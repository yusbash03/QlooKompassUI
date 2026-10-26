import { Info } from 'lucide-react';
import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ProvenanceLabel } from '@/features/evidence/ProvenanceLabel';
import { usePlan, type GrowthPlan } from '@/features/plans/api';
import { isTerminal } from '@/features/plans/stages';
import { useProfiles } from '@/features/profiles/api';
import { isAppError } from '@/shared/api/problem';
import { PageContainer, PageHeader } from '@/shared/layout/PageHeader';
import { idempotencyKeyFor, settleIdempotencyKey } from '@/shared/lib/idempotency';
import { useOnlineStatus } from '@/shared/lib/useOnlineStatus';
import { Badge } from '@/shared/ui/Badge';
import { Banner } from '@/shared/ui/Banner';
import { buttonClasses } from '@/shared/ui/button-classes';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { SelectField, TextareaField } from '@/shared/ui/Field';
import { Skeleton } from '@/shared/ui/Skeleton';
import { useEvaluation, useStartEvaluation, type Evaluation } from './api';
import { Highlighted } from './Highlighted';
import { parseLlmOnlyDraft, unverifiedNames, type LlmOnlyDraft } from './llm-only-draft';
import { MetricsTable } from './MetricsTable';

// True by construction (BE-04 §4), so it is always shown — the backend's own notes follow it.
const BUILT_IN_CAVEAT = 'The AI-only plan cannot cite retrieved data by design.';

const scopeFor = (profileId: string) => `eval:${profileId}`;

