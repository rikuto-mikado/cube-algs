import { FACE_NORMALS, faceFromNormal, type Face } from './faces';
import {
  CUBE_ROTATIONS,
  IDENTITY,
  mulMat,
  mulMatVec,
  vecEquals,
  vecKey,
  type Mat3,
  type Vec3,
} from './math';

/**
 * A single cubie. `home` is its solved position (also its identity);
 * `pos` is where it currently is and `rot` is the exact rotation that maps
 * its home frame onto its current frame (so `pos = rot * home`).
 */
export interface Cubie {
  readonly id: number;
  readonly home: Vec3;
  readonly pos: Vec3;
  readonly rot: Mat3;
}

export interface CubeState {
  readonly cubies: readonly Cubie[];
}

/** A sticker as seen on the current cube. */
export interface Sticker {
  readonly cubieId: number;
  /** Solved position of the owning cubie (identity). */
  readonly home: Vec3;
  /** Face the sticker belongs to in the solved cube — determines its colour. */
  readonly homeFace: Face;
  /** Current position of the owning cubie. */
  readonly pos: Vec3;
  /** Face direction the sticker currently points at. */
  readonly face: Face;
}

export function createSolvedCube(): CubeState {
  const cubies: Cubie[] = [];
  let id = 0;
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue;
        const home: Vec3 = [x, y, z];
        cubies.push({ id: id++, home, pos: home, rot: IDENTITY });
      }
    }
  }
  return { cubies };
}

export const SOLVED: CubeState = createSolvedCube();

/** Home-frame sticker normals of a cubie (one per non-zero coordinate). */
export function homeNormals(home: Vec3): Vec3[] {
  const out: Vec3[] = [];
  if (home[0] !== 0) out.push([home[0], 0, 0]);
  if (home[1] !== 0) out.push([0, home[1], 0]);
  if (home[2] !== 0) out.push([0, 0, home[2]]);
  return out;
}

export function getStickers(state: CubeState): Sticker[] {
  const out: Sticker[] = [];
  for (const c of state.cubies) {
    for (const n of homeNormals(c.home)) {
      out.push({
        cubieId: c.id,
        home: c.home,
        homeFace: faceFromNormal(n),
        pos: c.pos,
        face: faceFromNormal(mulMatVec(c.rot, n)),
      });
    }
  }
  return out;
}

/** Returns the face colour (home face) visible at position `pos` on face `face`. */
export function stickerAt(state: CubeState, pos: Vec3, face: Face): Sticker | undefined {
  const n = FACE_NORMALS[face];
  for (const c of state.cubies) {
    if (!vecEquals(c.pos, pos)) continue;
    for (const hn of homeNormals(c.home)) {
      if (vecEquals(mulMatVec(c.rot, hn), n)) {
        return { cubieId: c.id, home: c.home, homeFace: faceFromNormal(hn), pos: c.pos, face };
      }
    }
  }
  return undefined;
}

/** True when every face shows a single colour (independent of whole-cube orientation). */
export function isSolved(state: CubeState): boolean {
  const faceColor = new Map<Face, Face>();
  for (const s of getStickers(state)) {
    const existing = faceColor.get(s.face);
    if (existing === undefined) faceColor.set(s.face, s.homeFace);
    else if (existing !== s.homeFace) return false;
  }
  return true;
}

/** Strict equality: every cubie in the same place with the same orientation. */
export function statesEqual(a: CubeState, b: CubeState): boolean {
  const byId = new Map(b.cubies.map((c) => [c.id, c]));
  return a.cubies.every((c) => {
    const o = byId.get(c.id);
    return o !== undefined && vecEquals(c.pos, o.pos) && c.rot.every((v, i) => v === o.rot[i]);
  });
}

/** Applies a rigid whole-cube rotation to the state. */
export function rotateWholeCube(state: CubeState, m: Mat3): CubeState {
  return {
    cubies: state.cubies.map((c) => ({ ...c, pos: mulMatVec(m, c.pos), rot: mulMat(m, c.rot) })),
  };
}

/**
 * Rotates the whole cube so that every centre is back at its home face.
 * Useful to compare states that differ only by a whole-cube rotation (x/y/z).
 */
export function normalizeOrientation(state: CubeState): CubeState {
  const centers = state.cubies.filter((c) => homeNormals(c.home).length === 1);
  for (const m of CUBE_ROTATIONS) {
    if (centers.every((c) => vecEquals(mulMatVec(m, c.pos), c.home))) {
      return rotateWholeCube(state, m);
    }
  }
  throw new Error('Invalid cube state: centres are not a rigid rotation');
}

/**
 * The whole-cube orientation of a state: the rotation Q with
 * `centre.pos = Q · centre.home` for every centre.
 */
export function centerFrame(state: CubeState): Mat3 {
  const centers = state.cubies.filter((c) => homeNormals(c.home).length === 1);
  for (const m of CUBE_ROTATIONS) {
    if (centers.every((c) => vecEquals(mulMatVec(m, c.home), c.pos))) return m;
  }
  throw new Error('Invalid cube state: centres are not a rigid rotation');
}

export function cubieAt(state: CubeState, pos: Vec3): Cubie | undefined {
  return state.cubies.find((c) => vecEquals(c.pos, pos));
}

/**
 * True when the cubie is at its home position with identity orientation.
 * Centre spin is invisible on a standard 3x3, so centres only need to be in place.
 */
export function isCubieSolved(c: Cubie): boolean {
  if (!vecEquals(c.pos, c.home)) return false;
  return homeNormals(c.home).length === 1 || c.rot.every((v, i) => v === IDENTITY[i]);
}

export function cubieKind(home: Vec3): 'center' | 'edge' | 'corner' {
  const n = homeNormals(home).length;
  return n === 1 ? 'center' : n === 2 ? 'edge' : 'corner';
}

export { vecKey };
