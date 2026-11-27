import { statusKey } from '../../i18n/strings';
import { useI18n } from '../../i18n/useI18n';
import type { AlgorithmCase, LearningStatus } from '../../types';
import { StatusDot } from '../catalog/StatusBadge';
import { STATUS_META } from '../catalog/statusMeta';
import { CopyButton } from '../ui/CopyButton';
import { Dropdown, type DropdownOption } from '../ui/Dropdown';
import { ExpandableText } from '../ui/ExpandableText';
import { MirrorIcon } from '../ui/icons';
import { Segmented } from '../ui/Segmented';

interface CaseHeaderProps {
  readonly c: AlgorithmCase;
  /** Built-in algorithms followed by the user's custom ones. */
  readonly algorithms: readonly string[];
  readonly builtInCount: number;
  readonly algIndex: number;
  readonly onAlgIndexChange: (i: number) => void;
  readonly onRemoveCustom: (alg: string) => void;
  /** The algorithm actually played (mirrored when mirror mode is on). */
  readonly playedAlg: string;
  readonly mirrored: boolean;
  readonly status: LearningStatus;
  readonly onStatusChange: (s: LearningStatus) => void;
  readonly bookmarked: boolean;
  readonly onToggleBookmark: () => void;
}

const STATUSES: readonly LearningStatus[] = ['unseen', 'learning', 'mastered'];

/**
 * Case title block with a fixed height: every row is single-line (truncated,
 * tap to expand), so switching cases never resizes the 3D viewport below.
 *
 * Below `sm` the secondary controls (status, algorithm switcher, copy) move to
 * the top row in compact form so the case name gets the full second row.
 */
export function CaseHeader({
  c,
  algorithms,
  builtInCount,
  algIndex,
  onAlgIndexChange,
  onRemoveCustom,
  playedAlg,
  mirrored,
  status,
  onStatusChange,
  bookmarked,
  onToggleBookmark,
}: CaseHeaderProps) {
  const { t, pick, category } = useI18n();
  const recognition = pick(c.recognition);
  const tag = (i: number) =>
    i === 0 ? `★ ${t('recommended')}` : i < builtInCount ? t('alternative', { n: i }) : `${t('custom')} ${i - builtInCount + 1}`;
  const shortTag = (i: number) => (i === 0 ? '★' : i < builtInCount ? t('alternative', { n: i }) : `${t('custom')} ${i - builtInCount + 1}`);
  const options: DropdownOption<number>[] = algorithms.map((a, i) => ({
    value: i,
    text: a,
    label: (
      <span className="flex flex-col">
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${i >= builtInCount ? 'text-violet-300' : 'text-zinc-500'}`}>
          {tag(i)}
        </span>
        <span className="font-mono text-[12px] text-zinc-100">{a}</span>
      </span>
    ),
  }));
  const isCustom = algIndex >= builtInCount;

  const algControls = (compact: boolean) => (
    <>
      {algorithms.length > 1 && (
        <Dropdown
          value={algIndex}
          options={options}
          onChange={onAlgIndexChange}
          ariaLabel={t('chooseAlg')}
          align="right"
          className={compact ? 'max-w-[6.5rem]' : 'w-[13rem]'}
          buttonClassName={compact ? 'h-7' : ''}
          menuClassName={compact ? 'w-[min(26rem,calc(100vw-4.5rem))]' : 'w-[min(26rem,calc(100vw-2rem))]'}
          buttonContent={
            <span className="flex items-center gap-1.5">
              <span className={`shrink-0 text-[10px] font-semibold ${isCustom ? 'text-violet-300' : 'text-zinc-400'}`}>
                {compact ? shortTag(algIndex) : tag(algIndex)}
              </span>
              {!compact && <span className="truncate font-mono text-[10.5px] text-zinc-500">{algorithms[algIndex]}</span>}
            </span>
          }
        />
      )}
      {isCustom && (
        <button
          type="button"
          onClick={() => onRemoveCustom(algorithms[algIndex])}
          className={`grid shrink-0 place-items-center rounded-lg border border-white/10 text-zinc-400 transition hover:border-rose-400/40 hover:bg-rose-400/10 hover:text-rose-200 ${
            compact ? 'h-7 w-7' : 'h-6 w-6'
          }`}
          aria-label={t('removeCustom')}
          title={t('removeCustom')}
        >
          ×
        </button>
      )}
      <CopyButton text={playedAlg} compact={compact} />
    </>
  );

  return (
    <div className="flex h-full min-w-0 flex-col justify-center gap-1">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-zinc-300">{c.stage}</span>
          <span className="truncate text-xs text-zinc-500">{category(c.category)}</span>
          {mirrored && (
            <span
              className="flex shrink-0 items-center gap-1 rounded-md border border-fuchsia-400/30 bg-fuchsia-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-fuchsia-200"
              title={t('mirroredBadge')}
            >
              <span className="sm:hidden">
                <MirrorIcon size={11} />
              </span>
              <span className="hidden sm:inline">{t('mirroredBadge')}</span>
            </span>
          )}
        </div>

        {/* < sm: compact status + algorithm controls share the top row */}
        <div className="flex shrink-0 items-center gap-1 sm:hidden">
          <Dropdown
            value={status}
            onChange={onStatusChange}
            ariaLabel={t('learningStatus')}
            align="right"
            buttonClassName="h-7"
            menuClassName="w-36"
            options={STATUSES.map((s) => ({
              value: s,
              text: t(statusKey(s)),
              label: (
                <span className="flex items-center gap-2">
                  <StatusDot status={s} />
                  {t(statusKey(s))}
                </span>
              ),
            }))}
            buttonContent={
              <span className="flex items-center gap-1.5">
                <StatusDot status={status} />
                <span className={`hidden min-[400px]:inline ${STATUS_META[status].text}`}>{t(statusKey(status))}</span>
              </span>
            }
          />
          {algControls(true)}
        </div>

        <div className="hidden shrink-0 sm:block">
          <Segmented
            value={status}
            onChange={onStatusChange}
            ariaLabel={t('learningStatus')}
            options={STATUSES.map((s) => ({
              value: s,
              label: <span className={status === s ? STATUS_META[s].text : undefined}>{t(statusKey(s))}</span>,
            }))}
          />
        </div>
      </div>

      <div className="flex min-w-0 items-center justify-between gap-2">
        <h1 className="flex min-w-0 items-center gap-1.5 text-lg font-semibold tracking-tight text-zinc-50 short:text-base sm:text-xl">
          <span className="truncate" title={c.name}>
            {c.name}
          </span>
          <button
            type="button"
            onClick={onToggleBookmark}
            className={`-m-1 shrink-0 p-1 text-lg leading-none transition ${bookmarked ? 'text-amber-300' : 'text-zinc-600 hover:text-zinc-300'}`}
            aria-label={bookmarked ? t('removeFavourite') : t('addFavourite')}
            title={t('favourite')}
          >
            {bookmarked ? '★' : '☆'}
          </button>
        </h1>
        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">{algControls(false)}</div>
      </div>

      <div className="h-4 text-xs leading-4 text-zinc-400 short:hidden">
        {recognition && (
          <ExpandableText
            text={recognition}
            heading={t('recognitionLabel')}
            ariaLabel={t('showFullRecognition')}
            buttonClassName="h-4 leading-4"
          />
        )}
      </div>
    </div>
  );
}
