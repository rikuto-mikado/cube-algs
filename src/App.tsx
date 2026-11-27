import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CaseDiagram } from './components/catalog/CaseDiagram';
import { Catalog } from './components/catalog/Catalog';
import { CAMERA_VIEW_LABEL, CAMERA_VIEW_ORDER, CAMERA_VIEW_SHORT, type CameraView } from './components/cube3d/cameraViews';
import { COLOR_SCHEMES } from './components/cube3d/colors';
import { CubeCanvas, type CameraRequest } from './components/cube3d/CubeCanvas';
import type { CubeAnimation } from './components/cube3d/CubeModel';
import { DrillHeader, DrillPanel } from './components/drill/DrillPanel';
import { CaseHeader } from './components/player/CaseHeader';
import { MoveBar } from './components/player/MoveBar';
import { PlayerControls } from './components/player/PlayerControls';
import { SandboxPanel } from './components/sandbox/SandboxPanel';
import { Dropdown } from './components/ui/Dropdown';
import { ExpandableText } from './components/ui/ExpandableText';
import { MirrorIcon, SlidersIcon } from './components/ui/icons';
import { Popover } from './components/ui/Popover';
import { Segmented } from './components/ui/Segmented';
import { ToggleChip } from './components/ui/ToggleChip';
import { targetF2LSlot } from './core/cube/analysis';
import { drillAlgorithm } from './core/cube/drill';
import type { MaskMode } from './core/cube/masking';
import { computeStates } from './core/cube/moves';
import { computeSetupState } from './core/cube/setup';
import { SOLVED } from './core/cube/state';
import { invertAlgorithm } from './core/notation/inverse';
import { mirrorAlgorithm } from './core/notation/mirror';
import type { Move, ParsedAlgorithm } from './core/notation/types';
import { validateAlgorithm } from './core/notation/validate';
import { ALL_CASES, CASES_BY_STAGE, getCaseById } from './data/algorithms';
import { useCustomAlgs } from './hooks/useCustomAlgs';
import { filterDrillPool, useDrill, type DrillOptions } from './hooks/useDrill';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { usePlayback } from './hooks/usePlayback';
import { isRecord, usePersistentState } from './hooks/usePersistentState';
import { usePreferences } from './hooks/usePreferences';
import { useProgress } from './hooks/useProgress';
import { useSandbox } from './hooks/useSandbox';
import { notationErrorText, type StringKey } from './i18n/strings';
import { createI18n, I18nContext, useI18n } from './i18n/useI18n';
import { STAGES, type AlgorithmCase, type AppMode, type ColorSchemeId, type Stage } from './types';

interface Selection {
  readonly stage: Stage;
  readonly byStage: Readonly<Record<Stage, string>>;
}

const DEFAULT_SELECTION: Selection = {
  stage: 'PLL',
  byStage: { F2L: 'f2l-01', OLL: 'oll-27', PLL: 'pll-t' },
};

function isSelection(v: unknown): v is Selection {
  return (
    isRecord(v) &&
    STAGES.includes(v.stage as Stage) &&
    isRecord(v.byStage) &&
    STAGES.every((s) => {
      const id = (v.byStage as Record<string, unknown>)[s];
      return typeof id === 'string' && getCaseById(id)?.stage === s;
    })
  );
}

const MODES: readonly AppMode[] = ['learn', 'drill', 'sandbox'];
const isMode = (v: unknown): v is AppMode => MODES.includes(v as AppMode);
const MODE_LABEL: Readonly<Record<AppMode, StringKey>> = { learn: 'modeLearn', drill: 'modeDrill', sandbox: 'modeSandbox' };

/** Base duration of a quarter turn at 1× speed (seconds). */
const QUARTER_TURN_SECONDS = 0.42;
/** Cadence mode: short beat between consecutive moves at 1× speed (seconds). */
const CADENCE_BEAT_SECONDS = 0.07;

