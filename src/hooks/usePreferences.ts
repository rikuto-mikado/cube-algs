import { useCallback } from 'react';
import { LANGUAGES, type Language, type PlaybackPreferences } from '../types';
import { isRecord, usePersistentState } from './usePersistentState';

export const SPEED_MIN = 0.5;
export const SPEED_MAX = 2.5;

function defaultLanguage(): Language {
  try {
    return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'en';
  } catch {
    return 'en';
  }
}

/** Phones (narrow, or short in landscape) start with the canvas diagram collapsed. */
function defaultShowDiagram(): boolean {
  try {
    return typeof window === 'undefined' || (window.innerWidth >= 640 && window.innerHeight > 500);
  } catch {
    return true;
  }
}

export const DEFAULT_PREFERENCES: PlaybackPreferences = {
  speed: 1,
  loop: false,
  cadence: 'smooth',
  showAllColors: false,
  f2lFocus: false,
  mirror: false,
  showDiagram: true,
  diagramSource: 'setup',
  colorScheme: 'western',
  language: 'en',
};

const oneOf =
  <T,>(values: readonly T[]) =>
  (v: unknown): v is T =>
    values.includes(v as T);
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const isSpeed = (v: unknown): v is number => typeof v === 'number' && v >= SPEED_MIN && v <= SPEED_MAX;

const FIELD_VALIDATORS: { readonly [K in keyof PlaybackPreferences]: (v: unknown) => v is PlaybackPreferences[K] } = {
  speed: isSpeed,
  loop: isBool,
  cadence: oneOf(['smooth', 'cadence'] as const),
  showAllColors: isBool,
  f2lFocus: isBool,
  mirror: isBool,
  showDiagram: isBool,
  diagramSource: oneOf(['setup', 'live'] as const),
  colorScheme: oneOf(['western', 'highContrast'] as const),
  language: oneOf(LANGUAGES),
};

/**
 * Field-by-field sanitiser: keeps every valid stored value and falls back to
 * defaults for missing/invalid ones, so adding preferences never wipes old ones.
 */
export function sanitizePreferences(v: unknown, defaults: PlaybackPreferences = DEFAULT_PREFERENCES): PlaybackPreferences {
  if (!isRecord(v)) return defaults;
  const out: Record<string, unknown> = { ...defaults };
  for (const key of Object.keys(FIELD_VALIDATORS) as (keyof PlaybackPreferences)[]) {
    if (FIELD_VALIDATORS[key](v[key])) out[key] = v[key];
  }
  return out as unknown as PlaybackPreferences;
}

const KEY = 'cube-algs:prefs:v1';

export function usePreferences() {
  const [prefs, setPrefs] = usePersistentState<PlaybackPreferences>(
    KEY,
    { ...DEFAULT_PREFERENCES, language: defaultLanguage(), showDiagram: defaultShowDiagram() },
    (v): v is PlaybackPreferences => isRecord(v),
    (v) => sanitizePreferences(v, { ...DEFAULT_PREFERENCES, language: defaultLanguage(), showDiagram: defaultShowDiagram() }),
  );
  const update = useCallback(
    (patch: Partial<PlaybackPreferences>) => setPrefs((p) => ({ ...p, ...patch })),
    [setPrefs],
  );
  return { prefs, update };
}
