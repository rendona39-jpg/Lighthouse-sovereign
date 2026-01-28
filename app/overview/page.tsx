'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, TrendingUp, TrendingDown, CheckCircle, Receipt, Users, UtensilsCrossed, Lightbulb, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useLighthouse } from '@/hooks/use-lighthouse';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TopBar } from '@/components/dashboard/top-bar';
import { KPICard } from '@/components/overview/kpi-card';
import { PulseChart } from '@/components/overview/pulse-chart';
import { DriversList } from '@/components/overview/drivers-list';
import { ExpenseTable } from '@/components/overview/expense-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DEMO_STATS, DEMO_CATEGORY_PERFORMANCE, DEMO_PERIOD_COMPARISON, DEMO_SEASONAL_INSIGHTS, DEMO_BUSINESS } from '@/lib/demo-data';

export default function OverviewPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { hasData } = useLighthouse({ orgId: user?.orgId });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const stats = DEMO_STATS;
  const categoryData = DEMO_CATEGORY_PERFORMANCE;
  const periodComparison = DEMO_PERIOD_COMPARISON;
  const seasonalInsights = DEMO_SEASONAL_INSIGHTS;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar hasData={hasData} />
      
      <div className="ml-[60px] flex flex-col min-h-screen">
        <TopBar />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Overview</h1>
                <p className="text-[13px] text-muted-foreground mt-1">
                  {DEMO_BUSINESS.name} • {stats.efficiency.periodRange}
                </p>
              </div>
            </div>

            {/* Business Summary Card */}
            <div className="mb-8">
              <h3 className="text-lg text-foreground mb-4">
                What did Theta <span className="font-serif italic font-semibold">think</span> of the data?
              </h3>
              <p className="text-[15px] text-muted-foreground leading-relaxed max-w-4xl">
                <span className="text-foreground font-medium">{DEMO_BUSINESS.name}</span> is performing strongly with <span className="text-foreground font-medium">${(DEMO_BUSINESS.revenue / 1000000).toFixed(2)}M</span> in revenue across {DEMO_BUSINESS.periods} periods. The <span className="text-foreground font-medium">Tasting Menu</span> drives {DEMO_BUSINESS.topDriver.pct}% of sales, indicating strong premium positioning. Your <span className="text-foreground font-medium">{DEMO_BUSINESS.margin}% margin</span> is healthy for fine dining, though <span className="text-explore font-medium">Imported Ingredients</span> (5.2% burn) presents an optimization opportunity. Consider seasonal sourcing strategies.
              </p>
            </div>

            {/* KPI Cards - Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <KPICard
                icon={DollarSign}
                value={`$${stats.efficiency.totalRevenue.toLocaleString()}`}
                label="Total Revenue"
                subtext={`${stats.efficiency.factDensity} facts certified`}
              />
              
              <KPICard
                icon={TrendingUp}
                value={stats.metadata.hero_category}
                label={`${stats.topDrivers[0]?.pct_total.toFixed(0)}% Top Driver`}
                subtext={`$${stats.topDrivers[0]?.value.toLocaleString()}`}
              />
              
              <KPICard
                icon={CheckCircle}
                value={`${stats.efficiency.margin}%`}
                label="Margin"
                subtext={`${(stats.efficiency.avgConfidence * 100).toFixed(1)}% confidence`}
              />
            </div>

            {/* KPI Cards - Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <KPICard
                icon={Receipt}
                value="$127"
                label="Average Check"
                subtext={<span className="text-success flex items-center gap-1"><TrendingUp className="h-3 w-3" /> +5% vs last period</span>}
              />
              
              <KPICard
                icon={Users}
                value="32%"
                label="Labor Cost %"
                subtext="Industry: 30-35%"
              />
              
              <KPICard
                icon={UtensilsCrossed}
                value="28%"
                label="Food Cost %"
                subtext="Industry: 25-30%"
              />
            </div>

            {/* Pulse Chart */}
            <div className="mb-8">
              <PulseChart data={stats.pulse} />
            </div>

            {/* Category Performance Grid */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg">Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Category</th>
                        <th className="text-right py-3 px-4 text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Revenue</th>
                        <th className="text-right py-3 px-4 text-[11px] uppercase tracking-wide text-muted-foreground font-medium">% of Total</th>
                        <th className="text-right py-3 px-4 text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryData.map((category) => (
                        <tr key={category.category} className="border-b border-border last:border-0">
                          <td className="py-3 px-4 text-[15px] text-foreground font-medium">{category.category}</td>
                          <td className="py-3 px-4 text-[15px] text-foreground text-right font-mono">${category.revenue.toLocaleString()}</td>
                          <td className="py-3 px-4 text-[15px] text-muted-foreground text-right">{category.pctTotal}%</td>
                          <td className="py-3 px-4 text-right">
                            <span className={`text-[15px] flex items-center justify-end gap-1 ${category.trendUp ? 'text-success' : 'text-destructive'}`}>
                              {category.trendUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                              {category.trend}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Period-over-Period & Seasonal Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Period Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Last 3 Periods</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {periodComparison.map((period) => (
                    <div 
                      key={period.period}
                      className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                    >
                      <div>
                        <p className="text-[15px] font-semibold text-foreground">
                          {period.period}: ${period.revenue.toLocaleString()}
                        </p>
                        <p className="text-[13px] text-muted-foreground">{period.margin}% margin</p>
                      </div>
                      <span className={`text-[13px] px-2 py-1 rounded ${
                        period.status === 'best' 
                          ? 'bg-success/10 text-success' 
                          : period.status === 'below' 
                            ? 'bg-explore/10 text-explore' 
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {period.status === 'best' && <CheckCircle className="h-3 w-3 inline mr-1" />}
                        {period.status === 'below' && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                        {period.label}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Seasonal Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-explore" />
                    Seasonal Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {seasonalInsights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-3 text-[15px] text-foreground">
                        <span className="text-muted-foreground mt-0.5">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DriversList drivers={stats.topDrivers} />
              <ExpenseTable expenses={stats.expenseLeaks} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
