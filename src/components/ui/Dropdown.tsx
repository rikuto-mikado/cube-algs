import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export interface DropdownOption<T extends string | number> {
  readonly value: T;
  readonly label: ReactNode;
  /** Plain-text label for type-ahead and screen readers (defaults to `label` when it is a string). */
  readonly text?: string;
  readonly hint?: ReactNode;
}

interface DropdownProps<T extends string | number> {
  readonly value: T;
  readonly options: readonly DropdownOption<T>[];
  readonly onChange: (value: T) => void;
  readonly ariaLabel: string;
  /** Rendered inside the trigger; defaults to the selected option's label. */
  readonly buttonContent?: ReactNode;
  readonly className?: string;
  readonly buttonClassName?: string;
  readonly menuClassName?: string;
  readonly align?: 'left' | 'right';
  readonly placement?: 'bottom' | 'top';
  readonly title?: string;
}

const textOf = <T extends string | number>(o: DropdownOption<T>) =>
  o.text ?? (typeof o.label === 'string' ? o.label : String(o.value));

/**
 * Dark, accessible listbox dropdown (WAI-ARIA "select-only combobox" pattern):
 * arrow keys / Home / End / type-ahead to move, Enter or Space to pick,
 * Escape or Tab to close. Key events are contained so global shortcuts don't fire.
 */
export function Dropdown<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel,
  buttonContent,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  align = 'left',
  placement = 'bottom',
  title,
}: DropdownProps<T>) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ text: '', at: 0 });

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return;
    list.current?.focus();
    const onPointer = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  // Keep the active option visible by scrolling the list only (scrollIntoView
  // would also scroll overflow-hidden ancestors such as the app shell).
  useEffect(() => {
    const box = list.current;
    if (!open || !box) return;
    const el = box.querySelector<HTMLElement>(`[data-index="${active}"]`);
    if (!el) return;
    if (el.offsetTop < box.scrollTop) box.scrollTop = el.offsetTop - 4;
    else if (el.offsetTop + el.offsetHeight > box.scrollTop + box.clientHeight)
      box.scrollTop = el.offsetTop + el.offsetHeight - box.clientHeight + 4;
  }, [open, active]);

  const openMenu = (index = selectedIndex) => {
    setActive(index);
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };
  const choose = (index: number) => {
    const o = options[index];
    if (o) onChange(o.value);
    close();
  };

  // Space is deliberately left to the global player shortcut (play / pause);
  // Enter and the arrow keys open the menu.
  const onButtonKey = (e: KeyboardEvent) => {
    if (['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      openMenu(e.key === 'ArrowUp' ? Math.max(0, selectedIndex - 1) : selectedIndex);
    }
  };

  const onListKey = (e: KeyboardEvent) => {
    const last = options.length - 1;
    let handled = true;
    switch (e.key) {
      case 'ArrowDown':
        setActive((i) => Math.min(last, i + 1));
        break;
      case 'ArrowUp':
        setActive((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        setActive(0);
        break;
      case 'End':
        setActive(last);
        break;
      case 'Enter':
      case ' ':
        choose(active);
        break;
      case 'Escape':
        close();
        break;
      case 'Tab':
        setOpen(false);
        handled = false;
        break;
      default:
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          const now = e.timeStamp;
          const t = typeahead.current;
          t.text = now - t.at > 600 ? e.key.toLowerCase() : t.text + e.key.toLowerCase();
          t.at = now;
          const hit = options.findIndex((o) => textOf(o).toLowerCase().startsWith(t.text));
          if (hit >= 0) setActive(hit);
        } else handled = false;
    }
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        ref={button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={`${ariaLabel}: ${selected ? textOf(selected) : ''}`}
        title={title}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onButtonKey}
        className={`flex w-full items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900/80 px-2.5 py-1 text-left text-[11px] text-zinc-200 backdrop-blur transition hover:border-white/20 hover:bg-zinc-800/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400/70 ${buttonClassName}`}
      >
        <span className="min-w-0 flex-1 truncate">{buttonContent ?? selected?.label}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className={`shrink-0 text-zinc-500 transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul
          ref={list}
          id={`${id}-list`}
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel}
          aria-activedescendant={`${id}-opt-${active}`}
          onKeyDown={onListKey}
          className={`absolute z-50 max-h-72 min-w-full overflow-y-auto overscroll-contain rounded-xl border border-white/10 bg-zinc-900/95 p-1 shadow-2xl shadow-black/60 ring-1 ring-black/40 backdrop-blur-xl focus:outline-none [scrollbar-width:thin] ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${placement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} ${menuClassName}`}
        >
          {options.map((o, i) => {
            const isSel = o.value === value;
            return (
              <li
                key={String(o.value)}
                id={`${id}-opt-${i}`}
                data-index={i}
                role="option"
                aria-selected={isSel}
                onPointerEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={`flex cursor-pointer items-start gap-2 rounded-lg px-2.5 py-1.5 text-[12px] transition ${
                  i === active ? 'bg-white/10 text-zinc-50' : 'text-zinc-300'
                }`}
              >
                <span className={`mt-0.5 w-3 shrink-0 text-sky-300 ${isSel ? '' : 'invisible'}`} aria-hidden>
                  ✓
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block">{o.label}</span>
                  {o.hint && <span className="mt-0.5 block text-[10px] text-zinc-500">{o.hint}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
