// /mutation-engine/operators/noise.ts
// Noise mutations: OCR errors, number corruption, extra whitespace

import { MutationOperator } from '../types';

export const ocrErrors: MutationOperator = {
  name: 'ocr_errors',
  apply: (data: any) => {
    const substitutions: Record<string, string> = { '5': 'S', '0': 'O', '1': 'l', '8': 'B' };
    return data.map((row: any) => {
      Object.keys(row).forEach(key => {
        if (typeof row[key] === 'string' && Math.random() < 0.1) {
          row[key] = row[key].split('').map(char =>
            substitutions[char] || char
          ).join('');
        }
      });
      return row;
    });
  },
  revert: (data: any) => data
};

export const numberCorruption: MutationOperator = {
  name: 'number_corruption',
  apply: (data: any) => {
    return data.map((row: any) => {
      Object.keys(row).forEach(key => {
        if (typeof row[key] === 'number' && Math.random() < 0.1) {
          row[key] = row[key].toString().replace(/5/g, 'S');
        }
      });
      return row;
    });
  },
  revert: (data: any) => data
};

export const extraWhitespace: MutationOperator = {
  name: 'extra_whitespace',
  apply: (data: any) => {
    return data.map((row: any) => {
      Object.keys(row).forEach(key => {
        if (typeof row[key] === 'string') {
          row[key] = '  ' + row[key] + '  ';
        }
      });
      return row;
    });
  },
  revert: (data: any) => data.map((row: any) => {
    Object.keys(row).forEach(key => {
      if (typeof row[key] === 'string') row[key] = row[key].trim();
    });
    return row;
  })
};

export const noiseOperators = [ocrErrors, numberCorruption, extraWhitespace];
