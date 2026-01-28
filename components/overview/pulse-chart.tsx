'use client';

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { PulseData } from '@/lib/types';

interface PulseChartProps {
  data: PulseData[];
}

export function PulseChart({ data }: PulseChartProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  return (
    <div className="bg-secondary rounded-xl p-6 border border-border">
      <h3 className="text-xl font-semibold text-foreground mb-6">Revenue Pulse</h3>
      
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            opacity={0.5}
          />
          <XAxis
            dataKey="period"
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="left"
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCurrency}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'margin_pct') {
                return [`${value.toFixed(1)}%`, 'Margin'];
              }
              return [`$${value.toLocaleString()}`, name === 'revenue' ? 'Revenue' : 'Expenses'];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
            formatter={(value) => {
              const labels: Record<string, string> = {
                revenue: 'Revenue',
                expenses: 'Expenses',
                margin_pct: 'Margin %',
              };
              return labels[value] || value;
            }}
          />
          <Bar
            yAxisId="left"
            dataKey="revenue"
            fill="var(--primary)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            yAxisId="left"
            dataKey="expenses"
            fill="var(--destructive)"
            fillOpacity={0.3}
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="margin_pct"
            stroke="var(--success)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--success)' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
