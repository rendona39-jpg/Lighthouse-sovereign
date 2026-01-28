# LIGHTHOUSE F&B INTELLIGENCE CONSTITUTION

**Version:** 1.0
**Purpose:** Universal financial physics for food & beverage operations
**Scope:** Single bagel cart → 50-unit restaurant group
**Authority:** This document defines all semantic mapping, conservation laws, and certification gates

---

## I. LIGHTHOUSE PHYSICS (Universal F&B Laws)

### A. Conservation Laws

#### Inventory Conservation
```
(Opening Inventory + Purchases) - Closing Inventory = Cost of Goods Sold
```

**RULE:** If this equation doesn't balance within 2% tolerance → Quarantine
**REASON:** Indicates theft, waste, or data entry error

**Implementation:**
- Opening Inventory must be previous period's Closing Inventory
- Purchases include all vendor invoices (food, beverage, supplies)
- Closing Inventory requires physical count (not estimated)
- 2% tolerance accounts for shrinkage, spillage, sampling

#### Labor Conservation

**Tips = Pass-Through Liability (NOT revenue)**
- Tips collected are remitted to staff
- Do NOT add tips to gross revenue
- Record as liability: "Tips Payable"

**Labor Cost Thresholds:**
```yaml
healthy: <= 35% of Gross Sales
acceptable: 35-45% of Gross Sales
warning: 45-50% of Gross Sales (Explore Mode)
critical: > 50% of Gross Sales (Overstaffing alert)
```

**RULE:** Separate Hourly vs Salary, track Overtime separately
**REASON:** Overtime is variable cost, salary is fixed

**Sub-Components:**
- **Hourly Wages:** Front-of-house (FOH) + Back-of-house (BOH)
- **Salary:** Managers, Executive Chef, Sous Chef
- **Overtime:** Time-and-a-half for hours > 40/week
- **Payroll Tax:** Employer-paid FICA, unemployment insurance
- **Benefits:** Health insurance, 401k matching, workers comp

#### Revenue Leakage Conservation
```
Gross Sales - (Discounts + Comps + Voids + Refunds) = Net Sales
```

**RULE:** Leakage > 8% of Gross → Explore Mode (Alert: Manager abuse)
**REASON:** Industry standard leakage is 3-5%

**Leakage Categories:**
- **Discounts:** Authorized price reductions (happy hour, senior discount)
- **Comps:** Free items given (manager discretion, customer complaint resolution)
- **Voids:** Canceled orders (requires manager override)
- **Refunds:** Post-sale returns (quality issues, wrong order)

**Fraud Detection:**
- If single manager's void rate > 2x location average → Flag for review
- If voids cluster at end-of-shift → Potential theft pattern

#### Cash Flow Physics

**Cash In ≠ Revenue**

```yaml
EXCLUDE from Revenue:
  - Owner Deposits: Equity injection (not earned income)
  - Loan Proceeds: Liability (borrowed money, not earned)
  - Customer Deposits: Deferred revenue (prepayment for future service)
  - Gift Card Sales: Deferred revenue (not earned until redeemed)

INCLUDE in Revenue:
  - Customer Payments: Cash, credit card, mobile pay
  - Catering Deposits: When service is performed (not when deposit received)
```

**Cash Out ≠ Expense**

```yaml
EXCLUDE from Expense:
  - Owner Draws: Equity distribution (not business cost)
  - Loan Payments (Principal): Liability reduction
  - Gift Card Redemptions: Recognize previously deferred revenue
  - Security Deposits: Asset (refundable)

INCLUDE in Expense:
  - Operating Costs: COGS, Labor, Rent, Utilities
  - Loan Payments (Interest): Cost of borrowing
  - Depreciation: Asset write-down over useful life
```

**RULE:** Only operating activity flows to Atomic Fact Spine
**REASON:** Non-operating flows distort business performance

---

### B. Prime Cost Law

```
Prime Cost = COGS + Labor
```

**Industry Benchmark:**
- **Healthy:** 60-65% of revenue
- **Warning:** 65-70% of revenue
- **Critical:** > 70% of revenue (business is unprofitable)

**RULE:** Track Prime Cost as PRIMARY KPI
**REASON:** If Prime Cost is controlled, business is viable

**Prime Cost Components:**
1. **Food Cost** (28-35% of revenue)
   - Proteins (meat, seafood, eggs)
   - Produce (fresh vegetables, fruit)
   - Dry Goods (flour, sugar, spices)
   - Beverages (coffee, soda, juice)
   - Waste (spoilage, over-prep, theft)

2. **Labor Cost** (25-35% of revenue)
   - Hourly wages (servers, cooks, dishwashers)
   - Salary (managers, chefs)
   - Payroll tax (employer portion)
   - Benefits (insurance, 401k)

