import type { ReactNode } from 'react';
import { CopyButton } from './CopyButton';
import { Popover } from './Popover';

interface ExpandableTextProps {
  /** Full text shown in the popover (and the tooltip on hover devices). */
  readonly text: string;
  /** Trigger content (single line, truncated); defaults to `text`. */
  readonly children?: ReactNode;
  readonly ariaLabel: string;
  /** Optional heading inside the popover. */
  readonly heading?: string;
  /** Small explanatory note under the text. */
  readonly note?: string;
  /** Show a copy button; a string sets its label. */
  readonly copy?: boolean | string;
  readonly panelClassName?: string;
  readonly mono?: boolean;
  readonly placement?: 'top' | 'bottom';
  readonly className?: string;
  readonly buttonClassName?: string;
}

/**
 * A single truncated line that opens a popover with the full text on tap —
 * touch users can't hover a `title` tooltip. The trigger height never changes.
 */
export function ExpandableText({
  text,
  children,
  ariaLabel,
  heading,
  note,
  copy = false,
  panelClassName = '',
  mono = false,
  placement = 'bottom',
  className = '',
  buttonClassName = '',
}: ExpandableTextProps) {
  return (
    <Popover
      className={`min-w-0 ${className}`}
      ariaLabel={ariaLabel}
      title={text}
      placement={placement}
      align="stretch"
      buttonClassName={`block w-full min-w-0 cursor-pointer truncate text-left transition hover:text-zinc-200 ${buttonClassName}`}
      button={children ?? text}
      panelClassName={`max-h-[40vh] overflow-y-auto [scrollbar-width:thin] ${panelClassName}`}
    >
      {heading && <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{heading}</div>}
      <p className={`whitespace-normal break-words text-[13px] leading-relaxed text-zinc-100 ${mono ? 'font-mono' : ''}`}>{text}</p>
      {(note || copy) && (
        <div className="mt-2 flex items-end justify-between gap-3">
          <p className="text-[11px] leading-snug text-zinc-500">{note}</p>
          {copy && <CopyButton text={text} label={typeof copy === 'string' ? copy : undefined} />}
        </div>
      )}
    </Popover>
  );
}
