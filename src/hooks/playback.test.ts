import { describe, expect, it } from 'vitest';
import { playbackReducer, type PlayerState } from './usePlayback';

const init = (total = 3): PlayerState => ({ key: 'a', total, step: 0, playing: false, anim: null, nextId: 1 });

describe('playback reducer', () => {
  it('plays through every move then stops', () => {
    let s = playbackReducer(init(2), { type: 'play' });
    expect(s.anim).toMatchObject({ from: 0, direction: 1 });
    s = playbackReducer(s, { type: 'animDone', id: s.anim!.id });
    expect(s.step).toBe(1);
    expect(s.anim).toMatchObject({ from: 1, direction: 1 });
    s = playbackReducer(s, { type: 'animDone', id: s.anim!.id });
    expect(s.step).toBe(2);
    expect(s.anim).toBeNull();
  });

  it('ignores stale animation completions', () => {
    const s = playbackReducer(init(), { type: 'stepForward' });
    expect(playbackReducer(s, { type: 'animDone', id: 999 })).toBe(s);
  });

  it('stepping settles a running animation first', () => {
    let s = playbackReducer(init(), { type: 'stepForward' });
    s = playbackReducer(s, { type: 'stepForward' });
    expect(s.step).toBe(1);
    expect(s.anim).toMatchObject({ from: 1, direction: 1 });
    s = playbackReducer(s, { type: 'stepBack' });
    expect(s.step).toBe(2);
    expect(s.anim).toMatchObject({ from: 2, direction: -1 });
  });

  it('jump clamps and cancels animation', () => {
    let s = playbackReducer(init(), { type: 'play' });
    s = playbackReducer(s, { type: 'jump', step: 99 });
    expect(s).toMatchObject({ step: 3, anim: null, playing: false });
  });

  it('play at the end restarts from the setup state', () => {
    const s = playbackReducer({ ...init(), step: 3 }, { type: 'play' });
    expect(s.step).toBe(0);
    expect(s.anim).toMatchObject({ from: 0 });
  });

  it('loop restart only fires while playing at the end', () => {
    const atEnd = { ...init(), step: 3, playing: true };
    expect(playbackReducer(atEnd, { type: 'loopRestart' }).anim).toMatchObject({ from: 0 });
    expect(playbackReducer({ ...atEnd, playing: false }, { type: 'loopRestart' }).anim).toBeNull();
  });
});
