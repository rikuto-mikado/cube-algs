/**
 * Exact integer linear algebra for the cube engine.
 * All values are integers; no floating point is ever used for state.
 */

export type Coord = -1 | 0 | 1;
export type Vec3 = readonly [number, number, number];
/** Row-major 3x3 integer matrix. */
export type Mat3 = readonly [number, number, number, number, number, number, number, number, number];
export type Axis = 'x' | 'y' | 'z';

export const AXES: readonly Axis[] = ['x', 'y', 'z'];

export const IDENTITY: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

export function axisIndex(axis: Axis): 0 | 1 | 2 {
  return axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
}

export function mulMatVec(m: Mat3, v: Vec3): Vec3 {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ];
}

export function mulMat(a: Mat3, b: Mat3): Mat3 {
  const r: number[] = new Array<number>(9);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
    }
  }
  return r as unknown as Mat3;
}

export function transpose(m: Mat3): Mat3 {
  return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
}

/** Normalises any integer to 0..3 */
export function mod4(n: number): 0 | 1 | 2 | 3 {
  return (((n % 4) + 4) % 4) as 0 | 1 | 2 | 3;
}

/**
 * Rotation matrix for `quarterTurns` * 90° about the positive axis,
 * following the right-hand rule (counter-clockwise when looking from +axis toward the origin).
 */
export function rotationMatrix(axis: Axis, quarterTurns: number): Mat3 {
  const q = mod4(quarterTurns);
  const c = [1, 0, -1, 0][q];
  const s = [0, 1, 0, -1][q];
  switch (axis) {
    case 'x':
      return [1, 0, 0, 0, c, -s, 0, s, c];
    case 'y':
      return [c, 0, s, 0, 1, 0, -s, 0, c];
    case 'z':
      return [c, -s, 0, s, c, 0, 0, 0, 1];
  }
}

export function vecEquals(a: Vec3, b: Vec3): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

export function matEquals(a: Mat3, b: Mat3): boolean {
  for (let i = 0; i < 9; i++) if (a[i] !== b[i]) return false;
  return true;
}

export function vecKey(v: Vec3): string {
  return `${v[0]},${v[1]},${v[2]}`;
}

/** All 24 proper rotations of the cube, generated from x/y rotations. */
export const CUBE_ROTATIONS: readonly Mat3[] = (() => {
  const out: Mat3[] = [];
  const seen = new Set<string>();
  const queue: Mat3[] = [IDENTITY];
  const gens = [rotationMatrix('x', 1), rotationMatrix('y', 1)];
  while (queue.length > 0) {
    const m = queue.shift() as Mat3;
    const key = m.join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
    for (const g of gens) queue.push(mulMat(g, m));
  }
  return out;
})();
