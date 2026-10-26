import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useProfile } from '@/features/profiles/api';
import { BUDGETS, CATEGORIES, labelOf, OBJECTIVES } from '@/features/profiles/profile-options';
import { isAppError, type AppError } from '@/shared/api/problem';
import { PageContainer, PageHeader } from '@/shared/layout/PageHeader';
import { formatDateTime } from '@/shared/lib/format';
import { idempotencyKeyFor, settleIdempotencyKey } from '@/shared/lib/idempotency';
import { useOnlineStatus } from '@/shared/lib/useOnlineStatus';
import { Banner } from '@/shared/ui/Banner';
import { Button } from '@/shared/ui/Button';
import { ErrorState } from '@/shared/ui/ErrorState';
import { FullPageStatus } from '@/shared/ui/FullPageStatus';
import { SegmentedControl } from '@/shared/ui/SegmentedControl';
import { Switch } from '@/shared/ui/Switch';
import { findActivePlanId, useStartGeneration, type StartGrowthPlanRequest } from './api';
import { useQuota } from './quota';
import { isTerminal } from './stages';

type CampaignCount = '1' | '2' | '3';

type Outcome =
  | { kind: 'unconfirmed' }
  | { kind: 'in-progress'; planId: string | null }
  | { kind: 'quota'; resetsAt: string | null }
  | { kind: 'message'; text: ReactNode };

/** Generate screen (design 3f, FE-4): brief summary, options, quota and the guarded Generate action. */
export function GeneratePage() {
  const { profileId = '' } = useParams();
  const navigate = useNavigate();
  const profile = useProfile(profileId);
  const quota = useQuota();
  const online = useOnlineStatus();
  const start = useStartGeneration();

  const [includeCollaborations, setIncludeCollaborations] = useState(true);
  const [campaigns, setCampaigns] = useState<CampaignCount>('3');
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  if (profile.isPending) return <FullPageStatus label="Loading your brief…" />;
  if (profile.isError) {
    return (
      <PageContainer narrow>
        {isAppError(profile.error) && profile.error.code === 'not_found' ? (
          <ErrorState title="Brief not found">
            This brief doesn&apos;t exist or belongs to another account.{' '}
            <Link to="/app/plans" className="font-medium text-primary hover:underline">
              Back to your plans
            </Link>
          </ErrorState>
        ) : (
          <ErrorState
            title="We couldn't load this brief"
            error={profile.error}
            onRetry={() => void profile.refetch()}
          />
        )}
      </PageContainer>
    );
  }

  const brief = profile.data.profile;
  const remaining = quota.data?.remainingToday;
  const outOfQuota = remaining === 0;
  const body: StartGrowthPlanRequest = {
    businessProfileId: profileId,
    options: { includeCollaborations, includeCampaigns: true, maxCampaigns: Number(campaigns) },
  };
  const scope = `gen:${profileId}`;

  const generate = async () => {
    setOutcome(null);
    // Created on this press; reused only if an earlier press for the same request never got a definite answer.
    const idempotencyKey = idempotencyKeyFor(scope, JSON.stringify(body));
    try {
      const accepted = await start.mutateAsync({ body, idempotencyKey });
      settleIdempotencyKey(scope);
      navigate(isTerminal(accepted.status) ? `/app/plans/${accepted.id}` : `/app/plans/${accepted.id}/progress`);
    } catch (error) {
      setOutcome(await describeFailure(error, scope, profileId, quota.data?.resetsAt ?? null));
    }
  };

  const summary = [
    brief.category === 'Other' ? brief.categoryOther : labelOf(CATEGORIES, brief.category),
    brief.primaryLocation,
    labelOf(OBJECTIVES, brief.marketingObjective),
    brief.budgetRange ? labelOf(BUDGETS, brief.budgetRange) : null,
    plural(brief.referenceEntities?.length ?? 0, 'reference'),
  ]
    .filter(Boolean)
    .join(' · ');

  const blocked = !online || outOfQuota;

  return (
    <PageContainer narrow>
      <PageHeader
        title="Generate your growth plan"
        description="We research cultural data for this brief, then write insights, partnerships, campaigns and experiments."
      />

      <div className="mt-8 flex flex-col gap-4">
        <section
          aria-labelledby="brief-summary"
          className="flex flex-col gap-1.5 rounded-(--radius-card) border border-border bg-surface p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <h2 id="brief-summary" className="text-lg text-ink">
              {brief.brandName}
            </h2>
            <Link
              to={`/app/profiles/${profileId}/edit`}
              className="shrink-0 text-sm font-medium text-primary hover:underline"
            >
              Edit brief
            </Link>
          </div>
          <p className="text-sm text-ink-muted">{summary}</p>
        </section>

        <section aria-label="Plan options" className="rounded-(--radius-card) border border-border bg-surface px-5">
          <div className="flex items-center justify-between gap-4 border-b border-border py-4">
            <span aria-hidden className="text-sm font-medium text-ink">
              Include partnership ideas
            </span>
            <Switch
              label="Include partnership ideas"
              hideLabel
              checked={includeCollaborations}
              onCheckedChange={setIncludeCollaborations}
            />
          </div>
          <div className="flex items-center justify-between gap-4 py-4">
            <span className="text-sm font-medium text-ink">Number of campaigns</span>
            <SegmentedControl
              label="Number of campaigns"
              value={campaigns}
              onChange={setCampaigns}
              options={[
                { value: '1', label: '1' },
                { value: '2', label: '2' },
                { value: '3', label: '3' },
              ]}
            />
          </div>
        </section>

        {quota.data && (
          <p className="text-sm text-ink-muted" aria-live="polite">
            {outOfQuota
              ? `You've used all ${quota.data.dailyLimit} plans for today. More are available from ${formatDateTime(quota.data.resetsAt)}.`
              : `Uses 1 of your ${plural(quota.data.remainingToday, 'remaining plan')} today.`}
          </p>
        )}

        {outcome && <OutcomeBanner outcome={outcome} />}

        <Button
          size="lg"
          className="w-full"
          onClick={() => void generate()}
          loading={start.isPending}
          disabled={blocked}
        >
          {outcome?.kind === 'unconfirmed' ? 'Retry' : 'Generate growth plan'}
        </Button>
        {!online && (
          <p className="flex items-center justify-center gap-2 text-sm font-medium text-ink">
            <span aria-hidden className="size-2 rounded-full bg-weak" />
            Generating needs an internet connection
          </p>
        )}
      </div>
    </PageContainer>
  );
}

