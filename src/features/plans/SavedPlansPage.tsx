import { Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useProfiles } from '@/features/profiles/api';
import { BriefsList } from '@/features/profiles/BriefsList';
import { PageContainer, PageHeader } from '@/shared/layout/PageHeader';
import { Banner } from '@/shared/ui/Banner';
import { buttonClasses } from '@/shared/ui/button-classes';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { SkeletonCard } from '@/shared/ui/Skeleton';

function flashFrom(state: unknown): string | null {
  if (typeof state !== 'object' || state === null || !('flash' in state)) return null;
  return typeof state.flash === 'string' ? state.flash : null;
}

const newBriefLink = (
  <Link to="/app/profiles/new" className={buttonClasses()}>
    <Plus aria-hidden className="size-4" />
    New brief
  </Link>
);

// FE-2/3: briefs + empty state. FE-6 adds the paged plans list from GET /growth-plans, filters and offline copies.
export function SavedPlansPage() {
  const flash = flashFrom(useLocation().state);
  const profiles = useProfiles();
  const hasBriefs = (profiles.data?.items.length ?? 0) > 0;

  return (
    <PageContainer>
      <PageHeader
        title="Plans"
        description="Growth plans generated from your brand briefs."
        actions={hasBriefs ? newBriefLink : undefined}
      />
      {flash && (
        <Banner className="mt-6" tone="info">
          {flash}
        </Banner>
      )}

      <div className="mt-8">
        {profiles.isPending && (
          <div role="status" aria-label="Loading your briefs" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}
        {profiles.isError && (
          <ErrorState
            title="We couldn't load your briefs"
            error={profiles.error}
            onRetry={() => void profiles.refetch()}
          />
        )}
        {profiles.data && !hasBriefs && (
          <EmptyState title="No plans yet" action={newBriefLink}>
            Describe your brand and goal. Your first growth plan takes about a minute.
          </EmptyState>
        )}
        {profiles.data && hasBriefs && (
          <section aria-labelledby="briefs-heading">
            <h2 id="briefs-heading" className="text-[22px] text-ink">
              Your briefs
            </h2>
            <p className="mt-1 text-sm text-ink-muted">Generate a plan from any brief, or edit it first.</p>
            <div className="mt-4">
              <BriefsList briefs={profiles.data.items} />
            </div>
          </section>
        )}
      </div>
    </PageContainer>
  );
}
