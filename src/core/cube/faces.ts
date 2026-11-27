import type { Vec3 } from './math';

/** The six faces of the cube, named by their *home* (solved) direction. */
export type Face = 'U' | 'D' | 'L' | 'R' | 'F' | 'B';

export const FACES: readonly Face[] = ['U', 'D', 'F', 'B', 'R', 'L'];

/** World axis convention (matches Three.js): +x = R, +y = U, +z = F. */
export const FACE_NORMALS: Readonly<Record<Face, Vec3>> = {
  R: [1, 0, 0],
  L: [-1, 0, 0],
  U: [0, 1, 0],
  D: [0, -1, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
};

export function faceFromNormal(n: Vec3): Face {
  if (n[0] === 1) return 'R';
  if (n[0] === -1) return 'L';
  if (n[1] === 1) return 'U';
  if (n[1] === -1) return 'D';
  if (n[2] === 1) return 'F';
  if (n[2] === -1) return 'B';
  throw new Error(`Not a unit face normal: ${n.join(',')}`);
}
