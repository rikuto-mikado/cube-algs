import type { StringKey } from '../../i18n/strings';

export type CameraView = 'iso' | 'top' | 'front' | 'back' | 'left' | 'right';

/** Direction (from the cube centre) for each quick-view preset. */
export const CAMERA_VIEWS: Readonly<Record<CameraView, readonly [number, number, number]>> = {
  iso: [5.5, 4.8, 6.9],
  // a hair off the pole keeps the orbit well-defined; F ends up at the bottom of the screen
  top: [0, 1, 0.02],
  front: [0, 0.2, 1],
  back: [0, 0.2, -1],
  left: [-1, 0.2, 0],
  right: [1, 0.2, 0],
};

export const CAMERA_VIEW_ORDER: readonly CameraView[] = ['iso', 'top', 'front', 'right', 'back', 'left'];

/** Compact labels for narrow screens (face letters are universal notation). */
export const CAMERA_VIEW_SHORT: Readonly<Record<CameraView, string>> = {
  iso: '◇',
  top: 'U',
  front: 'F',
  back: 'B',
  left: 'L',
  right: 'R',
};

export const CAMERA_VIEW_LABEL: Readonly<Record<CameraView, StringKey>> = {
  iso: 'viewIso',
  top: 'viewTop',
  front: 'viewFront',
  back: 'viewBack',
  left: 'viewLeft',
  right: 'viewRight',
};

/** Camera distance that frames the cube on landscape-ish viewports. */
export const BASE_DISTANCE = 10;
/** Below this aspect ratio the camera pulls back so the cube still fits horizontally. */
export const FIT_ASPECT = 1.1;

/** Ideal camera distance for an aspect ratio: pull back (never widen the FOV) on narrow portrait screens. */
export function fitDistance(aspect: number): number {
  return BASE_DISTANCE * Math.max(1, FIT_ASPECT / Math.max(0.2, aspect));
}
