import type { ReactNode } from 'react';
import { SPEED_MAX, SPEED_MIN } from '../../hooks/usePreferences';
import { useI18n } from '../../i18n/useI18n';
import type { PlaybackCadence } from '../../types';
import { GearIcon } from '../ui/icons';
import { Popover } from '../ui/Popover';
import { Segmented } from '../ui/Segmented';

interface PlayerControlsProps {
  readonly playing: boolean;
  readonly step: number;
  readonly total: number;
  readonly speed: number;
  readonly loop: boolean;
  readonly cadence: PlaybackCadence;
  /** Disables transport buttons (e.g. drill before the answer is revealed). */
  readonly locked?: boolean;
  readonly onToggle: () => void;
  readonly onStepBack: () => void;
  readonly onStepForward: () => void;
  readonly onReset: () => void;
  readonly onToEnd: () => void;
  readonly onSpeedChange: (s: number) => void;
  readonly onLoopChange: (l: boolean) => void;
  readonly onCadenceChange: (c: PlaybackCadence) => void;
}

function IconButton({
  label,
  shortcut,
  onClick,
  children,
  primary,
  disabled,
}: {
  label: string;
  shortcut?: string;
  onClick: () => void;
  children: ReactNode;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={`grid place-items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-30 ${
        primary
          ? 'h-12 w-12 bg-zinc-100 text-zinc-900 shadow-lg shadow-black/40 hover:bg-white active:scale-95 short:h-10 short:w-10'
          : 'h-9 w-9 text-zinc-300 hover:bg-white/10 hover:text-white active:scale-95 touch:h-10 touch:w-10 short:h-9 short:w-9'
      }`}
    >
      {children}
    </button>
  );
}

const svg = (d: string, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d={d} />
  </svg>
);

const ICONS = {
  play: svg('M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z', 22),
  pause: svg('M6 4h4v16H6zM14 4h4v16h-4z', 22),
  back: svg('M6 5h2v14H6zM19 5.5v13a.75.75 0 0 1-1.16.63L9.5 12.63a.75.75 0 0 1 0-1.26l8.34-6.5A.75.75 0 0 1 19 5.5z'),
  fwd: svg('M16 5h2v14h-2zM5 5.5v13a.75.75 0 0 0 1.16.63l8.34-6.5a.75.75 0 0 0 0-1.26L6.16 4.87A.75.75 0 0 0 5 5.5z'),
  reset: (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  ),
  end: svg('M4 5.5v13a.75.75 0 0 0 1.16.63L12 13.6v4.9a.75.75 0 0 0 1.16.63l8.34-6.5a.75.75 0 0 0 0-1.26l-8.34-6.5A.75.75 0 0 0 12 5.5v4.9L5.16 4.87A.75.75 0 0 0 4 5.5z'),
};

export function PlayerControls(p: PlayerControlsProps) {
  const { t } = useI18n();
  const locked = p.locked ?? false;
  const empty = p.total === 0;
  const customised = p.speed !== 1 || p.loop || p.cadence !== 'smooth';

  const speed = (
    <label className="flex items-center gap-2">
      <span>{t('speed')}</span>
      <input
        type="range"
        min={SPEED_MIN}
        max={SPEED_MAX}
        step={0.25}
        value={p.speed}
        onChange={(e) => p.onSpeedChange(Number(e.target.value))}
        className="min-w-0 flex-1 accent-sky-400 sm:w-24 sm:flex-none"
        aria-label={t('animationSpeed')}
      />
      <span className="w-9 font-mono tabular-nums text-zinc-300">{p.speed.toFixed(2).replace(/0$/, '')}×</span>
    </label>
  );
  const cadence = (size: 'xs' | 'sm') => (
    <Segmented
      value={p.cadence}
      onChange={p.onCadenceChange}
      ariaLabel={t('cadenceLabel')}
      size={size}
      options={[
        { value: 'smooth', label: t('cadenceSmooth'), title: t('cadenceHint') },
        { value: 'cadence', label: t('cadenceBeat'), title: t('cadenceHint') },
      ]}
    />
  );
  const loop = (
    <label className="flex cursor-pointer select-none items-center gap-1.5">
      <input type="checkbox" checked={p.loop} onChange={(e) => p.onLoopChange(e.target.checked)} className="h-4 w-4 accent-sky-400 sm:h-auto sm:w-auto" />
      {t('loop')}
    </label>
  );

  return (
    <div className="flex shrink-0 items-center justify-center gap-x-1.5 gap-y-1.5 sm:tall:flex-wrap sm:tall:gap-x-5">
      <div className="flex items-center gap-0.5 sm:gap-1">
        <IconButton label={t('resetToSetup')} shortcut="R" onClick={p.onReset} disabled={locked || p.step === 0}>
          {ICONS.reset}
        </IconButton>
        <IconButton label={t('stepBack')} shortcut="←" onClick={p.onStepBack} disabled={locked || p.step === 0}>
          {ICONS.back}
        </IconButton>
        <IconButton
          label={p.playing ? t('pause') : t('play')}
          shortcut="Space"
          onClick={p.onToggle}
          primary
          disabled={locked || empty}
        >
          {p.playing ? ICONS.pause : ICONS.play}
        </IconButton>
        <IconButton label={t('stepForward')} shortcut="→" onClick={p.onStepForward} disabled={locked || p.step >= p.total}>
          {ICONS.fwd}
        </IconButton>
        <IconButton label={t('jumpToSolved')} onClick={p.onToEnd} disabled={locked || p.step >= p.total}>
          {ICONS.end}
        </IconButton>
      </div>

      <div className="flex items-center gap-1 text-xs text-zinc-400 sm:tall:gap-3">
        <span className="w-10 text-center font-mono tabular-nums text-zinc-300 sm:w-12">
          {locked ? '–' : `${p.step}/${p.total}`}
        </span>

        {/* roomy screens (sm and up, not short): everything inline */}
        <div className="hidden items-center gap-3 sm:tall:flex">
          {speed}
          {cadence('xs')}
          {loop}
        </div>

        {/* phones and short landscape: tucked into a popover above the footer */}
        <Popover
          className="sm:tall:hidden"
          ariaLabel={t('playbackOptions')}
          title={t('playbackOptions')}
          placement="top"
          align="right"
          panelClassName="w-[min(17rem,calc(100vw-1.5rem))] space-y-3 text-xs text-zinc-300"
          buttonClassName="relative grid h-10 w-10 place-items-center rounded-full text-zinc-300 transition hover:bg-white/10 hover:text-white active:scale-95 aria-expanded:bg-white/10 aria-expanded:text-white"
          button={
            <>
              <GearIcon />
              {customised && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-sky-400" aria-hidden />}
            </>
          }
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{t('playbackOptions')}</div>
          {speed}
          <div className="flex items-center justify-between gap-3">
            {cadence('sm')}
            {loop}
          </div>
        </Popover>
      </div>
    </div>
  );
}
