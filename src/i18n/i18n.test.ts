import { describe, expect, it } from 'vitest';
import { ALL_CASES, categoriesOf } from '../data/algorithms';
import { STAGES } from '../types';
import { DICTIONARIES, categoryLabel, translate, type StringKey } from './strings';

describe('i18n', () => {
  it('has a Japanese string for every English key', () => {
    const en = Object.keys(DICTIONARIES.en).sort();
    expect(Object.keys(DICTIONARIES.ja).sort()).toEqual(en);
    for (const k of en) expect(DICTIONARIES.ja[k as StringKey].length, k).toBeGreaterThan(0);
  });

  it('fills placeholders', () => {
    expect(translate('en', 'jumpToMove', { n: 3 })).toBe('Jump to after move 3');
    expect(translate('ja', 'jumpToMove', { n: 3 })).toBe('3 手目の後へ移動');
  });

  it('localises every case category and recognition hint', () => {
    for (const s of STAGES) {
      for (const c of categoriesOf(s)) expect(categoryLabel(c, 'ja'), c).not.toBe(c);
    }
    for (const c of ALL_CASES) {
      if (c.recognition) {
        expect(c.recognition.en.length, c.id).toBeGreaterThan(0);
        expect(c.recognition.ja.length, c.id).toBeGreaterThan(0);
      }
    }
  });
});

describe('notation error messages', () => {
  it('are localised with a 1-based position', async () => {
    const { notationErrorText } = await import('./strings');
    const e = { code: 'unrecognised', token: 'Q', position: 4 };
    expect(notationErrorText('en', e)).toBe('Unrecognised move “Q” (at position 5)');
    expect(notationErrorText('ja', e)).toBe('認識できない手「Q」 (5 文字目)');
  });
});
