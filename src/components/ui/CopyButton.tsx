import { useState } from 'react';
import { useI18n } from '../../i18n/useI18n';

/** Copies `text` to the clipboard; `compact` renders an icon-only button (small screens). */
export function CopyButton({
  text,
  label,
  className = '',
  compact = false,
}: {
  text: string;
  /** Defaults to "Copy alg". */
  label?: string;
  className?: string;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      })
      .catch(() => undefined);
  };
  if (compact) {
    return (
      <button
        type="button"
        onClick={copy}
        aria-label={label ?? t('copyAlg')}
        title={label ?? t('copyAlg')}
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/10 transition hover:bg-white/10 ${
          copied ? 'text-emerald-300' : 'text-zinc-300'
        } ${className}`}
      >
        {copied ? <CheckIcon /> : <ClipboardIcon />}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={copy}
      className={`shrink-0 whitespace-nowrap rounded-lg border border-white/10 px-2 py-1 text-[11px] text-zinc-300 transition hover:bg-white/10 ${className}`}
    >
      {copied ? t('copied') : (label ?? t('copyAlg'))}
    </button>
  );
}

function ClipboardIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}
