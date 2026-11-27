import { describe, expect, it } from 'vitest';
import { invertMoves, parseMoves } from '../notation';
import {
  applyMoves,
  centerFrame,
  computeSetupState,
  F2L_SLOTS,
  IDENTITY,
  isSolved,
  isStickerVisible,
  normalizeOrientation,
  SOLVED,
  statesEqual,
  targetF2LSlot,
  type Face,
  type Vec3,
} from './index';
import { AUF_MOVES, drillAlgorithm, NO_TWIST, pickDrillCase, randomItem, randomTwist, seededRng, Y_ROTATIONS } from './drill';
import { caseKey, isStageCase, solvesSameCase } from './caseKeys';

describe('setup state with rotations', () => {
  it('presents rotation-containing algorithms in the standard orientation', () => {
    const alg = parseMoves("y' U' R' U R");
    const setup = computeSetupState(alg);
    expect(centerFrame(setup)).toEqual(IDENTITY);
    const end = applyMoves(setup, alg);
    expect(isSolved(end)).toBe(true);
    expect(centerFrame(end)).not.toEqual(IDENTITY); // the solver ends rotated, as in real life
  });

  it('matches the plain inverse rule when the algorithm has no net rotation', () => {
    const alg = parseMoves("R U R' U' M' U R U' r'");
    expect(statesEqual(computeSetupState(alg), applyMoves(SOLVED, invertMoves(alg)))).toBe(true);
  });
});

describe('focused F2L mask (f2l-slot)', () => {
  const visible = (home: Vec3, face: Face, slot: 'FR' | 'FL' = 'FR') => isStickerVisible('f2l-slot', home, face, slot);

  it('colours centres, the cross and the target pair only', () => {
    expect(visible([0, 1, 0], 'U')).toBe(true); // centre
    expect(visible([0, -1, 1], 'D')).toBe(true); // cross edge
    expect(visible([1, -1, 1], 'R')).toBe(true); // FR corner
    expect(visible([1, 0, 1], 'F')).toBe(true); // FR edge
    expect(visible([-1, -1, 1], 'D')).toBe(false); // FL corner (solved slot) muted
    expect(visible([-1, 0, -1], 'B')).toBe(false); // BL edge muted
    expect(visible([1, 1, 1], 'U')).toBe(false); // last layer muted
  });

  it('follows the requested slot', () => {
    expect(visible([-1, -1, 1], 'D', 'FL')).toBe(true);
    expect(visible([1, -1, 1], 'D', 'FL')).toBe(false);
  });

  it('differs from the regular F2L mask only on solved-slot pieces', () => {
    for (const c of SOLVED.cubies) {
      const inOtherSlot = (['FL', 'BR', 'BL'] as const).some(
        (s) => F2L_SLOTS[s].corner.join() === c.home.join() || F2L_SLOTS[s].edge.join() === c.home.join(),
      );
      const regular = isStickerVisible('f2l', c.home, 'D');
      expect(visible(c.home, 'D')).toBe(inOtherSlot ? false : regular);
    }
  });
});

describe('targetF2LSlot', () => {
  it('finds the unsolved slot', () => {
    expect(targetF2LSlot(computeSetupState("U R U' R'"))).toBe('FR');
    expect(targetF2LSlot(computeSetupState("U' L' U L"))).toBe('FL');
    expect(targetF2LSlot(SOLVED)).toBeUndefined();
    expect(targetF2LSlot(computeSetupState("R U R' L' U' L"))).toBeUndefined();
  });
});

