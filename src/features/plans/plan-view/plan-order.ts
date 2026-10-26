import type { EvidenceQuality } from '@/features/evidence/types';

const RANK: Record<EvidenceQuality, number> = { Strong: 0, Moderate: 1, Weak: 2 };

/** Strongest evidence first; stable for equal strength so the plan's own order is kept. */
export function byStrength<T extends { evidenceStrength: EvidenceQuality }>(items: T[]): T[] {
  return [...items].sort((a, b) => RANK[a.evidenceStrength] - RANK[b.evidenceStrength]);
}

export const PLAN_TABS = ['overview', 'insights', 'partnerships', 'campaigns', 'experiments', 'evidence'] as const;
export type PlanTab = (typeof PLAN_TABS)[number];

export function toPlanTab(value: string | null): PlanTab {
  return PLAN_TABS.find((t) => t === value) ?? 'overview';
}
