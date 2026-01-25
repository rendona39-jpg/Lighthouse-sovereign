// /mutation-engine/operators/semantic.ts
// Semantic mutations: column renames, SKU aliasing, date format changes

import { MutationOperator } from '../types';

const synonymMap: Record<string, string[]> = {
  'COGS': ['Cost', 'CostOfGoods', 'DirectCost', 'VariableCost'],
  'Revenue': ['Sales', 'Income', 'TotalSales', 'Receipts'],
  'Item': ['Product', 'SKU', 'Name', 'Description'],
  'Date': ['Timestamp', 'Time', 'DateTime', 'Period']
};

export const columnRename: MutationOperator = {
  name: 'column_rename',
  apply: (data: any) => {
    const columns = Object.keys(data[0] || {});
    const columnToRename = columns.find(col => synonymMap[col]);
    if (!columnToRename) return data;

    const synonyms = synonymMap[columnToRename];
    const newName = synonyms[Math.floor(Math.random() * synonyms.length)];

    return data.map((row: any) => {
      const { [columnToRename]: value, ...rest } = row;
      return { ...rest, [newName]: value };
    });
  },
  revert: (data: any) => data
};

export const skuAliasing: MutationOperator = {
  name: 'sku_aliasing',
  apply: (data: any) => {
    return data.map((row: any) => {
      if (row.Item || row.Product || row.SKU) {
        const itemKey = row.Item ? 'Item' : row.Product ? 'Product' : 'SKU';
        const original = row[itemKey];
        const words = original.split(' ');
        row[itemKey] = words.reverse().join(' ');
      }
      return row;
    });
  },
  revert: (data: any) => data
};

export const dateFormatChange: MutationOperator = {
  name: 'date_format_change',
  apply: (data: any) => {
    return data.map((row: any) => {
      if (row.Date) {
        const parts = row.Date.split('/');
        if (parts.length === 3) {
          row.Date = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
      }
      return row;
    });
  },
  revert: (data: any) => data
};

export const semanticOperators = [columnRename, skuAliasing, dateFormatChange];