describe('drill helpers', () => {
  it('seeded RNG is deterministic and in range', () => {
    const a = seededRng(42);
    const b = seededRng(42);
    const xs = Array.from({ length: 200 }, () => a());
    expect(xs).toEqual(Array.from({ length: 200 }, () => b()));
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
  });

  it('randomItem covers every item', () => {
    const rng = seededRng(1);
    const seen = new Set(Array.from({ length: 200 }, () => randomItem(AUF_MOVES, rng)));
    expect(seen).toEqual(new Set(AUF_MOVES));
    expect(() => randomItem([], rng)).toThrow();
  });

  it('pickDrillCase avoids immediate repeats when it can', () => {
    const rng = seededRng(7);
    const pool = [{ id: 'a' }, { id: 'b' }];
    for (let i = 0; i < 50; i++) expect(pickDrillCase(pool, rng, 'a')?.id).toBe('b');
    expect(pickDrillCase([{ id: 'a' }], rng, 'a')?.id).toBe('a');
    expect(pickDrillCase([], rng)).toBeUndefined();
  });

  it('randomTwist respects the options', () => {
    const rng = seededRng(3);
    for (let i = 0; i < 30; i++) {
      expect(randomTwist(rng, { auf: false, rotation: false })).toEqual(NO_TWIST);
      const t = randomTwist(rng, { auf: true, rotation: false });
      expect(t.rotation).toBe('');
      expect(AUF_MOVES).toContain(t.auf);
      const r = randomTwist(rng, { auf: false, rotation: true });
      expect(r.auf).toBe('');
      expect(Y_ROTATIONS).toContain(r.rotation);
    }
  });

  it('drillAlgorithm prefixes the solver’s rotation and AUF', () => {
    expect(drillAlgorithm("R U R'", NO_TWIST)).toBe("R U R'");
    expect(drillAlgorithm("R U R'", { rotation: 'y', auf: "U'" })).toBe("y U' R U R'");
  });

  it('twisted PLL setups stay the same case and are presented upright', () => {
    const tperm = parseMoves("R U R' U' R' F R2 U' R' U' R U R' F'");
    for (const rotation of Y_ROTATIONS) {
      for (const auf of AUF_MOVES) {
        const full = parseMoves(drillAlgorithm("R U R' U' R' F R2 U' R' U' R U R' F'", { rotation, auf }));
        const setup = computeSetupState(full);
        expect(centerFrame(setup)).toEqual(IDENTITY);
        expect(isSolved(applyMoves(setup, full))).toBe(true);
        expect(caseKey('PLL', full)).toBe(caseKey('PLL', tperm));
      }
    }
  });

  it('a y twist moves an F2L case into another slot', () => {
    const full = parseMoves(drillAlgorithm("U R U' R'", { rotation: 'y', auf: '' }));
    const setup = computeSetupState(full);
    expect(targetF2LSlot(setup)).not.toBe('FR');
    expect(isSolved(applyMoves(setup, full))).toBe(true);
    expect(normalizeOrientation(applyMoves(setup, full))).toBeTruthy();
  });
});

describe('solvesSameCase', () => {
  const sune = parseMoves("R U R' U R U2 R'");
  it('accepts alternatives (including AUF and rotation variants)', () => {
    expect(solvesSameCase('OLL', sune, parseMoves("y' R' U2 R U R' U R"))).toBe(true);
    expect(solvesSameCase('OLL', sune, parseMoves("U R U R' U R U2 R'"))).toBe(true);
  });
  it('rejects other cases, broken F2L and empty input', () => {
    expect(solvesSameCase('OLL', sune, parseMoves("R U2 R' U' R U' R'"))).toBe(false); // anti-sune
    expect(solvesSameCase('OLL', sune, parseMoves("R U R' U R U2 R' D"))).toBe(false); // breaks F2L
    expect(solvesSameCase('OLL', sune, [])).toBe(false);
  });
  it('isStageCase validates stage invariants', () => {
    expect(isStageCase('F2L', parseMoves("R U R'"))).toBe(true);
    expect(isStageCase('F2L', parseMoves("L' U' L"))).toBe(false); // FL slot, not FR
    expect(isStageCase('PLL', parseMoves("R U R' U'"))).toBe(false);
    expect(isStageCase('PLL', parseMoves("M2 U M2 U2 M2 U M2"))).toBe(true);
  });
});
