/**
 * Pure helpers for the recognition drill: seeded randomness, case picking and
 * AUF / y pre-rotation "twists" that present a case from a random angle.
 */

/** Returns a float in [0, 1). */
export type Rng = () => number;

export const AUF_MOVES = ['', 'U', "U'", 'U2'] as const;
export type AufMove = (typeof AUF_MOVES)[number];

export const Y_ROTATIONS = ['', 'y', "y'", 'y2'] as const;
export type YRotation = (typeof Y_ROTATIONS)[number];

/** Small, fast, seedable PRNG (mulberry32) — deterministic for tests and replays. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomItem<T>(items: readonly T[], rng: Rng): T {
  if (items.length === 0) throw new Error('randomItem: empty list');
  return items[Math.min(items.length - 1, Math.floor(rng() * items.length))];
}

/** Picks a random case, avoiding an immediate repeat of `previousId` when possible. */
export function pickDrillCase<T extends { readonly id: string }>(
  pool: readonly T[],
  rng: Rng,
  previousId?: string,
): T | undefined {
  if (pool.length === 0) return undefined;
  const candidates = pool.length > 1 ? pool.filter((c) => c.id !== previousId) : pool;
  return randomItem(candidates, rng);
}

export interface DrillTwist {
  /** U-layer adjustment the solver must make before the algorithm. */
  readonly auf: AufMove;
  /** Whole-cube rotation the solver must make first (the case is seen from another side). */
  readonly rotation: YRotation;
}

export const NO_TWIST: DrillTwist = { auf: '', rotation: '' };

export function randomTwist(rng: Rng, options: { readonly auf: boolean; readonly rotation: boolean }): DrillTwist {
  return {
    rotation: options.rotation ? randomItem(Y_ROTATIONS, rng) : '',
    auf: options.auf ? randomItem(AUF_MOVES, rng) : '',
  };
}

/**
 * The full solution played in the drill: `[rotation] [AUF] algorithm`.
 * Its inverse-rule setup shows the case from the twisted angle while the
 * cube is still held in the standard orientation.
 */
export function drillAlgorithm(alg: string, twist: DrillTwist): string {
  return [twist.rotation, twist.auf, alg].filter((s) => s !== '').join(' ');
}
