import { memo, useId, useMemo } from 'react';
import { faceGrid, isF2LSolved, isLastLayerOriented, lastLayerArrows, type PermutationArrow } from '../../core/cube/analysis';
import { FACE_NORMALS, type Face } from '../../core/cube/faces';
import { isStickerVisible, type MaskMode } from '../../core/cube/masking';
import type { F2LSlot } from '../../core/cube/slots';
import { getStickers, normalizeOrientation, type CubeState, type Sticker } from '../../core/cube/state';
import type { Vec3 } from '../../core/cube/math';
import type { ColorSchemeId, Stage } from '../../types';
import { COLOR_SCHEMES, MASK_COLOR } from '../cube3d/colors';

interface CaseDiagramProps {
  readonly state: CubeState;
  readonly stage: Stage;
  readonly maskMode: MaskMode;
  readonly colorScheme: ColorSchemeId;
  /** F2L: slot the isometric view looks at (and the focus mask targets). */
  readonly focusSlot?: F2LSlot;
  readonly showArrows?: boolean;
  readonly className?: string;
  readonly title?: string;
}

function stickerColor(s: Sticker, maskMode: MaskMode, colorScheme: ColorSchemeId, focusSlot: F2LSlot): string {
  return isStickerVisible(maskMode, s.home, s.homeFace, focusSlot)
    ? COLOR_SCHEMES[colorScheme].colors[s.homeFace]
    : MASK_COLOR;
}

/** Top-down last-layer view with side stickers (OLL / PLL recognition style). */
function TopDown({
  state,
  color,
  arrows,
}: {
  state: CubeState;
  color: (s: Sticker) => string;
  arrows: readonly PermutationArrow[];
}) {
  // Unique per instance: dozens of diagrams share one document.
  const markerId = `arrowhead-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const U = faceGrid(state, 'U');
  const side = (f: Face) => faceGrid(state, f)[0];
  const cell = 20;
  const gap = 2;
  const o = 14; // offset of U grid (room for side strips)
  const strip = 7;
  const rects: { x: number; y: number; w: number; h: number; fill: string; key: string }[] = [];
  U.forEach((row, r) =>
    row.forEach((s, c) =>
      rects.push({ key: `u${r}${c}`, x: o + c * (cell + gap), y: o + r * (cell + gap), w: cell, h: cell, fill: color(s) }),
    ),
  );
  const full = 3 * cell + 2 * gap;
  const F = side('F');
  const B = side('B');
  const R = side('R');
  const L = side('L');
  for (let i = 0; i < 3; i++) {
    const along = o + i * (cell + gap);
    rects.push({ key: `f${i}`, x: along, y: o + full + 3, w: cell, h: strip, fill: color(F[i]) });
    rects.push({ key: `b${i}`, x: along, y: o - 3 - strip, w: cell, h: strip, fill: color(B[2 - i]) });
    rects.push({ key: `r${i}`, x: o + full + 3, y: along, w: strip, h: cell, fill: color(R[2 - i]) });
    rects.push({ key: `l${i}`, x: o - 3 - strip, y: along, w: strip, h: cell, fill: color(L[i]) });
  }
  const center = (p: Vec3) => ({ x: o + (p[0] + 1) * (cell + gap) + cell / 2, y: o + (p[2] + 1) * (cell + gap) + cell / 2 });
  const size = o * 2 + full;
  const isSwap = (a: PermutationArrow) =>
    arrows.some((b) => b !== a && b.from.join() === a.to.join() && b.to.join() === a.from.join());
  const drawn = arrows.filter((a) => !isSwap(a) || a.from.join() < a.to.join());

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
      {drawn.length > 0 && (
        <defs>
          <marker id={markerId} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#111318" />
          </marker>
        </defs>
      )}
      <rect x={o - 2} y={o - 2} width={full + 4} height={full + 4} rx={4} fill="#0c0d10" />
      {rects.map((r) => (
        <rect key={r.key} x={r.x} y={r.y} width={r.w} height={r.h} rx={2.5} fill={r.fill} />
      ))}
      {drawn.map((a, i) => {
        const p = center(a.from);
        const q = center(a.to);
        const dx = q.x - p.x;
        const dy = q.y - p.y;
        const len = Math.hypot(dx, dy);
        const sh = 5 / len;
        return (
          <line
            key={i}
            x1={p.x + dx * sh}
            y1={p.y + dy * sh}
            x2={q.x - dx * sh}
            y2={q.y - dy * sh}
            stroke="#111318"
            strokeWidth={2.2}
            strokeLinecap="round"
            markerEnd={`url(#${markerId})`}
            markerStart={isSwap(a) ? `url(#${markerId})` : undefined}
          />
        );
      })}
    </svg>
  );
}

