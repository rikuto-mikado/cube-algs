import { describe, expect, it } from 'vitest';
import { applyMoves } from '../cube/moves';
import { SOLVED, type CubeState } from '../cube/state';
import { mulMat, mulMatVec, vecKey, type Mat3 } from '../cube/math';
import { MAX_CUSTOM_MOVES, mirrorAlgorithm, mirrorMoves, parseMoves, validateAlgorithm } from './index';

/** Reflection across the L/R plane (x → −x). */
const MX: Mat3 = [-1, 0, 0, 0, 1, 0, 0, 0, 1];

/** Mirror image of a cube state: every cubie (and its identity) reflected. */
function reflectState(s: CubeState): Map<string, string> {
  const out = new Map<string, string>();
  for (const c of s.cubies) {
    const home = mulMatVec(MX, c.home);
    out.set(vecKey(home), `${vecKey(mulMatVec(MX, c.pos))}|${mulMat(mulMat(MX, c.rot), MX).join(',')}`);
  }
  return out;
}

function byHome(s: CubeState): Map<string, string> {
  return new Map(s.cubies.map((c) => [vecKey(c.home), `${vecKey(c.pos)}|${c.rot.join(',')}`]));
}

describe('mirrorAlgorithm', () => {
  it.each([
    ["R U R' U R U2 R'", "L' U' L U' L' U2 L"],
    ["(R U R' U') R' F R F'", "(L' U' L U) L F' L' F"],
    ["Rw U Rw'", "Lw' U' Lw"],
    ["r U' l'", "l' U r"],
    ["M2 U M U2 M' U M2", "M2 U' M U2 M' U' M2"],
    ["x y' z2 E S'", "x y z2 E' S"],
    ["R2' U2 F2", "L2' U2 F2"],
  ])('%s ↔ %s', (alg, mirrored) => {
    expect(mirrorAlgorithm(alg)).toBe(mirrored);
    expect(mirrorAlgorithm(mirrored)).toBe(alg);
  });

  it('preserves trigger groupings', () => {
    expect(mirrorAlgorithm("F (R U R' U') F'")).toBe("F' (L' U' L U) F");
  });

  it('is geometrically the reflection of the cube state for every move type', () => {
    const algs = [
      "R U R' U' R' F R2 U' R' U' R U R' F'",
      "M' U M2 U M2 U M' U2 M2 x y' z",
      "Rw U Lw' D Fw2 Bw' u' d2 f b2 l r'",
      "E S' E2 S2 B L' D2",
    ];
    for (const alg of algs) {
      const mirrored = applyMoves(SOLVED, mirrorMoves(parseMoves(alg)));
      expect(byHome(mirrored), alg).toEqual(reflectState(applyMoves(SOLVED, parseMoves(alg))));
    }
  });
});

describe('validateAlgorithm', () => {
  it('accepts valid notation and returns the parse', () => {
    const r = validateAlgorithm("(R U R' U') Rw2 x'");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.parsed.moves).toHaveLength(6);
  });

  it('reports empty input without an error position', () => {
    for (const s of ['', '   ', '\n']) expect(validateAlgorithm(s)).toMatchObject({ ok: false, reason: 'empty', position: -1 });
  });

  it.each([
    ['R U Q', 4],
    ["(R U R'", 7],
    ['R U)', 3],
    ['R () U', 2],
  ])('pinpoints the syntax error in %j', (src, position) => {
    expect(validateAlgorithm(src)).toMatchObject({ ok: false, reason: 'syntax', position });
  });

  it('reports machine-readable error codes for localisation', () => {
    expect(validateAlgorithm('R U Qx')).toMatchObject({ code: 'unrecognised', token: 'Qx' });
    expect(validateAlgorithm("(R U")).toMatchObject({ code: 'missing', token: ')' });
    expect(validateAlgorithm('R ]')).toMatchObject({ code: 'unexpected', token: ']' });
    expect(validateAlgorithm('[]')).toMatchObject({ code: 'empty-group' });
    expect(validateAlgorithm('')).toMatchObject({ code: 'empty' });
  });

  it('caps very long input', () => {
    expect(validateAlgorithm('R '.repeat(MAX_CUSTOM_MOVES + 1))).toMatchObject({ ok: false, reason: 'syntax' });
    expect(validateAlgorithm('R '.repeat(MAX_CUSTOM_MOVES)).ok).toBe(true);
  });
});
