// /mutation-engine/operators/structural.ts
// Structural mutations: missing columns, reordered columns, empty rows

import { MutationOperator } from '../types';

export const missingColumn: MutationOperator = {
  name: 'missing_column',
  apply: (data: any) => {
    const columns = Object.keys(data[0] || {});
    const randomColumn = columns[Math.floor(Math.random() * columns.length)];
    return data.map((row: any) => {
      const { [randomColumn]: removed, ...rest } = row;
      return rest;
    });
  },
  revert: (data: any) => data
};

export const reorderedColumns: MutationOperator = {
  name: 'reordered_columns',
  apply: (data: any) => {
    const columns = Object.keys(data[0] || {});
    const shuffled = [...columns].sort(() => Math.random() - 0.5);
    return data.map((row: any) => {
      const reordered: any = {};
      shuffled.forEach(col => { reordered[col] = row[col]; });
      return reordered;
    });
  },
  revert: (data: any) => data
};

export const emptyRows: MutationOperator = {
  name: 'empty_rows',
  apply: (data: any) => {
    const emptyRow = Object.keys(data[0] || {}).reduce((acc, key) => ({ ...acc, [key]: null }), {});
    const position = Math.floor(Math.random() * data.length);
    return [...data.slice(0, position), emptyRow, ...data.slice(position)];
  },
  revert: (data: any) => data.filter((row: any) => Object.values(row).some(v => v !== null))
};

export const structuralOperators = [missingColumn, reorderedColumns, emptyRows];