**Alert Triggers:**
- Prime Cost > 70% → "💡 Prime Cost is 72% (target: 60-65%). Consider menu price increase or cost reduction."
- Food Cost > 35% → "💡 Food Cost is 38%. Review portion sizes, supplier contracts, and waste procedures."
- Labor Cost > 40% → "💡 Labor is 42%. Review shift scheduling and labor productivity."

---

### C. Cash Flow Physics

**Golden Rule:** Cash In ≠ Revenue, Cash Out ≠ Expense

#### Non-Operating Cash Inflows (EXCLUDE from Revenue)
```yaml
Owner Deposits:
  classification: Equity Injection
  spine_action: Exclude
  reason: Owner investing personal funds, not earned income

Loan Proceeds:
  classification: Liability
  spine_action: Exclude
  reason: Borrowed money must be repaid

Gift Card Sales:
  classification: Deferred Revenue
  spine_action: Exclude (until redemption)
  reason: Customer has not received goods/services yet

Customer Deposits (Catering):
  classification: Deferred Revenue
  spine_action: Exclude (until event date)
  reason: Revenue is earned when service is performed
```

#### Non-Operating Cash Outflows (EXCLUDE from Expense)
```yaml
Owner Draws:
  classification: Equity Distribution
  spine_action: Exclude
  reason: Owner taking profits out, not business cost

Loan Payments (Principal):
  classification: Liability Reduction
  spine_action: Exclude (interest IS an expense)
  reason: Paying down debt, not consuming resources

Equipment Purchase:
  classification: Asset Acquisition
  spine_action: Exclude (depreciation IS an expense)
  reason: Asset provides multi-year benefit
```

---

## II. INTEGRITY LAWS (The 0.992 Gate)

### A. Certification Rules

```yaml
confidence >= 0.992:
  destination: atomic_fact_spine
  label: "✓ Certified"
  audit_status: "Defensible in court/tax audit"

confidence < 0.992:
  destination: quarantine_ledger
  label: "💡 Explore Mode"
  audit_status: "Requires human review"

conservation_violation: true
  destination: quarantine_ledger
  override: "FORCE QUARANTINE (even if confidence = 0.999)"
  reason: "Math doesn't balance - physics violation"
```

### B. Math Override Principle

**IF:** POSITIVE sum < NEGATIVE sum (for same time period)
**THEN:** Quarantine ALL facts (even if confidence = 0.999)
**REASON:** Business cannot have negative revenue - data is corrupt

**Example:**
```
Revenue (POSITIVE): $5,000
COGS (NEGATIVE): $3,000
Labor (NEGATIVE): $2,500
Operating Costs (NEGATIVE): $1,000

Total POSITIVE: $5,000
Total NEGATIVE: $6,500

RESULT: Conservation violation → Quarantine entire file
ALERT: "Business shows $1,500 loss. Review data for errors or missing revenue entries."
```

### C. Provenance Requirements

Every certified fact MUST contain:

```yaml
source_hash:
  type: SHA-256
  purpose: Cryptographic fingerprint of source file
  use_case: "Detect duplicate uploads, trace fact to original document"

source_row:
  type: Integer
  purpose: Exact CSV row number (1-indexed)
  use_case: "Auditor can verify fact against source document"

source_column:
  type: String
  purpose: Exact CSV column name
  use_case: "Understand what POS field generated this fact"

extraction_method:
  type: Enum
  values: ["DETERMINISTIC_PARSE", "AZURE_VISION", "GEMINI_SNIFFER"]
  purpose: "How was this fact extracted?"
  use_case: "If dispute, re-run extraction with same method"

confidence:
  type: Float (0.0 - 1.0)
  purpose: "Certainty that this fact is correct"
  use_case: "0.992+ → Certified, <0.992 → Quarantine"
```

**RULE:** No fact without provenance
**REASON:** Audit trail for legal/tax defense

### D. Rule of Structural Confirmation

**Principle:** When data exhibits verifiable mathematical structure, confidence can be elevated based on physics validation, not just semantic matching.

**Applies to:** Pivot tables, structured reports, multi-period financial statements

**Verification Criteria:**

1. **Column Symmetry (N×2 Pattern)**
   ```
   Expected: Amount, Metadata, Amount, Metadata, Amount, Metadata...
   Validation: Count(non-empty columns) % 2 = 0
   Example: 12 periods → 24 data columns (excluding category column)
   ```

2. **Type Consistency**
   ```
   Odd columns (1,3,5,7...): Numeric (currency amounts)
   Even columns (2,4,6,8...): Numeric or String (percentages, ratios)
   Column 0: String (category names)
   ```

