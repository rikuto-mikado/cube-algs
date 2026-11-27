import type { AlgorithmCase, LocalizedText } from '../../types';

/**
 * All 41 F2L cases, written for the front-right (FR) slot.
 * Categories are derived from where the target corner and edge start.
 */
const f2l = (
  n: number,
  category: string,
  algorithms: string[],
  recognition?: LocalizedText,
): AlgorithmCase => ({
  id: `f2l-${String(n).padStart(2, '0')}`,
  stage: 'F2L',
  name: `F2L ${n}`,
  category,
  algorithms,
  recognition,
  maskMode: 'f2l',
});

const BASIC = 'Basic Inserts';
const TOP = 'Both in Top';
const WHITE_UP = 'White Facing Up';
const EDGE_SLOT = 'Edge in Slot';
const CORNER_SLOT = 'Corner in Slot';
const BOTH_SLOT = 'Both in Slot';

export const F2L_CASES: readonly AlgorithmCase[] = [
  f2l(1, BASIC, ["U (R U' R')", "R' F R F'"], { en: 'Pair is split; pull the corner over the slot and insert the pair from the right.', ja: 'ペアが分かれた状態。コーナーをスロットの上へ移し、右からペアを入れる。' }),
  f2l(2, BASIC, ["U' (F' U F)", "y' U' (R' U R)"], { en: 'Mirror of case 1: insert from the front.', ja: 'ケース1の鏡像。前から入れる。' }),
  f2l(3, BASIC, ["F' U' F", "y' (R' U' R)"], { en: 'Edge and corner already form a pair above the slot: front insert.', ja: 'スロットの上でエッジとコーナーがすでにペアになっている。前から挿入。' }),
  f2l(4, BASIC, ["R U R'"], { en: 'Edge and corner already form a pair above the slot: right insert.', ja: 'スロットの上でエッジとコーナーがすでにペアになっている。右から挿入。' }),

  f2l(5, TOP, ["U' (R U R') U2 (R U' R')"]),
  f2l(6, TOP, ["U (F' U' F) U2 (F' U F)"]),
  f2l(7, TOP, ["U' (R U2 R') U2 (R U' R')"]),
  f2l(8, TOP, ["U (F' U2 F) U2 (F' U F)"]),
  f2l(9, TOP, ["U' (R U' R' U) (F' U' F)"]),
  f2l(10, TOP, ["U' (R U R' U) (R U R')"]),
  f2l(11, TOP, ["U' (R U2 R' U) (F' U' F)"]),
  f2l(12, TOP, ["(R U' R' U) (R U' R') U2 (R U' R')", "R' U2 R2 U R2 U R"]),
  f2l(13, TOP, ["U (F' U F U') (F' U' F)"]),
  f2l(14, TOP, ["U' (R U' R' U) (R U R')"]),
  f2l(15, TOP, ["(R' D' R) U' (R' D R) (U R U' R')"]),
  f2l(16, TOP, ["(R U' R') U2 (F' U' F)", "(R U' R' U) d (R' U' R)"]),

  f2l(17, WHITE_UP, ["(R U2 R' U') (R U R')"]),
  f2l(18, WHITE_UP, ["(F' U2 F U) (F' U' F)", "y' (R' U2 R U) (R' U' R)"]),
  f2l(19, WHITE_UP, ["U (R U2 R') U (R U' R')"]),
  f2l(20, WHITE_UP, ["U' (F' U2 F) U' (F' U F)"]),
  f2l(21, WHITE_UP, ["U2 (R U R' U) (R U' R')"]),
  f2l(22, WHITE_UP, ["U2 (F' U' F U') (F' U F)"]),
  f2l(23, WHITE_UP, ["(R U R') U2 (R U R' U') (R U R')", "U2 R2 U2 R' U' R U' R2", "U R U' R' U' R U' R' U R U' R'"]),
  f2l(24, WHITE_UP, ["(F U R U' R' F') (R U' R')", "y' (R' U' R) U2 (R' U' R U) (R' U' R)"]),

  f2l(25, EDGE_SLOT, ["U' (R' F R F') (R U' R')"]),
  f2l(26, EDGE_SLOT, ['R2 U R2 U R2 U2 R2', "U2 R2 U2 R2 U' R2 U' R2"]),
  f2l(27, EDGE_SLOT, ["U' (R U' R') U2 (R U' R')"]),
  f2l(28, EDGE_SLOT, ["U (R U R') U2 (R U R')"]),
  f2l(29, EDGE_SLOT, ["U' (R U R' U) (F' U' F)"]),
  f2l(30, EDGE_SLOT, ["U (F' U' F U') (R U R')"]),

  f2l(31, CORNER_SLOT, ["U (R U' R') (F R' F' R)"]),
  f2l(32, CORNER_SLOT, ["(R U' R' U) (R U' R')"]),
  f2l(33, CORNER_SLOT, ["(F' U F U') (F' U F)"]),
  f2l(34, CORNER_SLOT, ["(R U R' U') (R U R')"]),
  f2l(35, CORNER_SLOT, ["(F' U' F U) (F' U' F)"]),
  f2l(36, CORNER_SLOT, ["U' (R' F R F') (R U R')"]),

  f2l(37, BOTH_SLOT, ["R2 U2 F R2 F' U2 R' U R'", "(R U2 R') U (R U2 R') U (F' U' F)"], { en: 'Corner twisted with the white sticker on top, edge flipped.', ja: 'コーナーは白が上向きにねじれ、エッジは反転している。' }),
  f2l(38, BOTH_SLOT, ["(R U' R' U') (R U R') U2 (R U' R')"]),
  f2l(39, BOTH_SLOT, ["(R U' R' U) (R U2 R') U (R U' R')"]),
  f2l(40, BOTH_SLOT, ["(r U' r' U2) (r U r') (R U R')", "(R U' R') d (R' U' R U') (R' U' R)"]),
  f2l(41, BOTH_SLOT, ["(R U F) (R U R' U') F' R'", "(R U' R') F' (L' U2 L) F"]),
];
