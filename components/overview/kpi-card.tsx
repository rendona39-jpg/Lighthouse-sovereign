'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  icon: LucideIcon;
  value: string;
  label: string;
  subtext?: string;
  className?: string;
}

export function KPICard({ icon: Icon, value, label, subtext, className }: KPICardProps) {
  return (
    <div
      className={cn(
        'bg-secondary rounded-xl p-8 border border-border',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
          {label}
        </span>
      </div>
      
      <p className="text-4xl font-bold font-mono text-foreground tracking-tight">
        {value}
      </p>
      
      {subtext && (
        <p className="text-[13px] text-muted-foreground mt-2">
          {subtext}
        </p>
      )}
    </div>
  );
}
