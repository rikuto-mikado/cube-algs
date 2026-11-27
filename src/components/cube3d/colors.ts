import type { Face } from '../../core/cube/faces';
import type { ColorSchemeId } from '../../types';

export interface ColorScheme {
  readonly label: string;
  readonly colors: Readonly<Record<Face, string>>;
}

/** Standard Western layout for CFOP practice: U = Yellow, D = White, F = Green, R = Red. */
export const COLOR_SCHEMES: Readonly<Record<ColorSchemeId, ColorScheme>> = {
  western: {
    label: 'Western',
    colors: { U: '#ffd21f', D: '#f4f5f0', F: '#00a651', B: '#1257d6', R: '#c8102e', L: '#ff6a13' },
  },
  highContrast: {
    label: 'High contrast',
    colors: { U: '#ffe600', D: '#ffffff', F: '#00c853', B: '#2962ff', R: '#d50000', L: '#ff9100' },
  },
};

/** Neutral muted grey used for masked stickers. */
export const MASK_COLOR = '#5d616b';
