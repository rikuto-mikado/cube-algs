import { memo, useMemo, useRef, useState } from 'react';
import { computeSetupState } from '../../core/cube/setup';
import { CASES_BY_STAGE, categoriesOf } from '../../data/algorithms';
import type { ProgressApi } from '../../hooks/useProgress';
import { stageBlurbKey, statusKey } from '../../i18n/strings';
import { useI18n } from '../../i18n/useI18n';
import { STAGES, type AlgorithmCase, type ColorSchemeId, type LearningStatus, type Stage } from '../../types';
import { CaseDiagram } from './CaseDiagram';
import { StatusDot } from './StatusBadge';

type StatusFilter = 'all' | LearningStatus | 'bookmarked';

interface CatalogProps {
  readonly stage: Stage;
  readonly onStageChange: (s: Stage) => void;
  readonly selectedId: string;
  readonly onSelect: (c: AlgorithmCase) => void;
  readonly progress: ProgressApi;
  readonly colorScheme: ColorSchemeId;
}

const CaseCard = memo(function CaseCard({
  c,
  algIndex,
  selected,
  status,
  bookmarked,
  onSelect,
  onToggleBookmark,
  colorScheme,
  favLabel,
  unfavLabel,
}: {
  c: AlgorithmCase;
  algIndex: number;
  selected: boolean;
  status: LearningStatus;
  bookmarked: boolean;
  onSelect: (c: AlgorithmCase) => void;
  onToggleBookmark: (id: string) => void;
  colorScheme: ColorSchemeId;
  favLabel: string;
  unfavLabel: string;
}) {
  const alg = c.algorithms[Math.min(algIndex, c.algorithms.length - 1)];
  const setup = useMemo(() => computeSetupState(alg, c.setupMoves), [alg, c.setupMoves]);
  const m = /^(.*?) \((.*)\)$/.exec(c.name);
  const shortName = m ? m[1] : c.name;
  const nickname = m ? m[2] : undefined;
  return (
    <div
      className={`group relative rounded-xl border p-2 transition ${
        selected
          ? 'border-sky-400/70 bg-sky-400/10 shadow-[0_0_0_1px_rgba(56,189,248,0.35)]'
          : 'border-white/5 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]'
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(c)}
        className="flex w-full flex-col items-center gap-1.5 text-left focus:outline-none"
        aria-pressed={selected}
      >
        <CaseDiagram
          state={setup}
          stage={c.stage}
          maskMode={c.maskMode}
          colorScheme={colorScheme}
          className="aspect-square w-full max-w-[104px]"
          title={c.name}
        />
        <span className="flex w-full items-center gap-1.5" title={c.name}>
          <StatusDot status={status} />
          <span className="truncate text-[12px] font-medium text-zinc-200">{shortName}</span>
        </span>
        <span className="-mt-1 h-3.5 w-full truncate pl-3.5 text-[10px] leading-3.5 text-zinc-500">{nickname ?? ''}</span>
      </button>
      <button
        type="button"
        onClick={() => onToggleBookmark(c.id)}
        className={`absolute right-1.5 top-1.5 rounded-md p-1 text-sm touch:right-0.5 touch:top-0.5 touch:p-2 leading-none transition ${
          bookmarked ? 'text-amber-300' : 'text-zinc-600 opacity-0 hover:text-zinc-300 group-hover:opacity-100 focus:opacity-100 touch:opacity-60'
        }`}
        aria-label={`${bookmarked ? unfavLabel : favLabel}: ${c.name}`}
        title={bookmarked ? unfavLabel : favLabel}
      >
        {bookmarked ? '★' : '☆'}
      </button>
    </div>
  );
});

/** Single-row, horizontally scrollable filter strip — its height never changes between stages. */
function CategoryStrip({
  categories,
  active,
  onChange,
}: {
  categories: readonly string[];
  active: string | null;
  onChange: (c: string | null) => void;
}) {
  const { t, category } = useI18n();
  const strip = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: true });
  const updateEdges = () => {
    const el = strip.current;
    if (!el) return;
    const left = el.scrollLeft > 2;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    if (left !== edges.left || right !== edges.right) setEdges({ left, right });
  };
  const scrollBy = (dx: number) => strip.current?.scrollBy({ left: dx, behavior: 'smooth' });
  const chip = (key: string | null, label: string) => {
    const on = active === key;
    return (
      <button
        key={key ?? '__all'}
        type="button"
        role="radio"
        aria-checked={on}
        onClick={() => onChange(key === active ? null : key)}
        className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] transition touch:py-1.5 ${
          on ? 'border-sky-400/60 bg-sky-400/10 text-sky-200' : 'border-white/10 text-zinc-400 hover:text-zinc-200'
        }`}
      >
        {label}
      </button>
    );
  };
  return (
    <div className="relative -mx-4 flex items-center">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        onClick={() => scrollBy(-160)}
        className={`absolute left-0 z-10 h-full w-7 ${edges.left ? 'hidden sm:flex' : 'hidden'} items-center justify-center bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-transparent text-zinc-500 hover:text-zinc-200`}
      >
        ‹
      </button>
      <div
        ref={strip}
        role="radiogroup"
        aria-label={t('groupFilter')}
        className="flex gap-1 overflow-x-auto scroll-smooth px-4 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={updateEdges}
        onWheel={(e) => {
          // map vertical wheel to horizontal scroll for mouse users
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) e.currentTarget.scrollLeft += e.deltaY;
        }}
      >
        {chip(null, t('allGroups'))}
        {categories.map((c) => chip(c, category(c)))}
      </div>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        onClick={() => scrollBy(160)}
        className={`absolute right-0 z-10 h-full w-7 ${edges.right ? 'hidden sm:flex' : 'hidden'} items-center justify-center bg-gradient-to-l from-zinc-950 via-zinc-950/90 to-transparent text-zinc-500 hover:text-zinc-200`}
      >
        ›
      </button>
    </div>
  );
}

