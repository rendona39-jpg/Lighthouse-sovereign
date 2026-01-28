'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, TrendingDown, BarChart3, Lightbulb } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useLighthouse } from '@/hooks/use-lighthouse';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TopBar } from '@/components/dashboard/top-bar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DEMO_STATS, DEMO_CATEGORY_PERFORMANCE } from '@/lib/demo-data';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export default function AnalyticsPage() {
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

  const growthData = categoryData.map(c => ({
    name: c.category,
    growth: Number.parseFloat(c.trend),
  }));

  return (
    <div className="min-h-screen bg-background">
      <Sidebar hasData={hasData} />
      
      <div className="ml-[60px] flex flex-col min-h-screen">
        <TopBar />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
              <p className="text-[13px] text-muted-foreground mt-1">Deep dive & trends</p>
            </div>

            {/* Time Series Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  Revenue Trends (P1-P12)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.pulse}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="period" className="text-xs" tick={{ fill: 'currentColor' }} />
                      <YAxis className="text-xs" tick={{ fill: 'currentColor' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--popover)', 
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="var(--primary)" 
                        strokeWidth={2}
                        dot={{ fill: 'var(--primary)', strokeWidth: 0, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Growth Rate</p>
                    <p className="text-xl font-semibold text-success flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      +12.4%
                    </p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Volatility</p>
                    <p className="text-xl font-semibold text-foreground">Low</p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Trend</p>
                    <p className="text-xl font-semibold text-success flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      Ascending
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Growth */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Category Growth Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={growthData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                      <XAxis type="number" className="text-xs" tick={{ fill: 'currentColor' }} tickFormatter={(v) => `${v}%`} />
                      <YAxis dataKey="name" type="category" className="text-xs" tick={{ fill: 'currentColor' }} width={120} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--popover)', 
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`${value}%`, 'Growth']}
                      />
                      <Bar dataKey="growth" radius={[0, 4, 4, 0]}>
                        {growthData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.growth >= 0 ? 'var(--success)' : 'var(--destructive)'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Predictive Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-explore" />
                  Next Period Forecast
                </CardTitle>
                <CardDescription>Based on historical patterns and seasonal trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-secondary rounded-xl">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Projected Revenue (P13)</p>
                    <p className="text-3xl font-bold font-mono text-foreground">$110,400</p>
                    <p className="text-[13px] text-success mt-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +2.0% vs P12
                    </p>
                  </div>
                  <div className="p-6 bg-secondary rounded-xl">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                      <Lightbulb className="h-3 w-3 text-explore" />
                      Key Drivers
                    </p>
                    <ul className="space-y-2 text-[13px] text-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        Holiday season boost expected
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        Private dining bookings up 25%
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        New winter menu launch
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
