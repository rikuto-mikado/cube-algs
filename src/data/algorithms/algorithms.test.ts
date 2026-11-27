import { describe, expect, it } from 'vitest';
import {
  applyMoves,
  computeSetupState,
  isCrossSolved,
  isF2LSolved,
  isLastLayerOriented,
  isSolved,
  lastLayerArrows,
  normalizeOrientation,
  solvedSlots,
  statesEqual,
  SOLVED,
  targetF2LSlot,
} from '../../core/cube';
import { f2lCaseKey, isSolvedByAuf, ollCaseKey, pllCaseKey, solvesSameCase } from '../../core/cube/caseKeys';
import { AUF_MOVES, drillAlgorithm, Y_ROTATIONS } from '../../core/cube/drill';
import { mirrorAlgorithm, parseMoves } from '../../core/notation';
import type { AlgorithmCase } from '../../types';
import { ALL_CASES, F2L_CASES, OLL_CASES, PLL_CASES } from './index';

const entries = (cases: readonly AlgorithmCase[]) =>
  cases.flatMap((c) => c.algorithms.map((alg, i) => ({ c, alg, label: `${c.id}#${i} ${alg}` })));

describe('dataset integrity', () => {
  it('has the full CFOP case counts', () => {
    expect(F2L_CASES).toHaveLength(41);
    expect(OLL_CASES).toHaveLength(57);
    expect(PLL_CASES).toHaveLength(21);
  });

  it('has unique ids and at least one algorithm per case', () => {
    expect(new Set(ALL_CASES.map((c) => c.id)).size).toBe(ALL_CASES.length);
    for (const c of ALL_CASES) expect(c.algorithms.length).toBeGreaterThan(0);
  });

  it.each(entries(ALL_CASES))('$label: alg(inverse(alg)) returns to solved', ({ c, alg }) => {
    const moves = parseMoves(alg);
    const setup = computeSetupState(moves, c.setupMoves);
    expect(isSolved(setup)).toBe(false);
    const end = applyMoves(setup, moves);
    expect(isSolved(end)).toBe(true);
    if (!c.setupMoves) expect(statesEqual(normalizeOrientation(end), SOLVED)).toBe(true);
  });
});

describe('F2L cases', () => {
  it.each(entries(F2L_CASES))('$label keeps cross and the other three slots', ({ alg }) => {
    const setup = computeSetupState(alg);
    expect(isCrossSolved(setup)).toBe(true);
    expect(solvedSlots(setup).sort()).toEqual(['BL', 'BR', 'FL']);
  });

  it('covers all 41 distinct cases, with alternatives solving the same case', () => {
    const keys = F2L_CASES.map((c) => {
      const ks = new Set(c.algorithms.map((a) => f2lCaseKey(computeSetupState(a))));
      expect(ks.size, c.id).toBe(1);
      return [...ks][0];
    });
    expect(new Set(keys).size).toBe(41);
  });
});

describe('OLL cases', () => {
  it.each(entries(OLL_CASES))('$label preserves F2L and is a real OLL case', ({ alg }) => {
    const setup = computeSetupState(alg);
    expect(isF2LSolved(setup)).toBe(true);
    expect(isLastLayerOriented(setup)).toBe(false);
  });

  it('covers 57 distinct orientation cases', () => {
    const keys = OLL_CASES.map((c) => {
      const ks = new Set(c.algorithms.map((a) => ollCaseKey(computeSetupState(a))));
      expect(ks.size, c.id).toBe(1);
      return [...ks][0];
    });
    expect(new Set(keys).size).toBe(57);
  });

  it('matches edge-orientation categories', () => {
    for (const c of OLL_CASES) {
      const key = ollCaseKey(computeSetupState(c.algorithms[0]));
      // key positions 1,3,5,7 are edges; 'U' means oriented
      const edgesOriented = [1, 3, 5, 7].filter((i) => key[i] === 'U').length;
      const cornersOriented = [0, 2, 4, 6].filter((i) => key[i] === 'U').length;
      if (c.category === 'Dot') expect(edgesOriented, c.id).toBe(0);
      else if (c.category === 'Cross') expect(edgesOriented, c.id).toBe(4);
      else if (c.category === 'Corners Oriented') {
        expect(cornersOriented, c.id).toBe(4);
        expect(edgesOriented, c.id).toBe(2);
      } else expect(edgesOriented, c.id).toBe(2);
    }
  });
});

describe('PLL cases', () => {
  it.each(entries(PLL_CASES))('$label preserves F2L and orientation', ({ alg }) => {
    const setup = computeSetupState(alg);
    expect(isF2LSolved(setup)).toBe(true);
    expect(isLastLayerOriented(setup)).toBe(true);
    expect(isSolvedByAuf(setup)).toBe(false);
  });

  it('covers 21 distinct permutation cases', () => {
    const keys = PLL_CASES.map((c) => {
      const ks = new Set(c.algorithms.map((a) => pllCaseKey(parseMoves(a))));
      expect(ks.size, c.id).toBe(1);
      return [...ks][0];
    });
    expect(new Set(keys).size).toBe(21);
  });

  it('matches corner/edge permutation categories', () => {
    for (const c of PLL_CASES) {
      const arrows = lastLayerArrows(computeSetupState(c.algorithms[0]));
      const corners = arrows.filter((a) => a.kind === 'corner').length;
      const edges = arrows.filter((a) => a.kind === 'edge').length;
      if (c.category === 'Edges Only') expect(corners, c.id).toBe(0);
      if (c.category === 'Corners Only') expect(edges, c.id).toBe(0);
      if (c.category === 'G Perms') expect([corners, edges], c.id).toEqual([3, 3]);
      if (c.category === 'Adjacent Swap' || c.category === 'Diagonal Swap')
        expect([corners, edges], c.id).toEqual([2, 2]);
    }
  });
});

describe('mirrored (left-handed) algorithms', () => {
  it.each(entries(ALL_CASES))('$label mirrored still solves its mirrored case', ({ c, alg }) => {
    const mirrored = parseMoves(mirrorAlgorithm(alg));
    const setup = computeSetupState(mirrored, c.setupMoves);
    expect(isSolved(applyMoves(setup, mirrored))).toBe(true);
    if (c.stage === 'F2L') {
      expect(isCrossSolved(setup)).toBe(true);
      expect(solvedSlots(setup).sort()).toEqual(['BL', 'BR', 'FR']);
      expect(targetF2LSlot(setup)).toBe('FL');
    } else {
      expect(isF2LSolved(setup)).toBe(true);
      expect(isLastLayerOriented(setup)).toBe(c.stage === 'PLL');
    }
  });
});

describe('random drill twists', () => {
  it.each([...OLL_CASES, ...PLL_CASES].map((c) => ({ c, label: c.id })))('$label keeps its case under every AUF and y twist', ({ c }) => {
    const base = parseMoves(c.algorithms[0]);
    for (const rotation of Y_ROTATIONS) {
      for (const auf of AUF_MOVES) {
        const full = parseMoves(drillAlgorithm(c.algorithms[0], { rotation, auf }));
        expect(solvesSameCase(c.stage, base, full), `${rotation} ${auf}`).toBe(true);
      }
    }
  });

  it.each(F2L_CASES.map((c) => ({ c, label: c.id })))('$label keeps its case under every AUF', ({ c }) => {
    const base = parseMoves(c.algorithms[0]);
    for (const auf of AUF_MOVES) {
      expect(solvesSameCase('F2L', base, parseMoves(drillAlgorithm(c.algorithms[0], { rotation: '', auf })))).toBe(true);
    }
  });
});
