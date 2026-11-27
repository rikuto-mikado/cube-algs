import { useMemo, useState } from 'react';
import { solvesSameCase } from '../../core/cube/caseKeys';
import type { MaskMode } from '../../core/cube/masking';
import { parseMoves } from '../../core/notation/parser';
import type { ValidationResult } from '../../core/notation/validate';
import { normalizeAlgText } from '../../hooks/useCustomAlgs';
import type { SandboxState } from '../../hooks/useSandbox';
import { notationErrorText, type StringKey } from '../../i18n/strings';
import { useI18n } from '../../i18n/useI18n';
import type { AlgorithmCase } from '../../types';
import { Dropdown } from '../ui/Dropdown';
import { Segmented } from '../ui/Segmented';

interface SandboxPanelProps {
  readonly state: SandboxState;
  readonly onChange: (patch: Partial<SandboxState>) => void;
  readonly validation: ValidationResult;
  /** Case that a valid sandbox algorithm can be saved to (the current Learn case). */
  readonly target: AlgorithmCase;
  readonly targetAlg: string;
  readonly customAlgs: readonly string[];
  readonly onSave: (alg: string) => void;
  readonly onRemoveCustom: (alg: string) => void;
}

const MASKS: readonly { value: MaskMode; key: StringKey }[] = [
  { value: 'full', key: 'maskFull' },
  { value: 'f2l', key: 'maskF2l' },
  { value: 'f2l-slot', key: 'maskF2lSlot' },
  { value: 'oll', key: 'maskOll' },
  { value: 'pll', key: 'maskPll' },
];

export function SandboxPanel({
  state,
  onChange,
  validation,
  target,
  targetAlg,
  customAlgs,
  onSave,
  onRemoveCustom,
}: SandboxPanelProps) {
  const { t, lang } = useI18n();
  const [savedText, setSavedText] = useState<string | null>(null);

  const text = normalizeAlgText(state.text);
  const isDuplicate = [...target.algorithms, ...customAlgs].some((a) => normalizeAlgText(a) === text);
  const matches = useMemo(
    () => validation.ok && solvesSameCase(target.stage, parseMoves(target.algorithms[0]), validation.parsed.moves),
    [validation, target],
  );
  const justSaved = savedText === text;

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto px-4 pb-6 pt-1 [scrollbar-width:thin]">
      <div>
        <label htmlFor="sandbox-input" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          {t('sandboxInputLabel')}
        </label>
        <textarea
          id="sandbox-input"
          value={state.text}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={4}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          placeholder={t('sandboxPlaceholder')}
          aria-invalid={!validation.ok && validation.reason === 'syntax'}
          aria-describedby="sandbox-status"
          className={`w-full resize-none rounded-xl border bg-black/40 px-3 py-2 font-mono text-base leading-relaxed sm:text-[13px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none ${
            !validation.ok && validation.reason === 'syntax'
              ? 'border-rose-400/60 focus:border-rose-400'
              : 'border-white/10 focus:border-sky-400/60'
          }`}
        />
        <div id="sandbox-status" role="status" aria-live="polite" className="mt-1.5 min-h-[2.5rem] text-[11px]">
          {validation.ok ? (
            <span className="text-emerald-300">✓ {t('sandboxValid', { n: validation.parsed.moves.length })}</span>
          ) : validation.reason === 'empty' ? (
            <span className="text-zinc-500">{t('sandboxEmpty')}</span>
          ) : (
            <div className="space-y-1">
              <div className="text-rose-300">
                {t('sandboxError')}: {notationErrorText(lang, validation)}
              </div>
              {validation.position >= 0 && (
                <div className="truncate rounded-md bg-black/40 px-2 py-1 font-mono text-[11px] text-zinc-400">
                  {state.text.slice(Math.max(0, validation.position - 18), validation.position)}
                  <mark className="rounded bg-rose-500/80 px-0.5 text-white">{state.text[validation.position] ?? '␣'}</mark>
                  {state.text.slice(validation.position + 1, validation.position + 18)}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="mt-1 flex gap-1.5">
          <button
            type="button"
            onClick={() => onChange({ text: targetAlg })}
            className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-zinc-300 transition hover:bg-white/10"
          >
            {t('sandboxLoadCase')}
          </button>
          <button
            type="button"
            onClick={() => onChange({ text: '' })}
            className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-zinc-300 transition hover:bg-white/10"
          >
            {t('sandboxClear')}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{t('sandboxStart')}</div>
        <Segmented
          size="sm"
          value={state.start}
          onChange={(start) => onChange({ start })}
          ariaLabel={t('sandboxStart')}
          options={[
            { value: 'setup', label: t('sandboxStartSetup'), title: t('sandboxStartSetupHint') },
            { value: 'solved', label: t('sandboxStartSolved'), title: t('sandboxStartSolvedHint') },
          ]}
        />
        <p className="text-[10.5px] text-zinc-500">
          {state.start === 'setup' ? t('sandboxStartSetupHint') : t('sandboxStartSolvedHint')}
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{t('sandboxMask')}</div>
        <Dropdown
          value={state.mask}
          onChange={(mask) => onChange({ mask })}
          ariaLabel={t('sandboxMask')}
          options={MASKS.map((m) => ({ value: m.value, label: t(m.key) }))}
        />
      </div>

      <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{t('sandboxSaveTo')}</div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-zinc-100">
            <span className="mr-1.5 rounded bg-white/10 px-1 py-0.5 text-[10px] font-bold text-zinc-300">{target.stage}</span>
            {target.name}
          </span>
          <button
            type="button"
            disabled={!matches || isDuplicate}
            onClick={() => {
              onSave(text);
              setSavedText(text);
            }}
            className="shrink-0 rounded-lg bg-sky-400 px-3 py-1 text-[12px] font-semibold text-zinc-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-zinc-500"
          >
            {t('sandboxSave')}
          </button>
        </div>
        <p className="min-h-[1rem] text-[11px]">
          {!validation.ok ? null : justSaved ? (
            <span className="text-emerald-300">{t('sandboxSaved', { name: target.name })}</span>
          ) : isDuplicate ? (
            <span className="text-zinc-500">{t('sandboxDuplicate')}</span>
          ) : matches ? (
            <span className="text-emerald-300">{t('sandboxMatches', { name: target.name })}</span>
          ) : (
            <span className="text-amber-300">{t('sandboxMismatch')}</span>
          )}
        </p>

        <div className="border-t border-white/5 pt-2">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{t('sandboxCustomList')}</div>
          {customAlgs.length === 0 ? (
            <p className="text-[11px] text-zinc-600">{t('sandboxNoCustom')}</p>
          ) : (
            <ul className="space-y-1">
              {customAlgs.map((a) => (
                <li key={a} className="flex items-center gap-2 rounded-lg bg-black/30 px-2 py-1">
                  <button
                    type="button"
                    className="min-w-0 flex-1 truncate text-left font-mono text-[11px] text-zinc-300 hover:text-white"
                    onClick={() => onChange({ text: a })}
                    title={a}
                  >
                    {a}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveCustom(a)}
                    className="shrink-0 rounded px-1 text-zinc-500 hover:bg-rose-400/10 hover:text-rose-200"
                    aria-label={t('removeCustom')}
                    title={t('removeCustom')}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="text-[10.5px] leading-relaxed text-zinc-600">{t('sandboxNotationHelp')}</p>
    </div>
  );
}
