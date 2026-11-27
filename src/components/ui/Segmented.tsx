import type { ReactNode } from 'react';

interface SegmentedProps<T extends string> {
  readonly value: T;
  readonly options: readonly { readonly value: T; readonly label: ReactNode; readonly title?: string }[];
  readonly onChange: (v: T) => void;
  readonly ariaLabel: string;
  readonly size?: 'xs' | 'sm';
  readonly className?: string;
}

/** Compact radio-group style segmented control. */
export function Segmented<T extends string>({ value, options, onChange, ariaLabel, size = 'xs', className = '' }: SegmentedProps<T>) {
  return (
    <div className={`flex rounded-lg bg-white/[0.06] p-0.5 ${className}`} role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={`flex-1 whitespace-nowrap rounded-md font-medium transition ${
            size === 'xs' ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-1 text-[11px]'
          } ${o.value === value ? 'bg-white/15 text-zinc-50 shadow-sm' : 'text-zinc-500 hover:text-zinc-200'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
