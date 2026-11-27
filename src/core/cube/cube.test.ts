import { describe, expect, it } from 'vitest';
import { parseMoves } from '../notation/parser';
import { invertMoves } from '../notation/inverse';
import {
  applyAlgorithm,
  applyMoves,
  computeSetupState,
  createSolvedCube,
  isSolved,
  isStickerVisible,
  normalizeOrientation,
  statesEqual,
  stickerAt,
  SOLVED,
  type Face,
  type Vec3,
} from './index';

const colorAt = (alg: string, pos: Vec3, face: Face): Face | undefined =>
  stickerAt(applyAlgorithm(SOLVED, alg), pos, face)?.homeFace;

describe('solved cube', () => {
  it('has 26 cubies and 54 stickers', () => {
    const s = createSolvedCube();
    expect(s.cubies).toHaveLength(26);
    expect(isSolved(s)).toBe(true);
  });
});

describe('move directions', () => {
  it.each<[string, Vec3, Face, Face]>([
    ['R', [1, 1, 0], 'U', 'F'], // R moves F stickers up to U
    ['L', [-1, 1, 0], 'U', 'B'], // L moves B stickers up to U
    ['U', [0, 1, 1], 'F', 'R'], // U moves R stickers to F
    ['D', [0, -1, 1], 'F', 'L'], // D moves L stickers to F
    ['F', [1, 0, 1], 'R', 'U'], // F moves U stickers to R
    ['B', [-1, 0, -1], 'L', 'U'], // B moves U stickers to L
    ['M', [0, 1, 0], 'U', 'B'], // M follows L
    ['E', [0, 0, 1], 'F', 'L'], // E follows D
    ['S', [1, 0, 0], 'R', 'U'], // S follows F
    ['x', [0, 1, 0], 'U', 'F'], // x follows R
    ['y', [0, 0, 1], 'F', 'R'], // y follows U
    ['z', [1, 0, 0], 'R', 'U'], // z follows F
    ['r', [0, 1, 0], 'U', 'F'],
    ['Rw', [0, 1, 0], 'U', 'F'],
    ['l', [0, 1, 0], 'U', 'B'],
    ['u', [0, 0, 1], 'F', 'R'],
    ['d', [0, 0, 1], 'F', 'L'],
    ['f', [1, 0, 0], 'R', 'U'],
    ['b', [-1, 0, 0], 'L', 'U'],
  ])('%s puts the expected colour at %j on %s', (alg, pos, face, expected) => {
    expect(colorAt(alg, pos, face)).toBe(expected);
  });

  it('wide moves and rotations decompose into outer + slice moves', () => {
    const eq = (a: string, b: string) =>
      expect(statesEqual(applyAlgorithm(SOLVED, a), applyAlgorithm(SOLVED, b))).toBe(true);
    eq('r', "R M'");
    eq('l', 'L M');
    eq('u', "U E'");
    eq('d', 'D E');
    eq('f', 'F S');
    eq('b', "B S'");
    eq('x', "R M' L'");
    eq('y', "U E' D'");
    eq('z', "F S B'");
    eq("R2'", 'R2');
    eq("R'", 'R R R');
  });
});

describe('group properties', () => {
  it.each(['R', 'U', 'F', 'M', 'E', 'S', 'r', 'x', 'y', 'z', 'Bw', 'D', 'L', 'B'])(
    '%s has order 4',
    (m) => {
      const once = applyAlgorithm(SOLVED, m);
      expect(isSolved(once) && !['x', 'y', 'z'].includes(m)).toBe(false);
      expect(statesEqual(applyAlgorithm(SOLVED, `${m} ${m} ${m} ${m}`), SOLVED)).toBe(true);
    },
  );

  it('sexy move has order 6', () => {
    let s = SOLVED;
    for (let i = 1; i <= 6; i++) {
      s = applyAlgorithm(s, "R U R' U'");
      expect(statesEqual(s, SOLVED)).toBe(i === 6);
    }
  });

  it('whole-cube rotations keep the cube solved', () => {
    const s = applyAlgorithm(SOLVED, "x y2 z'");
    expect(isSolved(s)).toBe(true);
    expect(statesEqual(normalizeOrientation(s), SOLVED)).toBe(true);
  });

  it('alg followed by its inverse is the identity', () => {
    const moves = parseMoves("R U2 r' M E S' x y' z2 Fw d' B L2");
    expect(statesEqual(applyMoves(applyMoves(SOLVED, moves), invertMoves(moves)), SOLVED)).toBe(true);
  });
});

describe('setup state', () => {
  it('playing the algorithm from the setup state solves the cube', () => {
    const alg = "R U R' U' R' F R2 U' R' U' R U R' F'";
    const setup = computeSetupState(alg);
    expect(isSolved(setup)).toBe(false);
    expect(isSolved(applyAlgorithm(setup, alg))).toBe(true);
  });
});

describe('masking', () => {
  it('f2l hides last-layer pieces but keeps centres', () => {
    expect(isStickerVisible('f2l', [1, 1, 1], 'U')).toBe(false);
    expect(isStickerVisible('f2l', [0, 1, 0], 'U')).toBe(true);
    expect(isStickerVisible('f2l', [1, 0, 1], 'F')).toBe(true);
  });
  it('oll shows only U stickers of last-layer pieces', () => {
    expect(isStickerVisible('oll', [1, 1, 1], 'U')).toBe(true);
    expect(isStickerVisible('oll', [1, 1, 1], 'R')).toBe(false);
    expect(isStickerVisible('oll', [1, -1, 1], 'R')).toBe(true);
  });
  it('pll and full show everything', () => {
    expect(isStickerVisible('pll', [1, 1, 1], 'R')).toBe(true);
    expect(isStickerVisible('full', [1, 1, 1], 'R')).toBe(true);
  });
});