/** /app/evaluate — LLM-only vs Qloo-grounded comparison for judges & developers (FE-8, US-G1). Behind feature flags. */
export function EvaluationPage() {
  const [params, setParams] = useSearchParams();
  const runId = params.get('run');
  const profiles = useProfiles();
  const start = useStartEvaluation();
  const online = useOnlineStatus();
  const [profileId, setProfileId] = useState('');
  const [startError, setStartError] = useState<string | null>(null);
  const [unconfirmed, setUnconfirmed] = useState(false);

  const briefs = profiles.data?.items ?? [];
  const selected = profileId || briefs[0]?.id || '';

  const run = (event?: FormEvent) => {
    event?.preventDefault();
    if (!selected) return;
    setStartError(null);
    setUnconfirmed(false);
    const scope = scopeFor(selected);
    start.mutate(
      { businessProfileId: selected, idempotencyKey: idempotencyKeyFor(scope, 'v1') },
      {
        onSuccess: (evaluation) => {
          settleIdempotencyKey(scope);
          setParams({ run: evaluation.id });
        },
        onError: (error) => {
          // No definite answer: keep the key so "Retry" can't start a second comparison.
          if (isAppError(error) && (error.isNetwork || (error.status >= 500 && error.code !== 'feature_disabled'))) {
            setUnconfirmed(true);
            return;
          }
          settleIdempotencyKey(scope);
          setStartError(startFailureText(error));
        },
      },
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title={
          <span className="inline-flex flex-wrap items-center gap-3">
            Evaluation mode <Badge tone="outline">for judges &amp; developers</Badge>
          </span>
        }
        description="Run the same brief through the Qloo-grounded pipeline and an AI-only prompt, then compare."
      />

      <div className="mt-8 flex flex-col gap-8">
        {profiles.isPending && <Skeleton className="h-10 w-full max-w-xl" />}
        {profiles.isError && (
          <ErrorState
            title="We couldn't load your briefs"
            error={profiles.error}
            onRetry={() => void profiles.refetch()}
          />
        )}
        {profiles.data && briefs.length === 0 && (
          <EmptyState
            title="Create a brief first"
            action={
              <Link to="/app/profiles/new" className={buttonClasses()}>
                New brief
              </Link>
            }
          >
            A comparison runs one of your briefs through both approaches.
          </EmptyState>
        )}
        {briefs.length > 0 && (
          <form onSubmit={run} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <SelectField
              label="Brief"
              className="w-full sm:max-w-md"
              value={selected}
              onChange={(e) => setProfileId(e.target.value)}
              options={briefs.map((b) => ({ value: b.id, label: b.brandName }))}
            />
            <Button type="submit" loading={start.isPending} disabled={!online}>
              Run comparison
            </Button>
          </form>
        )}
        {!online && briefs.length > 0 && (
          <p className="-mt-5 text-sm text-ink-muted">Running a comparison needs a connection.</p>
        )}

        <div aria-live="polite">
          {unconfirmed && (
            <Banner
              tone="danger"
              title="We couldn't confirm your request"
              action={
                <Button size="sm" variant="secondary" onClick={() => run()}>
                  Retry safely
                </Button>
              }
            >
              Retrying won&apos;t start a second comparison.
            </Banner>
          )}
          {startError && <Banner tone="danger">{startError}</Banner>}
        </div>

        {runId && <EvaluationResult id={runId} />}
      </div>
    </PageContainer>
  );
}

function startFailureText(error: unknown): string {
  if (!isAppError(error)) return 'We couldn’t start the comparison. Please try again.';
  switch (error.code) {
    case 'generation_quota_exceeded':
      return 'You’ve reached today’s generation limit. A comparison generates a plan, so it counts toward the limit.';
    case 'feature_disabled':
      return 'Evaluation mode is turned off on the server.';
    case 'rate_limited':
      return 'Too many requests right now. Please wait a minute and try again.';
    case 'not_found':
      return 'This brief no longer exists.';
    default:
      return error.detail ?? 'We couldn’t start the comparison. Please try again.';
  }
}

function EvaluationResult({ id }: { id: string }) {
  const evaluation = useEvaluation(id);

  if (evaluation.isPending) {
    return <p className="text-sm text-ink-muted">Loading the comparison…</p>;
  }
  if (evaluation.isError) {
    return (
      <ErrorState
        title={
          isAppError(evaluation.error) && evaluation.error.code === 'not_found'
            ? 'Comparison not found'
            : "We couldn't load this comparison"
        }
        error={evaluation.error}
        onRetry={() => void evaluation.refetch()}
      />
    );
  }

  const data = evaluation.data;
  if (!isTerminal(data.status)) {
    return (
      <div role="status" className="rounded-(--radius-card) border border-border bg-surface p-5 text-sm text-ink">
        <p className="font-medium">Running comparison…</p>
        <p className="mt-1 text-ink-muted">
          The grounded plan goes through the full research pipeline, so this can take a minute or two.
        </p>
      </div>
    );
  }
  if (data.status === 'Failed') {
    return (
      <Banner tone="danger" title="The comparison failed">
        {data.error?.message ?? 'Please try again.'}
      </Banner>
    );
  }
  return <ComparisonView evaluation={data} />;
}

function ComparisonView({ evaluation }: { evaluation: Evaluation }) {
  const notesId = useId();
  const [reviewerNotes, setReviewerNotes] = useState('');
  const draft = parseLlmOnlyDraft(evaluation.llmOnlyOutput);
  const caveats = [BUILT_IN_CAVEAT, ...(evaluation.notes ?? []).filter((n) => n !== BUILT_IN_CAVEAT)];

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby={`${notesId}-measures`} className="flex flex-col gap-3">
        <h2 id={`${notesId}-measures`} className="text-xl text-ink">
          Measures
        </h2>
        <MetricsTable grounded={evaluation.groundedMetrics} llmOnly={evaluation.llmOnlyMetrics} />
        <ul className="flex flex-col gap-1.5 text-sm text-ink-muted">
          {caveats.map((caveat) => (
            <li key={caveat} className="flex gap-2">
              <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
              {caveat}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby={`${notesId}-outputs`} className="flex flex-col gap-3">
        <h2 id={`${notesId}-outputs`} className="text-xl text-ink">
          Both plans
        </h2>
        <p className="text-sm text-ink-muted">
          <mark className="rounded-sm bg-warning-bg px-0.5 text-ink underline decoration-moderate decoration-dotted underline-offset-2">
            Highlighted
          </mark>{' '}
          names weren&apos;t found in retrieved data.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          {evaluation.groundedPlanId ? (
            <GroundedColumn planId={evaluation.groundedPlanId} />
          ) : (
            <Column title="Qloo-grounded plan" label={<ProvenanceLabel kind="evidence" />}>
              <p className="text-sm text-ink-muted">No grounded plan was produced.</p>
            </Column>
          )}
          <Column title="AI-only plan" label={<ProvenanceLabel kind="ai" />}>
            {draft ? (
              <DraftSections draft={draft} unverified={unverifiedNames(draft)} />
            ) : (
              <p className="text-sm text-ink-muted">The AI-only output couldn&apos;t be displayed.</p>
            )}
          </Column>
        </div>
      </section>

      <TextareaField
        label="Reviewer notes"
        hint="Only kept on this screen — not saved or sent anywhere."
        optional
        value={reviewerNotes}
        onChange={(e) => setReviewerNotes(e.target.value)}
        maxLength={2000}
        count={reviewerNotes.length}
      />
    </div>
  );
}

function Column({ title, label, children }: { title: string; label: ReactNode; children: ReactNode }) {
  const titleId = useId();
  return (
    <article
      aria-labelledby={titleId}
      className="flex flex-col gap-4 rounded-(--radius-card) border border-border bg-surface p-5"
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={titleId} className="font-sans text-base font-semibold text-ink">
          {title}
        </h3>
        {label}
      </header>
      {children}
    </article>
  );
}

function GroundedColumn({ planId }: { planId: string }) {
  const plan = usePlan(planId);
  return (
    <Column title="Qloo-grounded plan" label={<ProvenanceLabel kind="evidence" />}>
      {plan.isPending && <Skeleton className="h-40 w-full" />}
      {plan.isError && <p className="text-sm text-ink-muted">This plan couldn&apos;t be loaded.</p>}
      {plan.data && (
        <>
          <DraftSections
            draft={fromPlan(plan.data)}
            unverified={(plan.data.unlinkedMentions ?? []).map((m) => m.name)}
          />
          <Link to={`/app/plans/${planId}`} className="text-sm font-medium text-primary hover:underline">
            Open the full plan with evidence
          </Link>
        </>
      )}
    </Column>
  );
}

function fromPlan(plan: GrowthPlan): LlmOnlyDraft {
  return {
    summary: { headline: plan.summary?.headline ?? null },
    insights: plan.insights.map((i) => ({ title: i.title, finding: i.finding })),
    collaborations: plan.collaborations.map((c) => ({
      partnerName: c.partnerName,
      culturalConnection: c.culturalConnection,
    })),
    campaigns: plan.campaigns.map((c) => ({ title: c.title, angle: c.angle })),
    experiments: plan.experiments.map((e) => ({ hypothesis: e.hypothesis })),
    mentionedEntities: [],
  };
}

function DraftSections({ draft, unverified }: { draft: LlmOnlyDraft; unverified: string[] }) {
  const h = (value: string) => <Highlighted text={value} names={unverified} />;
  const sections: { title: string; items: { key: string; main: string; sub?: string }[] }[] = [
    { title: 'Insights', items: draft.insights.map((i, n) => ({ key: `i${n}`, main: i.title, sub: i.finding })) },
    {
      title: 'Partnerships',
      items: draft.collaborations.map((c, n) => ({ key: `c${n}`, main: c.partnerName, sub: c.culturalConnection })),
    },
    { title: 'Campaigns', items: draft.campaigns.map((c, n) => ({ key: `k${n}`, main: c.title, sub: c.angle })) },
    { title: 'Experiments', items: draft.experiments.map((e, n) => ({ key: `e${n}`, main: e.hypothesis })) },
  ];
  return (
    <div className="flex flex-col gap-4 text-sm">
      {draft.summary?.headline && <p className="text-[15px] font-medium text-ink">{h(draft.summary.headline)}</p>}
      {sections
        .filter((s) => s.items.length > 0)
        .map((section) => (
          <div key={section.title}>
            <h4 className="mb-1.5 text-xs font-semibold tracking-wide text-ink-muted uppercase">{section.title}</h4>
            <ul className="flex flex-col gap-2">
              {section.items.map((item) => (
                <li key={item.key}>
                  <span className="font-medium text-ink">{h(item.main)}</span>
                  {item.sub && <span className="block text-ink-muted">{h(item.sub)}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  );
}