const EMPTY_PARSED: ParsedAlgorithm = { source: '', nodes: [], moves: [] };

const reverseMove = (m: Move): Move => ({ ...m, amount: -m.amount as Move['amount'] });

/** What the player is currently showing, independent of the mode that produced it. */
interface PlayerSource {
  /** Playback resets whenever this changes. */
  readonly key: string;
  readonly alg: string;
  readonly stage: Stage | null;
  readonly maskMode: MaskMode;
  readonly setupMoves?: string;
  readonly fromSolved: boolean;
  /** Drill: hide the solution and lock playback until revealed. */
  readonly locked: boolean;
}

const VIEW_KEYS: readonly CameraView[] = CAMERA_VIEW_ORDER;
const SCHEME_IDS = Object.keys(COLOR_SCHEMES) as ColorSchemeId[];

/** A display toggle rendered as an inline chip (roomy screens) or a switch row (Display popover). */
interface DisplayToggle {
  readonly id: string;
  readonly on: boolean;
  readonly label: string;
  readonly hint: string;
  readonly icon?: ReactNode;
  readonly toggle: () => void;
}

export default function App() {
  const { prefs, update } = usePreferences();
  const i18n = useMemo(() => createI18n(prefs.language), [prefs.language]);
  const { t, pick } = i18n;
  const progress = useProgress();
  const custom = useCustomAlgs();
  const sandbox = useSandbox();
  const [mode, setMode] = usePersistentState<AppMode>('cube-algs:mode:v1', 'learn', isMode);
  const [selection, setSelection] = usePersistentState<Selection>('cube-algs:selection:v1', DEFAULT_SELECTION, isSelection);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 1024);
  const [cameraRequest, setCameraRequest] = useState<CameraRequest | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    document.documentElement.lang = prefs.language;
  }, [prefs.language]);

  const flyTo = useCallback((view: CameraView) => setCameraRequest((r) => ({ id: (r?.id ?? 0) + 1, view })), []);

  // ---- Learn: selected case + built-in and custom algorithms ----
  const current: AlgorithmCase = getCaseById(selection.byStage[selection.stage]) ?? CASES_BY_STAGE[selection.stage][0];
  const customAlgs = custom.get(current.id);
  const algorithms = useMemo(() => [...current.algorithms, ...customAlgs], [current.algorithms, customAlgs]);
  const algIndex = Math.min(progress.getPreferredAlg(current.id), algorithms.length - 1);

  const algsFor = useCallback(
    (c: AlgorithmCase) => {
      const list = [...c.algorithms, ...custom.get(c.id)];
      return list[Math.min(progress.getPreferredAlg(c.id), list.length - 1)];
    },
    [custom, progress],
  );

  // ---- Drill ----
  const poolFor = useCallback(
    (o: DrillOptions) => filterDrillPool(ALL_CASES, o, progress.getStatus, (id) => progress.bookmarks.has(id)),
    [progress],
  );
  const drill = useDrill(poolFor);
  const drillCase = drill.round ? (getCaseById(drill.round.caseId) ?? null) : null;

  // ---- Sandbox ----
  const sandboxValidation = useMemo(() => validateAlgorithm(sandbox.state.text), [sandbox.state.text]);

  const maskFor = useCallback(
    (m: MaskMode): MaskMode => (prefs.showAllColors ? 'full' : m === 'f2l' && prefs.f2lFocus ? 'f2l-slot' : m),
    [prefs.showAllColors, prefs.f2lFocus],
  );

  const source: PlayerSource = useMemo(() => {
    const mirrorIf = (a: string) => (prefs.mirror ? mirrorAlgorithm(a) : a);
    if (mode === 'drill') {
      if (!drill.round || !drillCase) {
        return { key: 'drill:none', alg: '', stage: null, maskMode: 'full', fromSolved: true, locked: true };
      }
      return {
        key: `drill:${drill.round.n}:${prefs.mirror}`,
        alg: drillAlgorithm(mirrorIf(algsFor(drillCase)), drill.round.twist),
        stage: drillCase.stage,
        maskMode: maskFor(drillCase.maskMode),
        setupMoves: drillCase.setupMoves,
        fromSolved: false,
        locked: !drill.round.revealed,
      };
    }
    if (mode === 'sandbox') {
      const valid = sandboxValidation.ok;
      return {
        key: `sandbox:${sandbox.state.start}:${valid ? sandbox.state.text : ''}`,
        alg: valid ? sandbox.state.text : '',
        stage: null,
        maskMode: prefs.showAllColors ? 'full' : sandbox.state.mask,
        fromSolved: sandbox.state.start === 'solved',
        locked: false,
      };
    }
    return {
      key: `learn:${current.id}#${algIndex}:${prefs.mirror}`,
      alg: mirrorIf(algorithms[algIndex]),
      stage: current.stage,
      maskMode: maskFor(current.maskMode),
      setupMoves: current.setupMoves,
      fromSolved: false,
      locked: false,
    };
  }, [mode, drill.round, drillCase, algsFor, prefs.mirror, prefs.showAllColors, maskFor, sandboxValidation, sandbox.state, current, algIndex, algorithms]);

  const parsed = useMemo(() => {
    if (!source.alg) return EMPTY_PARSED;
    const v = validateAlgorithm(source.alg);
    return v.ok ? v.parsed : EMPTY_PARSED;
  }, [source.alg]);
  const setupState = useMemo(
    () => (source.fromSolved ? SOLVED : computeSetupState(parsed.moves, source.setupMoves)),
    [parsed, source.fromSolved, source.setupMoves],
  );
  const states = useMemo(() => computeStates(setupState, parsed.moves), [setupState, parsed]);
  const focusSlot = useMemo(() => targetF2LSlot(setupState) ?? 'FR', [setupState]);
  const setupNotation = useMemo(() => (source.alg ? invertAlgorithm(source.alg) : ''), [source.alg]);

  const pb = usePlayback(source.key, parsed.moves.length, prefs.loop);

  const animation: CubeAnimation | null = useMemo(() => {
    if (!pb.anim) return null;
    const { id, from, direction } = pb.anim;
    const move = direction > 0 ? parsed.moves[from] : reverseMove(parsed.moves[from - 1]);
    const half = Math.abs(move.amount) === 2;
    const beat = prefs.cadence === 'cadence' && pb.playing && direction > 0 && from > 0;
    return {
      id,
      move,
      from: states[from],
      to: states[from + direction],
      duration: (QUARTER_TURN_SECONDS * (half ? 1.45 : 1)) / prefs.speed,
      delay: beat ? CADENCE_BEAT_SECONDS / prefs.speed : 0,
    };
  }, [pb.anim, pb.playing, parsed, states, prefs.speed, prefs.cadence]);

  const currentToken = pb.anim ? (pb.anim.direction > 0 ? pb.anim.from : pb.anim.from - 1) : -1;

  // ---- Navigation ----
  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };
  const selectCase = (c: AlgorithmCase) => {
    setSelection((s) => ({ stage: c.stage, byStage: { ...s.byStage, [c.stage]: c.id } }));
    closeSidebarOnMobile();
  };
  const setStage = useCallback((stage: Stage) => setSelection((s) => ({ ...s, stage })), [setSelection]);
  const stepCase = (delta: number) => {
    const list = CASES_BY_STAGE[current.stage];
    const i = list.findIndex((c) => c.id === current.id);
    selectCase(list[(i + delta + list.length) % list.length]);
  };
  const revealAndPlay = () => {
    drill.reveal();
    pb.play();
  };
  const openInLearn = (c: AlgorithmCase) => {
    setMode('learn');
    selectCase(c);
  };
  const removeCustom = (alg: string) => {
    const idx = algorithms.indexOf(alg);
    if (idx >= 0 && progress.getPreferredAlg(current.id) >= idx) progress.setPreferredAlg(current.id, 0);
    custom.remove(current.id, alg);
  };

  const drillAwaiting = mode === 'drill' && !!drill.round && !drill.round.revealed;
  const drillCanAdvance = mode === 'drill' && (!drill.round || drill.round.result !== 'pending');
  const locked = source.locked;

  useKeyboardShortcuts({
    Space: drillAwaiting ? revealAndPlay : locked ? undefined : pb.toggle,
    ArrowLeft: locked ? undefined : pb.stepBack,
    ArrowRight: locked ? undefined : pb.stepForward,
    r: locked ? undefined : pb.reset,
    c: () => flyTo('iso'),
    ...Object.fromEntries(VIEW_KEYS.map((v, i) => [String(i + 1), () => flyTo(v)])),
    ArrowUp: mode === 'learn' ? () => stepCase(-1) : undefined,
    ArrowDown: mode === 'learn' ? () => stepCase(1) : undefined,
    m: mode !== 'sandbox' ? () => update({ mirror: !prefs.mirror }) : undefined,
    Enter: drillCanAdvance ? drill.next : undefined,
    n: drillCanAdvance ? drill.next : undefined,
    '?': () => setShowHelp((v) => !v),
    Escape: () => setShowHelp(false),
  });

  const diagramStage: Stage | null = source.stage;
  const diagramState = prefs.diagramSource === 'live' ? states[pb.step] : setupState;
  const showFocusChip = mode !== 'sandbox' && source.stage === 'F2L';

  const displayToggles: DisplayToggle[] = [
    {
      id: 'all',
      on: prefs.showAllColors,
      label: t('showAllColors'),
      hint: t('showAllColorsHint'),
      toggle: () => update({ showAllColors: !prefs.showAllColors }),
    },
  ];
  if (showFocusChip)
    displayToggles.push({
      id: 'focus',
      on: prefs.f2lFocus,
      label: t('focusSlot'),
      hint: t('focusSlotHint'),
      toggle: () => update({ f2lFocus: !prefs.f2lFocus }),
    });
  if (mode !== 'sandbox')
    displayToggles.push({
      id: 'mirror',
      on: prefs.mirror,
      label: t('mirror'),
      hint: t('mirrorHint'),
      icon: <MirrorIcon />,
      toggle: () => update({ mirror: !prefs.mirror }),
    });
  const activeDisplayCount = displayToggles.filter((d) => d.on).length;
  const schemeName = (id: ColorSchemeId) => t(id === 'western' ? 'schemeWestern' : 'schemeHighContrast');
  const schemeLabel = (id: ColorSchemeId) => (
    <span className="flex items-center justify-center gap-2">
      <span className="flex gap-0.5" aria-hidden>
        {(['U', 'F', 'R'] as const).map((f) => (
          <span key={f} className="h-2.5 w-2.5 rounded-[3px]" style={{ background: COLOR_SCHEMES[id].colors[f] }} />
        ))}
      </span>
      {schemeName(id)}
    </span>
  );

  const shortcutRows: [string, StringKey][] = [
    ['Space', 'scPlayPause'],
    ['← / →', 'scStep'],
    ['R', 'scReset'],
    ['C', 'scCamera'],
    ['1 – 6', 'scViews'],
    ['↑ / ↓', 'scCase'],
    ['M', 'scMirror'],
    ['Enter', 'scDrill'],
    ['?', 'scHelp'],
  ];

  return (
    <I18nContext.Provider value={i18n}>
      <div className="flex h-dvh w-full overflow-hidden bg-zinc-950 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)] text-zinc-100">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
        )}
        <aside
          className={`fixed inset-y-0 left-0 z-30 flex w-85 max-w-[88vw] flex-col border-r pb-[env(safe-area-inset-bottom)] max-lg:pl-[env(safe-area-inset-left)] max-lg:pt-[env(safe-area-inset-top)] border-white/5 bg-zinc-950/95 backdrop-blur transition-[transform,margin] duration-300 lg:relative lg:z-0 lg:bg-zinc-950 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:-ml-85'
          }`}
          aria-label={t('catalogLabel')}
        >
          <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-4 short:pb-2 short:pt-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <img src="/favicon.svg" alt="" className="h-7 w-7" />
              <div className="min-w-0">
                <div className="text-sm font-semibold tracking-tight">{t('appName')}</div>
                <div className="truncate text-[10px] text-zinc-500">{t('appTagline')}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Segmented
                value={prefs.language}
                onChange={(language) => update({ language })}
                ariaLabel={t('language')}
                options={[
                  { value: 'en', label: 'EN' },
                  { value: 'ja', label: 'JA' },
                ]}
              />
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-md p-1.5 text-zinc-500 hover:bg-white/10 hover:text-zinc-200"
                aria-label={t('collapseSidebar')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
            </div>
          </div>
          <div className="px-4 pb-3">
            <Segmented
              size="sm"
              value={mode}
              onChange={setMode}
              ariaLabel={t('modeLabel')}
              options={MODES.map((m) => ({ value: m, label: t(MODE_LABEL[m]) }))}
            />
          </div>
          <div className="min-h-0 flex-1">
            {mode === 'learn' && (
              <Catalog
                stage={selection.stage}
                onStageChange={setStage}
                selectedId={current.id}
                onSelect={selectCase}
                progress={progress}
                colorScheme={prefs.colorScheme}
              />
            )}
            {mode === 'drill' && <DrillPanel drill={drill} />}
            {mode === 'sandbox' && (
              <SandboxPanel
                state={sandbox.state}
                onChange={sandbox.update}
                validation={sandboxValidation}
                target={current}
                targetAlg={algorithms[algIndex]}
                customAlgs={customAlgs}
                onSave={(alg) => custom.add(current.id, alg, current.algorithms)}
                onRemoveCustom={removeCustom}
              />
            )}
          </div>
        </aside>

        {/* Main */}
        <main className="relative flex min-w-0 flex-1 flex-col">
          {/* Fixed-height header slot: case text never resizes the 3D viewport. */}
          <header className="relative z-10 flex h-25 shrink-0 items-center gap-3 border-b border-white/5 px-4 short:h-16 sm:px-6">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="mt-3 shrink-0 self-start rounded-md border border-white/10 p-1.5 text-zinc-300 hover:bg-white/10 short:mt-2 touch:p-2"
                aria-label={t('openSidebar')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <div className="h-full min-w-0 flex-1 py-2 short:py-1">
              {mode === 'learn' && (
                <CaseHeader
                  c={current}
                  algorithms={algorithms}
                  builtInCount={current.algorithms.length}
                  algIndex={algIndex}
                  onAlgIndexChange={(i) => progress.setPreferredAlg(current.id, i)}
                  onRemoveCustom={removeCustom}
                  playedAlg={source.alg}
                  mirrored={prefs.mirror}
                  status={progress.getStatus(current.id)}
                  onStatusChange={(s) => progress.setStatus(current.id, s)}
                  bookmarked={progress.bookmarks.has(current.id)}
                  onToggleBookmark={() => progress.toggleBookmark(current.id)}
                />
              )}
              {mode === 'drill' && (
                <DrillHeader drill={drill} drillCase={drillCase} onRevealAndPlay={revealAndPlay} onOpenInLearn={openInLearn} />
              )}
              {mode === 'sandbox' && (
                <div className="flex h-full min-w-0 flex-col justify-center gap-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-violet-300">{t('modeSandbox')}</div>
                  <h1 className="truncate text-lg font-semibold tracking-tight text-zinc-50 short:text-base sm:text-xl">{t('sandboxTitle')}</h1>
                  <p className="h-4 truncate text-xs leading-4 text-zinc-400 short:hidden">
                    {sandboxValidation.ok
                      ? `${t('sandboxValid', { n: parsed.moves.length })} · ${sandbox.state.start === 'setup' ? t('sandboxStartSetup') : t('sandboxStartSolved')}`
                      : sandboxValidation.reason === 'empty'
                        ? t('sandboxEmpty')
                        : `${t('sandboxError')}: ${notationErrorText(i18n.lang, sandboxValidation)}`}
                  </p>
                </div>
              )}
            </div>
          </header>

          <section className="relative min-h-0 flex-1 bg-[radial-gradient(ellipse_at_center,#262a33_0%,#14161b_52%,#09090b_100%)]">
            <CubeCanvas
              state={states[pb.step]}
              animation={animation}
              onAnimationComplete={pb.animationDone}
              maskMode={source.maskMode}
              focusSlot={focusSlot}
              colorScheme={prefs.colorScheme}
              cameraRequest={cameraRequest}
              ariaLabel={t('canvasLabel')}
            />

            {/* Top overlays */}
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 short:p-2">
              {/* roomy screens: inline chips */}
              <div className="pointer-events-auto hidden max-w-[70%] flex-wrap items-center gap-1.5 sm:tall:flex">
                {displayToggles.map((d) => (
                  <ToggleChip key={d.id} on={d.on} onClick={d.toggle} title={d.hint}>
                    {d.icon ? (
                      <span className="flex items-center gap-1.5">
                        {d.icon}
                        {d.label}
                      </span>
                    ) : (
                      d.label
                    )}
                  </ToggleChip>
                ))}
                <Dropdown
                  value={prefs.colorScheme}
                  onChange={(colorScheme: ColorSchemeId) => update({ colorScheme })}
                  ariaLabel={t('colorScheme')}
                  title={t('colorScheme')}
                  className="w-34"
                  buttonClassName="bg-black/40"
                  options={SCHEME_IDS.map((id) => ({ value: id, text: schemeName(id), label: schemeLabel(id) }))}
                />
              </div>

              {/* phones / short landscape: one compact "Display" popover */}
              <Popover
                className="pointer-events-auto sm:tall:hidden"
                ariaLabel={t('displayOptions')}
                title={t('displayOptions')}
                align="left"
                panelClassName="w-[min(17rem,calc(100vw-1.5rem))] space-y-1 p-2"
                buttonClassName="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-[11px] font-medium text-zinc-200 backdrop-blur transition hover:bg-white/10 aria-expanded:border-sky-400/40 aria-expanded:bg-white/10"
                button={
                  <>
                    <SlidersIcon />
                    {t('display')}
                    {activeDisplayCount > 0 && (
                      <span className="grid h-4 min-w-4 place-items-center rounded-full bg-sky-400 px-1 text-[10px] font-bold leading-none text-zinc-950">
                        {activeDisplayCount}
                      </span>
                    )}
                  </>
                }
              >
                <div className="px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{t('displayOptions')}</div>
                {displayToggles.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    role="switch"
                    aria-checked={d.on}
                    onClick={d.toggle}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-white/5"
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-zinc-100">
                        {d.icon}
                        {d.label}
                      </span>
                      <span className="mt-0.5 block text-[10.5px] leading-snug text-zinc-500">{d.hint}</span>
                    </span>
                    <Switch on={d.on} />
                  </button>
                ))}
                <div className="mx-2 border-t border-white/5 pt-2">
                  <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{t('colorScheme')}</div>
                  <div className="grid grid-cols-2 gap-1 rounded-lg bg-white/[0.06] p-0.5" role="radiogroup" aria-label={t('colorScheme')}>
                    {SCHEME_IDS.map((id) => (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={prefs.colorScheme === id}
                        onClick={() => update({ colorScheme: id })}
                        className={`rounded-md px-2 py-1.5 text-[11px] font-medium transition ${
                          prefs.colorScheme === id ? 'bg-white/15 text-zinc-50 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {schemeLabel(id)}
                      </button>
                    ))}
                  </div>
                </div>
              </Popover>

              {diagramStage !== null || mode === 'sandbox' ? (
                prefs.showDiagram ? (
                  <div className="pointer-events-auto w-24 rounded-xl border border-white/10 bg-black/45 p-1 shadow-lg shadow-black/30 backdrop-blur sm:tall:w-38 sm:tall:p-1.5">
                    <div className="mb-1 flex items-center gap-1">
                      <div className="hidden min-w-0 flex-1 sm:tall:block">
                        <Segmented
                          value={prefs.diagramSource}
                          onChange={(diagramSource) => update({ diagramSource })}
                          ariaLabel={t('diagramSourceLabel')}
                          options={[
                            { value: 'setup', label: t('diagramSetup') },
                            { value: 'live', label: t('diagramLive') },
                          ]}
                        />
                      </div>
                      {/* compact: one tap toggles Setup ⇄ Live */}
                      <button
                        type="button"
                        onClick={() => update({ diagramSource: prefs.diagramSource === 'setup' ? 'live' : 'setup' })}
                        className="flex h-5 min-w-0 flex-1 items-center gap-1 rounded-md bg-white/[0.06] px-1.5 text-[10px] font-medium text-zinc-200 sm:tall:hidden"
                        aria-label={`${t('diagramSourceLabel')}: ${prefs.diagramSource === 'setup' ? t('diagramSetup') : t('diagramLive')}`}
                      >
                        <span className="shrink-0 text-zinc-500" aria-hidden>
                          ⇄
                        </span>
                        <span className="truncate">{prefs.diagramSource === 'setup' ? t('diagramSetup') : t('diagramLive')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => update({ showDiagram: false })}
                        className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100 touch:h-6 touch:w-6"
                        aria-label={t('collapse')}
                        title={t('collapse')}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
                          <path d="M6 15l6-6 6 6" />
                        </svg>
                      </button>
                    </div>
                    <CaseDiagram
                      state={diagramState}
                      stage={diagramStage ?? 'PLL'}
                      maskMode={diagramStage === 'PLL' ? 'pll' : source.maskMode}
                      focusSlot={focusSlot}
                      colorScheme={prefs.colorScheme}
                      showArrows={diagramStage === 'PLL' && !locked}
                      className="aspect-square w-full"
                      title={t('recognitionDiagram', { name: mode === 'learn' ? current.name : t('diagram') })}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => update({ showDiagram: true })}
                    className="pointer-events-auto flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-[11px] font-medium text-zinc-300 backdrop-blur transition hover:bg-white/10 touch:py-1.5"
                    aria-label={t('expand')}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                    {t('diagram')}
                  </button>
                )
              ) : null}
            </div>

            {/* Bottom overlays */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2.5 short:p-1.5">
              <div className="pointer-events-auto text-[10px] text-zinc-600">
                <span className="hidden touch:hidden sm:inline">{t('orbitHint')}</span>
                {/* keyboard shortcuts are irrelevant on touch devices */}
                <span className="touch:hidden">
                  <span className="hidden sm:inline"> · </span>
                  <button type="button" className="underline decoration-dotted hover:text-zinc-400" onClick={() => setShowHelp((v) => !v)}>
                    {t('shortcuts')}
                  </button>
                </span>
              </div>
              <div
                className="pointer-events-auto flex gap-0.5 rounded-xl border border-white/10 bg-black/40 p-0.5 backdrop-blur"
                role="group"
                aria-label={t('cameraViews')}
              >
                {CAMERA_VIEW_ORDER.map((v, i) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => flyTo(v)}
                    title={`${t(CAMERA_VIEW_LABEL[v])} (${i + 1})`}
                    aria-label={t(CAMERA_VIEW_LABEL[v])}
                    className="min-w-7 whitespace-nowrap rounded-lg px-1.5 py-1 text-[10.5px] font-medium text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100 touch:min-w-8 touch:py-1.5 sm:px-2"
                  >
                    <span className="sm:tall:hidden">{CAMERA_VIEW_SHORT[v]}</span>
                    <span className="hidden sm:tall:inline">{t(CAMERA_VIEW_LABEL[v])}</span>
                  </button>
                ))}
              </div>
            </div>

            {showHelp && (
              <div className="absolute bottom-12 left-3 z-10 rounded-xl border border-white/10 bg-zinc-900/95 p-3 text-xs text-zinc-300 shadow-xl backdrop-blur">
                <div className="mb-2 flex items-center justify-between gap-6">
                  <span className="font-semibold text-zinc-100">{t('keyboardShortcuts')}</span>
                  <button type="button" onClick={() => setShowHelp(false)} className="text-zinc-500 hover:text-zinc-200" aria-label={t('close')}>
                    ×
                  </button>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                  {shortcutRows.map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt>
                        <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px]">{k}</kbd>
                      </dt>
                      <dd className="text-zinc-400">{t(v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </section>

          {/* Fixed-layout footer: single-line move bar + controls + single-line setup. */}
          <footer className="relative z-10 shrink-0 space-y-1.5 border-t border-white/5 bg-zinc-950/80 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1.5 short:flex short:items-center short:gap-3 short:space-y-0 short:pb-[max(0.25rem,env(safe-area-inset-bottom))] short:pt-1 sm:px-6">
            {/* short landscape: move bar and transport share one row */}
            <div className="min-w-0 short:flex-1">
              <MoveBar nodes={parsed.nodes} step={pb.step} current={currentToken} onJump={pb.jump} hidden={locked && mode === 'drill'} />
            </div>
            <PlayerControls
              playing={pb.playing}
              step={pb.step}
              total={pb.total}
              speed={prefs.speed}
              loop={prefs.loop}
              cadence={prefs.cadence}
              locked={locked}
              onToggle={pb.toggle}
              onStepBack={pb.stepBack}
              onStepForward={pb.stepForward}
              onReset={pb.reset}
              onToEnd={pb.toEnd}
              onSpeedChange={(speed) => update({ speed })}
              onLoopChange={(loop) => update({ loop })}
              onCadenceChange={(cadence) => update({ cadence })}
            />
            <SetupLine notation={locked || source.fromSolved ? '' : setupNotation} />
          </footer>
        </main>
      </div>
      {/* recognition text for screen readers when the header truncates it */}
      <span className="sr-only" aria-live="polite">
        {mode === 'learn' ? pick(current.recognition) : ''}
      </span>
    </I18nContext.Provider>
  );
}

/**
 * One-line setup notation (fixed height, hidden on short landscape screens).
 * Tap opens a popover with the full notation and a copy button — no hover needed.
 */
function SetupLine({ notation }: { notation: string }) {
  const { t } = useI18n();
  if (!notation) return <div className="h-4 short:hidden" aria-hidden />;
  return (
    <ExpandableText
      className="h-4 short:hidden"
      text={notation}
      heading={t('setup')}
      note={t('setupHint')}
      ariaLabel={t('showFullSetup')}
      placement="top"
      mono
      copy={t('copySetup')}
      panelClassName="mx-auto max-w-xl"
      buttonClassName="h-4 text-center font-mono text-[10px] leading-4 text-zinc-600 hover:text-zinc-400"
    >
      {t('setup')}: <span className="text-zinc-500">{notation}</span>
    </ExpandableText>
  );
}

/** Visual on/off switch (the parent button carries `role="switch"`). */
function Switch({ on }: { on: boolean }) {
  return (
    <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${on ? 'bg-sky-400' : 'bg-white/15'}`} aria-hidden>
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
    </span>
  );
}