export function Catalog({ stage, onStageChange, selectedId, onSelect, progress, colorScheme }: CatalogProps) {
  const { t, category: categoryName } = useI18n();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const cases = CASES_BY_STAGE[stage];
  const categories = useMemo(() => categoriesOf(stage), [stage]);
  const activeCategory = category && categories.includes(category) ? category : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cases.filter((c) => {
      if (activeCategory && c.category !== activeCategory) return false;
      if (statusFilter === 'bookmarked' && !progress.bookmarks.has(c.id)) return false;
      if (statusFilter !== 'all' && statusFilter !== 'bookmarked' && progress.getStatus(c.id) !== statusFilter)
        return false;
      if (q && !`${c.name} ${c.category} ${categoryName(c.category)} ${c.algorithms.join(' ')}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [cases, activeCategory, statusFilter, query, progress, categoryName]);

  const grouped = useMemo(() => {
    const m = new Map<string, AlgorithmCase[]>();
    for (const c of filtered) m.set(c.category, [...(m.get(c.category) ?? []), c]);
    return [...m.entries()];
  }, [filtered]);

  const stageStats = (s: Stage) => {
    const list = CASES_BY_STAGE[s];
    const mastered = list.filter((c) => progress.getStatus(c.id) === 'mastered').length;
    const learning = list.filter((c) => progress.getStatus(c.id) === 'learning').length;
    return { total: list.length, mastered, learning };
  };
  const stats = stageStats(stage);

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2.5 px-4 pb-3 pt-1">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-white/[0.04] p-1" role="tablist" aria-label={t('stageTabs')}>
          {STAGES.map((s) => {
            const st = stageStats(s);
            return (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={s === stage}
                onClick={() => onStageChange(s)}
                className={`rounded-lg px-2 py-1.5 text-sm font-semibold transition ${
                  s === stage ? 'bg-zinc-100 text-zinc-900 shadow' : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                {s}
                <span className={`ml-1 text-[10px] font-medium ${s === stage ? 'text-zinc-500' : 'text-zinc-600'}`}>
                  {st.mastered}/{st.total}
                </span>
              </button>
            );
          })}
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2 text-[11px] text-zinc-500">
            <span className="truncate">{t(stageBlurbKey(stage))}</span>
            <span className="shrink-0">
              <span className="text-emerald-300">{stats.mastered}</span> {t('mastered')} ·{' '}
              <span className="text-amber-300">{stats.learning}</span> {t('learning')}
            </span>
          </div>
          <div className="flex h-1.5 overflow-hidden rounded-full bg-white/5">
            <div className="bg-emerald-400 transition-all" style={{ width: `${(stats.mastered / stats.total) * 100}%` }} />
            <div className="bg-amber-400/80 transition-all" style={{ width: `${(stats.learning / stats.total) * 100}%` }} />
          </div>
        </div>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-base text-zinc-100 placeholder:text-zinc-600 sm:text-sm focus:border-sky-400/60 focus:outline-none"
          aria-label={t('searchLabel')}
        />

        <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(['all', 'unseen', 'learning', 'mastered', 'bookmarked'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={`shrink-0 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium transition touch:py-1.5 ${
                statusFilter === f ? 'bg-white/15 text-zinc-100' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
              }`}
              aria-pressed={statusFilter === f}
            >
              {f === 'all' ? t('filterAll') : f === 'bookmarked' ? t('filterFavourites') : t(statusKey(f))}
            </button>
          ))}
        </div>

        <CategoryStrip key={stage} categories={categories} active={activeCategory} onChange={setCategory} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 [scrollbar-width:thin]">
        {grouped.length === 0 && <p className="py-10 text-center text-sm text-zinc-500">{t('noMatches')}</p>}
        {grouped.map(([cat, list]) => (
          <section key={cat} className="mb-4">
            <h3 className="sticky top-0 z-10 -mx-1 mb-2 bg-zinc-950/90 px-1 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 backdrop-blur">
              {categoryName(cat)} <span className="font-normal text-zinc-600">· {list.length}</span>
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {list.map((c) => (
                <CaseCard
                  key={c.id}
                  c={c}
                  algIndex={progress.getPreferredAlg(c.id)}
                  selected={c.id === selectedId}
                  status={progress.getStatus(c.id)}
                  bookmarked={progress.bookmarks.has(c.id)}
                  onSelect={onSelect}
                  onToggleBookmark={progress.toggleBookmark}
                  colorScheme={colorScheme}
                  favLabel={t('addFavourite')}
                  unfavLabel={t('removeFavourite')}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