function OutcomeBanner({ outcome }: { outcome: Outcome }) {
  switch (outcome.kind) {
    case 'unconfirmed':
      return (
        <Banner tone="danger">
          We couldn&apos;t confirm your request. Retry safely — if it already started, you&apos;ll get the same plan,
          not a second one.
        </Banner>
      );
    case 'in-progress':
      return (
        <Banner tone="info" role="alert">
          A plan for this brief is already being researched.{' '}
          {outcome.planId ? (
            <Link to={`/app/plans/${outcome.planId}/progress`} className="font-medium text-primary hover:underline">
              View its progress
            </Link>
          ) : (
            'Check your plans for its progress.'
          )}
        </Banner>
      );
    case 'quota':
      return (
        <Banner tone="danger">
          You&apos;ve reached today&apos;s plan limit.
          {outcome.resetsAt
            ? ` You can generate again from ${formatDateTime(outcome.resetsAt)}.`
            : ' Try again tomorrow.'}
        </Banner>
      );
    case 'message':
      return <Banner tone="danger">{outcome.text}</Banner>;
  }
}

async function describeFailure(
  error: unknown,
  scope: string,
  profileId: string,
  quotaResetsAt: string | null,
): Promise<Outcome> {
  if (!isAppError(error)) return { kind: 'message', text: 'Something went wrong. Please try again.' };

  // No definite answer (network, timeout, 5xx): keep the key so "Retry" can't create a duplicate plan.
  if (error.isNetwork || error.status >= 500) return { kind: 'unconfirmed' };

  settleIdempotencyKey(scope);
  switch (error.code) {
    case 'plan_in_progress':
      return { kind: 'in-progress', planId: await findActivePlanId(profileId).catch(() => null) };
    case 'generation_quota_exceeded':
      return { kind: 'quota', resetsAt: resetTime(error) ?? quotaResetsAt };
    case 'rate_limited':
      return { kind: 'message', text: 'Too many requests right now. Please wait a minute and try again.' };
    case 'not_found':
      return { kind: 'message', text: 'This brief no longer exists.' };
    case 'idempotency_key_reused':
      return {
        kind: 'message',
        text: 'That request was already used with different options. Please press Generate again.',
      };
    default:
      return { kind: 'message', text: error.detail ?? 'We couldn’t start your plan. Please try again.' };
  }
}

function resetTime(error: AppError): string | null {
  return error.retryAfterSeconds ? new Date(Date.now() + error.retryAfterSeconds * 1000).toISOString() : null;
}

function plural(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? '' : 's'}`;
}
