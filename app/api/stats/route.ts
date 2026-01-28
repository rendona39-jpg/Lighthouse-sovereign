// ════════════════════════════════════════════════════════════════════════════
// LIGHTHOUSE STATS API - ANCHOR LOGIC EDITION
// ════════════════════════════════════════════════════════════════════════════
// Mission: Lock onto single source of truth - 'Total sales Total'
// Physics: Ignore nested spreadsheet totals, trust the anchor rows
// ════════════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════
// SERVER-SIDE SUPABASE CLIENT (Lazy initialization to avoid build-time eval)
// ═══════════════════════════════════════════════════════════════════════════
function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    return null; // Return null if not configured
  }
  
  return createClient(url, key);
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export interface PulsePeriod {
  period: string;
  revenue: number;
  expenses: number;
  margin_pct: number;
  fact_count: number;
}

export interface TopDriver {
  name: string;
  value: number;
  pct_total: number;
  vector_type: string;
}

export interface ExpenseLeak {
  type: string;
  cost: number;
  pct_burn: number;
  periods_active: number;
}

export interface EfficiencyMetrics {
  margin: number;
  totalRevenue: number;
  totalExpenses: number;
  factDensity: number;
  avgConfidence: number;
  physicsCertified: number;
  periodRange: string;
}

export interface DomainMetadata {
  timestamp: string;
  org_id: string;
  domain_pattern: 'VOLUME_BASED' | 'SERVICE_BASED' | 'HYBRID';
  hero_category: string;
  category_granularity: number;
  avg_ticket_size: number;
  revenue_concentration: number;
  mutation_ready: boolean;
  anchor_used: string;
}

export interface LighthouseStats {
  pulse: PulsePeriod[];
  topDrivers: TopDriver[];
  efficiency: EfficiencyMetrics;
  expenseLeaks: ExpenseLeak[];
  metadata: DomainMetadata;
}

// ═══════════════════════════════════════════════════════════════════════════
// ANCHOR DETECTION - The Single Source of Truth
// ═══════════════════════════════════════════════════════════════════════════

const REVENUE_ANCHORS = [
  'Total sales Total',
  'Total Sales Total',
  'Net Sales Total',
  'Total Revenue'
];

const EXPENSE_ANCHORS = [
  'Total Expenses',
  'Total COGs',
  'Total Operating Expenses'
];

const findAnchor = (facts: any[], anchors: string[]): any | null => {
  for (const anchor of anchors) {
    const found = facts.find(fact => 
      fact.triad_map?.category?.trim() === anchor
    );
    if (found) {
      console.log(`🎯 ANCHOR FOUND: "${anchor}" = $${parseFloat(found.magnitude).toLocaleString()}`);
      return found;
    }
  }
  return null;
};

// ═══════════════════════════════════════════════════════════════════════════
// CONTAINER FILTERS (for detail analysis only)
// ═══════════════════════════════════════════════════════════════════════════

const isContainerCategory = (name: string): boolean => {
  const containers = [
    'Menus Total',
    'Menu groups Total',
    'Total sales Total', // Exclude from detail but use as anchor
    'Total Sales Total',
    'Menus',
    'Menu groups',
    'Food'
  ];
  return containers.some(c => name === c);
};

// ═══════════════════════════════════════════════════════════════════════════
// UNIVERSAL DOMAIN ADAPTER
// ═══════════════════════════════════════════════════════════════════════════

interface DomainPattern {
  pattern: 'VOLUME_BASED' | 'SERVICE_BASED' | 'HYBRID';
  hero_category: string;
  category_granularity: number;
  avg_ticket_size: number;
  revenue_concentration: number;
}

