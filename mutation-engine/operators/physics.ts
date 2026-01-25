// /mutation-engine/operators/physics.ts
// Physics mutations: sign inversion, unbalanced totals, missing costs

import { MutationOperator } from '../types';

export const signInversion: MutationOperator = {
  name: 'sign_inversion',
  apply: (data: any) => {
    return data.map((row: any) => {
      if (row.Revenue || row.Sales || row.Income) {
        const revenueKey = row.Revenue ? 'Revenue' : row.Sales ? 'Sales' : 'Income';
        row[revenueKey] = -Math.abs(row[revenueKey]);
      }
      return row;
    });
  },
  revert: (data: any) => data
};

export const unbalancedTotals: MutationOperator = {
  name: 'unbalanced_totals',
  apply: (data: any) => {
    const columns = Object.keys(data[0] || {});
    const extraRow: any = {};
    columns.forEach(col => {
      extraRow[col] = col.toLowerCase().includes('cost') ? 999999 : null;
    });
    return [...data, extraRow];
  },
  revert: (data: any) => data.slice(0, -1)
};

export const missingCosts: MutationOperator = {
  name: 'missing_costs',
  apply: (data: any) => {
    return data.map((row: any) => {
      if (row.COGS || row.Cost) {
        const costKey = row.COGS ? 'COGS' : 'Cost';
        if (Math.random() < 0.3) row[costKey] = 0;
      }
      return row;
    });
  },
  revert: (data: any) => data
};

export const physicsOperators = [signInversion, unbalancedTotals, missingCosts];