3. **Period Header Pattern**
   ```
   Row 1 contains: P1, P2, P3... OR Q1, Q2, Q3, Q4... OR Jan, Feb, Mar...
   Row 2 (optional): Date ranges like "12/30-1/26", "1/27-2/23"
   ```

4. **Category Coherence**
   ```
   First column contains F&B semantic terms:
   - Sales, Revenue, Income (POSITIVE indicators)
   - Cost, Expense, Labor, Wages (NEGATIVE indicators)
   - NOT generic strings like "Row1", "Data", "NULL"
   ```

**Confidence Boost Rules:**

```yaml
standard_pivot:
  detected_source: CUSTOM_MULTI_PERIOD
  gemini_confidence: 0.90 - 0.95
  structural_verification: PASS (all 4 criteria met)
  final_confidence: 0.995
  reasoning: "High structure + physics verification = near-certain"

ambiguous_pivot:
  detected_source: CUSTOM_MULTI_PERIOD
  gemini_confidence: 0.90 - 0.95
  structural_verification: PARTIAL (2-3 criteria met)
  final_confidence: 0.950
  reasoning: "Likely pivot, but some structural ambiguity"

failed_verification:
  detected_source: CUSTOM_MULTI_PERIOD
  gemini_confidence: 0.90 - 0.95
  structural_verification: FAIL (< 2 criteria met)
  final_confidence: 0.850 (no boost)
  reasoning: "Gemini detected pivot, but physics disagree - quarantine"
```

**Example - Greenwich P&L:**
```
Gemini confidence: 0.95 (CUSTOM_MULTI_PERIOD detected)
Physics verification:
  ✓ Column symmetry: 24 data columns (12 periods × 2)
  ✓ Type consistency: Odd=currency, Even=percentage
  ✓ Period headers: P1, P2, P3... P12
  ✓ Category coherence: Food Sales, Labor Cost, etc.

Result: Confidence boosted 0.95 → 0.995
Destination: atomic_fact_spine (certified)
```

**Why This Works:**
- Pivot tables are LESS ambiguous than transactional data (fixed structure)
- N×2 symmetry is binary: either true or false (no interpretation needed)
- Type checking is deterministic (parseFloat succeeds or fails)
- Period headers follow calendar logic (P1 < P2 < P3)

**Failure Modes (Will NOT Boost):**
- Irregular columns: 13, 17, 23 (not N×2)
- Mixed types: Some odd columns have text instead of numbers
- No period pattern: Random headers like "Column A", "Column B"
- Generic categories: "Item 1", "Row 2" (no F&B semantics)

**Audit Defense:**
> "Your Honor, this fact was certified at 0.995 confidence because:
> 1. Gemini semantic model identified it as a multi-period report
> 2. The file exhibited perfect N×2 column symmetry (24 data columns)
> 3. All amount columns contained valid currency values
> 4. Period headers followed P1-P12 sequential logic
> 5. Categories matched F&B industry standard terminology
> This is structural truth, not statistical guessing."

---

## III. HIERARCHY RULES (Generative UI Schema)

Define financial tree for auto-rendering dashboards:

```
ROOT: Total Revenue
├── POSITIVE Vectors (Revenue Streams)
│   ├── Food Sales
│   │   ├── Dine-In
│   │   ├── Takeout
│   │   └── Delivery
│   ├── Beverage Sales
│   │   ├── Alcoholic
│   │   └── Non-Alcoholic
│   ├── Catering Revenue
│   └── Merchandise Sales
│
├── LEVEL 1: Prime Cost (CRITICAL KPI)
│   ├── Food Cost (NEGATIVE vector)
│   │   ├── Proteins (Meat, Seafood, Eggs)
│   │   ├── Produce (Fresh vegetables/fruit)
│   │   ├── Dry Goods (Flour, Sugar, Spices)
│   │   ├── Beverages (Coffee, Soda, Juice)
│   │   └── Waste (Spoilage, Over-prep, Theft)
│   │
│   └── Labor Cost (NEGATIVE vector)
│       ├── Hourly Wages (FOH + BOH)
│       ├── Salary (Managers, Chefs)
│       ├── Overtime (Time-and-a-half)
│       ├── Payroll Tax (Employer portion)
│       └── Benefits (Health insurance, 401k)
│
├── LEVEL 2: Operating Costs (NEGATIVE vector)
│   ├── Occupancy
│   │   ├── Rent (Fixed)
│   │   ├── Property Tax
│   │   ├── Insurance (Liability, Property)
│   │   └── HOA/CAM Fees
│   ├── Utilities
│   │   ├── Electric
│   │   ├── Gas
│   │   ├── Water/Sewer
│   │   └── Trash Removal
│   ├── Marketing
│   │   ├── Digital Ads (Google, Facebook)
│   │   ├── Print/Flyers
│   │   ├── Promotions/Discounts
│   │   └── Loyalty Program Costs
│   ├── Supplies
│   │   ├── Smallwares (Plates, Utensils)
│   │   ├── Cleaning Supplies
│   │   ├── Paper Goods (To-go containers, napkins)
│   │   └── Uniforms
│   ├── Maintenance & Repairs
│   │   ├── Equipment Repairs (Ovens, Fridges)
│   │   ├── Plumbing/HVAC
│   │   └── Pest Control
│   └── Administrative
│       ├── POS System Fees
│       ├── Credit Card Processing (2-3% of sales)
│       ├── Accounting/Bookkeeping
│       ├── Legal Fees
│       └── Licenses & Permits
│
└── RESULT: Net Profit
    Formula: POSITIVE sum - NEGATIVE sum
    Benchmark: 10-15% of revenue (healthy restaurant)
    Alert: < 5% → "💡 Thin margins. Review cost structure."
```

