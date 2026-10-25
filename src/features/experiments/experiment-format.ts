import type { Experiment } from '@/features/evidence/types';

/** "exp_1" → "EXP-01" (the label used throughout the design). */
export function experimentLabel(id: string): string {
  const n = /(\d+)$/.exec(id)?.[1];
  return n ? `EXP-${n.padStart(2, '0')}` : id.toUpperCase();
}

const DAY_MS = 86_400_000;

/** Whole days left in a running experiment's measurement period, or null when not running. */
export function daysRemaining(experiment: Experiment, now = Date.now()): number | null {
  if (experiment.status !== 'Running' || !experiment.startedAt) return null;
  const end = Date.parse(experiment.startedAt) + experiment.measurementPeriodDays * DAY_MS;
  return Math.max(0, Math.ceil((end - now) / DAY_MS));
}
