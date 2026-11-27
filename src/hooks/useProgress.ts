import { useCallback, useMemo } from 'react';
import type { LearningStatus } from '../types';
import { isRecord, usePersistentState } from './usePersistentState';

export interface ProgressData {
  readonly status: Readonly<Record<string, LearningStatus>>;
  readonly bookmarks: readonly string[];
  readonly preferredAlg: Readonly<Record<string, number>>;
}

const EMPTY: ProgressData = { status: {}, bookmarks: [], preferredAlg: {} };
const STATUSES: readonly LearningStatus[] = ['unseen', 'learning', 'mastered'];

export function isProgress(v: unknown): v is ProgressData {
  if (!isRecord(v) || !isRecord(v.status) || !isRecord(v.preferredAlg) || !Array.isArray(v.bookmarks))
    return false;
  return (
    Object.values(v.status).every((s) => STATUSES.includes(s as LearningStatus)) &&
    Object.values(v.preferredAlg).every((n) => Number.isInteger(n) && (n as number) >= 0) &&
    v.bookmarks.every((b) => typeof b === 'string')
  );
}

export function useProgress() {
  const [data, setData] = usePersistentState<ProgressData>('cube-algs:progress:v1', EMPTY, isProgress);

  const getStatus = useCallback((id: string): LearningStatus => data.status[id] ?? 'unseen', [data]);
  const setStatus = useCallback(
    (id: string, status: LearningStatus) =>
      setData((d) => ({ ...d, status: { ...d.status, [id]: status } })),
    [setData],
  );
  const bookmarkSet = useMemo(() => new Set(data.bookmarks), [data.bookmarks]);
  const toggleBookmark = useCallback(
    (id: string) =>
      setData((d) => ({
        ...d,
        bookmarks: d.bookmarks.includes(id) ? d.bookmarks.filter((b) => b !== id) : [...d.bookmarks, id],
      })),
    [setData],
  );
  const getPreferredAlg = useCallback((id: string) => Math.max(0, data.preferredAlg[id] ?? 0), [data]);
  const setPreferredAlg = useCallback(
    (id: string, index: number) =>
      setData((d) => ({ ...d, preferredAlg: { ...d.preferredAlg, [id]: index } })),
    [setData],
  );
  const reset = useCallback(() => setData(EMPTY), [setData]);

  return { getStatus, setStatus, bookmarks: bookmarkSet, toggleBookmark, getPreferredAlg, setPreferredAlg, reset };
}

export type ProgressApi = ReturnType<typeof useProgress>;
