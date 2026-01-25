// /mutation-engine/types.ts
// Type definitions for mutation testing framework

export interface MutationOperator {
  name: string;
  apply: (data: any) => any;
  revert: (data: any) => any;
}

export interface Mutation {
  id: string;
  operator: string;
  original: any;
  mutated: any;
  reversible: boolean;
}

export interface MutationResult {
  mutationId: string;
  operator: string;
  success: boolean;
  certified: number;
  quarantined: number;
  error?: string;
}