### Multi-Location Aggregation Rules

```yaml
single_location:
  org_id: "greenwich_bagels"
  reporting: "Standalone performance"

multi_location:
  parent_org_id: "bagel_corp"
  locations:
    - org_id: "greenwich_bagels"
      label: "Greenwich CT"
    - org_id: "stamford_bagels"
      label: "Stamford CT"
    - org_id: "manhattan_bagels"
      label: "Manhattan NY"

  rollup_logic:
    - "SUM(magnitude) GROUP BY category"
    - "Calculate variance: location A vs location B"
    - "Alert if variance > 15% (investigate outlier)"

  variance_alerts:
    - condition: "food_cost_pct(Location A) - food_cost_pct(Location B) > 0.15"
      message: "💡 Greenwich food cost is 18% higher than Stamford. Investigate supplier contracts or waste procedures."
```

---

## IV. SEMANTIC ALIASES (POS Header Dictionary)

### A. POSITIVE Vectors (Revenue)

```yaml
revenue_exact_matches:
  - "Net Sales"
  - "Gross Sales"
  - "Total Sales"
  - "Revenue"
  - "Total Collected"
  - "Sales Amount"
  - "Total Revenue"
  - "Sales"
  - "Income"
  - "Sales Total"

revenue_fuzzy_patterns:
  - contains("sales") AND NOT contains("tax")
  - contains("revenue")
  - contains("collected")
  - contains("income") AND NOT contains("net income")
```

### B. NEGATIVE Vectors (COGS)

```yaml
cogs_exact_matches:
  - "Food Cost"
  - "COGS"
  - "Cost of Goods Sold"
  - "Usage"
  - "Food & Beverage Cost"
  - "Item COGS"
  - "Cost of Sales"
  - "Inventory Usage"
  - "Product Cost"

cogs_fuzzy_patterns:
  - contains("cost") AND (contains("food") OR contains("goods") OR contains("product"))
  - contains("usage") AND NOT contains("utility")
```

### C. NEGATIVE Vectors (Labor)

```yaml
labor_exact_matches:
  - "Labor Cost"
  - "Payroll"
  - "Wages"
  - "Staff Cost"
  - "Total Labor"
  - "Employee Cost"
  - "Labor Expense"
  - "Payroll Expense"

labor_fuzzy_patterns:
  - contains("labor")
  - contains("payroll")
  - contains("wage")
  - contains("staff") AND contains("cost")
```

### D. Pass-Through Items (EXCLUDE from Revenue)

```yaml
passthrough_exclude:
  Tips:
    reason: "Liability - collected for staff, remitted"
    action: "Do NOT add to revenue"

  Sales Tax:
    reason: "Liability - collected for state"
    action: "Do NOT add to revenue"

  Gift Card Sales:
    reason: "Deferred revenue - not earned yet"
    action: "Record as liability, recognize when redeemed"

  Customer Deposits:
    reason: "Prepayment for future service"
    action: "Record as liability, recognize when service performed"

RULE: If header matches passthrough → Do NOT create POSITIVE revenue fact
```

### E. POS-Specific Mappings

#### TOAST Headers

```yaml
toast_mappings:
  "Net Sales":
    spine_field: magnitude
    vector_type: POSITIVE
    category: "revenue"
    transform: STRIP_CURRENCY
    confidence: 0.99

  "Gross Sales":
    spine_field: magnitude
    vector_type: POSITIVE
    category: "revenue_gross"
    note: "Pre-discount revenue"
    confidence: 0.99

  "Discount Amount":
    spine_field: magnitude
    vector_type: NEGATIVE
    category: "revenue_leakage"
    transform: ABS
    confidence: 0.99

  "Refund Amount":
    spine_field: magnitude
    vector_type: NEGATIVE
    category: "revenue_leakage"
    transform: ABS
    confidence: 0.99

  "Void Amount":
    action: quarantine
    reason: "Requires manual investigation (potential fraud)"

  "Item COGS":
    spine_field: magnitude
    vector_type: NEGATIVE
    category: "food_cost"
    transform: ABS
    confidence: 0.99

  "Waste Amount":
    spine_field: magnitude
    vector_type: NEGATIVE
    category: "waste"
    transform: ABS
    confidence: 0.95
```

