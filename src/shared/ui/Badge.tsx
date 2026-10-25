import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { STATUS_META, type GenerationStatus } from './status-meta';

const badgeTones = {
  neutral: 'bg-surface-muted text-ink-muted',
  outline: 'border border-border text-ink-muted',
  /** Effort: Low / Medium / High as outlined pills. */
  low: 'border border-strong text-strong',
  medium: 'border border-moderate text-moderate',
  high: 'border border-danger text-danger',
  /** Mono tags such as "dev". */
  code: 'border border-border px-1.5 font-mono text-[10px] font-normal text-ink-muted',
} as const;

export type BadgeTone = keyof typeof badgeTones;

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Plan status chip; Running shows a spinner so the state isn't conveyed by colour alone. */
export function StatusChip({
  status,
  short = false,
  className,
}: {
  status: GenerationStatus;
  short?: boolean;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        meta.chip,
        className,
      )}
    >
      {status === 'Running' && <LoaderCircle aria-hidden className="size-3 motion-safe:animate-spin" />}
      {short ? meta.short : meta.label}
    </span>
  );
}
