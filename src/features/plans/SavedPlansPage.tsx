import { ChevronLeft, ChevronRight, Plus, WifiOff } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router';
import type { OfflineCopy } from '@/features/offline/offlineStore';
import { useOfflineCopies } from '@/features/offline/useOfflineCopies';
import { useProfiles } from '@/features/profiles/api';
import { BriefsList } from '@/features/profiles/BriefsList';
import { PageContainer, PageHeader } from '@/shared/layout/PageHeader';
import { cn } from '@/shared/lib/cn';
import { useOnlineStatus } from '@/shared/lib/useOnlineStatus';
import { Banner } from '@/shared/ui/Banner';
import { Button } from '@/shared/ui/Button';
import { buttonClasses } from '@/shared/ui/button-classes';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { controlClasses } from '@/shared/ui/field-classes';
import { SkeletonCard } from '@/shared/ui/Skeleton';
import { STATUS_META } from '@/shared/ui/status-meta';
import { PLANS_PAGE_SIZE, usePlans, type GrowthPlan, type GrowthPlanSummary } from './api';
import { PlanCard } from './PlanCard';

type Status = GrowthPlanSummary['status'];
const STATUSES = Object.keys(STATUS_META) as Status[];

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

/** Saved plans (FE-6): paged list with brief/status filters; offline it lists this device's offline copies only. */
export function SavedPlansPage() {
  const flash = flashFrom(useLocation().state);
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const briefFilter = params.get('brief') ?? undefined;
  const statusParam = params.get('status');
  const statusFilter = STATUSES.find((s) => s === statusParam);

  const online = useOnlineStatus();
  const plans = usePlans({ page, businessProfileId: briefFilter, status: statusFilter });
  const profiles = useProfiles();
  const offlineCopies = useOfflineCopies();
  const offlineIds = new Set((offlineCopies.data ?? []).map((c) => c.plan.id));
  const showOffline = !online || plans.fetchStatus === 'paused';

  const setFilter = (key: 'brief' | 'status' | 'page', value: string | null) =>
    setParams((p) => {
      const next = new URLSearchParams(p);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== 'page') next.delete('page');
      return next;
    });

  const briefs = profiles.data?.items ?? [];
  const totalPages = plans.data ? Math.max(1, Math.ceil(plans.data.totalCount / PLANS_PAGE_SIZE)) : 1;
  const filtered = Boolean(briefFilter || statusFilter);

  return (
    <PageContainer>
      <PageHeader
        title="Plans"
        description="Growth plans generated from your brand briefs."
        actions={briefs.length > 0 ? newBriefLink : undefined}
      />
      {flash && (
        <Banner className="mt-6" tone="info">
          {flash}
        </Banner>
      )}

      {showOffline ? (
        <OfflineList copies={offlineCopies.data ?? []} loading={offlineCopies.isPending} />
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <select
                aria-label="Filter by brief"
                value={briefFilter ?? ''}
                onChange={(e) => setFilter('brief', e.target.value || null)}
                className={cn(controlClasses, 'h-10 w-auto')}
              >
                <option value="">All briefs</option>
                {briefs.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.brandName}
                  </option>
                ))}
              </select>
              <select
                aria-label="Filter by status"
                value={statusFilter ?? ''}
                onChange={(e) => setFilter('status', e.target.value || null)}
                className={cn(controlClasses, 'h-10 w-auto')}
              >
                <option value="">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </select>
            </div>
            {plans.data && (
              <p className="text-sm text-ink-muted" aria-live="polite">
                {plans.data.totalCount === 1 ? '1 plan' : `${plans.data.totalCount} plans`}
              </p>
            )}
          </div>

          <div className="mt-4">
            {plans.isPending && (
              <div role="status" aria-label="Loading your plans" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            )}
            {plans.isError && (
              <ErrorState
                title="We couldn't load your plans"
                error={plans.error}
                onRetry={() => void plans.refetch()}
              />
            )}
            {plans.data &&
              plans.data.items.length === 0 &&
              (filtered ? (
                <p className="rounded-(--radius-card) border border-dashed border-border px-6 py-10 text-center text-sm text-ink-muted">
                  No plans match these filters.{' '}
                  <button
                    type="button"
                    onClick={() => setParams({})}
                    className="font-medium text-primary hover:underline"
                  >
                    Clear filters
                  </button>
                </p>
              ) : (
                <EmptyState
                  title="No plans yet"
                  action={
                    briefs.length > 0 ? (
                      <Link to={`/app/profiles/${briefs[0]!.id}/generate`} className={buttonClasses()}>
                        Generate your first plan
                      </Link>
                    ) : (
                      newBriefLink
                    )
                  }
                >
                  {briefs.length > 0
                    ? 'Generate a plan from one of your briefs. It takes about a minute.'
                    : 'Describe your brand and goal. Your first growth plan takes about a minute.'}
                </EmptyState>
              ))}
            {plans.data && plans.data.items.length > 0 && (
              <>
                <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {plans.data.items.map((plan) => (
                    <li key={plan.id}>
                      <PlanCard plan={plan} offline={offlineIds.has(plan.id)} />
                    </li>
                  ))}
                </ul>
                {totalPages > 1 && (
                  <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-4">
                    <Button
                      variant="secondary"
                      disabled={page <= 1}
                      onClick={() => setFilter('page', String(page - 1))}
                    >
                      <ChevronLeft aria-hidden className="size-4" />
                      Previous
                    </Button>
                    <p className="text-sm text-ink-muted">
                      Page {page} of {totalPages}
                    </p>
                    <Button
                      variant="secondary"
                      disabled={page >= totalPages}
                      onClick={() => setFilter('page', String(page + 1))}
                    >
                      Next
                      <ChevronRight aria-hidden className="size-4" />
                    </Button>
                  </nav>
                )}
              </>
            )}
          </div>

          {briefs.length > 0 && (
            <section aria-labelledby="briefs-heading" className="mt-12">
              <h2 id="briefs-heading" className="text-[22px] text-ink">
                Your briefs
              </h2>
              <p className="mt-1 text-sm text-ink-muted">Generate a plan from any brief, or edit it first.</p>
              <div className="mt-4">
                <BriefsList briefs={briefs} />
              </div>
            </section>
          )}
        </>
      )}
    </PageContainer>
  );
}

