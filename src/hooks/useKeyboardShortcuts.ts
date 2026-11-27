import { useEffect, useRef } from 'react';

export type ShortcutMap = Partial<Record<string, () => void>>;

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

/**
 * Global keyboard shortcuts keyed by `KeyboardEvent.key` (letters lower-cased).
 * Ignored while typing in form fields or when modifier keys are held.
 */
export function useKeyboardShortcuts(map: ShortcutMap): void {
  const ref = useRef(map);
  useEffect(() => {
    ref.current = map;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isEditable(e.target)) return;
      // let Enter activate a focused button/link natively
      if (e.key === 'Enter' && e.target instanceof HTMLElement && e.target.closest('button, a, [role="option"]')) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const handler = ref.current[key === ' ' ? 'Space' : key];
      if (!handler) return;
      // keep Space from "clicking" a focused button and arrows from scrolling
      e.preventDefault();
      handler();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
