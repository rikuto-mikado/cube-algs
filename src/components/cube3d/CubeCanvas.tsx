import { ContactShadows, Environment, Lightformer, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { MaskMode } from '../../core/cube/masking';
import type { F2LSlot } from '../../core/cube/slots';
import type { CubeState } from '../../core/cube/state';
import type { ColorSchemeId } from '../../types';
import { CubeModel, type CubeAnimation } from './CubeModel';
import { BASE_DISTANCE, CAMERA_VIEWS, fitDistance, type CameraView } from './cameraViews';

export interface CameraRequest {
  /** Increment to trigger a new flight (also re-flies to the same view). */
  readonly id: number;
  readonly view: CameraView;
}

interface CubeCanvasProps {
  readonly state: CubeState;
  readonly animation: CubeAnimation | null;
  readonly onAnimationComplete: (id: number) => void;
  readonly maskMode: MaskMode;
  readonly focusSlot: F2LSlot;
  readonly colorScheme: ColorSchemeId;
  readonly cameraRequest: CameraRequest | null;
  readonly ariaLabel: string;
}

/** Constant vertical FOV: perspective never warps when the viewport changes shape. */
const FOV = 34;
const DEFAULT_DIRECTION = new THREE.Vector3(...CAMERA_VIEWS.iso).normalize();
const MIN_DISTANCE = 5.5;
const MAX_DISTANCE = 16;
const INITIAL_POSITION = DEFAULT_DIRECTION.clone().multiplyScalar(BASE_DISTANCE).toArray();

const useFit = () => useThree((s) => fitDistance(s.size.width / Math.max(1, s.size.height)));

interface Flight {
  readonly start: number;
  readonly from: THREE.Spherical;
  readonly to: THREE.Spherical;
  /** Radius as a multiple of the fit distance, so resizes mid-flight stay consistent. */
  readonly fromScale: number;
}

const FLIGHT_MS = 700;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Owns every programmatic camera move:
 *  - smoothly scales the orbit distance when the viewport's aspect ratio changes;
 *  - flies along the orbit sphere (azimuth takes the shortest way round, so
 *    front ↔ back never flips through the poles) to a requested preset view.
 */
function CameraDirector({ request, controls }: { request: CameraRequest | null; controls: RefObject<OrbitControlsImpl | null> }) {
  const camera = useThree((s) => s.camera);
  const fit = useFit();
  const applied = useRef<number | null>(null);
  const flight = useRef<Flight | null>(null);
  const tmp = useRef(new THREE.Spherical());

  useEffect(() => {
    if (!request) return;
    const from = new THREE.Spherical().setFromVector3(camera.position);
    const to = new THREE.Spherical().setFromVector3(new THREE.Vector3(...CAMERA_VIEWS[request.view]));
    to.makeSafe();
    flight.current = { start: performance.now(), from, to, fromScale: from.radius / (applied.current ?? fit) };
    // `fit` intentionally read at request time only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, camera]);

  useFrame((_, dt) => {
    const c = controls.current;
    let moved = false;

    // 1. Keep the framing distance in step with the viewport shape.
    if (applied.current === null) {
      camera.position.setLength(fit);
      applied.current = fit;
      moved = true;
    } else if (applied.current !== fit) {
      const prev = applied.current;
      const next = Math.abs(fit - prev) < 1e-3 ? fit : prev + (fit - prev) * (1 - Math.exp(-dt * 7));
      applied.current = next;
      if (!flight.current) camera.position.multiplyScalar(next / prev);
      moved = true;
    }

    // 2. Preset / reset flight.
    const f = flight.current;
    if (f) {
      const t = Math.min(1, (performance.now() - f.start) / FLIGHT_MS);
      const e = easeOutCubic(t);
      let dTheta = f.to.theta - f.from.theta;
      dTheta = Math.atan2(Math.sin(dTheta), Math.cos(dTheta));
      const s = tmp.current;
      s.theta = f.from.theta + dTheta * e;
      s.phi = f.from.phi + (f.to.phi - f.from.phi) * e;
      const scale = f.fromScale + (1 - f.fromScale) * e;
      s.radius = scale * (applied.current ?? fit);
      s.makeSafe();
      camera.position.setFromSpherical(s);
      camera.up.set(0, 1, 0);
      if (t >= 1) flight.current = null;
      moved = true;
    }

    if (moved) {
      if (c) {
        c.target.set(0, 0, 0);
        c.update();
      } else {
        camera.lookAt(0, 0, 0);
      }
    }
  });
  return null;
}

/** Damped orbit (no panning); zoom limits scale with the portrait fit distance. */
function Controls({ controls }: { controls: RefObject<OrbitControlsImpl | null> }) {
  const k = useFit() / BASE_DISTANCE;
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      minDistance={MIN_DISTANCE}
      maxDistance={MAX_DISTANCE * k}
      rotateSpeed={0.85}
    />
  );
}

/** Balanced studio lighting: key + fill + rim plus soft procedural reflections (no network HDRs). */
function StudioLights() {
  return (
    <>
      <ambientLight intensity={0.32} />
      <directionalLight position={[5, 9, 7]} intensity={1.45} />
      <directionalLight position={[-7, 3, 5]} intensity={0.55} />
      {/* cool rims from behind: outline the dark silhouette against the backdrop */}
      <directionalLight position={[-3, 5, -8]} intensity={0.9} color="#dfe8ff" />
      <directionalLight position={[6, 1, -6]} intensity={0.45} color="#e6ecff" />
      <directionalLight position={[2, -6, 3]} intensity={0.25} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 6, 2]} rotation-x={Math.PI / 2} scale={[8, 4, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[6, 2, 4]} rotation-y={-Math.PI / 3} scale={[4, 6, 1]} />
        <Lightformer form="rect" intensity={0.9} position={[-6, 2, 3]} rotation-y={Math.PI / 3} scale={[4, 6, 1]} />
        <Lightformer form="ring" intensity={0.9} position={[0, 2, -7]} scale={4} color="#cfd9ff" />
        <Lightformer form="rect" intensity={0.7} position={[0, -5, -4]} rotation-x={-Math.PI / 4} scale={[10, 2, 1]} color="#b9c6ff" />
      </Environment>
    </>
  );
}

export function CubeCanvas({
  state,
  animation,
  onAnimationComplete,
  maskMode,
  focusSlot,
  colorScheme,
  cameraRequest,
  ariaLabel,
}: CubeCanvasProps) {
  const controls = useRef<OrbitControlsImpl | null>(null);
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      aria-label={ariaLabel}
      onCreated={({ gl }) => {
        // Neutral tone mapping keeps sticker hues true instead of ACES' darker reds
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <PerspectiveCamera makeDefault position={INITIAL_POSITION} fov={FOV} near={0.1} far={100} />
      <StudioLights />
      <CubeModel
        state={state}
        animation={animation}
        onAnimationComplete={onAnimationComplete}
        maskMode={maskMode}
        focusSlot={focusSlot}
        colorScheme={colorScheme}
      />
      {/*
        The contact shadow only depends on the cube's geometry (not on the camera),
        so it re-renders every frame only while a layer is turning. When idle it
        renders a single frame after each React update (drei resets its frame
        counter per render), i.e. after jumps, case changes and animation ends.
      */}
      <ContactShadows
        position={[0, -2.25, 0]}
        opacity={0.45}
        scale={9}
        blur={2.6}
        far={4}
        resolution={512}
        frames={animation ? Infinity : 1}
      />
      <Controls controls={controls} />
      <CameraDirector request={cameraRequest} controls={controls} />
    </Canvas>
  );
}
