import { NextResponse } from 'next/server';
import type { QueryResponse } from '@/lib/types';

// Simulated AI responses based on query patterns
function generateResponse(message: string): QueryResponse {
  const lowerMessage = message.toLowerCase();
  
  // Revenue-related queries
  if (lowerMessage.includes('revenue') || lowerMessage.includes('sales')) {
    return {
      mode: 'certified',
      answer: 'Your total revenue for the period P1-P12 is $855,503. Hot Bagels is your top revenue driver at 32.4% ($277,250), followed by Cold Brew Coffee at 18.9% ($162,045). Revenue has shown a consistent upward trend, with P12 being your strongest period at $97,603.',
      reasoning: {
        trace: [
          { step: 'analyzing', message: 'Parsing revenue metrics from certified facts...' },
          { step: 'fetching', message: 'Retrieving period-over-period comparisons...' },
          { step: 'computing', message: 'Calculating driver contributions...' },
        ],
      },
      provenance: [
        { fact_id: 'f_001', source: 'sales_report_2024.csv', confidence: 0.98 },
        { fact_id: 'f_002', source: 'pos_transactions.csv', confidence: 0.95 },
        { fact_id: 'f_003', source: 'daily_summary.csv', confidence: 0.97 },
      ],
      chartData: {
        chartType: 'bar',
        data: [
          { period: 'P1', revenue: 68500 },
          { period: 'P2', revenue: 72300 },
          { period: 'P3', revenue: 69800 },
          { period: 'P4', revenue: 75400 },
          { period: 'P5', revenue: 71200 },
          { period: 'P6', revenue: 78900 },
          { period: 'P7', revenue: 82100 },
          { period: 'P8', revenue: 79500 },
          { period: 'P9', revenue: 84300 },
          { period: 'P10', revenue: 86700 },
          { period: 'P11', revenue: 89200 },
          { period: 'P12', revenue: 97603 },
        ],
        config: {
          xAxis: 'period',
          yAxis: 'revenue',
          title: 'Revenue by Period',
        },
      },
      actions: [
        { text: 'Show top products', query: 'What are my best selling products?' },
        { text: 'Compare to expenses', query: 'How do my expenses compare to revenue?' },
        { text: 'Forecast next period', query: 'What is the revenue forecast for P13?' },
      ],
      timestamp: new Date().toISOString(),
    };
  }

  // Expense-related queries
  if (lowerMessage.includes('expense') || lowerMessage.includes('cost') || lowerMessage.includes('spending')) {
    return {
      mode: 'certified',
      answer: 'Your total expenses for P1-P12 are $643,300, resulting in a gross margin of 24.8%. The largest expense leaks identified are Food Waste ($28,500, 4.4% of burn) and Overtime Labor ($24,200, 3.8% of burn). Addressing these two areas could improve your margin by up to 2-3 percentage points.',
      reasoning: {
        trace: [
          { step: 'analyzing', message: 'Categorizing expense patterns...' },
          { step: 'fetching', message: 'Identifying recurring cost centers...' },
          { step: 'computing', message: 'Calculating burn rate percentages...' },
        ],
      },
      provenance: [
        { fact_id: 'f_101', source: 'expense_ledger.csv', confidence: 0.96 },
        { fact_id: 'f_102', source: 'payroll_records.csv', confidence: 0.94 },
      ],
      actions: [
        { text: 'Reduce food waste', query: 'How can I reduce food waste?' },
        { text: 'Optimize labor', query: 'Show me overtime labor trends' },
        { text: 'Compare margins', query: 'How does my margin compare to industry?' },
      ],
      timestamp: new Date().toISOString(),
    };
  }

  // Product-related queries
  if (lowerMessage.includes('product') || lowerMessage.includes('bagel') || lowerMessage.includes('best selling')) {
    return {
      mode: 'certified',
      answer: 'Your top performing products by revenue contribution are:\n\n1. **Hot Bagels** - $277,250 (32.4%)\n2. **Cold Brew Coffee** - $162,045 (18.9%)\n3. **Breakfast Sandwiches** - $128,325 (15.0%)\n4. **Fresh Pastries** - $94,105 (11.0%)\n5. **Lunch Specials** - $76,995 (9.0%)\n\nHot Bagels alone accounts for nearly a third of your total revenue, making it your hero category.',
      reasoning: {
        trace: [
          { step: 'analyzing', message: 'Ranking products by revenue contribution...' },
          { step: 'fetching', message: 'Pulling category breakdowns...' },
        ],
      },
      provenance: [
        { fact_id: 'f_201', source: 'product_sales.csv', confidence: 0.97 },
        { fact_id: 'f_202', source: 'inventory_movement.csv', confidence: 0.93 },
      ],
      chartData: {
        chartType: 'bar',
        data: [
          { name: 'Hot Bagels', value: 277250 },
          { name: 'Cold Brew', value: 162045 },
          { name: 'Sandwiches', value: 128325 },
          { name: 'Pastries', value: 94105 },
          { name: 'Lunch', value: 76995 },
        ],
        config: {
          xAxis: 'name',
          yAxis: 'value',
          title: 'Revenue by Product Category',
        },
      },
      actions: [
        { text: 'Bagel trends', query: 'Show me Hot Bagels performance over time' },
        { text: 'Pricing analysis', query: 'What is my average ticket size?' },
      ],
      timestamp: new Date().toISOString(),
    };
  }

  // Margin-related queries
  if (lowerMessage.includes('margin') || lowerMessage.includes('profit')) {
    return {
      mode: 'certified',
      answer: 'Your current gross margin is **24.8%** based on certified facts with 94.2% average confidence. This represents $212,203 in gross profit from $855,503 in revenue. Your margin has improved from 24.1% in P1 to 28.5% in P12, showing positive operational efficiency gains.',
      reasoning: {
        trace: [
          { step: 'analyzing', message: 'Computing margin metrics...' },
          { step: 'fetching', message: 'Tracking margin progression...' },
        ],
      },
      provenance: [
        { fact_id: 'f_301', source: 'financial_summary.csv', confidence: 0.98 },
      ],
      chartData: {
        chartType: 'line',
        data: [
          { period: 'P1', margin: 24.1 },
          { period: 'P2', margin: 25.0 },
          { period: 'P3', margin: 23.9 },
          { period: 'P4', margin: 26.0 },
          { period: 'P5', margin: 23.5 },
          { period: 'P6', margin: 27.5 },
          { period: 'P7', margin: 27.2 },
          { period: 'P8', margin: 26.9 },
          { period: 'P9', margin: 27.4 },
          { period: 'P10', margin: 27.9 },
          { period: 'P11', margin: 28.1 },
          { period: 'P12', margin: 28.5 },
        ],
        config: {
          xAxis: 'period',
          yAxis: 'margin',
          title: 'Margin Trend (%)',
        },
      },
      actions: [
        { text: 'Improve margin', query: 'How can I improve my margin?' },
        { text: 'Industry benchmark', query: 'What is the industry average margin?' },
      ],
      timestamp: new Date().toISOString(),
    };
  }

  // Default explore response for unmatched queries
  return {
    mode: 'explore',
    answer: `I understand you're asking about "${message}". Based on your business data, I can help you explore insights related to revenue trends, expense analysis, product performance, and operational metrics. Could you provide more specific details about what you'd like to know?`,
    reasoning: {
      trace: [
        { step: 'analyzing', message: 'Processing your question...' },
        { step: 'generating', message: 'Preparing exploratory response...' },
      ],
    },
    actions: [
      { text: 'Revenue overview', query: 'What is my total revenue?' },
      { text: 'Expense breakdown', query: 'Show me my expense breakdown' },
      { text: 'Top products', query: 'What are my best selling products?' },
      { text: 'Margin analysis', query: 'What is my profit margin?' },
    ],
    timestamp: new Date().toISOString(),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      );
    }

    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 800));

    const response = generateResponse(message);
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: 'Query processing failed' },
      { status: 500 }
    );
  }
}
