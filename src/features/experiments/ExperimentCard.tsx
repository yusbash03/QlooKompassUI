import { ClipboardPen, Play } from 'lucide-react';
import { Fragment, type ReactNode } from 'react';
import type { Experiment } from '@/features/evidence/types';
import { cn } from '@/shared/lib/cn';
import { formatDate } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { daysRemaining } from './experiment-format';

const LIFECYCLE = ['Proposed', 'Running', 'Concluded'] as const;

interface ExperimentCardProps {
  experiment: Experiment;
  /** Name of the linked campaign/recommendation, when known. */
  campaignName?: string;
  onStart?: () => void;
  onRecordResult?: () => void;
  /** Which decision rule the recorded result matched (set by FE-6b when concluding). */
  matchedRule?: 'success' | 'failure';
  busy?: boolean;
}

/** Mini test brief with the Plan → Launch → Measure lifecycle (Magic Patterns plan › Experiments tab). */
export function ExperimentCard({
  experiment,
  campaignName,
  onStart,
  onRecordResult,
  matchedRule,
  busy = false,
}: ExperimentCardProps) {
  const remaining = daysRemaining(experiment);
  const concluded = experiment.status === 'Concluded' || experiment.status === 'Abandoned';
  const showActions =
    !concluded &&
    ((experiment.status === 'Proposed' && onStart) || (experiment.status === 'Running' && onRecordResult));

  return (
    <article
      id={experiment.id}
      aria-labelledby={`${experiment.id}-title`}
      className="scroll-mt-24 rounded-(--radius-card) border border-border bg-surface"
    >
      <header className="flex flex-col gap-4 border-b border-border px-5 py-5 md:flex-row md:items-start md:justify-between md:px-6">
        <div className="max-w-2xl">
          <p className="text-xs text-ink-muted">Hypothesis</p>
          <h3 id={`${experiment.id}-title`} className="mt-1 text-lg leading-snug text-ink">
            {experiment.hypothesis}
          </h3>
        </div>
        <ol className="flex shrink-0 items-center gap-1.5" aria-label={`Status: ${experiment.status}`}>
          {LIFECYCLE.map((stage, index) => {
            const label = stage === 'Concluded' && experiment.status === 'Abandoned' ? 'Abandoned' : stage;
            const current = label === experiment.status;
            return (
              <Fragment key={stage}>
                {index > 0 && <span aria-hidden className="h-px w-3 bg-border" />}
                <li
                  aria-current={current ? 'step' : undefined}
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs whitespace-nowrap',
                    current
                      ? cn(
                          'font-medium',
                          experiment.status === 'Running' && 'bg-ai-bg text-ai',
                          experiment.status === 'Proposed' && 'bg-surface-muted text-ink-muted',
                          experiment.status === 'Concluded' && 'bg-evidence-bg text-evidence',
                          experiment.status === 'Abandoned' && 'bg-surface-muted text-ink',
                        )
                      : 'text-ink-muted',
                  )}
                >
                  {label}
                </li>
              </Fragment>
            );
          })}
        </ol>
      </header>

      <dl className="grid gap-x-8 gap-y-4 px-5 py-5 text-sm sm:grid-cols-2 md:px-6 lg:grid-cols-4">
        <Fact term="Audience segment">{experiment.segment}</Fact>
        <Fact term="Campaign">{campaignName ?? experiment.proposedCampaign}</Fact>
        <Fact term="Primary metric">{experiment.primaryMetric}</Fact>
        <Fact term="Period">
          {experiment.measurementPeriodDays} days
          {experiment.startedAt && (
            <span className="mt-0.5 block text-xs text-ink-muted">
              Started {formatDate(experiment.startedAt)}
              {remaining !== null && (
                <span className="text-ai"> · {remaining === 1 ? '1 day left' : `${remaining} days left`}</span>
              )}
            </span>
          )}
        </Fact>
        <div className="sm:col-span-2 lg:col-span-4">
          <dt className="text-xs text-ink-muted">Success threshold</dt>
          <dd className="mt-1 flex flex-wrap items-center gap-2 text-ink">
            <span className="font-medium">{experiment.successThreshold}</span>
            {experiment.thresholdIsProposedDefault && (
              <Badge tone="outline" className="px-2 text-[11px] font-normal">
                Proposed default
              </Badge>
            )}
          </dd>
        </div>
        {concluded && experiment.observedResult && (
          <div className="sm:col-span-2 lg:col-span-4">
            <dt className="text-xs text-ink-muted">Observed result</dt>
            <dd className="mt-1 text-ink">
              <span className="font-medium">{experiment.observedResult}</span>
              <span className="text-ink-muted"> vs {experiment.successThreshold}</span>
              {experiment.resultNotes && <span className="mt-1 block text-ink-muted">{experiment.resultNotes}</span>}
            </dd>
          </div>
        )}
      </dl>

      <div className={cn('grid gap-3 px-5 md:grid-cols-2 md:px-6', !showActions && 'pb-5 md:pb-6')}>
        <DecisionRule
          label="If it works →"
          text={experiment.nextDecision.ifSuccess}
          matched={matchedRule === 'success'}
        />
        <DecisionRule label="If not →" text={experiment.nextDecision.ifFailure} matched={matchedRule === 'failure'} />
      </div>

      {showActions && (
        <footer className="mt-5 flex justify-end border-t border-border px-5 py-4 md:px-6">
          {experiment.status === 'Proposed' && onStart && (
            <Button onClick={onStart} loading={busy}>
              <Play aria-hidden className="size-4" />
              Start experiment
            </Button>
          )}
          {experiment.status === 'Running' && onRecordResult && (
            <Button onClick={onRecordResult} disabled={busy}>
              <ClipboardPen aria-hidden className="size-4" />
              Record result
            </Button>
          )}
        </footer>
      )}
    </article>
  );
}

function Fact({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{term}</dt>
      <dd className="mt-1 text-ink">{children}</dd>
    </div>
  );
}

function DecisionRule({ label, text, matched }: { label: string; text: string; matched: boolean }) {
  return (
    <div
      className={cn(
        'rounded-(--radius-input) border p-4',
        matched ? 'border-strong bg-surface' : 'border-border bg-surface-muted',
      )}
    >
      <p className="flex items-center justify-between gap-2 text-sm font-medium text-ink">
        {label}
        {matched && <span className="text-xs font-medium text-strong">Matches your result</span>}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">{text}</p>
    </div>
  );
}
