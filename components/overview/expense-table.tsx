'use client';

import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExpenseLeak } from '@/lib/types';

interface ExpenseTableProps {
  expenses: ExpenseLeak[];
  maxItems?: number;
}

export function ExpenseTable({ expenses, maxItems = 6 }: ExpenseTableProps) {
  const displayExpenses = expenses.slice(0, maxItems);

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value}`;
  };

  return (
    <div className="bg-secondary rounded-xl p-6 border border-border">
      <h3 className="text-xl font-semibold text-foreground mb-6">Expense Leaks</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-medium pb-3">
                Category
              </th>
              <th className="text-right text-[11px] uppercase tracking-wide text-muted-foreground font-medium pb-3">
                Cost
              </th>
              <th className="text-right text-[11px] uppercase tracking-wide text-muted-foreground font-medium pb-3">
                % Burn
              </th>
              <th className="text-right text-[11px] uppercase tracking-wide text-muted-foreground font-medium pb-3">
                Periods
              </th>
            </tr>
          </thead>
          <tbody>
            {displayExpenses.map((expense) => {
              const isHighBurn = expense.pct_burn > 3;
              
              return (
                <tr key={expense.type} className="border-b border-border last:border-0">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {isHighBurn && (
                        <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                      )}
                      <span className="text-[13px] text-foreground">{expense.type}</span>
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <span className="text-[13px] font-mono text-foreground">
                      {formatCurrency(expense.cost)}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className={cn(
                        'text-[13px] font-mono',
                        isHighBurn ? 'text-destructive font-medium' : 'text-muted-foreground'
                      )}
                    >
                      {expense.pct_burn.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className="text-[13px] font-mono text-muted-foreground">
                      {expense.periods_active}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
