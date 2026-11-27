import type { Move, MoveBase } from '../notation/types';
import { parseMoves } from '../notation/parser';
import { axisIndex, mulMat, mulMatVec, rotationMatrix, type Axis } from './math';
import type { CubeState } from './state';

/**
 * Geometric definition of a base move (amount = 1, i.e. clockwise).
 * `direction` is the signed quarter-turn count about the +axis using the
 * right-hand rule; clockwise as seen from the +axis face is therefore -1.
 */
export interface MoveGeometry {
  readonly axis: Axis;
  /** Coordinates along `axis` of the layers that turn. */
  readonly layers: readonly (-1 | 0 | 1)[];
  readonly direction: 1 | -1;
}

export const MOVE_GEOMETRY: Readonly<Record<MoveBase, MoveGeometry>> = {
  // Outer faces
  R: { axis: 'x', layers: [1], direction: -1 },
  L: { axis: 'x', layers: [-1], direction: 1 },
  U: { axis: 'y', layers: [1], direction: -1 },
  D: { axis: 'y', layers: [-1], direction: 1 },
  F: { axis: 'z', layers: [1], direction: -1 },
  B: { axis: 'z', layers: [-1], direction: 1 },
  // Slices: M follows L, E follows D, S follows F
  M: { axis: 'x', layers: [0], direction: 1 },
  E: { axis: 'y', layers: [0], direction: 1 },
  S: { axis: 'z', layers: [0], direction: -1 },
  // Wide (two-layer) moves
  r: { axis: 'x', layers: [0, 1], direction: -1 },
  l: { axis: 'x', layers: [-1, 0], direction: 1 },
  u: { axis: 'y', layers: [0, 1], direction: -1 },
  d: { axis: 'y', layers: [-1, 0], direction: 1 },
  f: { axis: 'z', layers: [0, 1], direction: -1 },
  b: { axis: 'z', layers: [-1, 0], direction: 1 },
  // Whole-cube rotations: x follows R, y follows U, z follows F
  x: { axis: 'x', layers: [-1, 0, 1], direction: -1 },
  y: { axis: 'y', layers: [-1, 0, 1], direction: -1 },
  z: { axis: 'z', layers: [-1, 0, 1], direction: -1 },
};

/** Signed quarter turns about the +axis for a concrete move. */
export function signedQuarterTurns(move: Move): number {
  return MOVE_GEOMETRY[move.base].direction * move.amount;
}

/** True if a cubie at `pos` is part of the layer(s) turned by `move`. */
export function isInMoveLayer(move: Move, pos: readonly number[]): boolean {
  const g = MOVE_GEOMETRY[move.base];
  return (g.layers as readonly number[]).includes(pos[axisIndex(g.axis)]);
}

export function applyMove(state: CubeState, move: Move): CubeState {
  const g = MOVE_GEOMETRY[move.base];
  const m = rotationMatrix(g.axis, signedQuarterTurns(move));
  const ai = axisIndex(g.axis);
  const layers = g.layers as readonly number[];
  return {
    cubies: state.cubies.map((c) =>
      layers.includes(c.pos[ai]) ? { ...c, pos: mulMatVec(m, c.pos), rot: mulMat(m, c.rot) } : c,
    ),
  };
}

export function applyMoves(state: CubeState, moves: readonly Move[]): CubeState {
  return moves.reduce(applyMove, state);
}

/** Parses then applies a notation string. */
export function applyAlgorithm(state: CubeState, alg: string): CubeState {
  return applyMoves(state, parseMoves(alg));
}

/** States after 0..n moves: `result[k]` is the state after applying the first k moves. */
export function computeStates(start: CubeState, moves: readonly Move[]): CubeState[] {
  const out: CubeState[] = [start];
  for (const m of moves) out.push(applyMove(out[out.length - 1], m));
  return out;
}
