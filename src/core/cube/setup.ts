import { invertMoves } from '../notation/inverse';
import { parseMoves } from '../notation/parser';
import type { Move } from '../notation/types';
import { applyMoves } from './moves';
import { centerFrame, rotateWholeCube, SOLVED, type CubeState } from './state';

/**
 * Builds the study "Setup State" for algorithm A using the inverse rule:
 *   setup = inverse(A) applied to a solved cube (optionally pre-rotated by `setupMoves`).
 * Playing A forward from this state always resolves it back to solved.
 *
 * Algorithms containing cube rotations (`y' R U R'`) or net slice turns end in a
 * different orientation. The solved start is pre-rotated by that net rotation so
 * the case is always *presented* in the standard holding orientation
 * (yellow top, green front) — exactly how a learner would pick it up.
 */
export function computeSetupState(
  alg: string | readonly Move[],
  setupMoves?: string,
  base: CubeState = SOLVED,
): CubeState {
  const moves = typeof alg === 'string' ? parseMoves(alg) : alg;
  const start = setupMoves ? applyMoves(base, parseMoves(setupMoves)) : base;
  const net = centerFrame(applyMoves(SOLVED, moves));
  return applyMoves(rotateWholeCube(start, net), invertMoves(moves));
}
