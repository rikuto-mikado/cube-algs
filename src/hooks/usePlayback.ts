import { useCallback, useEffect, useMemo, useReducer } from 'react';

export interface StepAnimation {
  readonly id: number;
  /** Step the animation starts from. */
  readonly from: number;
  /** +1 plays move `from` forward, -1 undoes move `from - 1`. */
  readonly direction: 1 | -1;
}

export interface PlayerState {
  readonly key: string;
  readonly total: number;
  readonly step: number;
  readonly playing: boolean;
  readonly anim: StepAnimation | null;
  readonly nextId: number;
}

export type PlaybackAction =
  | { type: 'load'; key: string; total: number }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'animDone'; id: number }
  | { type: 'loopRestart' }
  | { type: 'stepForward' }
  | { type: 'stepBack' }
  | { type: 'jump'; step: number };

function startForward(s: PlayerState, from: number): PlayerState {
  return { ...s, step: from, anim: { id: s.nextId, from, direction: 1 }, nextId: s.nextId + 1 };
}

/** Instantly completes any running animation and returns the resulting state. */
function settle(s: PlayerState): PlayerState {
  if (!s.anim) return s;
  return { ...s, step: s.anim.from + s.anim.direction, anim: null };
}

export function playbackReducer(s: PlayerState, a: PlaybackAction): PlayerState {
  switch (a.type) {
    case 'load':
      return { ...s, key: a.key, total: a.total, step: 0, playing: false, anim: null };
    case 'play': {
      if (s.total === 0) return s;
      const base = s.anim ? s : s.step >= s.total ? { ...s, step: 0 } : s;
      const playing = { ...base, playing: true };
      return playing.anim ? playing : startForward(playing, playing.step);
    }
    case 'pause':
      // let the current quarter-turn finish so the cube never stops mid-move
      return { ...s, playing: false };
    case 'animDone': {
      if (!s.anim || s.anim.id !== a.id) return s;
      const done = settle(s);
      if (!done.playing) return done;
      if (done.step < done.total) return startForward(done, done.step);
      return done; // at the end: loop restart is scheduled by an effect, otherwise stop below
    }
    case 'loopRestart':
      if (!s.playing || s.anim || s.step < s.total) return s;
      return startForward(s, 0);
    case 'stepForward': {
      const b = { ...settle(s), playing: false };
      return b.step < b.total ? { ...b, anim: { id: b.nextId, from: b.step, direction: 1 }, nextId: b.nextId + 1 } : b;
    }
    case 'stepBack': {
      const b = { ...settle(s), playing: false };
      return b.step > 0 ? { ...b, anim: { id: b.nextId, from: b.step, direction: -1 }, nextId: b.nextId + 1 } : b;
    }
    case 'jump':
      return { ...s, playing: false, anim: null, step: Math.max(0, Math.min(s.total, a.step)) };
  }
}

/**
 * Step-based playback controller. React state only changes on step
 * transitions; per-frame interpolation lives in the renderer.
 */
export function usePlayback(key: string, total: number, loop: boolean) {
  const [state, dispatch] = useReducer(playbackReducer, { key, total, step: 0, playing: false, anim: null, nextId: 1 });

  // Reset when a different algorithm is loaded (adjusting state during render).
  if (state.key !== key || state.total !== total) dispatch({ type: 'load', key, total });

  const atEndWhilePlaying = state.playing && !state.anim && state.step >= state.total;
  useEffect(() => {
    if (!atEndWhilePlaying) return;
    if (!loop) {
      dispatch({ type: 'pause' });
      return;
    }
    const t = window.setTimeout(() => dispatch({ type: 'loopRestart' }), 800);
    return () => window.clearTimeout(t);
  }, [atEndWhilePlaying, loop]);

  const actions = useMemo(
    () => ({
      play: () => dispatch({ type: 'play' }),
      pause: () => dispatch({ type: 'pause' }),
      stepForward: () => dispatch({ type: 'stepForward' }),
      stepBack: () => dispatch({ type: 'stepBack' }),
      jump: (step: number) => dispatch({ type: 'jump', step }),
      reset: () => dispatch({ type: 'jump', step: 0 }),
      toEnd: () => dispatch({ type: 'jump', step: Number.MAX_SAFE_INTEGER }),
      animationDone: (id: number) => dispatch({ type: 'animDone', id }),
    }),
    [],
  );

  const toggle = useCallback(() => {
    if (state.playing) actions.pause();
    else actions.play();
  }, [state.playing, actions]);

  // When the key changed this render, report the freshly-loaded values.
  const fresh = state.key === key && state.total === total;
  return {
    step: fresh ? state.step : 0,
    playing: fresh ? state.playing : false,
    anim: fresh ? state.anim : null,
    total,
    ...actions,
    toggle,
  };
}

export type Playback = ReturnType<typeof usePlayback>;
