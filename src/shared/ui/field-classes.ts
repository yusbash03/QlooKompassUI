import { cn } from '@/shared/lib/cn';

/** Text inputs, selects and textareas (Magic Patterns brief form). */
export const controlClasses = cn(
  'w-full rounded-(--radius-input) border border-border bg-surface px-3 text-sm text-ink transition-colors',
  'placeholder:text-ink-muted/80',
  'aria-invalid:border-danger',
  'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-muted',
);

export const labelClasses = 'text-sm font-medium text-ink';
/** Hints sit between the label and the control. */
export const hintClasses = 'text-xs text-ink-muted';
export const errorClasses = 'text-xs text-danger';
