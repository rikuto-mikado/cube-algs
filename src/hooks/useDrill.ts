import { useCallback, useMemo, useState } from 'react';
import { NO_TWIST, pickDrillCase, randomTwist, type DrillTwist, type Rng } from '../core/cube/drill';
import { STAGES, type AlgorithmCase, type LearningStatus, type Stage } from '../types';
import { isRecord, usePersistentState } from './usePersistentState';

export type DrillPool = 'all' | 'notMastered' | 'learning' | 'favourites';
export const DRILL_POOLS: readonly DrillPool[] = ['all', 'notMastered', 'learning', 'favourites'];

export interface DrillOptions {
  readonly stages: readonly Stage[];
  readonly pool: DrillPool;
  readonly randomAuf: boolean;
  readonly randomRotation: boolean;
}

export const DEFAULT_DRILL_OPTIONS: DrillOptions = {
  stages: ['PLL'],
  pool: 'all',
  randomAuf: true,
  randomRotation: false,
};

function isDrillOptions(v: unknown): v is DrillOptions {
  return (
    isRecord(v) &&
    Array.isArray(v.stages) &&
    v.stages.every((s) => STAGES.includes(s as Stage)) &&
    DRILL_POOLS.includes(v.pool as DrillPool) &&
    typeof v.randomAuf === 'boolean' &&
    typeof v.randomRotation === 'boolean'
  );
}

/** Cases eligible for the drill under the given options. */
export function filterDrillPool(
  cases: readonly AlgorithmCase[],
  options: DrillOptions,
  getStatus: (id: string) => LearningStatus,
  isFavourite: (id: string) => boolean,
): AlgorithmCase[] {
  return cases.filter((c) => {
    if (!options.stages.includes(c.stage)) return false;
    switch (options.pool) {
      case 'all':
        return true;
      case 'notMastered':
        return getStatus(c.id) !== 'mastered';
      case 'learning':
        return getStatus(c.id) === 'learning';
      case 'favourites':
        return isFavourite(c.id);
    }
  });
}

export interface DrillRound {
  readonly n: number;
  readonly caseId: string;
  readonly twist: DrillTwist;
  readonly revealed: boolean;
  readonly result: 'pending' | 'knew' | 'missed';
}

export interface DrillScore {
  readonly knew: number;
  readonly total: number;
}

export function nextDrillRound(
  pool: readonly AlgorithmCase[],
  options: DrillOptions,
  previous: DrillRound | null,
  rng: Rng = Math.random,
): DrillRound | null {
  const c = pickDrillCase(pool, rng, previous?.caseId);
  if (!c) return null;
  return {
    n: (previous?.n ?? 0) + 1,
    caseId: c.id,
    twist: options.randomAuf || options.randomRotation
      ? randomTwist(rng, { auf: options.randomAuf, rotation: options.randomRotation })
      : NO_TWIST,
    revealed: false,
    result: 'pending',
  };
}

export function useDrill(poolFor: (options: DrillOptions) => readonly AlgorithmCase[]) {
  const [options, setOptions] = usePersistentState<DrillOptions>(
    'cube-algs:drill:v1',
    DEFAULT_DRILL_OPTIONS,
    isDrillOptions,
  );
  const pool = useMemo(() => poolFor(options), [poolFor, options]);
  const [round, setRound] = useState<DrillRound | null>(null);
  const [score, setScore] = useState<DrillScore>({ knew: 0, total: 0 });

  const next = useCallback(() => setRound((r) => nextDrillRound(pool, options, r) ?? r), [pool, options]);
  const reveal = useCallback(() => setRound((r) => (r ? { ...r, revealed: true } : r)), []);
  const mark = useCallback(
    (result: 'knew' | 'missed') => {
      if (!round || round.result !== 'pending') return;
      setRound({ ...round, revealed: true, result });
      setScore((s) => ({ knew: s.knew + (result === 'knew' ? 1 : 0), total: s.total + 1 }));
    },
    [round],
  );
  const resetScore = useCallback(() => setScore({ knew: 0, total: 0 }), []);
  const updateOptions = useCallback(
    (patch: Partial<DrillOptions>) => setOptions((o) => ({ ...o, ...patch })),
    [setOptions],
  );

  return useMemo(
    () => ({ options, updateOptions, pool, round, score, next, reveal, mark, resetScore }),
    [options, updateOptions, pool, round, score, next, reveal, mark, resetScore],
  );
}

export type DrillApi = ReturnType<typeof useDrill>;
