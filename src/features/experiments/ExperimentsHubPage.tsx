import { Link } from 'react-router';
import { PageContainer, PageHeader } from '@/shared/layout/PageHeader';
import { cn } from '@/shared/lib/cn';
import { buttonClasses } from '@/shared/ui/button-classes';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { SkeletonCard } from '@/shared/ui/Skeleton';
import { useExperimentsHub, type ExperimentSummary } from './api';
import { daysRemaining } from './experiment-format';
import { ExperimentActions } from './ExperimentActions';

const COLUMNS = [
  { id: 'Proposed', title: 'Proposed', dot: 'bg-ink-muted' },
  { id: 'Running', title: 'Running', dot: 'bg-ai' },
  { id: 'Concluded', title: 'Concluded', dot: 'bg-evidence' },
] as const;

const column = (s: ExperimentSummary) => (s.experiment.status === 'Abandoned' ? 'Concluded' : s.experiment.status);

/** /app/experiments — every experiment across your plans, from idea to decision (FE-6b, design 5a). */
export function ExperimentsHubPage() {
  const hub = useExperimentsHub();

  return (
    <PageContainer>
      <PageHeader title="Experiments" description="Every test across your plans, from idea to decision." />
      <div className="mt-8">
        {hub.isPending && (
          <div role="status" aria-label="Loading experiments" className="grid gap-4 md:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}
        {hub.isError && (
          <ErrorState title="We couldn't load your experiments" error={hub.error} onRetry={() => void hub.refetch()} />
        )}
        {hub.data && hub.data.items.length === 0 && (
          <EmptyState
            title="No experiments yet"
            action={
              <Link to="/app/plans" className={buttonClasses()}>
                Go to plans
              </Link>
            }
          >
            Experiments come with every growth plan — open a plan and start one.
          </EmptyState>
        )}
        {hub.data && hub.data.items.length > 0 && (
          <>
            <div className="grid items-start gap-4 lg:grid-cols-3">
              {COLUMNS.map((col) => {
                const items = hub.data.items.filter((s) => column(s) === col.id);
                return (
                  <section
                    key={col.id}
                    aria-labelledby={`col-${col.id}`}
                    className="flex flex-col gap-2.5 rounded-(--radius-card) bg-surface-muted p-3"
                  >
                    <div className="flex items-center justify-between px-2 py-1">
                      <h2
                        id={`col-${col.id}`}
                        className="flex items-center gap-2 font-sans text-sm font-medium text-ink"
                      >
                        <span aria-hidden className={cn('size-2 rounded-full', col.dot)} />
                        {col.title}
                      </h2>
                      <span className="text-sm text-ink-muted">
                        {items.length}
                        <span className="sr-only"> experiments</span>
                      </span>
                    </div>
                    {items.length === 0 ? (
                      <p className="px-2 pb-2 text-sm text-ink-muted">Nothing here yet.</p>
                    ) : (
                      <ul className="flex flex-col gap-2.5">
                        {items.map((s) => (
                          <li key={`${s.growthPlanId}:${s.experiment.id}`}>
                            <HubCard summary={s} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>
            {hub.data.totalCount > hub.data.items.length && (
              <p className="mt-4 text-sm text-ink-muted">
                Showing the latest {hub.data.items.length} of {hub.data.totalCount} experiments.
              </p>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
}

function HubCard({ summary }: { summary: ExperimentSummary }) {
  const { experiment, growthPlanId, brandName } = summary;
  const remaining = daysRemaining(experiment);
  const concluded = experiment.status === 'Concluded' || experiment.status === 'Abandoned';

  return (
    <ExperimentActions planId={growthPlanId} experiment={experiment}>
      {({ onStart, onRecordResult, busy }) => (
        <article className="flex flex-col gap-1.5 rounded-(--radius-input) border border-border bg-surface p-4">
          <p className="text-xs text-ink-muted">{brandName}</p>
          <h3 className="font-sans text-sm leading-snug font-medium text-ink">{experiment.hypothesis}</h3>
          <p className="text-xs text-ink-muted">{experiment.primaryMetric}</p>
          {remaining !== null && (
            <p className="text-xs font-medium text-ai">
              {remaining === 1 ? '1 day remaining' : `${remaining} days remaining`}
            </p>
          )}
          {concluded && (
            <p className="text-xs text-ink-muted">
              {experiment.status === 'Abandoned' ? (
                <span className="font-medium text-ink">Abandoned</span>
              ) : (
                <>
                  <span className="font-medium text-ink">{experiment.observedResult ?? 'No result recorded'}</span> vs{' '}
                  {experiment.successThreshold}
                </>
              )}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {experiment.status === 'Proposed' && onStart && (
              <Button size="sm" onClick={onStart} loading={busy}>
                Start
              </Button>
            )}
            {experiment.status === 'Running' && onRecordResult && (
              <Button size="sm" variant="secondary" onClick={onRecordResult} disabled={busy}>
                Record result
              </Button>
            )}
            <Link
              to={`/app/plans/${growthPlanId}?tab=experiments`}
              className="text-sm font-medium text-primary hover:underline"
              aria-label={`Open plan for ${brandName}`}
            >
              Open plan
            </Link>
          </div>
        </article>
      )}
    </ExperimentActions>
  );
}
