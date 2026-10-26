import { CloudDownload } from 'lucide-react';
import { Link } from 'react-router';
import { formatDate } from '@/shared/lib/format';
import { Badge, StatusChip } from '@/shared/ui/Badge';
import type { GrowthPlanSummary } from './api';

const plural = (n: number | undefined, noun: string) => `${n ?? 0} ${noun}${n === 1 ? '' : 's'}`;

/** Saved-plan report card (Magic Patterns plans list). */
export function PlanCard({
  plan,
  offline = false,
  savedAt,
}: {
  plan: GrowthPlanSummary;
  offline?: boolean;
  savedAt?: string;
}) {
  const unfinished = plan.status === 'Queued' || plan.status === 'Running';
  const failed = plan.status === 'Failed';
  const href = unfinished || failed ? `/app/plans/${plan.id}/progress` : `/app/plans/${plan.id}`;
  const c = plan.counts;
  const blurb = unfinished
    ? plan.status === 'Queued'
      ? 'Waiting to start — usually a few seconds.'
      : 'Searching cultural data and writing recommendations.'
    : failed
      ? 'Open to see why and try again.'
      : `${plural(c?.insights, 'insight')} · ${plural(c?.collaborations, 'partnership')} · ${plural(c?.campaigns, 'campaign')} · ${plural(c?.experiments, 'experiment')}`;

  return (
    <Link
      to={href}
      className="group flex h-full flex-col rounded-(--radius-card) border border-border bg-surface p-5 transition-colors hover:border-ink-muted"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-medium text-ink-muted">{plan.brandName}</p>
        <StatusChip status={plan.status} short />
      </div>
      <h3 className="mt-3 text-lg leading-snug text-ink">
        {unfinished
          ? 'Researching your brief…'
          : failed
            ? 'Plan couldn’t be completed'
            : (plan.headline ?? 'Growth plan')}
      </h3>
      <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{blurb}</p>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-5 text-xs text-ink-muted">
        <span>{formatDate(plan.completedAt ?? plan.createdAt)}</span>
        {offline && (
          <Badge tone="outline" className="gap-1 font-normal">
            <CloudDownload aria-hidden className="size-3" />
            Offline copy{savedAt ? ` · saved ${formatDate(savedAt)}` : ''}
          </Badge>
        )}
        {plan.isMock && (
          <Badge tone="code" className="border-transparent bg-[#14122B] text-[#FBBF24]">
            MOCK
          </Badge>
        )}
      </div>
    </Link>
  );
}
