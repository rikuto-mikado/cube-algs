import { describe, expect, it } from 'vitest';
import { seededRng } from '../core/cube/drill';
import { ALL_CASES } from '../data/algorithms';
import type { LearningStatus } from '../types';
import { addCustomAlg, MAX_CUSTOM_PER_CASE, normalizeAlgText, removeCustomAlg, sanitizeCustomAlgs } from './useCustomAlgs';
import { DEFAULT_DRILL_OPTIONS, filterDrillPool, nextDrillRound } from './useDrill';
import { DEFAULT_PREFERENCES, sanitizePreferences } from './usePreferences';
import { isProgress } from './useProgress';

describe('sanitizePreferences', () => {
  it('keeps valid stored fields and fills new ones from defaults', () => {
    const old = { speed: 1.5, loop: true, showAllColors: true, showDiagram: false, colorScheme: 'highContrast' };
    expect(sanitizePreferences(old)).toEqual({
      ...DEFAULT_PREFERENCES,
      speed: 1.5,
      loop: true,
      showAllColors: true,
      showDiagram: false,
      colorScheme: 'highContrast',
    });
  });

  it('drops invalid values', () => {
    const p = sanitizePreferences({ speed: 99, language: 'fr', cadence: 'jazz', mirror: 'yes', diagramSource: 'live' });
    expect(p.speed).toBe(DEFAULT_PREFERENCES.speed);
    expect(p.language).toBe(DEFAULT_PREFERENCES.language);
    expect(p.cadence).toBe('smooth');
    expect(p.mirror).toBe(false);
    expect(p.diagramSource).toBe('live');
    expect(sanitizePreferences(null)).toEqual(DEFAULT_PREFERENCES);
  });
});

describe('custom algorithms store', () => {
  it('adds normalised algorithms and rejects duplicates', () => {
    let d = addCustomAlg({}, 'oll-27', "  R U R'   U R U2 R'  ", ["R U R' U R U2 R'"]);
    expect(d).toEqual({});
    d = addCustomAlg(d, 'oll-27', "y' R'  U2 R U R' U R", ["R U R' U R U2 R'"]);
    expect(d['oll-27']).toEqual(["y' R' U2 R U R' U R"]);
    expect(addCustomAlg(d, 'oll-27', "y' R' U2 R U R' U R")).toBe(d);
    expect(addCustomAlg(d, 'oll-27', '   ')).toBe(d);
  });

  it('removes algorithms and drops empty entries', () => {
    const d = addCustomAlg({}, 'pll-t', 'R U');
    expect(removeCustomAlg(d, 'pll-t', 'R U')).toEqual({});
    expect(removeCustomAlg(d, 'pll-x', 'R U')).toBe(d);
  });

  it('caps the number per case', () => {
    let d = {};
    for (let i = 0; i < MAX_CUSTOM_PER_CASE + 5; i++) d = addCustomAlg(d, 'x', `R${' U'.repeat(i)}`);
    expect((d as Record<string, string[]>).x).toHaveLength(MAX_CUSTOM_PER_CASE);
  });

  it('normalises whitespace', () => {
    expect(normalizeAlgText("  R\tU\n R' ")).toBe("R U R'");
  });
});

describe('drill pool & rounds', () => {
  const status: Record<string, LearningStatus> = { 'pll-t': 'mastered', 'pll-ua': 'learning' };
  const getStatus = (id: string) => status[id] ?? 'unseen';
  const fav = (id: string) => id === 'oll-27';

  it('filters by stage and pool', () => {
    const opts = DEFAULT_DRILL_OPTIONS;
    expect(filterDrillPool(ALL_CASES, { ...opts, stages: ['PLL'], pool: 'all' }, getStatus, fav)).toHaveLength(21);
    expect(filterDrillPool(ALL_CASES, { ...opts, stages: ['PLL'], pool: 'notMastered' }, getStatus, fav)).toHaveLength(20);
    expect(filterDrillPool(ALL_CASES, { ...opts, stages: ['PLL'], pool: 'learning' }, getStatus, fav).map((c) => c.id)).toEqual(['pll-ua']);
    expect(filterDrillPool(ALL_CASES, { ...opts, stages: ['OLL', 'PLL'], pool: 'favourites' }, getStatus, fav).map((c) => c.id)).toEqual(['oll-27']);
    expect(filterDrillPool(ALL_CASES, { ...opts, stages: [] }, getStatus, fav)).toHaveLength(0);
  });

  it('creates numbered rounds without immediate repeats', () => {
    const rng = seededRng(9);
    const pool = ALL_CASES.filter((c) => c.stage === 'PLL');
    let r = nextDrillRound(pool, { ...DEFAULT_DRILL_OPTIONS, randomAuf: false }, null, rng);
    expect(r).toMatchObject({ n: 1, revealed: false, result: 'pending', twist: { auf: '', rotation: '' } });
    for (let i = 2; i < 30; i++) {
      const next = nextDrillRound(pool, DEFAULT_DRILL_OPTIONS, r, rng);
      expect(next?.n).toBe(i);
      expect(next?.caseId).not.toBe(r?.caseId);
      r = next;
    }
    expect(nextDrillRound([], DEFAULT_DRILL_OPTIONS, r, rng)).toBeNull();
  });
});

describe('corrupted storage hardening', () => {
  it('drops custom algorithms that are not valid notation', () => {
    const clean = sanitizeCustomAlgs({ a: ["R U R' U'", 'R Qx', ''], b: ['(R U'] });
    expect(clean).toEqual({ a: ["R U R' U'"] });
  });

  it('caps custom algorithms per case', () => {
    const many = Array.from({ length: MAX_CUSTOM_PER_CASE + 5 }, () => 'R U');
    expect(sanitizeCustomAlgs({ a: many }).a).toHaveLength(MAX_CUSTOM_PER_CASE);
  });

  it('rejects negative or fractional preferred algorithm indices', () => {
    const base = { status: {}, bookmarks: [] };
    expect(isProgress({ ...base, preferredAlg: { x: 1 } })).toBe(true);
    expect(isProgress({ ...base, preferredAlg: { x: -1 } })).toBe(false);
    expect(isProgress({ ...base, preferredAlg: { x: 0.5 } })).toBe(false);
  });
});
