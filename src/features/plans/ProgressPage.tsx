import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useCurrentUser } from '@/features/auth/auth-context';
import { isAppError } from '@/shared/api/problem';
import { queryKeys } from '@/shared/api/queryKeys';
import { PageContainer } from '@/shared/layout/PageHeader';
import { StatusChip } from '@/shared/ui/Badge';
import { Banner } from '@/shared/ui/Banner';
import { buttonClasses } from '@/shared/ui/button-classes';
import { ErrorState } from '@/shared/ui/ErrorState';
import { FullPageStatus } from '@/shared/ui/FullPageStatus';
import { ProgressSteps } from '@/shared/ui/ProgressSteps';
import { usePlan, usePlanStatus } from './api';
import { toProgressSteps } from './stages';

/** Research progress (design 3g/3h, FE-4). Shows only what the backend reports; never a fake percentage. */
export function ProgressPage() {
  const { planId = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = useCurrentUser().id;
  const status = usePlanStatus(planId);
  const plan = usePlan(planId);

  const current = status.data?.status;
  const done = current === 'Completed' || current === 'CompletedWithLimitations';

  // Hand off to the report exactly once. Re-running this on every render (new query-key objects, refetches) restarted the
  // navigation and cancelled the plan fetch in a loop — the page flickered and showed the offline state.
  const handedOff = useRef(false);
  useEffect(() => {
    if (!done || handedOff.current) return;
    handedOff.current = true;
    const keys = queryKeys.user(userId);
    // The plan's content only exists once it's terminal: drop the early (Running) copy, then open the report. Removing
    // rather than invalidating matters — PlanPage would otherwise see the stale Running copy and bounce straight back.
    queryClient.removeQueries({ queryKey: keys.plan(planId), exact: true });
    void queryClient.invalidateQueries({ queryKey: [...keys.all, 'profiles'] });
    navigate(`/app/plans/${planId}`, { replace: true });
  }, [done, navigate, planId, queryClient, userId]);

  if (status.isPending) return <FullPageStatus label="Checking your plan…" />;
  if (status.isError) {
    return (
      <PageContainer narrow>
        {isAppError(status.error) && status.error.code === 'not_found' ? (
          <ErrorState title="Plan not found">
            This plan doesn&apos;t exist or belongs to another account.{' '}
            <Link to="/app/plans" className="font-medium text-primary hover:underline">
              Back to your plans
            </Link>
          </ErrorState>
        ) : (
          <ErrorState title="We couldn't check this plan" error={status.error} onRetry={() => void status.refetch()} />
        )}
      </PageContainer>
    );
  }

  const data = status.data;
  const steps = toProgressSteps(data.stages);
  const failed = data.status === 'Failed';
  const active = steps.find((s) => s.state === 'active');
  const profileId = plan.data?.businessProfileId;

  return (
    <PageContainer narrow>
      <div className="mx-auto max-w-xl">
        {plan.data && <p className="text-sm text-ink-muted">{plan.data.brandName}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-[28px] tracking-tight text-ink">
            {failed ? 'We couldn’t finish this plan' : 'Building your growth plan'}
          </h1>
          {failed && <StatusChip status="Failed" />}
        </div>

        {failed && (
          <Banner tone="danger" className="mt-6">
            {data.error?.message ?? 'Something went wrong while researching this plan.'}
          </Banner>
        )}

        <div className="mt-6 rounded-(--radius-card) border border-border bg-surface p-6">
          {steps.length > 0 ? (
            <ProgressSteps label="Research progress" steps={steps} />
          ) : (
            <p className="text-sm text-ink-muted">Waiting to start — usually a few seconds.</p>
          )}
        </div>

        {/* One polite announcement per stage change, so screen-reader users hear progress without the whole list. */}
        <p aria-live="polite" className="sr-only">
          {failed
            ? 'Plan failed.'
            : active
              ? `${active.label}${active.detail ? `: ${active.detail}` : ''}`
              : data.status === 'Queued'
                ? 'Waiting to start.'
                : ''}
        </p>

        {failed ? (
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            {profileId && (
              <>
                <Link to={`/app/profiles/${profileId}/edit`} className={buttonClasses({ variant: 'secondary' })}>
                  Edit brief
                </Link>
                <Link to={`/app/profiles/${profileId}/generate`} className={buttonClasses()}>
                  Try again
                </Link>
              </>
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">
            Usually 30–90 seconds. You can leave this page — we&apos;ll keep working.{' '}
            <Link to="/app/plans" className="font-medium text-primary hover:underline">
              Back to plans
            </Link>
          </p>
        )}
      </div>
    </PageContainer>
  );
}
