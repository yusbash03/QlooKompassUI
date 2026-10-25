import type { components } from '@/shared/api/schema';

export type GenerationStatus = components['schemas']['GenerationStatus'];

/** Plan status chip styles (Magic Patterns plans list). `short` is used on compact cards. */
export const STATUS_META: Record<GenerationStatus, { label: string; short: string; chip: string }> = {
  Queued: { label: 'Queued', short: 'Queued', chip: 'bg-surface-muted text-ink-muted' },
  Running: { label: 'Running', short: 'Running', chip: 'bg-ai-bg text-ai' },
  Completed: { label: 'Completed', short: 'Completed', chip: 'bg-evidence-bg text-evidence' },
  CompletedWithLimitations: {
    label: 'Completed with limitations',
    short: 'With limitations',
    chip: 'bg-warning-bg text-moderate',
  },
  Failed: { label: 'Failed', short: 'Failed', chip: 'border border-danger text-danger' },
};
