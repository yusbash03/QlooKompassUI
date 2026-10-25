import { cn } from '@/shared/lib/cn';

// Magic Patterns design (Design/magic-patterns): medium weight, 10px corners, one hairline border colour.
const variants = {
  primary: 'bg-primary text-primary-ink hover:bg-primary-hover',
  secondary: 'border border-border bg-surface text-ink hover:bg-surface-muted',
  ghost: 'text-ink hover:bg-surface-muted',
  // primary-ink is white in light mode and ink in dark mode, where the danger red is too light for white text.
  destructive: 'bg-danger text-primary-ink hover:brightness-110',
  /** Dark button, e.g. "Reload" in the update toast. */
  inverse: 'bg-ink text-bg hover:opacity-90',
} as const;

const sizes = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

/** Shared by <Button> and by router <Link>s styled as buttons. */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
}: { variant?: ButtonVariant; size?: ButtonSize } = {}) {
  return cn(
    'inline-flex items-center justify-center whitespace-nowrap rounded-(--radius-input) font-medium transition-colors duration-150',
    'disabled:cursor-not-allowed disabled:opacity-50',
    variants[variant],
    sizes[size],
  );
}
