import { MapPin } from 'lucide-react';
import { Link } from 'react-router';
import type { components } from '@/shared/api/schema';
import { formatDate } from '@/shared/lib/format';
import { StatusChip } from '@/shared/ui/Badge';
import { buttonClasses } from '@/shared/ui/button-classes';
import { CATEGORIES, labelOf } from './profile-options';

type BusinessProfileSummary = components['schemas']['BusinessProfileSummary'];

/** The user's briefs as report cards (Magic Patterns plan-card styling), each with Edit and Generate (US-C3). */
export function BriefsList({ briefs }: { briefs: BusinessProfileSummary[] }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {briefs.map((brief) => (
        <li key={brief.id}>
          <article className="flex h-full flex-col rounded-(--radius-card) border border-border bg-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-medium text-ink-muted">{labelOf(CATEGORIES, brief.category)}</p>
              {brief.latestPlanStatus && <StatusChip status={brief.latestPlanStatus} short />}
            </div>
            <h3 className="mt-3 text-lg leading-snug text-ink">{brief.brandName}</h3>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 text-sm text-ink-muted">
              {brief.primaryLocation && (
                <span className="inline-flex items-center gap-1">
                  <MapPin aria-hidden className="size-3.5" />
                  {brief.primaryLocation}
                </span>
              )}
              <span>{brief.planCount === 1 ? '1 plan' : `${brief.planCount} plans`}</span>
            </p>
            <div className="mt-auto flex items-center justify-between gap-2 pt-5">
              <span className="text-xs text-ink-muted">Updated {formatDate(brief.updatedAt)}</span>
              <div className="flex gap-2">
                <Link
                  to={`/app/profiles/${brief.id}/edit`}
                  className={buttonClasses({ variant: 'secondary', size: 'sm' })}
                  aria-label={`Edit ${brief.brandName} brief`}
                >
                  Edit
                </Link>
                <Link
                  to={`/app/profiles/${brief.id}/generate`}
                  className={buttonClasses({ size: 'sm' })}
                  aria-label={`Generate a plan for ${brief.brandName}`}
                >
                  Generate
                </Link>
              </div>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
