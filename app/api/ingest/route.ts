// app/api/ingest/route.ts
// Web-based ingestion pipeline with Azure Document Intelligence
// Replaces SMS ingestion, preserves conservation physics

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  DocumentAnalysisClient,
  AzureKeyCredential
} from '@azure/ai-form-recognizer';
import crypto from 'crypto';
import {
  checkRateLimit,
  validateFileSize,
  detectSpam,
  quarantineSuspiciousActivity
} from '@/lib/rateLimiter';
import { sniffCSV } from '@/lib/agents/sniffer';

// Lazy client initialization to avoid build-time env var evaluation
function getSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getAzureClient() {
  return new DocumentAnalysisClient(
    process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT!,
    new AzureKeyCredential(process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY!)
  );
}

// Business document types (domain-agnostic)
const ALLOWED_DOCUMENT_TYPES = [
  'INVOICE',
  'RECEIPT',
  'STATEMENT',
  'PAYROLL',
  'INVENTORY',
  'REPORT'
] as const;

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

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const userId = (formData.get('userId') as string) || 'anonymous';
    const files = formData.getAll('file');

    const rateCheck = await checkRateLimit(userId, 'upload');
    if (!rateCheck.allowed) {
      return NextResponse.json({
        success: false,
        message: rateCheck.reason
      }, { status: 429 });
    }

    const spamCheck = await detectSpam(userId);
    if (spamCheck.isSpam) {
      await quarantineSuspiciousActivity(userId, spamCheck.reason!, { files });
      return NextResponse.json({
        success: false,
        message: 'Suspicious activity detected'
      }, { status: 403 });
    }

    if (!files.length) {
      return NextResponse.json({
        success: false,
        message: 'No files uploaded'
      }, { status: 400 });
    }

    const results: IngestResult[] = [];

    for (const fileData of files) {
      const file = fileData as File;
      try {
        results.push(await processFile(file, userId));
      } catch (err: any) {
        results.push({
          success: false,
          certified: 0,
          quarantined: 0,
          message: `Error processing ${file.name}`,
          errors: [err.message]
        });
      }
    }

    const certified = results.reduce((s, r) => s + r.certified, 0);
    const quarantined = results.reduce((s, r) => s + r.quarantined, 0);
    const detectedKpis = await detectKPIs(userId);

    return NextResponse.json({
      success: results.every(r => r.success),
      certified,
      quarantined,
      detectedKpis,
      details: results
    });
  } catch (error) {
    console.error('Ingestion error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

async function processFile(
  file: File,
  userId: string
): Promise<IngestResult> {
  console.log('📥 Processing file:', file.name);

  // Get Supabase client
  const supabase = getSupabaseClient();

  // Convert File to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  console.log('📏 File size:', arrayBuffer.byteLength, 'bytes');
  const sizeCheck = await validateFileSize(arrayBuffer);
  if (!sizeCheck.valid) {
    console.log('❌ Size check failed:', sizeCheck.reason);
    throw new Error(sizeCheck.reason);
  }
  console.log('✅ Size check passed');

  const sourceHash = crypto
    .createHash('sha256')
    .update(new Uint8Array(arrayBuffer))
    .digest('hex');

  const fileName = `${userId}/${Date.now()}_${file.name}`;
  console.log('📤 Uploading to Supabase storage:', fileName);
  const { data: uploadData, error } = await supabase.storage
    .from('raw-receipts')
    .upload(fileName, arrayBuffer, {
      contentType: file.type
    });

  if (error) {
    console.log('❌ Storage upload error:', error);
    throw error;
  }
  console.log('✅ Upload successful:', uploadData.path);

  console.log('🔍 Extracting with Azure...');
  const extracted = await extractWithAzure(new Uint8Array(arrayBuffer), file.type, file.name);
  console.log('✅ Azure extraction complete, facts:', extracted.facts?.length || 0);

  const documentType = classifyDocument(extracted);
  console.log('📋 Document classified as:', documentType);

  if (!ALLOWED_DOCUMENT_TYPES.includes(documentType as any)) {
    console.log('❌ Unsupported document type:', documentType);
    throw new Error(`Unsupported document type: ${documentType}`);
  }

  console.log('📝 Inserting provenance...');
  const { data: provenance, error: provError } = await supabase
    .from('provenance_chain')
    .insert({
      org_id: userId,
      blob_storage_id: uploadData.path,
      source_hash: sourceHash,
      source_type: 'WEB_UPLOAD',
      document_type: documentType,
      coordinate_map: {
        original_filename: file.name,
        file_type: file.type || 'application/octet-stream',
        file_size_bytes: arrayBuffer.byteLength
      }
    })
    .select()
    .single();

  if (provError) {
    console.log('❌ Provenance error:', provError);
    throw provError;
  }
  console.log('✅ Provenance inserted:', provenance.provenance_id);

  const facts: ExtractedFact[] = extracted.facts ?? [];

  // Apply universal F&B contextual inference
  const enrichedFacts = applyContextualInference(facts, file.name, documentType);

  const certified = enrichedFacts.filter(f => f.confidence >= 0.992);
  const quarantined = enrichedFacts.filter(f => f.confidence < 0.992);

  console.log(`📊 Pre-conservation: ${certified.length} certified, ${quarantined.length} quarantined`);

  // Conservation check: Only apply to balanced datasets (P&Ls, financial statements)
  // Skip for single-type transactional data (all revenue or all costs)
  const positiveCount = certified.filter(f => f.vector_type === 'POSITIVE').length;
  const negativeCount = certified.filter(f => f.vector_type === 'NEGATIVE').length;
  const isSingleType = positiveCount === 0 || negativeCount === 0;
  const shouldCheckConservation = !isSingleType && certified.length > 10;

  if (shouldCheckConservation) {
    if (!checkConservation(certified)) {
      console.log(`⚠️  Conservation check FAILED - moving ${certified.length} certified facts to quarantine`);
      quarantined.push(...certified);
      certified.length = 0;
    } else {
      console.log(`✅ Conservation check PASSED - ${certified.length} facts remain certified`);
    }
  } else {
    console.log(`⏭️  Conservation check SKIPPED (single-type transactional data or small dataset)`);
  }

  if (certified.length) {
    await supabase.from('atomic_fact_spine').insert(
      certified.map(f => ({
        org_id: userId,
        vector_type: f.vector_type,
        magnitude: f.magnitude,
        temporal_anchor: f.temporal_anchor,
        triad_map: {
          category: f.category,
          description: f.description
        },
        provenance_id: provenance.provenance_id,
        confidence: f.confidence
      }))
    );
  }

  if (quarantined.length) {
    await supabase.from('quarantine_ledger').insert(
      quarantined.map(f => ({
        org_id: userId,
        raw_fact: f,
        provenance_id: provenance.provenance_id,
        reason: 'CONFIDENCE_BELOW_THRESHOLD'
      }))
    );
  }

  return {
    success: true,
    certified: certified.length,
    quarantined: quarantined.length,
    message: `Processed ${file.name}`
  };
}

/* ---------- Helpers ---------- */

/**
 * UNIVERSAL F&B CONTEXTUAL INFERENCE ENGINE
 *
 * Applies physics-based certification and semantic enrichment without hardcoding.
 *
 * Context Sources:
 * 1. Filename → Primary category prefix ('Items.csv' → 'Item')
 * 2. Column headers → Already mapped by sniffer
 * 3. Row position → Summary detection (first row = totals)
 * 4. Document type → Fallback category
 *
 * Confidence Boosts:
 * - Single row files → 0.995 (no ambiguity)
 * - Summary rows (first with large magnitude) → 0.980
 * - Multiple consistent facts → Base confidence maintained
 */
function applyContextualInference(
  facts: ExtractedFact[],
  filename: string,
  documentType: string
): ExtractedFact[] {
  if (!facts || facts.length === 0) return facts;

  console.log(`🧠 Applying contextual inference for ${filename} (${facts.length} facts)`);

  // Extract category prefix from filename (e.g., "Items.csv" → "Item")
  const fileBasename = filename.replace(/\.[^/.]+$/, ''); // Remove extension
  const categoryPrefix = fileBasename
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Detect file type patterns
  const isSingleRow = facts.length === 1;
  const isSummaryFile = filename.toLowerCase().includes('total') ||
                        filename.toLowerCase().includes('summary');

  // Check if first fact is likely a summary (large magnitude relative to others)
  const magnitudes = facts.map(f => f.magnitude);
  const avgMagnitude = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
  const firstFactIsSummary = facts.length > 1 &&
                              facts[0].magnitude > avgMagnitude * 2;

  // Pre-check: Is this clean transactional data?
  // UNIVERSAL RULE: If sniffer successfully extracted facts with complete data,
  // and we have multiple facts (not just a summary), then it's clean data.
  const allFactsComplete = facts.every(f => f.magnitude && f.vector_type);
  const isCleanTransactional = allFactsComplete && facts.length >= 3;

  if (isCleanTransactional) {
    console.log(`  🎯 Clean transactional data detected: ${facts.length} facts with complete structure`);
  }

  return facts.map((fact, index) => {
    let confidence = fact.confidence;
    let category = fact.category;
    let description = fact.description;
    const boosts: string[] = [];

    // BOOST 1: Single-row files (no ambiguity)
    if (isSingleRow) {
      confidence = 0.995;
      boosts.push('single-row');
    }

    // BOOST 2: Known summary files (Total sales, aggregates)
    if (isSummaryFile) {
      confidence = Math.max(confidence, 0.995);
      boosts.push('summary-file');
    }

    // BOOST 3: Summary row (first row with large magnitude)
    if (index === 0 && firstFactIsSummary && !isSingleRow) {
      confidence = Math.max(confidence, 0.995);
      boosts.push('summary-row');
    }

    // BOOST 4: Clean transactional data (all facts well-structured)
    if (isCleanTransactional && confidence < 0.992) {
      confidence = 0.995;
      boosts.push('clean-transactional');
    }

    // Log boosts for first fact only (avoid spam)
    if (index === 0 && boosts.length > 0) {
      console.log(`  ✨ Applied boosts: ${boosts.join(', ')} → confidence: ${confidence} (was ${fact.confidence})`);
    }

    // ENRICHMENT: Add contextual category if currently uncategorized
    if (category === 'uncategorized' && categoryPrefix) {
      // Use filename as category prefix
      category = index === 0 && (firstFactIsSummary || isSummaryFile)
        ? `${categoryPrefix} Total`
        : categoryPrefix;
    }

    // ENRICHMENT: Add contextual description
    if (description === 'Sales transaction' || description === 'unknown') {
      const positionLabel = index === 0 && firstFactIsSummary ? 'Summary' : 'Detail';
      description = `${categoryPrefix} ${positionLabel} - ${fact.vector_type === 'POSITIVE' ? 'Revenue' : 'Cost'}`;
    }

    return {
      ...fact,
      confidence,
      category,
      description
    };
  });
}

/* ---------- Original Helpers ---------- */

async function extractWithAzure(
  data: Uint8Array,
  mime: string,
  filename?: string
): Promise<{ facts: ExtractedFact[] }> {
  console.log('⚡ extractWithAzure called with mime:', mime, 'filename:', filename);

  // Path A: CSV → Agentic
  const isCSV = mime.includes('csv') || filename?.toLowerCase().endsWith('.csv');
  if (isCSV) {
    console.log('📊 CSV detected - calling semantic ...');

    const skill = await sniffCSV(data);
    console.log(`✅  confidence: ${skill.confidence}, source: ${skill.detected_source}`);

    // Parse CSV using 's skill
    const csvText = new TextDecoder('utf-8').decode(data);
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');

    const facts: ExtractedFact[] = [];

    // Handle pivot table multi-period extraction
    const isPivotTable = skill.detected_source === 'CUSTOM_MULTI_PERIOD';

    if (isPivotTable) {
      console.log('📊 Pivot table detected - extracting multi-period facts...');

      // Get period headers from Row 1 (skip empty columns, take odd columns)
      const periodHeaders = headers.filter((h, i) => i > 0 && h.trim() !== '' && i % 2 === 1);
      console.log(`📅 Detected ${periodHeaders.length} periods:`, periodHeaders.slice(0, 5));

      // Get date ranges from Row 2 (if present)
      const dateRangeRow = lines[1]?.split(',') || [];
      const dateRanges = dateRangeRow.filter((d, i) => i > 0 && d.trim() !== '' && i % 2 === 1);

      // Process data rows (skip first 2 header rows)
      const startRow = 2;
      for (let i = startRow; i < lines.length; i++) {
        if (skill.summary_rows_detected.includes(i)) {
          console.log(`⏭️ Skipping summary row ${i}`);
          continue;
        }

        const values = lines[i].split(',');
        const category = values[0]?.trim().replace(/"/g, '');

        if (!category || category === '') continue;

        // Extract one fact per period
        for (let periodIdx = 0; periodIdx < periodHeaders.length; periodIdx++) {
          const columnIdx = 1 + (periodIdx * 2); // Odd columns: 1, 3, 5, 7...
          const amountStr = values[columnIdx];

          if (!amountStr || amountStr.trim() === '') continue;

          const magnitude = parseFloat(amountStr.replace(/[$,]/g, ''));
          if (isNaN(magnitude) || magnitude === 0) continue;

          // Determine vector type from category name
          const categoryLower = category.toLowerCase();
          const isRevenue = categoryLower.includes('sales') ||
                           categoryLower.includes('revenue') ||
                           categoryLower.includes('income');

          const isCost = categoryLower.includes('cost') ||
                        categoryLower.includes('expense') ||
                        categoryLower.includes('labor') ||
                        categoryLower.includes('wages') ||
                        categoryLower.includes('payroll');

          const vector_type = isRevenue ? 'POSITIVE' :
                             isCost ? 'NEGATIVE' :
                             magnitude >= 0 ? 'POSITIVE' : 'NEGATIVE';

          // Build temporal anchor
          const period = periodHeaders[periodIdx] || `P${periodIdx + 1}`;
          const dateRange = dateRanges[periodIdx] || '';
          const temporal_anchor = dateRange ? `${period} (${dateRange})` : period;

          facts.push({
            magnitude: Math.abs(magnitude),
            vector_type,
            temporal_anchor,
            category: category,
            description: `${category} - ${temporal_anchor}`,
            confidence: skill.confidence
          } as ExtractedFact);
        }
      }

      console.log(`✅ Extracted ${facts.length} facts from pivot table (${periodHeaders.length} periods)`);
      return { facts };
    }

    // Standard transactional CSV parsing (non-pivot)
    console.log(`🔍 Processing ${lines.length - 1} transactional CSV rows`);
    console.log(`📋 Column mappings from sniffer: ${skill.column_mappings.length}`);

    if (skill.column_mappings.length === 0) {
      console.log('⚠️  No column mappings - sniffer failed to map CSV structure');
      return { facts: [] };
    }

    // Log first mapping for debugging
    console.log('📊 Sample mapping:', JSON.stringify(skill.column_mappings[0], null, 2));

    for (let i = 1; i < lines.length; i++) {
      // Skip summary rows detected by 
      if (skill.summary_rows_detected.includes(i)) {
        console.log(`⏭️ Skipping summary row ${i}`);
        continue;
      }

      const values = lines[i].split(',');
      const fact: Partial<ExtractedFact> = {};

      // Apply sniffer's column mappings
      for (const mapping of skill.column_mappings) {
        const value = values[mapping.csv_column_index];

        if (mapping.spine_field === 'magnitude') {
          const rawValue = value?.toString() || '';
          let magnitude = parseFloat(rawValue.replace(/[$,]/g, ''));

          if (isNaN(magnitude)) continue; // Skip invalid numbers

          // Apply transforms
          if (mapping.transform === 'ABS') magnitude = Math.abs(magnitude);
          if (mapping.transform === 'NEGATE') magnitude = -magnitude;

          fact.magnitude = Math.abs(magnitude);

          // Determine vector_type with fallback
          if (mapping.vector_type) {
            fact.vector_type = mapping.vector_type;
          } else {
            // Infer from column name or category
            const columnName = mapping.csv_column?.toLowerCase() || '';
            const isRevenue = columnName.includes('sales') ||
                             columnName.includes('revenue') ||
                             columnName.includes('income') ||
                             columnName.includes('gross');
            const isCost = columnName.includes('cost') ||
                          columnName.includes('expense') ||
                          columnName.includes('discount') ||
                          columnName.includes('refund') ||
                          columnName.includes('void');

            fact.vector_type = isRevenue ? 'POSITIVE' :
                              isCost ? 'NEGATIVE' :
                              magnitude >= 0 ? 'POSITIVE' : 'NEGATIVE';
          }
        }

        if (mapping.spine_field === 'temporal_anchor') {
          fact.temporal_anchor = value?.toString() || new Date().toISOString().split('T')[0];
        }

        if (mapping.spine_field === 'category') {
          fact.category = value.trim().replace(/"/g, '');
        }

        if (mapping.spine_field === 'description') {
          fact.description = value.trim().replace(/"/g, '');
        }
      }

      // Only add fact if it has magnitude and vector_type (temporal_anchor defaults to today)
      if (fact.magnitude && fact.vector_type) {
        facts.push({
          magnitude: fact.magnitude,
          vector_type: fact.vector_type,
          temporal_anchor: fact.temporal_anchor || new Date().toISOString().split('T')[0],
          category: fact.category || 'uncategorized',
          description: fact.description || fact.category || 'Sales transaction',
          confidence: skill.confidence
        } as ExtractedFact);
      }
    }

    console.log(`✅ Extracted ${facts.length} facts from transactional CSV`);
    if (facts.length === 0) {
      console.log('⚠️  No facts extracted - debug info:');
      console.log('  - Total rows processed:', lines.length - 1);
      console.log('  - Column mappings available:', skill.column_mappings.length);
      console.log('  - Sample row:', lines[1]?.substring(0, 200));
    }
    return { facts };
  }

  // Path B: PDF/Image → Azure Vision
  const azureClient = getAzureClient();
  const modelId = mime.includes('pdf') || mime.includes('image')
    ? 'prebuilt-invoice'
    : 'prebuilt-document';

  const poller = await azureClient.beginAnalyzeDocument(modelId, data);
  await poller.pollUntilDone();

  // Conservative by design — Azure facts need manual review
  return { facts: [] };
}

function classifyDocument(data: any): string {
  const c = JSON.stringify(data).toLowerCase();
  if (c.includes('invoice')) return 'INVOICE';
  if (c.includes('receipt')) return 'RECEIPT';
  return 'REPORT';
}

function checkConservation(facts: ExtractedFact[]): boolean {
  const pos = facts
    .filter(f => f.vector_type === 'POSITIVE')
    .reduce((s, f) => s + f.magnitude, 0);

  const neg = facts
    .filter(f => f.vector_type === 'NEGATIVE')
    .reduce((s, f) => s + f.magnitude, 0);

  return neg <= pos * 10;
}

async function detectKPIs(userId: string): Promise<string[]> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from('atomic_fact_spine')
    .select('triad_map')
    .eq('org_id', userId);

  if (!data) return [];

  const categories = new Set(
    data.map(d => (d.triad_map as any)?.category).filter(Boolean)
  );

  const out: string[] = [];
  if (categories.has('food')) out.push('food_cost_pct');
  if (categories.has('labor')) out.push('labor_pct');
  if (categories.has('revenue')) out.push('revenue_trend');

  return out;
}
