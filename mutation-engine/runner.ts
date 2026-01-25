// /mutation-engine/runner.ts
// Run mutations through ingestion pipeline and analyze results

import { Mutation, MutationResult } from './types';

export async function runMutations(
  mutations: Mutation[],
  ingestEndpoint: string = '/api/ingest'
): Promise<MutationResult[]> {
  const results: MutationResult[] = [];

  for (const mutation of mutations) {
    try {
      // Convert mutated data to FormData
      const formData = new FormData();
      const csvBlob = new Blob([convertToCSV(mutation.mutated)], { type: 'text/csv' });
      formData.append('file', csvBlob, `${mutation.id}.csv`);
      formData.append('userId', 'mutation_test');

      const response = await fetch(ingestEndpoint, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      results.push({
        mutationId: mutation.id,
        operator: mutation.operator,
        success: result.success,
        certified: result.certified || 0,
        quarantined: result.quarantined || 0,
        error: result.error
      });
    } catch (error: any) {
      results.push({
        mutationId: mutation.id,
        operator: mutation.operator,
        success: false,
        certified: 0,
        quarantined: 0,
        error: error.message
      });
    }
  }

  return results;
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => row[h]).join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function analyzeFailures(results: MutationResult[]): any {
  const failures = results.filter(r => !r.success);
  const byOperator: Record<string, number> = {};

  failures.forEach(f => {
    byOperator[f.operator] = (byOperator[f.operator] || 0) + 1;
  });

  return {
    totalMutations: results.length,
    failures: failures.length,
    successRate: ((results.length - failures.length) / results.length) * 100,
    failuresByOperator: byOperator,
    topFailures: Object.entries(byOperator)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
  };
}
