import type { Message, LighthouseStats } from './types';

export const DEMO_BUSINESS = {
  name: "Osteria Luminosa",
  location: "Greenwich, CT",
  industry: "Fine Dining Italian",
  revenue: 1247000,
  factsCertified: 892,
  topDriver: { name: "Tasting Menu", pct: 42, value: 523740 },
  margin: 18.5,
  periods: 12
};

export const DEMO_STATS: LighthouseStats = {
  pulse: [
    { period: 'P1', revenue: 98000, expenses: 80360, margin_pct: 18.0, fact_count: 74 },
    { period: 'P2', revenue: 102000, expenses: 83640, margin_pct: 18.0, fact_count: 76 },
    { period: 'P3', revenue: 105000, expenses: 85575, margin_pct: 18.5, fact_count: 78 },
    { period: 'P4', revenue: 100000, expenses: 82000, margin_pct: 18.0, fact_count: 73 },
    { period: 'P5', revenue: 103000, expenses: 84460, margin_pct: 18.0, fact_count: 75 },
    { period: 'P6', revenue: 101000, expenses: 82820, margin_pct: 18.0, fact_count: 74 },
    { period: 'P7', revenue: 99000, expenses: 81180, margin_pct: 18.0, fact_count: 72 },
    { period: 'P8', revenue: 104000, expenses: 84760, margin_pct: 18.5, fact_count: 77 },
    { period: 'P9', revenue: 106000, expenses: 86290, margin_pct: 18.6, fact_count: 79 },
    { period: 'P10', revenue: 98600, expenses: 81050, margin_pct: 17.8, fact_count: 71 },
    { period: 'P11', revenue: 102400, expenses: 83865, margin_pct: 18.1, fact_count: 75 },
    { period: 'P12', revenue: 108200, expenses: 87450, margin_pct: 19.2, fact_count: 80 },
  ],
  topDrivers: [
    { name: 'Tasting Menu', value: 523740, pct_total: 42, vector_type: 'revenue' },
    { name: 'Wine Program', value: 311750, pct_total: 25, vector_type: 'revenue' },
    { name: 'Handmade Pasta', value: 187050, pct_total: 15, vector_type: 'revenue' },
    { name: 'Seasonal Specials', value: 149640, pct_total: 12, vector_type: 'revenue' },
    { name: 'Private Dining', value: 74820, pct_total: 6, vector_type: 'revenue' },
  ],
  efficiency: {
    margin: 18.5,
    totalRevenue: 1247000,
    totalExpenses: 1016305,
    factDensity: 892,
    avgConfidence: 0.942,
    physicsCertified: 847,
    periodRange: 'P1-P12 (12 months)',
  },
  expenseLeaks: [
    { type: 'Imported Ingredients', cost: 64844, pct_burn: 5.2, periods_active: 12 },
    { type: 'Sommelier Labor', cost: 49880, pct_burn: 4.0, periods_active: 12 },
    { type: 'Linen Service', cost: 31175, pct_burn: 2.5, periods_active: 12 },
    { type: 'Equipment Maintenance', cost: 24940, pct_burn: 2.0, periods_active: 8 },
  ],
  metadata: {
    org_id: 'osteria-luminosa',
    domain_pattern: 'SERVICE_BASED',
    hero_category: 'Tasting Menu',
    category_granularity: 5,
    avg_ticket_size: 127,
    revenue_concentration: 0.42,
  },
};

