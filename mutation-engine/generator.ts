// /mutation-engine/generator.ts
// Generate mutations from all operator categories

import { Mutation } from './types';
import { structuralOperators } from './operators/structural';
import { semanticOperators } from './operators/semantic';
import { noiseOperators } from './operators/noise';
import { temporalOperators } from './operators/temporal';
import { physicsOperators } from './operators/physics';

const allOperators = [
  ...structuralOperators,
  ...semanticOperators,
  ...noiseOperators,
  ...temporalOperators,
  ...physicsOperators
];

export function generateMutations(originalData: any, count: number = 100): Mutation[] {
  const mutations: Mutation[] = [];

  for (let i = 0; i < count; i++) {
    const operator = allOperators[Math.floor(Math.random() * allOperators.length)];
    const mutated = operator.apply(JSON.parse(JSON.stringify(originalData)));

    mutations.push({
      id: `mutation_${i}`,
      operator: operator.name,
      original: originalData,
      mutated,
      reversible: true
    });
  }

  return mutations;
}
