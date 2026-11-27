import { memo, useEffect, useRef } from 'react';
import type { AlgNode } from '../../core/notation/types';
import { useI18n } from '../../i18n/useI18n';

interface MoveBarProps {
  readonly nodes: readonly AlgNode[];
  /** Number of moves applied (0 = setup state). */
  readonly step: number;
  /** Index of the move currently animating/highlighted, or -1. */
  readonly current: number;
  readonly onJump: (step: number) => void;
  /** Drill: hide the solution until revealed. */
  readonly hidden?: boolean;
}

interface TokenCtx {
  readonly step: number;
  readonly current: number;
  readonly onJump: (s: number) => void;
  readonly jumpLabel: (n: number) => string;
}

function Token({ text, index, ctx }: { text: string; index: number; ctx: TokenCtx }) {
  const isCurrent = index === ctx.current;
  const done = index < ctx.step && !isCurrent;
  return (
    <button
      type="button"
      data-move={index}
      onClick={() => ctx.onJump(index + 1)}
      className={`min-w-[2.1rem] shrink-0 rounded-md px-1.5 py-1 font-mono touch:min-w-[2.5rem] touch:py-2.5 short:py-1 text-[15px] font-semibold leading-none transition-all duration-150 ${
        isCurrent
          ? 'scale-110 bg-sky-400 text-zinc-950 shadow-[0_0_18px_rgba(56,189,248,0.55)]'
          : done
            ? 'text-zinc-300 hover:bg-white/10'
            : 'text-zinc-500 hover:bg-white/10 hover:text-zinc-200'
      }`}
      aria-current={isCurrent ? 'step' : undefined}
      title={ctx.jumpLabel(index + 1)}
    >
      {text}
    </button>
  );
}

function firstIndex(ns: readonly AlgNode[]): number {
  const f = ns[0];
  return f.kind === 'move' ? f.index : firstIndex(f.children);
}

function renderNodes(nodes: readonly AlgNode[], ctx: TokenCtx, depth: number): React.ReactNode[] {
  return nodes.map((n, i) => {
    if (n.kind === 'move') return <Token key={`m${n.index}`} text={n.move.text} index={n.index} ctx={ctx} />;
    return (
      <span
        key={`g${depth}-${i}-${firstIndex(n.children)}`}
        className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-white/10 bg-white/[0.04] px-1 py-0.5 touch:py-0"
      >
        <span className="select-none font-mono text-zinc-600">(</span>
        {renderNodes(n.children, ctx, depth + 1)}
        <span className="select-none font-mono text-zinc-600">)</span>
      </span>
    );
  });
}

/**
 * Clickable notation bar preserving trigger groupings. Always a single line
 * (fixed height): long algorithms scroll horizontally and follow the playhead.
 */
export const MoveBar = memo(function MoveBar({ nodes, step, current, onJump, hidden = false }: MoveBarProps) {
  const { t } = useI18n();
  const scroller = useRef<HTMLDivElement>(null);
  const focus = current >= 0 ? current : step - 1;

  useEffect(() => {
    const box = scroller.current;
    if (!box || hidden) return;
    if (focus < 0) {
      box.scrollTo({ left: 0, behavior: 'smooth' });
      return;
    }
    const el = box.querySelector<HTMLElement>(`[data-move="${focus}"]`);
    if (!el) return;
    const boxRect = box.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const target = box.scrollLeft + (r.left - boxRect.left) - (boxRect.width - r.width) / 2;
    box.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [focus, hidden, nodes]);

  const ctx: TokenCtx = { step, current, onJump, jumpLabel: (n) => t('jumpToMove', { n }) };

  return (
    <div
      ref={scroller}
      className="h-11 overflow-x-auto overscroll-x-contain short:h-9 overflow-y-hidden [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label={t('algorithmMoves')}
    >
      <div className="mx-auto flex h-full w-max items-center gap-x-1 px-4">
        {hidden ? (
          <span className="flex items-center gap-2 text-sm text-zinc-500">
            <span className="font-mono tracking-[0.3em] text-zinc-600">• • • •</span>
            {t('drillHiddenMoves')}
          </span>
        ) : nodes.length === 0 ? (
          <span className="text-sm text-zinc-600">{t('noMoves')}</span>
        ) : (
          renderNodes(nodes, ctx, 0)
        )}
      </div>
    </div>
  );
});
