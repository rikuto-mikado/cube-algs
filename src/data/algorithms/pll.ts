import type { AlgorithmCase, LocalizedText } from '../../types';

const pll = (
  id: string,
  name: string,
  category: string,
  algorithms: string[],
  recognition?: LocalizedText,
): AlgorithmCase => ({ id: `pll-${id}`, stage: 'PLL', name, category, algorithms, recognition, maskMode: 'pll' });

export const PLL_CASES: readonly AlgorithmCase[] = [
  // Edges only
  pll('ua', 'Ua-Perm', 'Edges Only', ["(M2 U M) U2 (M' U M2)", "(R U' R U) (R U R U') (R' U' R2)"], { en: 'Solid bar at the back; three edges cycle anticlockwise.', ja: '奥にそろったバー。3つのエッジが反時計回りに入れ替わる。' }),
  pll('ub', 'Ub-Perm', 'Edges Only', ["(M2 U' M) U2 (M' U' M2)", "(R2 U) (R U R' U') (R' U') (R' U R')"], { en: 'Solid bar at the back; three edges cycle clockwise.', ja: '奥にそろったバー。3つのエッジが時計回りに入れ替わる。' }),
  pll('h', 'H-Perm', 'Edges Only', ['(M2 U M2) U2 (M2 U M2)', "(M2 U' M2) U2 (M2 U' M2)", "R2 U2 R U2 R2 U2 R2 U2 R U2 R2"], { en: 'Opposite colours on every side: two pairs of opposite edges swap.', ja: '全側面に反対色。向かい合うエッジ2組が入れ替わる。' }),
  pll('z', 'Z-Perm', 'Edges Only', ["(M' U M2 U M2 U) (M' U2 M2)", "(M2 U M2 U) (M' U2 M2 U2 M')"], { en: 'Checkerboard of adjacent colours on two sides.', ja: '2つの側面に隣接色のチェッカー模様。' }),
  // Corners only
  pll('aa', 'Aa-Perm', 'Corners Only', ["x (R' U R') D2 (R U' R') D2 R2 x'", "(R' F R' B2) (R F' R' B2) R2"], { en: 'Headlights on the left with a bar; corners cycle clockwise.', ja: '左にヘッドライトとバー。コーナーが時計回りに回る。' }),
  pll('ab', 'Ab-Perm', 'Corners Only', ["x R2 D2 (R U R') D2 (R U' R) x'", "(R B' R F2) (R' B R F2) R2"], { en: 'Headlights on the back with a bar; corners cycle anticlockwise.', ja: '奥にヘッドライトとバー。コーナーが反時計回りに回る。' }),
  pll('e', 'E-Perm', 'Corners Only', ["x' (R U' R' D) (R U R' D') (R U R' D) (R U' R' D') x", "R2 U R' U' y R U R' U' R U R' U' R U R' y' R U' R2", "x' (R U' R') D (R U R') u2 (R' U R) D (R' U' R) x"], { en: 'No headlights anywhere; diagonal corner pairs swap on both sides.', ja: 'ヘッドライトなし。両側で対角のコーナーが入れ替わる。' }),
  // Adjacent corner swap
  pll('t', 'T-Perm', 'Adjacent Swap', ["(R U R' U') R' F R2 U' R' U' (R U R' F')"], { en: 'Headlights on one side, opposite side shows a 3-colour pattern with a bar to the left.', ja: '片側にヘッドライト、反対側は左にバーのある3色パターン。' }),
  pll('f', 'F-Perm', 'Adjacent Swap', ["R' U' F' (R U R' U') R' F R2 U' R' U' (R U R' U R)", "(R' U R U') R2 (F' U' F U) (R F R' F') R2 U'"], { en: 'Headlights on one side with a solid 3-sticker bar opposite.', ja: '片側にヘッドライト、反対側に3枚そろったバー。' }),
  pll('ja', 'Ja-Perm', 'Adjacent Swap', ["x R2 F R F' R U2 r' U r U2 x'", "(R' U L' U2) (R U' R' U2) R L", "(L' U' L F) (L' U' L U) L F' L2 U L"], { en: 'Solid 2x3 block on the left; bar + headlights.', ja: '左に2×3ブロック。バー＋ヘッドライト。' }),
  pll('jb', 'Jb-Perm', 'Adjacent Swap', ["(R U R' F') (R U R' U') R' F R2 U' R' U'", "(R U R' F') (R U R' U') R' F R2 U' R'"], { en: 'Solid 2x3 block on the right; bar + headlights.', ja: '右に2×3ブロック。バー＋ヘッドライト。' }),
  pll('ra', 'Ra-Perm', 'Adjacent Swap', ["(R U' R' U') (R U R D) (R' U' R D') (R' U2 R')", "(R U R' F') (R U2 R' U2) (R' F R U) (R U2 R')", "(L U2 L' U2) L F' (L' U' L U) L F L2"], { en: 'Headlights on the left with an outer bar on the front.', ja: '左にヘッドライト、手前の外側にバー。' }),
  pll('rb', 'Rb-Perm', 'Adjacent Swap', ["R2 F (R U R U') R' F' R U2 R' U2 R", "(R' U2 R U2) R' F (R U R' U') R' F' R2"], { en: 'Headlights on the right with an outer bar on the front.', ja: '右にヘッドライト、手前の外側にバー。' }),
  // Diagonal corner swap
  pll('v', 'V-Perm', 'Diagonal Swap', ["(R' U R' U') y (R' F' R2 U') (R' U R' F) R F y'", "(R' U R' d') (R' F' R2 U') (R' U R' F) R F"], { en: 'A 2x2 block and a diagonal corner swap; no headlights.', ja: '2×2ブロックと対角コーナー交換。ヘッドライトなし。' }),
  pll('y', 'Y-Perm', 'Diagonal Swap', ["F (R U' R' U') (R U R' F') (R U R' U') (R' F R F')", "(R2 U' R2 U' R2 U) (R' F' R U R2 U') (R' F R)"], { en: 'Two 1x2 blocks forming a V; diagonal corners swap.', ja: '2つの1×2ブロックがV字を作る。対角コーナーが交換。' }),
  pll('na', 'Na-Perm', 'Diagonal Swap', ["(R U R' U) (R U R' F') (R U R' U') (R' F R2 U') R' U2 (R U' R')", "(L U' R U2 L' U R') (L U' R U2 L' U R') U"], { en: 'Two opposite 1x2 bars, staircase pattern on the left.', ja: '向かい合う1×2バーが2つ。左側に階段模様。' }),
  pll('nb', 'Nb-Perm', 'Diagonal Swap', ["(R' U R U') (R' F' U' F) (R U R' F) R' F' (R U' R)", "(R' U L' U2 R U' L) (R' U L' U2 R U' L) U'"], { en: 'Two opposite 1x2 bars, staircase pattern on the right.', ja: '向かい合う1×2バーが2つ。右側に階段模様。' }),
  // G perms
  pll('ga', 'Ga-Perm', 'G Perms', ["R2 (U R' U R' U' R U') R2 (U' D) (R' U R D')", "R2 u R' U R' U' R u' R2 (y' R' U R)"], { en: 'Headlights on the left, solid 1x2 block on the right.', ja: '左にヘッドライト、右に1×2ブロック。' }),
  pll('gb', 'Gb-Perm', 'G Perms', ["(R' U' R U) (D' R2 U R' U R U' R U' R2) D", "(R' U' R) y R2 u R' U R U' R u' R2", "R' d' F R2 u R' U R U' R u' R2"], { en: 'Headlights with a solid 1x2 block above them (on the left).', ja: 'ヘッドライトの上に1×2ブロック（左側）。' }),
  pll('gc', 'Gc-Perm', 'G Perms', ["R2 (U' R U' R U R' U) R2 (U D') (R U' R' D)", "R2 u' R U' R U R' u R2 (y R U' R')"], { en: 'Headlights on the right, solid 1x2 block on the left.', ja: '右にヘッドライト、左に1×2ブロック。' }),
  pll('gd', 'Gd-Perm', 'G Perms', ["(R U R' U') (D R2 U' R U' R' U R' U R2) D'", "(R U R') y' R2 u' R U' R' U R' u R2", "R U R' F2 D' L U' L' U L' D F2"], { en: 'Headlights with a solid 1x2 block above them (on the right).', ja: 'ヘッドライトの上に1×2ブロック（右側）。' }),
];
