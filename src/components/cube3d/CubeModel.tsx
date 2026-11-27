import { useFrame } from '@react-three/fiber';
import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { FACE_NORMALS, faceFromNormal, type Face } from '../../core/cube/faces';
import { isStickerVisible, type MaskMode } from '../../core/cube/masking';
import type { F2LSlot } from '../../core/cube/slots';
import { MOVE_GEOMETRY, isInMoveLayer, signedQuarterTurns } from '../../core/cube/moves';
import { homeNormals, type CubeState } from '../../core/cube/state';
import type { Vec3 } from '../../core/cube/math';
import type { Move } from '../../core/notation/types';
import { COLOR_SCHEMES, MASK_COLOR } from './colors';
import { bodyGeometry, bodyMaterial, STICKER_OFFSET, stickerGeometry, stickerMaterial } from './resources';
import type { ColorSchemeId } from '../../types';

export interface CubeAnimation {
  readonly id: number;
  readonly move: Move;
  readonly from: CubeState;
  readonly to: CubeState;
  /** Seconds. */
  readonly duration: number;
  /** Seconds to hold still before turning (playback cadence beat). */
  readonly delay?: number;
}

interface CubeModelProps {
  readonly state: CubeState;
  readonly animation: CubeAnimation | null;
  readonly onAnimationComplete: (id: number) => void;
  readonly maskMode: MaskMode;
  readonly focusSlot: F2LSlot;
  readonly colorScheme: ColorSchemeId;
}

interface RestTransforms {
  readonly positions: THREE.Vector3[];
  readonly quaternions: THREE.Quaternion[];
}

const tmpMatrix = new THREE.Matrix4();

/** Resting transforms derived exclusively from the authoritative logical state. */
function restTransforms(state: CubeState): RestTransforms {
  const positions: THREE.Vector3[] = [];
  const quaternions: THREE.Quaternion[] = [];
  for (const c of state.cubies) {
    const r = c.rot;
    tmpMatrix.set(r[0], r[1], r[2], 0, r[3], r[4], r[5], 0, r[6], r[7], r[8], 0, 0, 0, 0, 1);
    positions[c.id] = new THREE.Vector3(c.pos[0], c.pos[1], c.pos[2]);
    quaternions[c.id] = new THREE.Quaternion().setFromRotationMatrix(tmpMatrix);
  }
  return { positions, quaternions };
}

function applyRest(groups: (THREE.Group | null)[], rest: RestTransforms) {
  groups.forEach((g, id) => {
    if (!g) return;
    g.position.copy(rest.positions[id]);
    g.quaternion.copy(rest.quaternions[id]);
  });
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const AXIS_VECTORS = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
} as const;

const STICKER_ROTATIONS: Readonly<Record<Face, THREE.Euler>> = {
  F: new THREE.Euler(0, 0, 0),
  B: new THREE.Euler(0, Math.PI, 0),
  R: new THREE.Euler(0, Math.PI / 2, 0),
  L: new THREE.Euler(0, -Math.PI / 2, 0),
  U: new THREE.Euler(-Math.PI / 2, 0, 0),
  D: new THREE.Euler(Math.PI / 2, 0, 0),
};

interface CubieProps {
  readonly home: Vec3;
  readonly maskMode: MaskMode;
  readonly focusSlot: F2LSlot;
  readonly colorScheme: ColorSchemeId;
  /** Stable per-cubie ref callback (created once, never re-bound on render). */
  readonly groupRef: (g: THREE.Group | null) => void;
}

/** One cubie: dark rounded body plus stickers in its *home* frame (they travel with the piece). */
const Cubie = memo(function Cubie({ home, maskMode, focusSlot, colorScheme, groupRef }: CubieProps) {
  const stickers = useMemo(
    () =>
      homeNormals(home).map((n) => {
        const face = faceFromNormal(n);
        const color = isStickerVisible(maskMode, home, face, focusSlot)
          ? COLOR_SCHEMES[colorScheme].colors[face]
          : MASK_COLOR;
        const fn = FACE_NORMALS[face];
        return {
          face,
          material: stickerMaterial(color),
          position: [fn[0] * STICKER_OFFSET, fn[1] * STICKER_OFFSET, fn[2] * STICKER_OFFSET] as const,
        };
      }),
    [home, maskMode, focusSlot, colorScheme],
  );
  return (
    <group ref={groupRef}>
      <mesh geometry={bodyGeometry} material={bodyMaterial} />
      {stickers.map((s) => (
        <mesh
          key={s.face}
          geometry={stickerGeometry}
          material={s.material}
          position={s.position}
          rotation={STICKER_ROTATIONS[s.face]}
        />
      ))}
    </group>
  );
});

const CUBIE_COUNT = 26;

export function CubeModel({ state, animation, onAnimationComplete, maskMode, focusSlot, colorScheme }: CubeModelProps) {
  const groups = useRef<(THREE.Group | null)[]>([]);
  // One stable callback per cubie id: React never detaches/re-attaches refs on re-render.
  const [groupRefs] = useState(() =>
    Array.from({ length: CUBIE_COUNT }, (_, id) => (g: THREE.Group | null) => {
      groups.current[id] = g;
    }),
  );

  const displayed = animation ? animation.from : state;
  const rest = useMemo(() => restTransforms(displayed), [displayed]);
  const endRest = useMemo(() => (animation ? restTransforms(animation.to) : null), [animation]);

  const anim = useMemo(() => {
    if (!animation) return null;
    const g = MOVE_GEOMETRY[animation.move.base];
    const active = animation.from.cubies.filter((c) => isInMoveLayer(animation.move, c.pos)).map((c) => c.id);
    return {
      id: animation.id,
      axis: AXIS_VECTORS[g.axis],
      angle: (signedQuarterTurns(animation.move) * Math.PI) / 2,
      active,
      duration: Math.max(0.05, animation.duration),
      delay: Math.max(0, animation.delay ?? 0),
    };
  }, [animation]);

  const timing = useRef<{ id: number; start: number; completed: boolean } | null>(null);
  const q = useRef(new THREE.Quaternion());

  useLayoutEffect(() => {
    applyRest(groups.current, rest);
  }, [rest]);

  useFrame(({ clock }) => {
    if (!anim) return;
    const now = clock.getElapsedTime();
    if (!timing.current || timing.current.id !== anim.id) {
      timing.current = { id: anim.id, start: now, completed: false };
    }
    const t = timing.current;
    if (t.completed) return;
    const elapsed = now - t.start - anim.delay;
    if (elapsed < 0) return; // cadence beat: hold the resting pose
    const progress = Math.min(1, elapsed / anim.duration);
    if (progress >= 1) {
      t.completed = true;
      if (endRest) applyRest(groups.current, endRest);
      onAnimationComplete(anim.id);
      return;
    }
    q.current.setFromAxisAngle(anim.axis, anim.angle * easeInOutCubic(progress));
    for (const id of anim.active) {
      const g = groups.current[id];
      if (!g) continue;
      g.position.copy(rest.positions[id]).applyQuaternion(q.current);
      g.quaternion.copy(q.current).multiply(rest.quaternions[id]);
    }
  });

  return (
    <group>
      {state.cubies.map((c) => (
        <Cubie
          key={c.id}
          home={c.home}
          maskMode={maskMode}
          focusSlot={focusSlot}
          colorScheme={colorScheme}
          groupRef={groupRefs[c.id]}
        />
      ))}
    </group>
  );
}
