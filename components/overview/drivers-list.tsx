'use client';

import type { TopDriver } from '@/lib/types';

interface DriversListProps {
  drivers: TopDriver[];
  maxItems?: number;
}

export function DriversList({ drivers, maxItems = 8 }: DriversListProps) {
  const displayDrivers = drivers.slice(0, maxItems);
  const maxValue = displayDrivers[0]?.pct_total || 100;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  return (
    <div className="bg-secondary rounded-xl p-6 border border-border">
      <h3 className="text-xl font-semibold text-foreground mb-6">Revenue Drivers</h3>
      
      <div className="space-y-4">
        {displayDrivers.map((driver, index) => (
          <div key={driver.name} className="group">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-muted-foreground w-4">
                  {index + 1}.
                </span>
                <span className="text-[13px] font-medium text-foreground">
                  {driver.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-mono text-muted-foreground">
                  {formatCurrency(driver.value)}
                </span>
                <span className="text-[11px] font-medium text-foreground w-12 text-right">
                  {driver.pct_total.toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div className="ml-6 h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(driver.pct_total / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
