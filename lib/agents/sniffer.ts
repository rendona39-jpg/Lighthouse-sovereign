/**
 * LIGHTHOUSE SEMANTIC 
 *
 * Mission: Map any F&B CSV to Atomic Fact Spine without human intervention
 *
 * Strategic Advantage:
 * - Tri-Point Distributed Sampling prevents "blind spots"
 * - Self-correcting via F&B physics (conservation laws)
 * - Detects summary rows, outliers, and structural breaks
 *
 * Process:
 * 1. Tri-Point Sample (Head: 30%, Mid: 40%, Tail: 30%)
 * 2. Load GEMINI.md constitution
 * 3. Call Gemini 3 Flash with strict JSON schema
 * 4. Resolve ambiguity via F&B physics rules
 * 5. Output deterministic ingestion skill
 */

import { promises as fs } from 'fs';
import path from 'path';

// ─────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────

interface Config {
  min_sample_rows: number;
  max_sample_rows: number;
  sample_percentage: number;

  // Tri-Point Distribution
  head_percentage: number; // % of sample from top
  mid_percentage: number;  // % of sample from middle
  tail_percentage: number; // % of sample from end
}

export interface IngestionSkill {
  detected_source: 'TOAST' | 'SQUARE' | 'R365' | 'CUSTOM' | 'CUSTOM_MULTI_PERIOD' | 'UNKNOWN';
  confidence: number; // 0.0 - 1.0
  column_mappings: ColumnMapping[];
  summary_rows_detected: number[]; // Row indices to exclude
  warnings: string[];
  outliers: OutlierAlert[];
}

export interface ColumnMapping {
  csv_column: string;
  csv_column_index: number;
  spine_field: 'vector_type' | 'magnitude' | 'temporal_anchor' | 'category' | 'description';
  vector_type?: 'POSITIVE' | 'NEGATIVE';
  transform?: 'ABS' | 'NEGATE' | 'STRIP_CURRENCY' | 'PARSE_DATE' | 'IGNORE';
  confidence: number;
  reasoning: string; // Why this mapping was chosen
}

export interface OutlierAlert {
  row_index: number;
  column: string;
  value: any;
  reason: string;
  recommended_action: 'QUARANTINE' | 'REVIEW' | 'IGNORE';
}

interface CSVSample {
  headers: string[];
  head_rows: string[][];
  mid_rows: string[][];
  tail_rows: string[][];
  total_row_count: number;
  file_size_bytes: number;
}

// ─────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────

const _CONFIG: Config = {
  min_sample_rows: 20,
  max_sample_rows: 100,
  sample_percentage: 0.1, // 10% of file

  // Tri-Point Distribution
  head_percentage: 0.30, // 30% from top
  mid_percentage: 0.40,  // 40% from middle
  tail_percentage: 0.30, // 30% from end
};

// ─────────────────────────────────────────────────────────────────────────
// STRATEGIC TRI-POINT SAMPLING
// ─────────────────────────────────────────────────────────────────────────

/**
 * SAMPLING PROTOCOL:
 *
 * Why Distributed Sampling?
 * - Head: Captures headers, initial data types, opening balances
 * - Mid: Captures high-volume rush periods, typical transactions
 * - Tail: Captures summary rows, daily totals, structural breaks
 *
 * This prevents:
 * - Missing "TOTAL" rows that crash simple parsers
 * - Assuming all rows are line items (when some are summaries)
 * - Blindness to data quality degradation at file end
 */
async function sampleCSV(buffer: Buffer): Promise<CSVSample> {
  const csvText = buffer.toString('utf-8');
  const lines = csvText.trim().split('\n');
  const totalRows = lines.length - 1; // Exclude header

  // Determine sample size
  const sampleSize = Math.min(
    _CONFIG.max_sample_rows,
    Math.max(
      _CONFIG.min_sample_rows,
      Math.floor(totalRows * _CONFIG.sample_percentage)
    )
  );

  // If file is tiny, sample everything
  if (totalRows <= _CONFIG.min_sample_rows) {
    const headers = lines[0].split(',');
    const allRows = lines.slice(1).map(line => line.split(','));

    return {
      headers,
      head_rows: allRows,
      mid_rows: [],
      tail_rows: [],
      total_row_count: totalRows,
      file_size_bytes: buffer.length
    };
  }

  // Tri-Point Distribution
  const headCount = Math.floor(sampleSize * _CONFIG.head_percentage);
  const midCount = Math.floor(sampleSize * _CONFIG.mid_percentage);
  const tailCount = sampleSize - headCount - midCount;

  const headers = lines[0].split(',');

  // HEAD: Rows 1 to headCount
  const headRows = lines.slice(1, 1 + headCount).map(line => line.split(','));

  // MID: Rows from mathematical middle
  const midStart = Math.floor(totalRows / 2) - Math.floor(midCount / 2);
  const midRows = lines.slice(midStart + 1, midStart + 1 + midCount).map(line => line.split(','));

  // TAIL: Last tailCount rows
  const tailRows = lines.slice(-tailCount).map(line => line.split(','));

  return {
    headers,
    head_rows: headRows,
    mid_rows: midRows,
    tail_rows: tailRows,
    total_row_count: totalRows,
    file_size_bytes: buffer.length
  };
}

