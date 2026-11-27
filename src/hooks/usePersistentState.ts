import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

function read<T>(key: string, fallback: T, validate: (v: unknown) => v is T, migrate?: (v: unknown) => T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (!validate(parsed)) return fallback;
    return migrate ? migrate(parsed) : parsed;
  } catch {
    return fallback;
  }
}

/**
 * useState that mirrors its value into localStorage (fails soft when storage is unavailable).
 * `migrate` can repair/upgrade a stored value that passed `validate`.
 */
export function usePersistentState<T>(
  key: string,
  fallback: T,
  validate: (v: unknown) => v is T,
  migrate?: (v: unknown) => T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => read(key, fallback, validate, migrate));
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage full or blocked — keep working in memory
    }
  }, [key, value]);
  return [value, setValue];
}

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
