import { F2L_SLOTS, type F2LSlot } from './slots';
import type { Face } from './faces';
import { vecEquals, type Vec3 } from './math';
import { cubieKind } from './state';

/**
 * - f2l:      cross, solved slots and the target pair in colour; last layer grey.
 * - f2l-slot: focused F2L — only the cross and the target slot's corner + edge in colour.
 * - oll:      F2L in colour; last-layer pieces only show their U sticker.
 * - pll/full: everything visible.
 */
export type MaskMode = 'f2l' | 'f2l-slot' | 'oll' | 'pll' | 'full';

export const MASK_MODES: readonly MaskMode[] = ['f2l', 'f2l-slot', 'oll', 'pll', 'full'];

/**
 * Decides whether a sticker is shown in colour for a given study stage.
 * Masking is keyed to the sticker's *identity* (home cubie + home face), so it
 * travels with the piece while it moves.
 *
 * `focusSlot` selects the target pair for `f2l-slot` (FR by default; FL for
 * mirrored algorithms).
 */
export function isStickerVisible(mode: MaskMode, home: Vec3, homeFace: Face, focusSlot: F2LSlot = 'FR'): boolean {
  if (mode === 'pll' || mode === 'full') return true;
  const kind = cubieKind(home);
  if (kind === 'center') return true;
  if (mode === 'f2l-slot') {
    const slot = F2L_SLOTS[focusSlot];
    if (vecEquals(home, slot.corner) || vecEquals(home, slot.edge)) return true;
    return home[1] === -1 && kind === 'edge';
  }
  if (home[1] !== 1) return true;
  if (mode === 'f2l') return false;
  return homeFace === 'U';
}
