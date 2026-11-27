import { createContext, useContext } from 'react';
import type { Language, LocalizedText } from '../types';
import { categoryLabel, translate, type StringKey } from './strings';

export interface I18n {
  readonly lang: Language;
  readonly t: (key: StringKey, vars?: Readonly<Record<string, string | number>>) => string;
  /** Picks the current language from a localised data field. */
  readonly pick: (text: LocalizedText | undefined) => string | undefined;
  readonly category: (category: string) => string;
}

export function createI18n(lang: Language): I18n {
  return {
    lang,
    t: (key, vars) => translate(lang, key, vars),
    pick: (text) => text?.[lang] ?? text?.en,
    category: (c) => categoryLabel(c, lang),
  };
}

export const I18nContext = createContext<I18n>(createI18n('en'));

export function useI18n(): I18n {
  return useContext(I18nContext);
}
