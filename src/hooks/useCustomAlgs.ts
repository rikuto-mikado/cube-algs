import { useCallback } from 'react';
import { validateAlgorithm } from '../core/notation/validate';
import { isRecord, usePersistentState } from './usePersistentState';

/** User-saved alternative algorithms, keyed by case id. */
export type CustomAlgs = Readonly<Record<string, readonly string[]>>;

const KEY = 'cube-algs:custom-algs:v1';
export const MAX_CUSTOM_PER_CASE = 12;

export function normalizeAlgText(alg: string): string {
  return alg.trim().replace(/\s+/g, ' ');
}

function isCustomAlgs(v: unknown): v is CustomAlgs {
  return (
    isRecord(v) && Object.values(v).every((list) => Array.isArray(list) && list.every((a) => typeof a === 'string'))
  );
}

/**
 * Drops stored entries that are no longer valid notation (e.g. hand-edited or
 * corrupted storage) so they can never reach the parser/mirror at render time.
 */
export function sanitizeCustomAlgs(v: CustomAlgs): CustomAlgs {
  const out: Record<string, readonly string[]> = {};
  for (const [id, list] of Object.entries(v)) {
    const valid = list.filter((a) => validateAlgorithm(a).ok).slice(0, MAX_CUSTOM_PER_CASE);
    if (valid.length) out[id] = valid;
  }
  return out;
}

/** Adds `alg` to a case unless it duplicates an existing entry (built-in or custom). */
export function addCustomAlg(data: CustomAlgs, id: string, alg: string, builtIn: readonly string[] = []): CustomAlgs {
  const text = normalizeAlgText(alg);
  const existing = data[id] ?? [];
  const seen = new Set([...builtIn, ...existing].map(normalizeAlgText));
  if (text === '' || seen.has(text) || existing.length >= MAX_CUSTOM_PER_CASE) return data;
  return { ...data, [id]: [...existing, text] };
}

export function removeCustomAlg(data: CustomAlgs, id: string, alg: string): CustomAlgs {
  const existing = data[id];
  if (!existing) return data;
  const rest = existing.filter((a) => a !== alg);
  const next: Record<string, readonly string[]> = { ...data };
  if (rest.length === 0) delete next[id];
  else next[id] = rest;
  return next;
}

const EMPTY: readonly string[] = [];

export function useCustomAlgs() {
  const [data, setData] = usePersistentState<CustomAlgs>(KEY, {}, isCustomAlgs, (v) => sanitizeCustomAlgs(v as CustomAlgs));
  const get = useCallback((id: string): readonly string[] => data[id] ?? EMPTY, [data]);
  const add = useCallback(
    (id: string, alg: string, builtIn: readonly string[]) => setData((d) => addCustomAlg(d, id, alg, builtIn)),
    [setData],
  );
  const remove = useCallback((id: string, alg: string) => setData((d) => removeCustomAlg(d, id, alg)), [setData]);
  return { data, get, add, remove };
}

export type CustomAlgsApi = ReturnType<typeof useCustomAlgs>;
