/**
 * Canonical case signatures used to verify the algorithm datasets: two
 * setup states map to the same key iff they are the same case up to the
 * U-layer adjustments (AUF) that a solver is free to make.
 */
import { parseMoves } from '../notation/parser';
import type { Move } from '../notation/types';
import { FACE_NORMALS, faceFromNormal } from './faces';
import { mulMatVec, vecEquals, type Vec3 } from './math';
import { applyMoves } from './moves';
import { isCubieSolved, normalizeOrientation, SOLVED, type CubeState } from './state';
import { isCrossSolved, isF2LSolved, isLastLayerOriented, solvedSlots } from './analysis';
import { computeSetupState } from './setup';

const AUF: readonly (readonly Move[])[] = ['', 'U', 'U2', "U'"].map((s) => parseMoves(s));

const LL_POSITIONS: readonly Vec3[] = [
  [-1, 1, -1],
  [0, 1, -1],
  [1, 1, -1],
  [1, 1, 0],
  [1, 1, 1],
  [0, 1, 1],
  [-1, 1, 1],
  [-1, 1, 0],
];

function minKey(keys: string[]): string {
  return keys.reduce((a, b) => (b < a ? b : a));
}

function pieceKey(state: CubeState, home: Vec3): string {
  const c = state.cubies.find((q) => vecEquals(q.home, home));
  if (!c) throw new Error('missing cubie');
  return `${c.pos.join(',')}|${c.rot.join(',')}`;
}

/** F2L case key: FR corner + FR edge placement, modulo a U-turn before the algorithm. */
export function f2lCaseKey(setup: CubeState): string {
  return minKey(
    AUF.map((auf) => {
      const s = normalizeOrientation(applyMoves(setup, auf));
      return `${pieceKey(s, [1, -1, 1])}#${pieceKey(s, [1, 0, 1])}`;
    }),
  );
}

/** OLL case key: direction of each U sticker in the last layer, modulo AUF. */
export function ollCaseKey(setup: CubeState): string {
  return minKey(
    AUF.map((auf) => {
      const s = normalizeOrientation(applyMoves(setup, auf));
      return LL_POSITIONS.map((p) => {
        const c = s.cubies.find((q) => vecEquals(q.pos, p));
        if (!c) throw new Error('missing cubie');
        return faceFromNormal(mulMatVec(c.rot, FACE_NORMALS.U));
      }).join('');
    }),
  );
}

/** PLL case key: last-layer permutation produced by `alg`'s setup, modulo pre- and post-AUF. */
export function pllCaseKey(alg: readonly Move[]): string {
  const keys: string[] = [];
  for (const pre of AUF) {
    for (const post of AUF) {
      const s = normalizeOrientation(applyMoves(computeSetupState(alg, undefined, applyMoves(SOLVED, pre)), post));
      keys.push(
        LL_POSITIONS.map((p) => {
          const c = s.cubies.find((q) => vecEquals(q.pos, p));
          return c ? c.home.join(',') : '?';
        }).join(';'),
      );
    }
  }
  return minKey(keys);
}

/** True if some U-layer adjustment alone solves the state. */
export function isSolvedByAuf(state: CubeState): boolean {
  return AUF.some((auf) => {
    const s = normalizeOrientation(applyMoves(state, auf));
    return s.cubies.every(isCubieSolved);
  });
}

export type CaseStage = 'F2L' | 'OLL' | 'PLL';

/** True when `alg`'s setup is a well-formed case of the given stage (FR-slot F2L, OLL or PLL). */
export function isStageCase(stage: CaseStage, alg: readonly Move[]): boolean {
  const setup = computeSetupState(alg);
  switch (stage) {
    case 'F2L': {
      const solved = solvedSlots(setup);
      return isCrossSolved(setup) && solved.length === 3 && !solved.includes('FR');
    }
    case 'OLL':
      return isF2LSolved(setup) && !isLastLayerOriented(setup);
    case 'PLL':
      return isF2LSolved(setup) && isLastLayerOriented(setup) && !isSolvedByAuf(setup);
  }
}

/** Canonical key of the case `alg` solves, for the given stage. */
export function caseKey(stage: CaseStage, alg: readonly Move[]): string {
  switch (stage) {
    case 'F2L':
      return f2lCaseKey(computeSetupState(alg));
    case 'OLL':
      return ollCaseKey(computeSetupState(alg));
    case 'PLL':
      return pllCaseKey(alg);
  }
}

/**
 * True when `candidate` solves the same case as `reference` (modulo AUF) while
 * respecting the stage's invariants — used to accept user-saved alternatives.
 */
export function solvesSameCase(stage: CaseStage, reference: readonly Move[], candidate: readonly Move[]): boolean {
  if (candidate.length === 0 || !isStageCase(stage, candidate)) return false;
  return caseKey(stage, reference) === caseKey(stage, candidate);
}
