import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

interface PopoverProps {
  /** Trigger content. */
  readonly button: ReactNode;
  readonly ariaLabel: string;
  readonly title?: string;
  readonly children: ReactNode;
  readonly className?: string;
  readonly buttonClassName?: string;
  readonly panelClassName?: string;
  readonly placement?: 'top' | 'bottom';
  /** `stretch` spans the wrapper's full width (use with a full-width wrapper). */
  readonly align?: 'left' | 'right' | 'center' | 'stretch';
  readonly disabled?: boolean;
}

const ALIGN = {
  left: 'left-0',
  right: 'right-0',
  center: 'left-1/2 -translate-x-1/2',
  stretch: 'inset-x-0',
} as const;

/**
 * Lightweight non-modal popover: tap/click to toggle, dismissed by tapping
 * outside or Escape. Works identically for touch (no hover dependency) and mouse.
 */
export function Popover({
  button,
  ariaLabel,
  title,
  children,
  className = '',
  buttonClassName = '',
  panelClassName = '',
  placement = 'bottom',
  align = 'left',
  disabled = false,
}: PopoverProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  const onKey = (e: KeyboardEvent) => {
    if (open && e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      trigger.current?.focus();
    }
  };

  return (
    <div ref={root} className={`relative ${className}`} onKeyDown={onKey}>
      <button
        ref={trigger}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={open ? `${id}-panel` : undefined}
        title={title}
        onClick={() => setOpen((v) => !v)}
        className={buttonClassName}
      >
        {button}
      </button>
      {open && (
        <div
          id={`${id}-panel`}
          role="dialog"
          aria-label={ariaLabel}
          className={`absolute z-50 rounded-xl border border-white/10 bg-zinc-900/90 p-3 text-zinc-200 shadow-2xl shadow-black/60 ring-1 ring-black/40 backdrop-blur-xl ${ALIGN[align]} ${
            placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-1.5'
          } ${panelClassName}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
