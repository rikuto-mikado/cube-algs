import type { Face } from './faces';
import { FACE_NORMALS } from './faces';
import { vecEquals, type Vec3 } from './math';
import {
  cubieKind,
  homeNormals,
  isCubieSolved,
  normalizeOrientation,
  stickerAt,
  type CubeState,
  type Sticker,
} from './state';
import { mulMatVec, rotationMatrix } from './math';
import { F2L_SLOT_NAMES, F2L_SLOTS, type F2LSlot } from './slots';

/** Maps a face-grid cell (row 0 = top, col 0 = left, viewed from outside in standard net orientation) to a cubie position. */
export function faceletPosition(face: Face, row: number, col: number): Vec3 {
  const c = col - 1;
  const r = row - 1;
  switch (face) {
    case 'U':
      return [c, 1, r];
    case 'D':
      return [c, -1, -r];
    case 'F':
      return [c, -r, 1];
    case 'B':
      return [-c, -r, -1];
    case 'R':
      return [1, -r, -c];
    case 'L':
      return [-1, -r, c];
  }
}

/** 3x3 grid of stickers for a face, rows top→bottom, cols left→right. */
export function faceGrid(state: CubeState, face: Face): Sticker[][] {
  const rows: Sticker[][] = [];
  for (let r = 0; r < 3; r++) {
    const row: Sticker[] = [];
    for (let c = 0; c < 3; c++) {
      const s = stickerAt(state, faceletPosition(face, r, c), face);
      if (!s) throw new Error(`Missing sticker ${face} ${r},${c}`);
      row.push(s);
    }
    rows.push(row);
  }
  return rows;
}

/** True when the first two layers (D + E layer pieces) are solved relative to the centres. */
export function isF2LSolved(state: CubeState): boolean {
  const n = normalizeOrientation(state);
  return n.cubies.filter((c) => c.home[1] !== 1).every(isCubieSolved);
}


export function isCrossSolved(state: CubeState): boolean {
  const n = normalizeOrientation(state);
  return n.cubies
    .filter((c) => c.home[1] === -1 && cubieKind(c.home) !== 'corner')
    .every(isCubieSolved);
}

/** Lists the F2L slots whose corner & edge are both solved (relative to centres). */
export function solvedSlots(state: CubeState): F2LSlot[] {
  const n = normalizeOrientation(state);
  return (Object.keys(F2L_SLOTS) as F2LSlot[]).filter((slot) => {
    const { corner, edge } = F2L_SLOTS[slot];
    return n.cubies
      .filter((c) => vecEquals(c.home, corner) || vecEquals(c.home, edge))
      .every(isCubieSolved);
  });
}

/**
 * The single F2L slot whose pair is unsolved (the slot an F2L algorithm
 * targets), or `undefined` when zero or several slots are unsolved.
 */
export function targetF2LSlot(state: CubeState): F2LSlot | undefined {
  const solved = solvedSlots(state);
  const open = F2L_SLOT_NAMES.filter((s) => !solved.includes(s));
  return open.length === 1 ? open[0] : undefined;
}

/** True if every last-layer piece has its U sticker facing up (relative to centres). */
export function isLastLayerOriented(state: CubeState): boolean {
  const n = normalizeOrientation(state);
  const up = FACE_NORMALS.U;
  return n.cubies
    .filter((c) => c.home[1] === 1)
    .every((c) => vecEquals(mulMatVec(c.rot, up), up));
}

export interface PermutationArrow {
  readonly kind: 'edge' | 'corner';
  /** Current position of the piece (where it sits in the case). */
  readonly from: Vec3;
  /** Where the algorithm will move it (its solved position). */
  readonly to: Vec3;
}

function arrowsWithAuf(n: CubeState, auf: number): PermutationArrow[] {
  const m = rotationMatrix('y', -auf);
  const out: PermutationArrow[] = [];
  for (const c of n.cubies) {
    if (c.home[1] !== 1 || cubieKind(c.home) === 'center' || c.pos[1] !== 1) continue;
    const target = mulMatVec(m, c.home);
    if (vecEquals(c.pos, target)) continue;
    out.push({ kind: cubieKind(c.home) === 'edge' ? 'edge' : 'corner', from: c.pos, to: target });
  }
  return out;
}

/**
 * Arrows describing how last-layer pieces move when the algorithm is executed.
 * The final U-layer adjustment is factored out (the AUF giving the fewest arrows wins).
 */
export function lastLayerArrows(state: CubeState): PermutationArrow[] {
  const n = normalizeOrientation(state);
  // Fewest moving pieces wins; ties prefer balanced corner/edge cycles (e.g. G perms show 3+3).
  const cost = (a: PermutationArrow[]) => {
    const corners = a.filter((x) => x.kind === 'corner').length;
    return a.length * 10 + Math.abs(corners - (a.length - corners));
  };
  let best = arrowsWithAuf(n, 0);
  for (let k = 1; k < 4; k++) {
    const a = arrowsWithAuf(n, k);
    if (cost(a) < cost(best)) best = a;
  }
  return best;
}

export { homeNormals };
