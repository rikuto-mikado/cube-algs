import type { Vec3 } from './math';

export type F2LSlot = 'FR' | 'FL' | 'BR' | 'BL';

export const F2L_SLOT_NAMES: readonly F2LSlot[] = ['FR', 'FL', 'BR', 'BL'];

/** Home positions of each F2L slot's corner and edge. */
export const F2L_SLOTS: Readonly<Record<F2LSlot, { corner: Vec3; edge: Vec3 }>> = {
  FR: { corner: [1, -1, 1], edge: [1, 0, 1] },
  FL: { corner: [-1, -1, 1], edge: [-1, 0, 1] },
  BR: { corner: [1, -1, -1], edge: [1, 0, -1] },
  BL: { corner: [-1, -1, -1], edge: [-1, 0, -1] },
};