#### SQUARE Headers

```yaml
square_mappings:
  "Gross Sales":
    spine_field: magnitude
    vector_type: POSITIVE
    category: "revenue"
    transform: STRIP_CURRENCY
    confidence: 0.99

  "Discounts":
    spine_field: magnitude
    vector_type: NEGATIVE
    category: "revenue_leakage"
    transform: ABS
    confidence: 0.99

  "Net Sales":
    spine_field: magnitude
    vector_type: POSITIVE
    category: "revenue"
    note: "Post-discount revenue"
    confidence: 0.99

  "Cost of Goods":
    spine_field: magnitude
    vector_type: NEGATIVE
    category: "food_cost"
    transform: ABS
    confidence: 0.99
```

#### R365 (Restaurant365) Headers

```yaml
r365_mappings:
  "Actual Sales":
    spine_field: magnitude
    vector_type: POSITIVE
    category: "revenue"
    transform: STRIP_CURRENCY
    confidence: 0.99

  "Theoretical Food Cost":
    spine_field: magnitude
    vector_type: NEGATIVE
    category: "food_cost_theoretical"
    note: "Ideal cost based on recipes"
    transform: ABS
    confidence: 0.95

  "Actual Food Cost":
    spine_field: magnitude
    vector_type: NEGATIVE
    category: "food_cost"
    transform: ABS
    confidence: 0.99

  "Variance":
    action: quarantine
    reason: "Variance = Actual - Theoretical (investigate waste/theft)"
    alert: "💡 Food cost variance detected. Compare actual vs theoretical to identify waste or portion control issues."
```

---

## V. ESCALATION PROTOCOLS

### A. Automatic Quarantine Triggers

```yaml
quarantine_rules:
  conservation_violation:
    condition: "POSITIVE sum < NEGATIVE sum"
    action: "Quarantine ALL facts from this file"
    reason: "Physics violation - business cannot lose more than it earns"
    severity: CRITICAL

  low_confidence:
    condition: "confidence < 0.992"
    action: "Quarantine individual fact"
    reason: "Below certification threshold"
    severity: WARNING

  missing_temporal_anchor:
    condition: "temporal_anchor is NULL"
    action: "Quarantine fact"
    reason: "Cannot determine when transaction occurred"
    severity: ERROR

  duplicate_hash:
    condition: "source_hash already exists in provenance_chain"
    action: "Reject upload"
    reason: "File already processed (prevent double-counting)"
    severity: ERROR

  unrecognized_header:
    condition: "No semantic alias match found"
    action: "Quarantine column"
    reason: "Unknown data - requires human review"
    severity: WARNING

  summary_row_detected:
    condition: "Row contains 'TOTAL' or 'GRAND TOTAL' or 'SUBTOTAL'"
    action: "Exclude from parsing"
    reason: "Summary rows cause double-counting"
    severity: INFO

  negative_revenue:
    condition: "POSITIVE vector has negative magnitude"
    action: "Quarantine fact"
    reason: "Revenue cannot be negative (unless it's a refund)"
    severity: ERROR

  zero_magnitude:
    condition: "magnitude = 0 AND category IN (revenue, cogs, labor)"
    action: "Quarantine fact"
    reason: "Zero cost/revenue is suspicious"
    severity: WARNING
```

### B. Explore Mode Triggers (Insights, Not Errors)

```yaml
explore_mode_alerts:
  prime_cost_high:
    condition: "(COGS + Labor) > 0.70 * revenue"
    message: "💡 Prime Cost is 72% (target: 60-65%). Consider menu price increase or cost reduction."
    severity: WARNING

  waste_high:
    condition: "waste > 0.05 * COGS"
    message: "💡 Waste is 7.2% of food cost. Industry average is 2-4%. Review prep procedures and portion control."
    severity: WARNING

  labor_high:
    condition: "labor > 0.45 * revenue"
    message: "💡 Labor is 48% of revenue. Industry benchmark is 30-35%. Review staffing levels and shift scheduling."
    severity: WARNING

  food_cost_high:
    condition: "food_cost > 0.35 * revenue"
    message: "💡 Food cost is 38% of revenue (target: 28-32%). Review supplier contracts, portion sizes, and waste."
    severity: WARNING

  multi_location_variance:
    condition: "ABS(metric_location_A - metric_location_B) > 0.15"
    message: "💡 Greenwich food cost is 18% higher than Stamford. Investigate supplier contracts or waste procedures."
    severity: INFO

  revenue_leakage_high:
    condition: "(discounts + comps + voids + refunds) > 0.08 * gross_sales"
    message: "💡 Revenue leakage is 10% (target: 3-5%). Review manager authorization logs and discount policies."
    severity: WARNING
```

