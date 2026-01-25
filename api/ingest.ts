// /api/ingest.ts
// Web-based ingestion pipeline with Azure Document Intelligence
// Replaces SMS ingestion, preserves conservation physics

import { createClient } from '@supabase/supabase-js';
import { DocumentAnalysisClient, AzureKeyCredential } from '@azure/ai-form-recognizer';
import formidable from 'formidable';
import crypto from 'crypto';
import fs from 'fs/promises';
import {
  checkRateLimit,
  validateFileSize,
  detectSpam,
  quarantineSuspiciousActivity
} from '../lib/rateLimiter';

// Initialize clients
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const azureClient = new DocumentAnalysisClient(
  process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT!,
  new AzureKeyCredential(process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY!)
);

// Business document types (domain-agnostic)
const ALLOWED_DOCUMENT_TYPES = [
  'INVOICE',
  'RECEIPT',
  'STATEMENT',
  'PAYROLL',
  'INVENTORY',
  'REPORT'
];

// Disable Next.js body parser
export const config = {
  api: {
    bodyParser: false
  }
};

interface ExtractedFact {
  vector_type: 'POSITIVE' | 'NEGATIVE';
  magnitude: number;
  temporal_anchor: string;
  category: string;
  description: string;
  confidence: number;
}

interface IngestResult {
  success: boolean;
  certified: number;
  quarantined: number;
  message: string;
  detectedKpis?: string[];
  errors?: string[];
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({
    maxFiles: 10,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    keepExtensions: true
  });

  try {
    const [fields, files] = await form.parse(req);
    
    // Extract user identifier (email, user_id, etc.)
    const userId = fields.userId?.[0] || 'anonymous';

    // Rate limit check
    const rateCheck = await checkRateLimit(userId, 'upload');
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: `⚠️ ${rateCheck.reason}`
      });
    }

    // Spam detection
    const spamCheck = await detectSpam(userId);
    if (spamCheck.isSpam) {
      await quarantineSuspiciousActivity(userId, spamCheck.reason!, { files });
      return res.status(403).json({
        success: false,
        message: '🚨 Suspicious activity detected.'
      });
    }

    // Process all uploaded files
    const uploadedFiles = Object.values(files).flat();
    
    if (uploadedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const results: IngestResult[] = [];
    
    for (const file of uploadedFiles) {
      try {
        const result = await processFile(file, userId);
        results.push(result);
      } catch (error: any) {
        results.push({
          success: false,
          certified: 0,
          quarantined: 0,
          message: `Error processing ${file.originalFilename}: ${error.message}`,
          errors: [error.message]
        });
      }
    }

    // Aggregate results
    const totalCertified = results.reduce((sum, r) => sum + r.certified, 0);
    const totalQuarantined = results.reduce((sum, r) => sum + r.quarantined, 0);
    const allSuccess = results.every(r => r.success);

    // Detect KPIs based on ingested data
    const detectedKpis = await detectKPIs(userId);

    return res.status(allSuccess ? 200 : 207).json({
      success: allSuccess,
      certified: totalCertified,
      quarantined: totalQuarantined,
      message: allSuccess 
        ? `✅ ${totalCertified} facts certified, ${totalQuarantined} quarantined`
        : `⚠️ Some files had errors`,
      detectedKpis,
      details: results
    });

  } catch (error: any) {
    console.error('Ingestion error:', error);
    return res.status(500).json({
      success: false,
      message: '❌ Error processing upload',
      error: error.message
    });
  }
}

