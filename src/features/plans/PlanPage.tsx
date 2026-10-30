import { WifiOff } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router';
import { ExperimentActions } from '@/features/experiments/ExperimentActions';
import { ExperimentCard } from '@/features/experiments/ExperimentCard';
import { OfflineToggle } from '@/features/offline/OfflineToggle';
import { useOfflineCopy } from '@/features/offline/useOfflineCopies';
import { isAppError } from '@/shared/api/problem';
import { PageContainer } from '@/shared/layout/PageHeader';
import { formatDate } from '@/shared/lib/format';
import { Banner } from '@/shared/ui/Banner';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { FullPageStatus } from '@/shared/ui/FullPageStatus';
import { usePlan } from './api';
import { PlanView } from './plan-view/PlanView';

/**
 * /app/plans/:planId — the user's own growth plan (FE-5). Unfinished or failed plans live on the progress screen.
 * Offline (or when the network fails) a saved offline copy is shown instead, clearly labelled (FE-6).
 */
export function PlanPage() {
  const { planId = '' } = useParams();
  const plan = usePlan(planId);
  const copy = useOfflineCopy(planId);

  // TanStack Query pauses fetches while offline: `paused` means we're waiting for a connection, not loading.
  const unreachable = plan.fetchStatus === 'paused' || (plan.isError && isAppError(plan.error) && plan.error.isNetwork);

  if (!plan.data && unreachable) {
    if (copy.isPending) return <FullPageStatus label="Looking for an offline copy…" />;
    if (copy.data) {
      return (
        <PlanView
          plan={copy.data.plan}
          mode="app"
          offlineNotice={
            <Banner tone="offline" strip>
              Offline copy · saved {formatDate(copy.data.savedAt)}. Changes need a connection.
            </Banner>
          }
        />
      );
    }
    return (
      <PageContainer narrow>
        <EmptyState icon={WifiOff} title="You’re offline">
          This plan isn&apos;t saved on this device. Turn on “Available offline” for a plan while connected to read it
          offline.{' '}
          <Link to="/app/plans" className="font-medium text-primary hover:underline">
            See saved plans
          </Link>
        </EmptyState>
      </PageContainer>
    );
  }

  if (plan.isPending) return <FullPageStatus label="Loading your plan…" />;
  if (plan.isError) {
    return (
      <PageContainer narrow>
        {isAppError(plan.error) && plan.error.code === 'not_found' ? (
          <ErrorState title="Plan not found">
            This plan doesn&apos;t exist or belongs to another account.{' '}
            <Link to="/app/plans" className="font-medium text-primary hover:underline">
              Back to your plans
            </Link>
          </ErrorState>
        ) : (
          <ErrorState title="We couldn't load this plan" error={plan.error} onRetry={() => void plan.refetch()} />
        )}
      </PageContainer>
    );
  }

  const data = plan.data;
  if (data.status === 'Queued' || data.status === 'Running' || data.status === 'Failed') {
    // A cached unfinished copy may be stale (the plan just completed): wait for the refetch before redirecting.
    if (plan.isFetching) return <FullPageStatus label="Loading your plan…" />;
    return <Navigate to={`/app/plans/${planId}/progress`} replace />;
  }
  return (
    <PlanView
      plan={data}
      mode="app"
      headerActions={<OfflineToggle plan={data} />}
      renderExperiment={(experiment, campaignName) => (
        <ExperimentActions planId={data.id} experiment={experiment}>
          {(actions) => <ExperimentCard experiment={experiment} campaignName={campaignName} {...actions} />}
        </ExperimentActions>
      )}
    />
  );
}