---

## VI. DATA QUALITY RULES

### A. Outlier Detection

```yaml
outlier_rules:
  magnitude_range:
    condition: "magnitude > (median * 10)"
    action: "Flag for review (likely data entry error)"
    example: "$1,000,000 bagel sale in small shop"
    severity: WARNING

  date_anomaly:
    condition: "temporal_anchor > TODAY OR temporal_anchor < (TODAY - 5 years)"
    action: "Quarantine (future dates or ancient history)"
    reason: "Date is outside reasonable business range"
    severity: ERROR

  negative_revenue:
    condition: "vector_type = POSITIVE AND magnitude < 0"
    action: "Quarantine (revenue cannot be negative)"
    note: "Refunds should be NEGATIVE vector, not negative POSITIVE"
    severity: ERROR

  zero_magnitude:
    condition: "magnitude = 0 AND category IN (revenue, cogs, labor)"
    action: "Quarantine (zero cost/revenue is suspicious)"
    reason: "Critical categories should not be zero"
    severity: WARNING

  string_in_numeric:
    condition: "magnitude field contains non-numeric characters (after currency strip)"
    action: "Quarantine"
    reason: "Cannot parse value as number"
    severity: ERROR

  missing_category:
    condition: "category is NULL OR category = ''"
    action: "Quarantine"
    reason: "Cannot categorize fact for reporting"
    severity: ERROR
```

### B. Summary Row Detection

**Patterns that indicate summary rows (EXCLUDE from parsing):**

```yaml
summary_patterns:
  - "TOTAL"
  - "GRAND TOTAL"
  - "SUBTOTAL"
  - "SUM"
  - "SUMMARY"
  - "AGGREGATE"
  - "NET TOTAL"
  - "DAILY TOTAL"
  - "WEEKLY TOTAL"
  - "MONTHLY TOTAL"

detection_logic:
  - "Check if any cell in row contains summary pattern (case-insensitive)"
  - "Typically occurs in last 10% of file (tail sampling catches this)"
  - "If detected, exclude entire row from fact extraction"
```

**REASON:** Summary rows aggregate line items. Including them causes double-counting.

**Example:**
```csv
Date,Item,Amount
2025-01-01,Bagel Sale,2.50
2025-01-01,Coffee Sale,3.00
2025-01-01,DAILY TOTAL,5.50  ← EXCLUDE THIS ROW
```

If "DAILY TOTAL" row is included, revenue would be counted as $11.00 instead of $5.50.

---

## VI. PIVOT TABLE & REPORT PHYSICS

### A. Horizontal Reporting Format

**Definition:**
A Pivot Table is a financial report where:
- Categories are in ROWS (first column)
- Time periods are in COLUMNS (horizontal)
- Each row becomes MULTIPLE atomic facts (one per period)

**Common Forms:**
- P&L Statements (P1, P2, P3... or Jan, Feb, Mar...)
- Cash Flow Reports (Q1, Q2, Q3, Q4...)
- Multi-Location Reports (Location A, Location B, Location C...)
- Budget vs Actual (Budgeted, Actual, Variance...)

### B. Detection Rules

**Trigger Pivot Mode if:**
1. Row 1 contains period identifiers: "P1", "P2", "P3", "Q1", "Q2", "Jan", "Feb", etc.
2. Row 1 contains location identifiers: "Greenwich", "Stamford", "Manhattan", etc.
3. Row 2 contains date ranges: "12/30-1/26", "1/27-2/23", etc.
4. First column contains category names: "Food Sales", "Labor Cost", "Total Revenue", etc.

### C. Parsing Logic

**Structure Pattern:**
```
Column 0: Category name
Column 1: Period 1 Amount
Column 2: Period 1 Metadata (%, ratio, etc.) → IGNORE
Column 3: Period 2 Amount
Column 4: Period 2 Metadata → IGNORE
Column 5: Period 3 Amount
...
```

**Extraction Rules:**
1. Parse period headers from Row 1 (skip empty columns)
2. Parse date ranges from Row 2 (if present)
3. For each data row (Row 3+):
   - Column 0 = category
   - Extract amounts from odd columns (1, 3, 5, 7...)
   - Ignore even columns (2, 4, 6, 8...) - they're percentages/metadata
