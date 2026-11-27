import type { ReactNode } from 'react';

export function ToggleChip({
  on,
  onClick,
  children,
  title,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      title={title}
      className={`whitespace-nowrap rounded-lg border px-2.5 py-1 text-[11px] font-medium backdrop-blur transition ${
        on ? 'border-sky-400/50 bg-sky-400/15 text-sky-100' : 'border-white/10 bg-black/40 text-zinc-300 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}