const C30 = Math.cos(Math.PI / 6);

/**
 * Rotation about y that brings the slot's outer corner to the front-right, so
 * the isometric view always looks straight at the target slot.
 */
const VIEW_ROTATION: Readonly<Record<F2LSlot, (x: number, z: number) => readonly [number, number]>> = {
  FR: (x, z) => [x, z],
  FL: (x, z) => [z, -x],
  BR: (x, z) => [-z, x],
  BL: (x, z) => [-x, -z],
};

/** Isometric U + two side faces, looking at `slot` (F2L style). */
function Isometric({ state, color, slot }: { state: CubeState; color: (s: Sticker) => string; slot: F2LSlot }) {
  const polys = useMemo(() => {
    const rot = VIEW_ROTATION[slot];
    const view = (v: readonly number[]) => {
      const [x, z] = rot(v[0], v[2]);
      return [x, v[1], z] as const;
    };
    const project = (v: readonly number[]) => [(v[0] - v[2]) * C30, -v[1] + (v[0] + v[2]) * 0.5] as const;
    const out: { key: string; points: string; fill: string }[] = [];
    for (const s of getStickers(state)) {
      const n = view(FACE_NORMALS[s.face]);
      // only faces pointing at the viewer: +x, +y, +z after the view rotation
      if (!(n[0] === 1 || n[1] === 1 || n[2] === 1)) continue;
      const p = view(s.pos);
      const axes = [0, 1, 2].filter((i) => n[i] === 0);
      const center = [0, 1, 2].map((i) => p[i] + n[i] * 0.5);
      const inset = 0.44;
      const corners = [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ].map(([a, b]) => {
        const q = [...center];
        q[axes[0]] += a * inset;
        q[axes[1]] += b * inset;
        return project(q);
      });
      out.push({
        key: `${s.face}${s.pos.join()}`,
        points: corners.map((c) => `${c[0].toFixed(3)},${c[1].toFixed(3)}`).join(' '),
        fill: color(s),
      });
    }
    return out;
  }, [state, color, slot]);
  const hull = [
    [1.5, 1.5, -1.5],
    [1.5, -1.5, -1.5],
    [1.5, -1.5, 1.5],
    [-1.5, -1.5, 1.5],
    [-1.5, 1.5, 1.5],
    [-1.5, 1.5, -1.5],
  ]
    .map((p) => [(p[0] - p[2]) * C30, -p[1] + (p[0] + p[2]) * 0.5].map((x) => x.toFixed(3)).join(','))
    .join(' ');
  return (
    <svg viewBox="-2.85 -3.15 5.7 6.3" className="h-full w-full">
      <polygon points={hull} fill="#0c0d10" stroke="#0c0d10" strokeWidth={0.12} strokeLinejoin="round" />
      {polys.map((p) => (
        <polygon key={p.key} points={p.points} fill={p.fill} stroke={p.fill} strokeWidth={0.02} strokeLinejoin="round" />
      ))}
    </svg>
  );
}

export const CaseDiagram = memo(function CaseDiagram({
  state,
  stage,
  maskMode,
  colorScheme,
  focusSlot = 'FR',
  showArrows = stage === 'PLL',
  className,
  title,
}: CaseDiagramProps) {
  const normalized = useMemo(() => normalizeOrientation(state), [state]);
  // Arrows only make sense for a genuine PLL state (F2L solved, last layer oriented).
  const arrows = useMemo(
    () =>
      showArrows && isF2LSolved(normalized) && isLastLayerOriented(normalized) ? lastLayerArrows(normalized) : [],
    [normalized, showArrows],
  );
  const color = useMemo(
    () => (s: Sticker) => stickerColor(s, maskMode, colorScheme, focusSlot),
    [maskMode, colorScheme, focusSlot],
  );
  return (
    <div className={className} role="img" aria-label={title}>
      {stage === 'F2L' ? (
        <Isometric state={normalized} color={color} slot={focusSlot} />
      ) : (
        <TopDown state={normalized} color={color} arrows={arrows} />
      )}
    </div>
  );
});