/** The list card needs a summary; an offline copy stores the whole plan. */
function toSummary(plan: GrowthPlan): GrowthPlanSummary {
  return {
    id: plan.id,
    businessProfileId: plan.businessProfileId,
    brandName: plan.brandName,
    status: plan.status,
    headline: plan.summary?.headline ?? null,
    isMock: plan.isMock,
    counts: {
      evidence: plan.evidence.length,
      insights: plan.insights.length,
      collaborations: plan.collaborations.length,
      campaigns: plan.campaigns.length,
      experiments: plan.experiments.length,
    },
    createdAt: plan.createdAt,
    completedAt: plan.completedAt ?? null,
  };
}

function OfflineList({ copies, loading }: { copies: OfflineCopy[]; loading: boolean }) {
  if (loading) return null;
  return (
    <section aria-labelledby="offline-heading" className="mt-8">
      <h2 id="offline-heading" className="flex items-center gap-2 text-[22px] text-ink">
        <WifiOff aria-hidden className="size-5 text-ink-muted" />
        Saved on this device
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        You&apos;re offline, so only plans you made available offline are shown. Generating needs a connection.
      </p>
      {copies.length === 0 ? (
        <p className="mt-4 rounded-(--radius-card) border border-dashed border-border px-6 py-10 text-center text-sm text-ink-muted">
          No plans are saved on this device yet.
        </p>
      ) : (
        <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {copies.map(({ plan, savedAt }) => (
            <li key={plan.id}>
              <PlanCard plan={toSummary(plan)} offline savedAt={savedAt} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
