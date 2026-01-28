'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ChartData } from '@/lib/types';

interface ChartArtifactProps {
  data: ChartData;
}

export function ChartArtifact({ data }: ChartArtifactProps) {
  const { chartType, data: chartData, config } = data;

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    if (config.yAxis === 'margin') {
      return `${value}%`;
    }
    return value.toLocaleString();
  };

  const tooltipFormatter = (value: number) => {
    if (config.yAxis === 'margin') {
      return [`${value}%`, 'Margin'];
    }
    if (config.yAxis === 'revenue' || config.yAxis === 'value') {
      return [`$${value.toLocaleString()}`, config.yAxis === 'value' ? 'Value' : 'Revenue'];
    }
    return [value.toLocaleString(), config.yAxis];
  };

  return (
    <div className="bg-background border border-border rounded-xl p-4">
      {config.title && (
        <h4 className="text-[13px] font-semibold text-foreground mb-4">
          {config.title}
        </h4>
      )}

      <ResponsiveContainer width="100%" height={280}>
        {chartType === 'line' ? (
          <LineChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              opacity={0.5}
            />
            <XAxis
              dataKey={config.xAxis}
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatValue}
            />
            <Tooltip
              formatter={tooltipFormatter}
              contentStyle={{
                backgroundColor: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'var(--foreground)' }}
            />
            <Line
              type="monotone"
              dataKey={config.yAxis}
              stroke="var(--success)"
              strokeWidth={2}
              dot={{ r: 3, fill: 'var(--success)' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        ) : chartType === 'bar' ? (
          <BarChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              opacity={0.5}
            />
            <XAxis
              dataKey={config.xAxis}
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatValue}
            />
            <Tooltip
              formatter={tooltipFormatter}
              contentStyle={{
                backgroundColor: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'var(--foreground)' }}
            />
            <Bar
              dataKey={config.yAxis}
              fill="var(--primary)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        ) : (
          <AreaChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              opacity={0.5}
            />
            <XAxis
              dataKey={config.xAxis}
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatValue}
            />
            <Tooltip
              formatter={tooltipFormatter}
              contentStyle={{
                backgroundColor: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'var(--foreground)' }}
            />
            <Area
              type="monotone"
              dataKey={config.yAxis}
              fill="var(--primary)"
              stroke="var(--primary)"
              fillOpacity={0.2}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
