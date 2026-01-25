// /mutation-engine/operators/temporal.ts
// Temporal mutations: date shifts, missing timestamps, out-of-order dates

import { MutationOperator } from '../types';

export const dateShift: MutationOperator = {
  name: 'date_shift',
  apply: (data: any) => {
    const daysToShift = [-30, -7, 7, 30][Math.floor(Math.random() * 4)];
    return data.map((row: any) => {
      if (row.Date) {
        const date = new Date(row.Date);
        date.setDate(date.getDate() + daysToShift);
        row.Date = date.toISOString().split('T')[0];
      }
      return row;
    });
  },
  revert: (data: any) => data
};

export const missingTimestamps: MutationOperator = {
  name: 'missing_timestamps',
  apply: (data: any) => {
    return data.map((row: any) => {
      if (Math.random() < 0.2) {
        delete row.Date;
        delete row.Time;
        delete row.Timestamp;
      }
      return row;
    });
  },
  revert: (data: any) => data
};

export const outOfOrderDates: MutationOperator = {
  name: 'out_of_order_dates',
  apply: (data: any) => {
    return data.sort(() => Math.random() - 0.5);
  },
  revert: (data: any) => data
};

export const temporalOperators = [dateShift, missingTimestamps, outOfOrderDates];