// ─────────────────────────────────────────────────────────────────────────
// LOAD F&B CONSTITUTION
// ─────────────────────────────────────────────────────────────────────────

async function loadConstitution(): Promise<string> {
  const constitutionPath = path.join(process.cwd(), 'GEMINI.md');
  return await fs.readFile(constitutionPath, 'utf-8');
}

// ─────────────────────────────────────────────────────────────────────────
// GEMINI 3 FLASH SEMANTIC MAPPING
// ─────────────────────────────────────────────────────────────────────────

async function callGemini(
  sample: CSVSample,
  constitution: string
): Promise<IngestionSkill> {

  const prompt = `
You are Lighthouse Semantic , a financial auditor analyzing restaurant CSV exports.

═══════════════════════════════════════════════════════════════════════════════
F&B PHYSICS CONSTITUTION
═══════════════════════════════════════════════════════════════════════════════

${constitution}

═══════════════════════════════════════════════════════════════════════════════
CSV DATA TO ANALYZE
═══════════════════════════════════════════════════════════════════════════════

HEADERS: ${JSON.stringify(sample.headers)}

HEAD SAMPLE (First ${sample.head_rows.length} rows):
${JSON.stringify(sample.head_rows.slice(0, 5), null, 2)}

MID SAMPLE (Middle ${sample.mid_rows.length} rows):
${JSON.stringify(sample.mid_rows.slice(0, 5), null, 2)}

TAIL SAMPLE (Last ${sample.tail_rows.length} rows):
${JSON.stringify(sample.tail_rows.slice(0, 5), null, 2)}

Total File Rows: ${sample.total_row_count}
File Size: ${sample.file_size_bytes} bytes

═══════════════════════════════════════════════════════════════════════════════
YOUR MISSION
═══════════════════════════════════════════════════════════════════════════════

1. Identify POS System (Toast/Square/R365/Custom)
2. Map each column to Atomic Fact Spine field using GEMINI.md aliases
3. Detect SUMMARY ROWS (rows containing "TOTAL", "GRAND TOTAL", "SUBTOTAL")
4. Resolve ambiguity using F&B physics:
   - "Tips" = pass-through (exclude from revenue)
   - "Discounts" = NEGATIVE revenue vector
   - "COGS" / "Food Cost" = NEGATIVE vector
   - "Sales" / "Revenue" = POSITIVE vector
5. Detect outliers (values > median * 10)
6. Ensure conservation: POSITIVE should >= NEGATIVE (or flag warning)

═══════════════════════════════════════════════════════════════════════════════
PIVOT TABLE DETECTION (CRITICAL)
═══════════════════════════════════════════════════════════════════════════════

You are now authorized to detect PIVOT TABLE structures.

If the CSV is a Pivot Table (categories in rows, periods in columns):

1. Set detected_source to "CUSTOM_MULTI_PERIOD"
2. Increase your confidence to 0.95+ (pivot tables are highly structured)
3. For column_mappings:
   - Map Column 0 → "category"
   - Map odd columns (1,3,5,7...) → "magnitude" with period index
   - Map even columns (2,4,6,8...) → "IGNORE" (metadata/percentages)
4. For each data row, create MULTIPLE column mappings (one per period)

Detection Hints:
- Row 1 headers: "P1", "P2", "P3" or "Jan", "Feb", "Mar" or "Q1", "Q2" or location names
- Row 2 might have date ranges: "12/30-1/26", "1/27-2/23"
- Column 0 has text (categories), other columns have numbers
- Pattern: Amount, Percentage, Amount, Percentage...

Example Output for Pivot Table:

{
  "detected_source": "CUSTOM_MULTI_PERIOD",
  "confidence": 0.95,
  "column_mappings": [
    {
      "csv_column": "Category",
      "csv_column_index": 0,
      "spine_field": "category",
      "transform": null,
      "confidence": 0.99,
      "reasoning": "First column contains category names (Food Sales, Labor Cost, etc.)"
    },
    {
      "csv_column": "P1_Amount",
      "csv_column_index": 1,
      "spine_field": "magnitude",
      "vector_type": "POSITIVE",
      "transform": "STRIP_CURRENCY",
      "confidence": 0.95,
      "reasoning": "Period 1 amounts (odd column)"
    },
    {
      "csv_column": "P1_Percentage",
      "csv_column_index": 2,
      "spine_field": "description",
      "transform": "IGNORE",
      "confidence": 0.99,
      "reasoning": "Metadata column (percentage) - will be ignored during parsing"
    },
    {
      "csv_column": "P2_Amount",
      "csv_column_index": 3,
      "spine_field": "magnitude",
      "vector_type": "POSITIVE",
      "transform": "STRIP_CURRENCY",
      "confidence": 0.95,
      "reasoning": "Period 2 amounts (odd column)"
    }
  ],
  "summary_rows_detected": [],
  "warnings": [
    "Detected pivot table with multiple periods - will create multiple facts per row"
  ],
  "outliers": []
}

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (STRICT JSON)
═══════════════════════════════════════════════════════════════════════════════

Return ONLY valid JSON matching this exact schema:

{
  "detected_source": "TOAST" | "SQUARE" | "R365" | "CUSTOM" | "CUSTOM_MULTI_PERIOD" | "UNKNOWN",
  "confidence": 0.95,
  "column_mappings": [
    {
      "csv_column": "Net Sales",
      "csv_column_index": 2,
      "spine_field": "magnitude",
      "vector_type": "POSITIVE",
      "transform": "STRIP_CURRENCY",
      "confidence": 0.99,
      "reasoning": "Matches TOAST alias 'Net Sales' → revenue"
    }
  ],
  "summary_rows_detected": [47, 98],
  "warnings": [
    "'Void Amount' detected in column 5 - recommend quarantine review"
  ],
  "outliers": [
    {
      "row_index": 23,
      "column": "Net Sales",
      "value": 1000000.00,
      "reason": "Value exceeds median * 10 (median: $45.00)",
      "recommended_action": "QUARANTINE"
    }
  ]
}

CRITICAL: Return ONLY the JSON object. No markdown, no explanation, no code fences.
`;

  // Call Gemini 3 Flash (or Gemini 2.0 Flash Exp)
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY environment variable not set');
  }

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.1, // Low temperature for deterministic mapping
          maxOutputTokens: 4096
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('Gemini API returned no candidates');
  }

  const text = data.candidates[0].content.parts[0].text;

  // Parse JSON (remove markdown fences if Gemini added them)
  const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(cleanText);
  } catch (parseError) {
    console.error('Failed to parse Gemini response:', cleanText);
    throw new Error(`Gemini returned invalid JSON: ${parseError}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// STRUCTURAL PHYSICS VERIFICATION
// ─────────────────────────────────────────────────────────────────────────

/**
 * Verify Pivot Table Physics (N×2 Symmetry + Type Consistency)
 *
 * Per GEMINI.md Section II.D: Rule of Structural Confirmation
 *
 * Checks:
 * 1. Column Symmetry: (non-empty columns - 1) % 2 = 0
 * 2. Type Consistency: Odd columns numeric, even columns numeric/string
 * 3. Period Header Pattern: P1, P2, Q1, Q2, Jan, Feb, etc.
 * 4. Category Coherence: F&B semantic terms in first column
 */
function verifyPivotPhysics(sample: CSVSample): {
  passed: boolean;
  score: number; // 0-4 (how many criteria met)
  details: string[];
} {
  const details: string[] = [];
  let score = 0;

  // Criterion 1: Column Symmetry (N×2 pattern)
  const nonEmptyHeaders = sample.headers.filter((h, i) => i === 0 || h.trim() !== '');
  const dataColumns = nonEmptyHeaders.length - 1; // Exclude category column

  if (dataColumns > 0 && dataColumns % 2 === 0) {
    score++;
    details.push(`✓ Column symmetry: ${dataColumns} data columns (${dataColumns/2} periods)`);
  } else {
    details.push(`✗ Column symmetry failed: ${dataColumns} data columns (not N×2)`);
  }

  // Criterion 2: Type Consistency
  let numericOddCount = 0;
  let totalOddColumns = 0;

  for (const row of sample.head_rows.slice(0, 10)) {
    for (let i = 1; i < row.length; i += 2) { // Odd columns: 1, 3, 5...
      totalOddColumns++;
      const value = row[i]?.replace(/[$,]/g, '');
      if (value && !isNaN(parseFloat(value))) {
        numericOddCount++;
      }
    }
  }

  const numericPercentage = totalOddColumns > 0 ? numericOddCount / totalOddColumns : 0;
  if (numericPercentage >= 0.8) {
    score++;
    details.push(`✓ Type consistency: ${(numericPercentage * 100).toFixed(0)}% of odd columns are numeric`);
  } else {
    details.push(`✗ Type consistency failed: Only ${(numericPercentage * 100).toFixed(0)}% numeric`);
  }

  // Criterion 3: Period Header Pattern
  const periodPatterns = /^(P\d+|Q\d+|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Greenwich|Stamford|Manhattan)/i;
  const matchingHeaders = nonEmptyHeaders.filter((h, i) => i > 0 && periodPatterns.test(h.trim()));

  if (matchingHeaders.length >= 2) {
    score++;
    details.push(`✓ Period headers: ${matchingHeaders.length} periods detected (${matchingHeaders.slice(0, 3).join(', ')}...)`);
  } else {
    details.push(`✗ Period headers: Only ${matchingHeaders.length} period identifiers found`);
  }

  // Criterion 4: Category Coherence (F&B semantic terms)
  const fbTerms = /(sales|revenue|income|cost|expense|labor|wages|payroll|cogs|food|beverage)/i;
  const firstColumnValues = [
    ...sample.head_rows.slice(0, 10).map(r => r[0]),
    ...sample.mid_rows.slice(0, 5).map(r => r[0])
  ].filter(v => v && v.trim() !== '');

  const fbMatches = firstColumnValues.filter(v => fbTerms.test(v));
  const fbPercentage = firstColumnValues.length > 0 ? fbMatches.length / firstColumnValues.length : 0;

  if (fbPercentage >= 0.5) {
    score++;
    details.push(`✓ Category coherence: ${(fbPercentage * 100).toFixed(0)}% F&B semantic terms`);
  } else {
    details.push(`✗ Category coherence: Only ${(fbPercentage * 100).toFixed(0)}% F&B terms`);
  }

  return {
    passed: score >= 3, // At least 3 out of 4 criteria
    score,
    details
  };
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN  FUNCTION
// ─────────────────────────────────────────────────────────────────────────

export async function sniffCSV(buffer: Buffer): Promise<IngestionSkill> {
  console.log('🐕 : Starting tri-point sampling...');

  // 1. Strategic Tri-Point Sampling
  const sample = await sampleCSV(buffer);
  console.log(`🐕 : Sampled ${sample.head_rows.length + sample.mid_rows.length + sample.tail_rows.length} rows from ${sample.total_row_count} total`);

  // 2. Load F&B Constitution
  const constitution = await loadConstitution();
  console.log('🐕 : Loaded GEMINI.md constitution');

  // 3. Call Gemini 3 Flash for semantic mapping
  console.log('🐕 : Calling Gemini 2.0 Flash for semantic mapping...');
  const skill = await callGemini(sample, constitution);
  console.log(`🐕 : Mapping complete - confidence: ${skill.confidence}, source: ${skill.detected_source}`);

  // 4. Validation: Ensure confidence threshold
  if (skill.confidence < 0.8) {
    throw new Error(`Low  confidence (${skill.confidence}). Cannot reliably map this CSV.`);
  }

  // 5. Filter out low-confidence column mappings
  const originalMappingCount = skill.column_mappings.length;
  skill.column_mappings = skill.column_mappings.filter(m => m.confidence >= 0.85);

  if (skill.column_mappings.length < originalMappingCount) {
    console.log(`🐕 : Filtered out ${originalMappingCount - skill.column_mappings.length} low-confidence mappings`);
  }

  // 6. Structural Physics Verification (Per GEMINI.md Section II.D)
  if (skill.detected_source === 'CUSTOM_MULTI_PERIOD') {
    console.log('🔬 : Running structural physics verification...');
    const physics = verifyPivotPhysics(sample);

    console.log(`🔬 Physics check: ${physics.score}/4 criteria met`);
    physics.details.forEach(detail => console.log(`   ${detail}`));

    if (physics.passed) {
      const originalConfidence = skill.confidence;
      skill.confidence = 0.995; // Boost to certification level
      console.log(`🚀 Confidence boosted: ${originalConfidence} → 0.995 (structural confirmation)`);
    } else {
      console.log(`⚠️  Physics verification failed - keeping confidence at ${skill.confidence}`);
    }
  }

  console.log(`🐕 : Final skill - ${skill.column_mappings.length} column mappings, ${skill.summary_rows_detected.length} summary rows detected`);

  return skill;
}
