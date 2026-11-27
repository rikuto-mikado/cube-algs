import { describe, expect, it } from 'vitest';
import { invertAlgorithm, invertMoves, movesToString, parseAlgorithm, parseMoves } from './index';

describe('parser', () => {
  it('parses outer turns with modifiers', () => {
    const moves = parseMoves("R U' F2 D2' B L'");
    expect(moves.map((m) => [m.base, m.amount])).toEqual([
      ['R', 1],
      ['U', -1],
      ['F', 2],
      ['D', -2],
      ['B', 1],
      ['L', -1],
    ]);
  });

  it('parses slice, wide (both notations) and rotation moves', () => {
    const moves = parseMoves("M E' S2 r Rw' u2 Fw x y' z2");
    expect(moves.map((m) => m.base)).toEqual(['M', 'E', 'S', 'r', 'r', 'u', 'f', 'x', 'y', 'z']);
    expect(moves[4].text).toBe("Rw'");
  });

  it('keeps trigger groups for display but flattens moves', () => {
    const alg = parseAlgorithm("(R U R' U') R' F (R2 U' R')");
    expect(alg.moves).toHaveLength(9);
    expect(alg.nodes).toHaveLength(4);
    const g = alg.nodes[0];
    expect(g.kind).toBe('group');
    if (g.kind === 'group') {
      expect(g.children.map((c) => (c.kind === 'move' ? c.index : -1))).toEqual([0, 1, 2, 3]);
    }
  });

  it('supports nested groups and typographic primes', () => {
    const alg = parseAlgorithm('F (R (U R’) U’) F’');
    expect(movesToString(alg.moves)).toBe("F R U R' U' F'");
  });

  it('rejects invalid notation', () => {
    expect(() => parseAlgorithm('R Q')).toThrow();
    expect(() => parseAlgorithm('(R U')).toThrow();
    expect(() => parseAlgorithm('R U)')).toThrow();
  });
});

describe('inverse', () => {
  it('reverses and inverts moves', () => {
    expect(movesToString(invertMoves(parseMoves("R U2 F' Rw M'")))).toBe("M Rw' F U2 R'");
  });

  it('preserves groupings when inverting strings', () => {
    expect(invertAlgorithm("(R U R' U') F")).toBe("F' (U R U' R')");
  });

  it('is an involution', () => {
    const src = "x R' U R' D2 R U' R' D2 R2 x'";
    expect(invertAlgorithm(invertAlgorithm(src))).toBe(src);
  });
});
