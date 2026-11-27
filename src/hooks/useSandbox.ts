import { useCallback } from 'react';
import { MASK_MODES, type MaskMode } from '../core/cube/masking';
import { isRecord, usePersistentState } from './usePersistentState';

export type SandboxStart = 'setup' | 'solved';

export interface SandboxState {
  readonly text: string;
  readonly start: SandboxStart;
  readonly mask: MaskMode;
}

const DEFAULT_SANDBOX: SandboxState = { text: "(R U R' U') R' F R2 U' R' U' (R U R' F')", start: 'setup', mask: 'full' };

function isSandbox(v: unknown): v is SandboxState {
  return (
    isRecord(v) &&
    typeof v.text === 'string' &&
    (v.start === 'setup' || v.start === 'solved') &&
    MASK_MODES.includes(v.mask as MaskMode)
  );
}

export function useSandbox() {
  const [state, setState] = usePersistentState<SandboxState>('cube-algs:sandbox:v1', DEFAULT_SANDBOX, isSandbox);
  const update = useCallback((patch: Partial<SandboxState>) => setState((s) => ({ ...s, ...patch })), [setState]);
  return { state, update };
}
