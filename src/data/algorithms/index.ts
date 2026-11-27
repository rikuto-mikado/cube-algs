import type { AlgorithmCase, Stage } from '../../types';
import { F2L_CASES } from './f2l';
import { OLL_CASES } from './oll';
import { PLL_CASES } from './pll';

export { F2L_CASES, OLL_CASES, PLL_CASES };

export const ALL_CASES: readonly AlgorithmCase[] = [...F2L_CASES, ...OLL_CASES, ...PLL_CASES];

export const CASES_BY_STAGE: Readonly<Record<Stage, readonly AlgorithmCase[]>> = {
  F2L: F2L_CASES,
  OLL: OLL_CASES,
  PLL: PLL_CASES,
};

const BY_ID = new Map(ALL_CASES.map((c) => [c.id, c]));

export function getCaseById(id: string): AlgorithmCase | undefined {
  return BY_ID.get(id);
}

export function categoriesOf(stage: Stage): string[] {
  return [...new Set(CASES_BY_STAGE[stage].map((c) => c.category))];
}
