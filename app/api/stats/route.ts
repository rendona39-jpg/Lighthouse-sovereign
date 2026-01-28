import { NextResponse } from 'next/server';
import type { LighthouseStats } from '@/lib/types';

// Mock data that simulates the backend response
const mockStats: LighthouseStats = {
  pulse: [
    { period: 'P1', revenue: 68500, expenses: 52000, margin_pct: 24.1, fact_count: 45 },
    { period: 'P2', revenue: 72300, expenses: 54200, margin_pct: 25.0, fact_count: 48 },
    { period: 'P3', revenue: 69800, expenses: 53100, margin_pct: 23.9, fact_count: 46 },
    { period: 'P4', revenue: 75400, expenses: 55800, margin_pct: 26.0, fact_count: 50 },
    { period: 'P5', revenue: 71200, expenses: 54500, margin_pct: 23.5, fact_count: 47 },
    { period: 'P6', revenue: 78900, expenses: 57200, margin_pct: 27.5, fact_count: 52 },
    { period: 'P7', revenue: 82100, expenses: 59800, margin_pct: 27.2, fact_count: 54 },
    { period: 'P8', revenue: 79500, expenses: 58100, margin_pct: 26.9, fact_count: 53 },
    { period: 'P9', revenue: 84300, expenses: 61200, margin_pct: 27.4, fact_count: 56 },
    { period: 'P10', revenue: 86700, expenses: 62500, margin_pct: 27.9, fact_count: 57 },
    { period: 'P11', revenue: 89200, expenses: 64100, margin_pct: 28.1, fact_count: 59 },
    { period: 'P12', revenue: 97603, expenses: 69800, margin_pct: 28.5, fact_count: 61 },
  ],
  topDrivers: [
    { name: 'Hot Bagels', value: 277250, pct_total: 32.4, vector_type: 'product' },
    { name: 'Cold Brew Coffee', value: 162045, pct_total: 18.9, vector_type: 'product' },
    { name: 'Breakfast Sandwiches', value: 128325, pct_total: 15.0, vector_type: 'product' },
    { name: 'Fresh Pastries', value: 94105, pct_total: 11.0, vector_type: 'product' },
    { name: 'Lunch Specials', value: 76995, pct_total: 9.0, vector_type: 'product' },
    { name: 'Specialty Drinks', value: 59785, pct_total: 7.0, vector_type: 'product' },
    { name: 'Catering Orders', value: 42755, pct_total: 5.0, vector_type: 'service' },
    { name: 'Merchandise', value: 14243, pct_total: 1.7, vector_type: 'product' },
  ],
  efficiency: {
    margin: 24.8,
    totalRevenue: 855503,
    totalExpenses: 643300,
    factDensity: 558,
    avgConfidence: 0.942,
    physicsCertified: 523,
    periodRange: 'P1-P12',
  },
  expenseLeaks: [
    { type: 'Food Waste', cost: 28500, pct_burn: 4.4, periods_active: 12 },
    { type: 'Overtime Labor', cost: 24200, pct_burn: 3.8, periods_active: 8 },
    { type: 'Utility Overages', cost: 12800, pct_burn: 2.0, periods_active: 6 },
    { type: 'Supply Chain Premium', cost: 9500, pct_burn: 1.5, periods_active: 4 },
    { type: 'Equipment Repairs', cost: 7200, pct_burn: 1.1, periods_active: 3 },
    { type: 'Marketing Inefficiency', cost: 5400, pct_burn: 0.8, periods_active: 5 },
  ],
  metadata: {
    org_id: 'greenwich_bagels',
    domain_pattern: 'VOLUME_BASED',
    hero_category: 'Hot Bagels',
    category_granularity: 8,
    avg_ticket_size: 14.75,
    revenue_concentration: 0.324,
  },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('org_id');

  if (!orgId) {
    return NextResponse.json(
      { error: 'org_id is required' },
      { status: 400 }
    );
  }

  // Simulate API latency
  await new Promise((resolve) => setTimeout(resolve, 200));

  return NextResponse.json(mockStats);
}