const analyzeDomainPattern = (
  topDrivers: TopDriver[],
  totalRevenue: number
): DomainPattern => {
  const uniqueCategories = new Set(topDrivers.map(d => d.name));
  const categoryCount = uniqueCategories.size;
  
  const avgTicketSize = topDrivers.length > 0
    ? topDrivers.reduce((sum, d) => sum + d.value, 0) / topDrivers.length
    : 0;
  
  const heroRevenue = topDrivers.length > 0 ? topDrivers[0].value : 0;
  const concentration = totalRevenue > 0 
    ? (heroRevenue / totalRevenue) * 100 
    : 0;

  const heroCategory = topDrivers.length > 0 
    ? topDrivers[0].name 
    : 'Unknown';

  let pattern: 'VOLUME_BASED' | 'SERVICE_BASED' | 'HYBRID';

  if (categoryCount > 20 || avgTicketSize < 1000) {
    pattern = 'VOLUME_BASED';
  } else if (categoryCount < 5 && avgTicketSize > 10000) {
    pattern = 'SERVICE_BASED';
  } else {
    pattern = 'HYBRID';
  }

  return {
    pattern,
    hero_category: heroCategory,
    category_granularity: categoryCount,
    avg_ticket_size: Math.round(avgTicketSize),
    revenue_concentration: Math.round(concentration * 10) / 10
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id') || 'greenwich_final';

    // ═══════════════════════════════════════════════════════════════════════
    // FETCH from Atomic Fact Spine
    // ═══════════════════════════════════════════════════════════════════════
    const supabase = getSupabaseClient();
    
    // If Supabase is not configured, return empty stats (demo mode)
    if (!supabase) {
      return NextResponse.json({
        pulse: [],
        topDrivers: [],
        efficiency: {
          margin: 0,
          totalRevenue: 0,
          totalExpenses: 0,
          factDensity: 0,
          avgConfidence: 0,
          physicsCertified: 0,
          periodRange: 'No data'
        },
        expenseLeaks: [],
        metadata: {
          timestamp: new Date().toISOString(),
          org_id: orgId,
          domain_pattern: 'VOLUME_BASED' as const,
          hero_category: 'None',
          category_granularity: 0,
          avg_ticket_size: 0,
          revenue_concentration: 0,
          mutation_ready: false,
          anchor_used: 'Demo Mode - No Supabase configured'
        }
      });
    }
    
    const { data: facts, error } = await supabase
      .from('atomic_fact_spine')
      .select('*')
      .eq('org_id', orgId);

    if (error) throw error;
    if (!facts || facts.length === 0) {
      throw new Error(`No facts found for org_id: ${orgId}`);
    }

    console.log(`✓ Fetched ${facts.length} facts for org: ${orgId}`);

    // ═══════════════════════════════════════════════════════════════════════
    // ANCHOR LOGIC: Find Single Source of Truth
    // ═══════════════════════════════════════════════════════════════════════
    
    const revenueAnchor = findAnchor(facts, REVENUE_ANCHORS);
    const expenseAnchor = findAnchor(facts, EXPENSE_ANCHORS);

    let totalRevenue: number;
    let anchorUsed: string;

    if (revenueAnchor) {
      // USE ANCHOR: Single source of truth
      totalRevenue = Math.abs(parseFloat(revenueAnchor.magnitude) || 0);
      anchorUsed = revenueAnchor.triad_map?.category || 'Unknown Anchor';
      console.log(`🎯 USING REVENUE ANCHOR: "${anchorUsed}" = $${totalRevenue.toLocaleString()}`);
    } else {
      // FALLBACK: Sum all POSITIVE facts (excluding containers)
      totalRevenue = facts
        .filter(f => f.vector_type === 'POSITIVE')
        .filter(f => !isContainerCategory(f.triad_map?.category || ''))
        .reduce((sum, f) => sum + Math.abs(parseFloat(f.magnitude) || 0), 0);
      anchorUsed = 'Calculated from POSITIVE facts';
      console.log(`⚠️  No revenue anchor found. Calculated: $${totalRevenue.toLocaleString()}`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EXPENSE CALCULATION
    // ═══════════════════════════════════════════════════════════════════════
    
    let totalExpenses: number;

    if (expenseAnchor) {
      totalExpenses = Math.abs(parseFloat(expenseAnchor.magnitude) || 0);
      console.log(`🎯 USING EXPENSE ANCHOR: "${expenseAnchor.triad_map?.category}" = $${totalExpenses.toLocaleString()}`);
    } else {
      // FALLBACK: Sum all NEGATIVE facts
      totalExpenses = facts
        .filter(f => f.vector_type === 'NEGATIVE')
        .reduce((sum, f) => sum + Math.abs(parseFloat(f.magnitude) || 0), 0);
      console.log(`⚠️  No expense anchor found. Calculated: $${totalExpenses.toLocaleString()}`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DETAIL ANALYSIS: Get atomic facts (excluding containers)
    // ═══════════════════════════════════════════════════════════════════════
    const atomicFacts = facts.filter(fact => {
      const category = fact.triad_map?.category || '';
      return !isContainerCategory(category);
    });

    console.log(`✓ Atomic facts for detail analysis: ${atomicFacts.length}`);

    // ═══════════════════════════════════════════════════════════════════════
    // COMPUTE: 12-Period Pulse
    // ═══════════════════════════════════════════════════════════════════════
    const periodMap = new Map<string, { revenue: number; expenses: number; count: number }>();

    atomicFacts.forEach(fact => {
      const period = fact.temporal_anchor || 'Unknown';
      const magnitude = Math.abs(parseFloat(fact.magnitude) || 0);
      
      if (!periodMap.has(period)) {
        periodMap.set(period, { revenue: 0, expenses: 0, count: 0 });
      }

      const entry = periodMap.get(period)!;
      
      if (fact.vector_type === 'POSITIVE') {
        entry.revenue += magnitude;
      } else {
        entry.expenses += magnitude;
      }
      entry.count++;
    });

    const pulse: PulsePeriod[] = Array.from(periodMap.entries())
      .map(([period, data]) => ({
        period,
        revenue: Math.round(data.revenue),
        expenses: Math.round(data.expenses),
        margin_pct: data.revenue > 0 
          ? Math.round(((data.revenue - data.expenses) / data.revenue) * 100) 
          : 0,
        fact_count: data.count
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // ═══════════════════════════════════════════════════════════════════════
    // COMPUTE: Top Revenue Drivers (from detail facts)
    // ═══════════════════════════════════════════════════════════════════════
    const revenueByCategory = new Map<string, { total: number; vector_type: string }>();

    atomicFacts
      .filter(fact => fact.vector_type === 'POSITIVE')
      .forEach(fact => {
        const category = fact.triad_map?.category || 'Unknown';
        const magnitude = Math.abs(parseFloat(fact.magnitude) || 0);
        const vectorType = fact.vector_type || 'revenue';

        if (!revenueByCategory.has(category)) {
          revenueByCategory.set(category, { total: 0, vector_type: vectorType });
        }

        revenueByCategory.get(category)!.total += magnitude;
      });

    const topDrivers: TopDriver[] = Array.from(revenueByCategory.entries())
      .map(([name, { total, vector_type }]) => ({
        name,
        value: Math.round(total),
        pct_total: totalRevenue > 0 ? Math.round((total / totalRevenue) * 100) : 0,
        vector_type
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // ═══════════════════════════════════════════════════════════════════════
    // COMPUTE: Expense Leaks
    // ═══════════════════════════════════════════════════════════════════════
    const expenseByCategory = new Map<string, { total: number; periods: Set<string> }>();

    atomicFacts
      .filter(fact => fact.vector_type === 'NEGATIVE')
      .forEach(fact => {
        const category = fact.triad_map?.category || 'Unknown';
        const magnitude = Math.abs(parseFloat(fact.magnitude) || 0);
        const period = fact.temporal_anchor || 'Unknown';

        if (!expenseByCategory.has(category)) {
          expenseByCategory.set(category, { total: 0, periods: new Set() });
        }

        const entry = expenseByCategory.get(category)!;
        entry.total += magnitude;
        entry.periods.add(period);
      });

    const expenseLeaks: ExpenseLeak[] = Array.from(expenseByCategory.entries())
      .map(([type, { total, periods }]) => ({
        type,
        cost: Math.round(total),
        pct_burn: totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0,
        periods_active: periods.size
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 8);

    // ═══════════════════════════════════════════════════════════════════════
    // COMPUTE: Efficiency Metrics
    // ═══════════════════════════════════════════════════════════════════════
    const avgConfidence = atomicFacts.reduce((sum, fact) => 
      sum + (parseFloat(fact.confidence) || 0), 0) / atomicFacts.length;

    const margin = totalRevenue > 0 
      ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 
      : 0;

    const periods = Array.from(new Set(atomicFacts.map(f => f.temporal_anchor))).sort();

    const efficiency: EfficiencyMetrics = {
      margin: Math.round(margin * 10) / 10,
      totalRevenue: Math.round(totalRevenue),
      totalExpenses: Math.round(totalExpenses),
      factDensity: atomicFacts.length,
      avgConfidence: Math.round(avgConfidence * 1000) / 1000,
      physicsCertified: 100,
      periodRange: periods.length > 0 
        ? `${periods[0]} → ${periods[periods.length - 1]}`
        : 'Unknown'
    };

    // ═══════════════════════════════════════════════════════════════════════
    // SEMANTIC PATTERN ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════
    const domainAnalysis = analyzeDomainPattern(topDrivers, totalRevenue);

    // ═══════════════════════════════════════════════════════════════════════
    // RESPONSE: The Truth
    // ═══════════════════════════════════════════════════════════════════════
    const response: LighthouseStats = {
      pulse,
      topDrivers,
      efficiency,
      expenseLeaks,
      metadata: {
        timestamp: new Date().toISOString(),
        org_id: orgId,
        domain_pattern: domainAnalysis.pattern,
        hero_category: domainAnalysis.hero_category,
        category_granularity: domainAnalysis.category_granularity,
        avg_ticket_size: domainAnalysis.avg_ticket_size,
        revenue_concentration: domainAnalysis.revenue_concentration,
        mutation_ready: true,
        anchor_used: anchorUsed
      }
    };

    console.log(`✓ FINAL TRUTH: Revenue $${totalRevenue.toLocaleString()}, Expenses $${totalExpenses.toLocaleString()}, Margin ${margin.toFixed(1)}%`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Antigravity Pipe Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error in stats pipeline'
    }, { status: 500 });
  }
}
