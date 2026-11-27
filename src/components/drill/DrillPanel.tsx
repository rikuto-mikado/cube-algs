import type { DrillApi, DrillPool } from '../../hooks/useDrill';
import type { StringKey } from '../../i18n/strings';
import { useI18n } from '../../i18n/useI18n';
import { STAGES, type AlgorithmCase } from '../../types';
import { Dropdown } from '../ui/Dropdown';
import { ExpandableText } from '../ui/ExpandableText';
import { ToggleChip } from '../ui/ToggleChip';

const POOL_LABEL: Readonly<Record<DrillPool, StringKey>> = {
  all: 'drillPoolAll',
  notMastered: 'drillPoolNotMastered',
  learning: 'drillPoolLearning',
  favourites: 'drillPoolFavourites',
};

function Check({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2 text-[12px] text-zinc-300">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-sky-400" />
      {label}
    </label>
  );
}

/** Sidebar settings and score for the recognition drill. */
export function DrillPanel({ drill }: { drill: DrillApi }) {
  const { t } = useI18n();
  const { options, updateOptions, pool, score } = drill;
  const accuracy = score.total ? Math.round((score.knew / score.total) * 100) : 0;
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto px-4 pb-6 pt-1 [scrollbar-width:thin]">
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{t('drillScore')}</span>
          <button type="button" onClick={drill.resetScore} className="text-[11px] text-zinc-500 underline decoration-dotted hover:text-zinc-300">
            {t('drillResetScore')}
          </button>
        </div>
        <div className="mt-1 flex items-baseline gap-3">
          <span className="font-mono text-2xl font-semibold tabular-nums text-zinc-50">
            {score.knew}
            <span className="text-zinc-500">/{score.total}</span>
          </span>
          <span className="text-[11px] text-zinc-400">
            {t('drillAccuracy')} <span className="font-mono text-zinc-200">{accuracy}%</span>
          </span>
        </div>
        <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-white/5">
          <div className="bg-emerald-400 transition-all" style={{ width: `${accuracy}%` }} />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{t('drillStages')}</div>
        <div className="flex gap-1.5">
          {STAGES.map((s) => {
            const on = options.stages.includes(s);
            return (
              <ToggleChip
                key={s}
                on={on}
                onClick={() =>
                  updateOptions({
                    stages: on ? options.stages.filter((x) => x !== s) : STAGES.filter((x) => x === s || options.stages.includes(x)),
                  })
                }
              >
                {s}
              </ToggleChip>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{t('drillPool')}</div>
        <Dropdown
          value={options.pool}
          onChange={(pool) => updateOptions({ pool })}
          ariaLabel={t('drillPool')}
          options={(Object.keys(POOL_LABEL) as DrillPool[]).map((p) => ({ value: p, label: t(POOL_LABEL[p]) }))}
        />
        <p className={`text-[11px] ${pool.length ? 'text-zinc-500' : 'text-amber-300'}`}>
          {pool.length ? t('drillPoolSize', { n: pool.length }) : t('drillEmpty')}
        </p>
      </div>

      <div className="space-y-2">
        <Check checked={options.randomAuf} onChange={(randomAuf) => updateOptions({ randomAuf })} label={t('drillRandomAuf')} />
        <Check
          checked={options.randomRotation}
          onChange={(randomRotation) => updateOptions({ randomRotation })}
          label={t('drillRandomRotation')}
        />
      </div>

      <button
        type="button"
        onClick={drill.next}
        disabled={pool.length === 0}
        className="rounded-xl bg-sky-400 px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-zinc-500"
      >
        {drill.round ? t('drillNext') : t('drillStart')}
      </button>
    </div>
  );
}

interface DrillHeaderProps {
  readonly drill: DrillApi;
  readonly drillCase: AlgorithmCase | null;
  readonly onRevealAndPlay: () => void;
  readonly onOpenInLearn: (c: AlgorithmCase) => void;
}

/** Fixed-height header slot content for the drill. */
export function DrillHeader({ drill, drillCase, onRevealAndPlay, onOpenInLearn }: DrillHeaderProps) {
  const { t, category, pick } = useI18n();
  const { round } = drill;
  const twist = round ? [round.twist.rotation, round.twist.auf].filter(Boolean).join(' ') : '';

  if (!round || !drillCase) {
    return (
      <div className="flex h-full items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-300">{t('drillTitle')}</div>
          <p className="truncate text-sm text-zinc-400">{drill.pool.length ? t('drillPrompt') : t('drillEmpty')}</p>
        </div>
        <button
          type="button"
          onClick={drill.next}
          disabled={drill.pool.length === 0}
          className="shrink-0 rounded-xl bg-sky-400 px-3 py-1.5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-300 disabled:bg-white/10 disabled:text-zinc-500"
        >
          {t('drillStart')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-w-0 flex-col justify-center gap-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-[11px]">
          <span className="font-semibold uppercase tracking-wider text-sky-300">{t('drillTitle')}</span>
          <span className="text-zinc-500">{t('drillRound', { n: round.n })}</span>
        </div>
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-zinc-400">
          {t('drillScore')} {drill.score.knew}/{drill.score.total}
        </span>
      </div>

      <div className="flex min-w-0 items-center justify-between gap-2">
        {round.revealed ? (
          <h1 className="flex min-w-0 items-center gap-2 text-lg font-semibold tracking-tight text-zinc-50 short:text-base sm:text-xl">
            <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-zinc-300">
              {drillCase.stage}
            </span>
            <span className="truncate">{drillCase.name}</span>
            {twist && (
              <span className="shrink-0 rounded-md border border-white/10 px-1.5 py-0.5 font-mono text-[11px] font-medium text-zinc-400" title={t('drillSolutionPrefix')}>
                {twist}
              </span>
            )}
          </h1>
        ) : (
          <h1 className="truncate text-lg font-semibold tracking-tight text-zinc-300 short:text-base sm:text-xl">{t('drillQuestion')}</h1>
        )}
        <div className="flex shrink-0 items-center gap-1.5">
          {!round.revealed ? (
            <button
              type="button"
              onClick={onRevealAndPlay}
              className="rounded-xl bg-sky-400 px-3 py-1.5 text-[12px] font-semibold text-zinc-950 transition hover:bg-sky-300"
              title="Space"
            >
              {t('drillReveal')}
            </button>
          ) : round.result === 'pending' ? (
            <>
              <button
                type="button"
                onClick={() => drill.mark('knew')}
                aria-label={t('drillKnew')}
                title={t('drillKnew')}
                className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1.5 text-[12px] font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
              >
                ✓<span className="hidden min-[400px]:inline"> {t('drillKnew')}</span>
              </button>
              <button
                type="button"
                onClick={() => drill.mark('missed')}
                aria-label={t('drillMissed')}
                title={t('drillMissed')}
                className="rounded-xl border border-rose-400/40 bg-rose-400/10 px-2.5 py-1.5 text-[12px] font-semibold text-rose-200 transition hover:bg-rose-400/20"
              >
                ✗<span className="hidden min-[400px]:inline"> {t('drillMissed')}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={drill.next}
              className="rounded-xl bg-sky-400 px-3 py-1.5 text-[12px] font-semibold text-zinc-950 transition hover:bg-sky-300"
              title="Enter"
            >
              {t('drillNext')} →
            </button>
          )}
        </div>
      </div>

      <div className="flex h-4 min-w-0 items-center gap-2 text-xs leading-4 text-zinc-400 short:hidden">
        {round.revealed ? (
          <>
            <ExpandableText
              className="flex-1"
              text={`${category(drillCase.category)}${pick(drillCase.recognition) ? ` · ${pick(drillCase.recognition)}` : ''}`}
              heading={t('recognitionLabel')}
              ariaLabel={t('showFullRecognition')}
              buttonClassName="h-4 leading-4"
            />
            <button
              type="button"
              onClick={() => onOpenInLearn(drillCase)}
              className="ml-auto shrink-0 text-[11px] text-sky-300 underline decoration-dotted hover:text-sky-200"
            >
              {t('drillOpenInLearn')}
            </button>
          </>
        ) : (
          <span className="truncate">{t('drillPrompt')}</span>
        )}
      </div>
    </div>
  );
}