async function processFile(file: any, userId: string): Promise<IngestResult> {
  // Read file buffer
  const fileBuffer = await fs.readFile(file.filepath);
  
  // Validate file size
  const sizeCheck = await validateFileSize(fileBuffer);
  if (!sizeCheck.valid) {
    throw new Error(sizeCheck.reason);
  }

  // Calculate SHA-256 hash for provenance
  const sourceHash = crypto
    .createHash('sha256')
    .update(fileBuffer)
    .digest('hex');

  // Upload to Supabase Storage
  const fileName = `${userId}/${Date.now()}_${file.originalFilename}`;
  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('raw-receipts')
    .upload(fileName, fileBuffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (uploadError) throw uploadError;

  // Extract data using Azure Document Intelligence
  const extractedData = await extractWithAzure(fileBuffer, file.mimetype);

  // Classify document type
  const documentType = classifyDocument(extractedData);

  if (!ALLOWED_DOCUMENT_TYPES.includes(documentType)) {
    throw new Error(`Document type ${documentType} not supported`);
  }

  // Create provenance record
  const { data: provenanceData, error: provenanceError } = await supabase
    .from('provenance_chain')
    .insert({
      org_id: userId,
      blob_storage_id: uploadData.path,
      source_hash: sourceHash,
      source_type: 'WEB_UPLOAD',
      document_type: documentType
    })
    .select()
    .single();

  if (provenanceError) throw provenanceError;

  // Convert extracted data to facts
  const facts = extractedData.facts || [];

  // Apply 0.992 confidence gate
  const certifiedFacts = facts.filter((f: ExtractedFact) => f.confidence >= 0.992);
  const quarantinedFacts = facts.filter((f: ExtractedFact) => f.confidence < 0.992);

  // Conservation check
  const conservationValid = checkConservation(certifiedFacts);
  if (!conservationValid) {
    // If conservation fails, quarantine all facts
    quarantinedFacts.push(...certifiedFacts);
    certifiedFacts.length = 0;
  }

  // Insert certified facts into spine
  if (certifiedFacts.length > 0) {
    const factsToInsert = certifiedFacts.map((f: ExtractedFact) => ({
      org_id: userId,
      vector_type: f.vector_type,
      magnitude: f.magnitude,
      temporal_anchor: f.temporal_anchor || new Date().toISOString(),
      triad_map: {
        category: f.category,
        description: f.description
      },
      provenance_id: provenanceData.provenance_id,
      confidence: f.confidence
    }));

    await supabase
      .from('atomic_fact_spine')
      .insert(factsToInsert);
  }

  // Insert quarantined facts
  if (quarantinedFacts.length > 0) {
    await supabase
      .from('quarantine_ledger')
      .insert(quarantinedFacts.map((f: ExtractedFact) => ({
        org_id: userId,
        raw_fact: f,
        reason: f.confidence < 0.992 
          ? 'CONFIDENCE_BELOW_THRESHOLD' 
          : 'CONSERVATION_VIOLATION',
        provenance_id: provenanceData.provenance_id
      })));
  }

  return {
    success: true,
    certified: certifiedFacts.length,
    quarantined: quarantinedFacts.length,
    message: `Processed ${file.originalFilename}`
  };
}

async function extractWithAzure(fileBuffer: Buffer, mimeType: string): Promise<any> {
  // Determine document model based on mime type
  let modelId = 'prebuilt-document'; // Default general document model
  
  if (mimeType.includes('pdf') || mimeType.includes('image')) {
    // Use invoice model for structured business documents
    modelId = 'prebuilt-invoice';
  }

  const poller = await azureClient.beginAnalyzeDocument(modelId, fileBuffer);
  const result = await poller.pollUntilDone();

  // Convert Azure result to our fact structure
  const facts: ExtractedFact[] = [];

  // Extract from tables
  if (result.tables) {
    for (const table of result.tables) {
      for (const cell of table.cells) {
        const cellValue = parseFloat(cell.content);
        if (!isNaN(cellValue) && cellValue !== 0) {
          facts.push({
            vector_type: cellValue > 0 ? 'POSITIVE' : 'NEGATIVE',
            magnitude: Math.abs(cellValue),
            temporal_anchor: new Date().toISOString(),
            category: inferCategory(cell.content),
            description: cell.content,
            confidence: cell.confidence || 0.95
          });
        }
      }
    }
  }

  // Extract from key-value pairs
  if (result.keyValuePairs) {
    for (const kvp of result.keyValuePairs) {
      if (kvp.value?.content) {
        const value = parseFloat(kvp.value.content);
        if (!isNaN(value) && value !== 0) {
          facts.push({
            vector_type: value > 0 ? 'POSITIVE' : 'NEGATIVE',
            magnitude: Math.abs(value),
            temporal_anchor: new Date().toISOString(),
            category: inferCategory(kvp.key?.content || ''),
            description: `${kvp.key?.content}: ${kvp.value.content}`,
            confidence: kvp.confidence || 0.95
          });
        }
      }
    }
  }

  return { facts };
}

function classifyDocument(extractedData: any): string {
  // Simple classification based on content
  const content = JSON.stringify(extractedData).toLowerCase();
  
  if (content.includes('invoice') || content.includes('bill')) return 'INVOICE';
  if (content.includes('receipt')) return 'RECEIPT';
  if (content.includes('statement') || content.includes('bank')) return 'STATEMENT';
  if (content.includes('payroll') || content.includes('wages')) return 'PAYROLL';
  if (content.includes('inventory') || content.includes('stock')) return 'INVENTORY';
  
  return 'REPORT'; // Default
}

function inferCategory(text: string): string {
  const lower = text.toLowerCase();
  
  // Cost categories
  if (lower.includes('food') || lower.includes('ingredient')) return 'food';
  if (lower.includes('labor') || lower.includes('wage') || lower.includes('salary')) return 'labor';
  if (lower.includes('rent') || lower.includes('lease')) return 'occupancy';
  if (lower.includes('utility') || lower.includes('electric') || lower.includes('gas')) return 'utilities';
  
  // Revenue categories
  if (lower.includes('sales') || lower.includes('revenue')) return 'revenue';
  
  return 'other';
}

function checkConservation(facts: ExtractedFact[]): boolean {
  // Basic conservation check: sum of positive should roughly equal sum of negative + margin
  const positive = facts
    .filter(f => f.vector_type === 'POSITIVE')
    .reduce((sum, f) => sum + f.magnitude, 0);
    
  const negative = facts
    .filter(f => f.vector_type === 'NEGATIVE')
    .reduce((sum, f) => sum + f.magnitude, 0);

  // Allow for reasonable profit margin (don't enforce exact balance)
  // Just check for obvious violations (e.g., costs > revenue by 10x)
  if (negative > positive * 10) return false;
  
  return true;
}

async function detectKPIs(userId: string): Promise<string[]> {
  // Query atomic_fact_spine to see what KPIs can be calculated
  const { data: facts } = await supabase
    .from('atomic_fact_spine')
    .select('vector_type, triad_map')
    .eq('org_id', userId)
    .limit(1000);

  if (!facts || facts.length === 0) return [];

  const kpis: string[] = [];
  const categories = new Set(facts.map(f => f.triad_map?.category).filter(Boolean));

  // Detect available KPIs based on data
  if (categories.has('food')) kpis.push('food_cost_pct');
  if (categories.has('labor')) kpis.push('labor_pct');
  if (categories.has('revenue')) kpis.push('revenue_trend');
  if (facts.some(f => f.vector_type === 'POSITIVE' && f.vector_type === 'NEGATIVE')) {
    kpis.push('margin_by_category');
  }

  return kpis;
}