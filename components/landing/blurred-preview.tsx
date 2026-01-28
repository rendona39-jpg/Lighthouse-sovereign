'use client';

import { TrendingUp, DollarSign, BarChart3, PieChart } from 'lucide-react';

export function BlurredPreview() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Blurred Dashboard Preview */}
      <div className="absolute inset-0 p-8 opacity-60" style={{ filter: 'blur(8px)' }}>
        {/* KPI Cards Row */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-secondary rounded-xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                Total Revenue
              </span>
            </div>
            <p className="text-3xl font-bold font-mono text-foreground">$1,247,000</p>
            <p className="text-[13px] text-muted-foreground mt-1">892 facts certified</p>
          </div>
          
          <div className="bg-secondary rounded-xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-success/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                Top Driver
              </span>
            </div>
            <p className="text-3xl font-bold font-mono text-foreground">Tasting Menu</p>
            <p className="text-[13px] text-muted-foreground mt-1">42% of revenue</p>
          </div>
          
          <div className="bg-secondary rounded-xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-info/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-info" />
              </div>
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                Margin
              </span>
            </div>
            <p className="text-3xl font-bold font-mono text-foreground">18.5%</p>
            <p className="text-[13px] text-muted-foreground mt-1">94.2% confidence</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="bg-secondary rounded-xl p-6 border border-border mb-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Revenue Pulse</h3>
          <div className="h-64 flex items-end gap-2">
            {[65, 78, 85, 72, 90, 88, 95, 82, 75, 92, 98, 85].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col gap-1">
                <div 
                  className="bg-primary rounded-t" 
                  style={{ height: `${height}%` }}
                />
                <div 
                  className="bg-destructive/30 rounded-b" 
                  style={{ height: `${100 - height}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-secondary rounded-xl p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Revenue Drivers</h3>
            <div className="space-y-3">
              {['Tasting Menu', 'Wine Program', 'Handmade Pasta', 'Private Dining'].map((item, i) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="h-2 bg-primary rounded-full" style={{ width: `${80 - i * 15}%` }} />
                  <span className="text-[13px] text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-secondary rounded-xl p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Expense Leaks</h3>
            <div className="flex items-center justify-center h-32">
              <PieChart className="h-24 w-24 text-muted-foreground/50" />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