4. Create ONE fact per period per category

**Example Transformation:**
```
Input Row:
"Food Sales,$64,814,98.6%,$51,707,95.5%,$65,769,86.1%"

Output Facts:
Fact 1: {
  temporal_anchor: "P1 (12/30-1/26)",
  category: "Food Sales",
  magnitude: 64814,
  vector_type: "POSITIVE",
  confidence: 0.999
}
Fact 2: {
  temporal_anchor: "P2 (1/27-2/23)",
  category: "Food Sales",
  magnitude: 51707,
  vector_type: "POSITIVE",
  confidence: 0.999
}
Fact 3: {
  temporal_anchor: "P3 (2/24-3/30)",
  category: "Food Sales",
  magnitude: 65769,
  vector_type: "POSITIVE",
  confidence: 0.999
}
```

### D. Special Handling

**Percentage Columns:**
- Always appear AFTER amount columns
- Treat as metadata (do NOT create facts)
- Can be stored in triad_map for context

**Empty Columns:**
- Often used as visual separators in Excel exports
- Skip any column that is consistently empty

**Summary Rows:**
- Detect rows with "Total", "Subtotal", "Grand Total"
- Exclude from atomic facts (they're aggregations)

**Variance Columns:**
- "Budget vs Actual", "Variance", "Difference"
- Create as separate facts with category suffix
- Example: "Food Sales - Variance" → separate fact

### E. Multi-Dimensional Pivots

**Some reports have BOTH periods AND locations:**
```
Category, Greenwich P1, Greenwich P2, Stamford P1, Stamford P2
Food Sales, $10k, $12k, $8k, $9k
```

**Parsing:**
- Detect dimension pattern (Location + Period)
- Create facts with combined temporal_anchor
- Example: temporal_anchor = "Greenwich - P1 (12/30-1/26)"

### F. Strategic Value

**The Moat:**
- Julius.ai: "Upload your P&L" → crashes → "Sorry, we only support Toast exports"
- Lighthouse: "Upload your P&L" → Gemini sees pivot structure → unpivots to atomic facts → "✓ 132 facts certified across 12 periods"

**Works for:**
- P&L statements (any format)
- Cash flow reports
- Multi-location comparisons
- Quarterly earnings (Q1, Q2, Q3, Q4)
- Monthly sales (Jan, Feb, Mar...)
- Budget vs Actual comparisons
- Any horizontal financial report

---

## VII. TRANSFORMATION RULES

### A. Currency Stripping

```yaml
STRIP_CURRENCY:
  patterns_to_remove:
    - "$"
    - "USD"
    - "€"
    - "£"
    - ","  # Thousand separator
    - " "  # Whitespace

  examples:
    - "$1,234.56" → 1234.56
    - "USD 999.99" → 999.99
    - "€ 500,00" → 500.00  # Note: European comma decimal
```

### B. Absolute Value

```yaml
ABS:
  purpose: "Convert negative numbers to positive magnitude"
  use_case: "COGS/Labor costs often exported as negative, but spine stores magnitude as positive with vector_type=NEGATIVE"

  examples:
    - -450.00 → 450.00 (vector_type: NEGATIVE)
    - -1875.00 → 1875.00 (vector_type: NEGATIVE)
```

### C. Negate

```yaml
NEGATE:
  purpose: "Flip sign (positive → negative, negative → positive)"
  use_case: "Refunds exported as positive but should be NEGATIVE vector"

  examples:
    - 100.00 → -100.00 (then ABS → 100.00, vector_type: NEGATIVE)
```

### D. Date Parsing

```yaml
PARSE_DATE:
  accepted_formats:
    - "YYYY-MM-DD" (ISO 8601)
    - "MM/DD/YYYY" (US format)
    - "DD/MM/YYYY" (European format)
    - "YYYY-MM-DD HH:MM:SS" (Timestamp)

  output_format: "YYYY-MM-DD" (ISO 8601)

  validation:
    - "Date must be <= TODAY"
    - "Date must be >= (TODAY - 5 years)"
    - "If invalid, quarantine fact"
```

---

## VIII. CONFIDENCE SCORING

### A. Deterministic Parsing (CSV)

```yaml
exact_match_confidence: 0.999
  condition: "Column name exactly matches GEMINI.md alias"
  example: "Net Sales" → 0.999

fuzzy_match_confidence: 0.95
  condition: "Column name matches fuzzy pattern"
  example: "Total Sales Amount" → 0.95 (contains "sales")

gemini_sniffer_confidence: 0.85 - 0.99
  condition: "Gemini 3 Flash semantic mapping"
  source: "Sniffer's column_mapping.confidence"

manual_override: 0.60
  condition: "Human tagged column in quarantine UI"
  note: "Below 0.992, requires second human review"
```

### B. Azure Vision (PDF/Image)

```yaml
azure_high_confidence: 0.95 - 0.99
  condition: "Azure returns 'High' confidence on extracted text"

azure_medium_confidence: 0.85 - 0.95
  condition: "Azure returns 'Medium' confidence"

azure_low_confidence: < 0.85
  condition: "Azure returns 'Low' confidence or ambiguous field"
  action: "Quarantine for human review"
```

---

## IX. EDGE CASE HANDLING

### A. Negative Revenue (Refunds)

**Problem:** Refunds are revenue reductions, but how to represent?

**Solution:**
```yaml
refund_mapping:
  vector_type: NEGATIVE
  category: "revenue_leakage"
  magnitude: ABS(refund_amount)

  example:
    - Gross Sales: $5,000 (POSITIVE)
    - Refunds: $200 (NEGATIVE, category: revenue_leakage)
    - Net Sales: $4,800 (POSITIVE - NEGATIVE)
```

### B. Multi-Currency

**Problem:** International operations in EUR, GBP, etc.

**Solution:**
```yaml
currency_normalization:
  - Detect currency symbol/code
  - Convert to USD using exchange rate on temporal_anchor date
  - Store original_currency and exchange_rate in triad_map metadata

  example:
    magnitude: 500.00 (USD)
    original_currency: "EUR"
    original_magnitude: 450.00
    exchange_rate: 1.11
    temporal_anchor: "2025-01-15"
```

### C. Multi-Period Files

**Problem:** CSV contains multiple days/months

**Solution:**
```yaml
temporal_aggregation:
  - Extract temporal_anchor from each row
  - Group facts by temporal_anchor
  - Do NOT aggregate - store as individual facts

  reason: "Preserves granularity for trend analysis"

  example:
    - Row 1: 2025-01-01, Revenue: $1,000
    - Row 2: 2025-01-02, Revenue: $1,200
    - Result: 2 facts (not 1 fact of $2,200)
```

---

## X. AUDIT TRAIL REQUIREMENTS

### A. Minimum Provenance Fields

Every fact in `atomic_fact_spine` MUST have:

```yaml
required_provenance:
  provenance_id:
    type: UUID
    purpose: "Links fact to provenance_chain table"

  source_hash:
    type: SHA-256 hex string
    purpose: "Cryptographic fingerprint of source file"

  source_type:
    type: ENUM
    values: ["WEB_UPLOAD", "EMAIL_INGEST", "API_PUSH"]

  document_type:
    type: ENUM
    values: ["INVOICE", "RECEIPT", "STATEMENT", "PAYROLL", "INVENTORY", "REPORT"]

  blob_storage_id:
    type: String
    purpose: "Path to raw file in Supabase storage (raw-receipts bucket)"

  ingest_timestamp:
    type: TIMESTAMP
    purpose: "When file was uploaded"
```

### B. Fact-Level Metadata

Every fact in `atomic_fact_spine` SHOULD have (in `triad_map` JSONB):

```yaml
optional_metadata:
  source_row: 42
  source_column: "Net Sales"
  extraction_method: "GEMINI_SNIFFER"
  sniffer_confidence: 0.95
  pos_system: "TOAST"
  original_value: "$1,234.56"
  transform_applied: "STRIP_CURRENCY"
```

---

## XI. DEPLOYMENT CHECKLIST

Before going live:

```yaml
data_validation:
  - [ ] Test with TOAST export (Net Sales, Item COGS)
  - [ ] Test with Square export (Gross Sales, Discounts)
  - [ ] Test with R365 export (Actual Sales, Variance)
  - [ ] Test with custom CSV (no POS match)
  - [ ] Test with multi-period file (30 days of data)
  - [ ] Test with summary rows (verify exclusion)
  - [ ] Test with outliers (verify quarantine)

physics_validation:
  - [ ] Verify conservation: POSITIVE >= NEGATIVE
  - [ ] Verify Prime Cost: (COGS + Labor) / Revenue
  - [ ] Verify revenue leakage: (Discounts + Voids) / Gross Sales

security_validation:
  - [ ] Verify SHA-256 hashing on all uploads
  - [ ] Verify duplicate file rejection
  - [ ] Verify 0.992 confidence gate enforcement
  - [ ] Verify quarantine isolation (no auto-certification)

performance_validation:
  - [ ] Upload 1,000-row CSV (should complete < 10 seconds)
  - [ ] Upload 10,000-row CSV (should complete < 60 seconds)
  - [ ] Verify Gemini 3 Flash sniffer latency < 5 seconds
```

---

**END OF CONSTITUTION**

**Version History:**
- v1.0 (2025-01-26): Initial release - Foundation for F&B intelligence
