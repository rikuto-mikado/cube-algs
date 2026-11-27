import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { MASK_COLOR } from './colors';

/** Geometry & materials shared by all 26 cubies (allocated once, never per frame). */
export const CUBIE_SIZE = 0.965;
const BODY_RADIUS = 0.075;
export const STICKER_SIZE = 0.8;
const STICKER_RADIUS = 0.13;
/** Distance from the cubie centre to the sticker plane. */
export const STICKER_OFFSET = CUBIE_SIZE / 2 + 0.0015;

export const bodyGeometry = new RoundedBoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE, 4, BODY_RADIUS);

/**
 * Dark satin plastic. A faint cool sheen lights up grazing angles so the
 * rounded cubie silhouettes separate from the dark backdrop from any viewpoint,
 * while the low-gloss clearcoat keeps highlights soft (no harsh glare).
 */
export const bodyMaterial = new THREE.MeshPhysicalMaterial({
  color: '#15161a',
  roughness: 0.4,
  metalness: 0,
  clearcoat: 0.4,
  clearcoatRoughness: 0.42,
  sheen: 0.55,
  sheenColor: new THREE.Color('#6f7a92'),
  sheenRoughness: 0.45,
  envMapIntensity: 1.15,
});

function roundedRectShape(size: number, radius: number): THREE.Shape {
  const h = size / 2;
  const s = new THREE.Shape();
  s.moveTo(-h + radius, -h);
  s.lineTo(h - radius, -h);
  s.quadraticCurveTo(h, -h, h, -h + radius);
  s.lineTo(h, h - radius);
  s.quadraticCurveTo(h, h, h - radius, h);
  s.lineTo(-h + radius, h);
  s.quadraticCurveTo(-h, h, -h, h - radius);
  s.lineTo(-h, -h + radius);
  s.quadraticCurveTo(-h, -h, -h + radius, -h);
  return s;
}

/** Thin bevelled tile so stickers catch a crisp highlight along their edges. */
export const stickerGeometry = (() => {
  const g = new THREE.ExtrudeGeometry(roundedRectShape(STICKER_SIZE - 0.03, STICKER_RADIUS), {
    depth: 0.004,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.015,
    bevelSegments: 2,
    curveSegments: 6,
  });
  g.translate(0, 0, -0.006);
  return g;
})();

const materialCache = new Map<string, THREE.MeshPhysicalMaterial>();

/** Glossy satin plastic for colours; flatter matte finish for masked stickers. */
export function stickerMaterial(color: string): THREE.MeshPhysicalMaterial {
  let m = materialCache.get(color);
  if (!m) {
    const masked = color === MASK_COLOR;
    m = new THREE.MeshPhysicalMaterial({
      color,
      roughness: masked ? 0.62 : 0.24,
      metalness: 0,
      clearcoat: masked ? 0.05 : 0.7,
      clearcoatRoughness: masked ? 0.6 : 0.18,
    });
    materialCache.set(color, m);
  }
  return m;
}
