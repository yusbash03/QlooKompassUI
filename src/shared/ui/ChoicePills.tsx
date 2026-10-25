import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/cn';

interface ChoicePillsProps extends Omit<ComponentProps<'input'>, 'type'> {
  legend: string;
  options: readonly { value: string; label: string }[];
  /** Current value, for styling the selected pill (pass from useWatch). */
  selected: string;
  error?: string;
  hint?: string;
}

/**
 * Pill-shaped radio group (budget band, design 3c). Native radios keep keyboard and screen-reader behaviour;
 * spread `register(name)` onto it.
 */
export function ChoicePills({ legend, options, selected, error, hint, name, ...inputProps }: ChoicePillsProps) {
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined;
  return (
    <fieldset aria-describedby={describedBy} className="flex flex-col gap-2.5">
      <legend className={cn('mb-2.5 text-[13px] font-medium', error ? 'text-danger' : 'text-ink')}>{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors',
              'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus',
              selected === option.value
                ? 'border-primary bg-primary-soft text-primary'
                : 'border-border-strong bg-surface text-ink hover:bg-surface-muted',
            )}
          >
            <input type="radio" value={option.value} name={name} className="sr-only" {...inputProps} />
            {option.label}
          </label>
        ))}
      </div>
      {hint && !error && (
        <p id={`${name}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="text-xs text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