export const DEMO_MESSAGES: Message[] = [
  {
    id: 'demo-1',
    role: 'user',
    content: 'What is my total revenue?',
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: 'demo-2',
    role: 'assistant',
    content: 'Your total revenue is **$1,247,000**, certified from 892 facts across 12 periods. This represents strong performance for an upscale Italian restaurant in Greenwich.',
    timestamp: new Date(Date.now() - 295000),
    mode: 'certified',
    reasoning: {
      trace: [
        { step: 'query_parse', message: 'Identified revenue aggregation request' },
        { step: 'fact_retrieval', message: 'Retrieved 892 certified revenue facts' },
        { step: 'aggregation', message: 'Summed across 12 accounting periods' },
      ],
    },
    chartData: {
      chartType: 'bar',
      data: [
        { period: 'P1', revenue: 98000 },
        { period: 'P2', revenue: 102000 },
        { period: 'P3', revenue: 105000 },
        { period: 'P4', revenue: 100000 },
        { period: 'P5', revenue: 103000 },
        { period: 'P6', revenue: 101000 },
        { period: 'P7', revenue: 99000 },
        { period: 'P8', revenue: 104000 },
        { period: 'P9', revenue: 106000 },
        { period: 'P10', revenue: 98600 },
        { period: 'P11', revenue: 102400 },
        { period: 'P12', revenue: 108200 },
      ],
      config: {
        xAxis: 'period',
        yAxis: 'revenue',
        title: 'Revenue by Period',
      },
    },
    provenance: [
      { fact_id: 'rev-001', source: 'P&L Statement', confidence: 0.98 },
      { fact_id: 'rev-002', source: 'Toast POS Export', confidence: 0.95 },
    ],
  },
  {
    id: 'demo-3',
    role: 'user',
    content: 'What are my top revenue drivers?',
    timestamp: new Date(Date.now() - 200000),
  },
  {
    id: 'demo-4',
    role: 'assistant',
    content: 'Your top 5 revenue drivers are:\n\n1. **Tasting Menu**: $523,740 (42%)\n2. **Wine Program**: $311,750 (25%)\n3. **Handmade Pasta**: $187,050 (15%)\n4. **Seasonal Specials**: $149,640 (12%)\n5. **Private Dining**: $74,820 (6%)\n\nThe Tasting Menu is your strongest performer, indicating strong premium positioning in the Greenwich market.',
    timestamp: new Date(Date.now() - 195000),
    mode: 'certified',
    reasoning: {
      trace: [
        { step: 'category_analysis', message: 'Grouped revenue by menu category' },
        { step: 'ranking', message: 'Sorted by total contribution' },
        { step: 'insight_generation', message: 'Identified premium positioning signal' },
      ],
    },
    actions: [
      { text: 'Analyze Tasting Menu trends', query: 'How is the Tasting Menu performing month over month?' },
      { text: 'Compare to industry', query: 'How does my revenue mix compare to similar restaurants?' },
    ],
  },
  {
    id: 'demo-5',
    role: 'user',
    content: 'Show expense breakdown',
    timestamp: new Date(Date.now() - 100000),
  },
  {
    id: 'demo-6',
    role: 'assistant',
    content: 'Your top expense categories:\n\n**High Priority:**\n- Imported Ingredients: $64,844 (5.2% burn)\n- Sommelier Labor: $49,880 (4.0% burn)\n\n**Standard:**\n- Linen Service: $31,175 (2.5% burn)\n- Equipment Maintenance: $24,940 (2.0% burn)\n\nImported Ingredients represents your largest controllable cost. Consider seasonal sourcing strategies to optimize.',
    timestamp: new Date(Date.now() - 95000),
    mode: 'certified',
    reasoning: {
      trace: [
        { step: 'expense_retrieval', message: 'Retrieved 324 expense facts' },
        { step: 'categorization', message: 'Grouped by expense type' },
        { step: 'burn_calculation', message: 'Calculated percentage of revenue' },
      ],
    },
    actions: [
      { text: 'Optimize imported ingredients', query: 'How can I reduce imported ingredient costs?' },
      { text: 'Compare to industry', query: 'Is my labor cost typical for fine dining?' },
    ],
  },
];

export const DEMO_CATEGORY_PERFORMANCE = [
  { category: 'Tasting Menu', revenue: 523740, pctTotal: 42, trend: '+8%', trendUp: true },
  { category: 'Wine Program', revenue: 311750, pctTotal: 25, trend: '+12%', trendUp: true },
  { category: 'Handmade Pasta', revenue: 187050, pctTotal: 15, trend: '-2%', trendUp: false },
  { category: 'Seasonal Specials', revenue: 149640, pctTotal: 12, trend: '+5%', trendUp: true },
  { category: 'Private Dining', revenue: 74820, pctTotal: 6, trend: '+18%', trendUp: true },
];

export const DEMO_PERIOD_COMPARISON = [
  { period: 'P12', revenue: 108200, margin: 19.2, status: 'best', label: 'Best period' },
  { period: 'P11', revenue: 102400, margin: 18.1, status: 'stable', label: 'Stable' },
  { period: 'P10', revenue: 98600, margin: 17.8, status: 'below', label: 'Below average' },
];

export const DEMO_SEASONAL_INSIGHTS = [
  'Winter revenue typically 15% higher (holiday season)',
  'Summer months see 8% dip (vacation travel)',
  'Consider summer patio specials to offset seasonal decline',
];

export const DEMO_UPLOADED_FILES = [
  { name: 'P&L_Dec2024.csv', facts: 409, date: 'Jan 26', status: 'certified' },
  { name: 'Toast_Export.csv', facts: 127, date: 'Jan 25', status: 'certified' },
  { name: 'Invoices_Jan.pdf', facts: 22, date: 'Jan 24', status: 'certified' },
];
