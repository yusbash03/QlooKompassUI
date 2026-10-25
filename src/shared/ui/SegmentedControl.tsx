import { useRef, type KeyboardEvent } from 'react';
import { cn } from '@/shared/lib/cn';

interface SegmentedControlProps<T extends string> {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  hideLabel?: boolean;
  /** Stretch segments to fill the width (e.g. Concluded / Abandoned in a dialog). */
  fill?: boolean;
  className?: string;
}

/**
 * Single-choice segmented control — a radio group with roving focus (arrow keys move and select).
 * Used for campaign count, experiment outcome and Board/List views.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  hideLabel = true,
  fill = false,
  className,
}: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const delta =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + options.length) % options.length;
    const option = options[next];
    if (!option) return;
    onChange(option.value);
    refs.current[next]?.focus();
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <span id={`${label}-label`} className={cn('text-[13px] font-medium text-ink', hideLabel && 'sr-only')}>
        {label}
      </span>
      <div
        role="radiogroup"
        aria-label={label}
        className={cn(
          'inline-flex overflow-hidden rounded-(--radius-input) border border-border-strong bg-surface text-sm font-semibold',
          fill && 'flex w-full',
        )}
      >
        {options.map((option, index) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              ref={(el) => {
                refs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(option.value)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={cn(
                'px-3.5 py-2 transition-colors duration-150 focus-visible:-outline-offset-2',
                fill && 'flex-1',
                selected ? 'bg-inverse text-inverse-ink' : 'text-ink hover:bg-surface-muted',
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
