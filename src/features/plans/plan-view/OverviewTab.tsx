import { ArrowRight, FlaskConical, TriangleAlert } from 'lucide-react';
import { EvidenceChip } from '@/features/evidence/EvidenceChip';
import { ProvenanceLabel } from '@/features/evidence/ProvenanceLabel';
import { QualityPill } from '@/features/evidence/QualityPill';
import type { EvidenceQuality } from '@/features/evidence/types';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';
import type { GrowthPlan } from '../api';
import { byStrength } from './plan-order';

const QUALITY_TEXT: Record<EvidenceQuality, string> = {
  Strong: 'text-strong',
  Moderate: 'text-moderate',
  Weak: 'text-weak',
};

/** Overview (Magic Patterns plan › Overview): summary, next step, top insights, evidence counts, limitations. */
export function OverviewTab({
  plan,
  onShowTab,
  onRevealExperiment,
}: {
  plan: GrowthPlan;
  onShowTab: (tab: 'insights' | 'evidence') => void;
  onRevealExperiment: (id: string) => void;
}) {
  const counts = (['Strong', 'Moderate', 'Weak'] as const).map((q) => ({
    quality: q,
    // Counted from the evidence the plan actually contains — never from assumptions.
    count: plan.evidence.filter((e) => e.quality === q).length,
  }));
  const topInsights = byStrength(plan.insights).slice(0, 3);
  const nextExperiment = plan.experiments.find((e) => e.status === 'Proposed') ?? plan.experiments[0];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:gap-10">
      <div className="min-w-0 space-y-10">
        {plan.summary && (
          <section aria-labelledby="summary-heading">
            <div className="flex items-center justify-between gap-3">
              <h2 id="summary-heading" className="text-[22px] text-ink">
                Summary
              </h2>
              <ProvenanceLabel kind="ai" />
            </div>
            <p className="mt-3 max-w-3xl leading-relaxed text-ink">{plan.summary.overview}</p>
          </section>
        )}

        {nextExperiment && (
          <section
            aria-labelledby="next-step-heading"
            className="rounded-(--radius-card) border border-border bg-surface p-5 md:p-6"
          >
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <FlaskConical aria-hidden className="size-4 text-primary" />
              Recommended next step
            </p>
            <h2 id="next-step-heading" className="mt-2 text-[22px] leading-snug text-ink">
              {nextExperiment.status === 'Proposed' ? 'Start your first experiment' : 'Check on your experiment'}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
              {nextExperiment.hypothesis} Measured by {nextExperiment.primaryMetric.toLowerCase()} over{' '}
              {nextExperiment.measurementPeriodDays} days.
            </p>
            <Button className="mt-4" onClick={() => onRevealExperiment(nextExperiment.id)}>
              Open experiment
              <ArrowRight aria-hidden className="size-4" />
            </Button>
          </section>
        )}

        {topInsights.length > 0 && (
          <section aria-labelledby="top-insights-heading">
            <div className="flex items-center justify-between gap-3">
              <h2 id="top-insights-heading" className="text-[22px] text-ink">
                Top insights
              </h2>
              <button
                type="button"
                onClick={() => onShowTab('insights')}
                className="rounded-sm text-sm font-medium text-primary hover:underline"
              >
                All {plan.insights.length} insights
              </button>
            </div>
            <ul className="mt-4 divide-y divide-border rounded-(--radius-card) border border-border bg-surface">
              {topInsights.map((insight) => (
                <li
                  key={insight.id}
                  className="flex flex-col gap-3 p-5 md:flex-row md:items-start md:justify-between md:gap-6"
                >
                  <div className="min-w-0">
                    <h3 className="font-sans text-base leading-snug font-medium text-ink">{insight.title}</h3>
                    <ul aria-label="Evidence" className="mt-2.5 flex flex-wrap gap-1.5">
                      {insight.evidenceKeys.map((key) => (
                        <li key={key}>
                          <EvidenceChip evidenceKey={key} />
                        </li>
                      ))}
                    </ul>
                  </div>
                  <QualityPill quality={insight.evidenceStrength} className="self-start" />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <aside className="space-y-6" aria-label="Evidence and limitations">
        <section
          aria-labelledby="glance-heading"
          className="rounded-(--radius-card) border border-border bg-surface p-5"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 id="glance-heading" className="font-sans text-sm font-medium text-ink">
              Evidence at a glance
            </h2>
            <ProvenanceLabel kind="evidence" />
          </div>
          <dl className="mt-4 grid grid-cols-3 divide-x divide-border">
            {counts.map(({ quality, count }) => (
              <div key={quality} className="px-3 first:pl-0 last:pr-0">
                <dt className={cn('text-xs font-medium', QUALITY_TEXT[quality])}>{quality}</dt>
                <dd className="mt-1 font-heading text-[28px] leading-none font-semibold text-ink">{count}</dd>
              </div>
            ))}
          </dl>
          <button
            type="button"
            onClick={() => onShowTab('evidence')}
            className="mt-5 inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-primary hover:underline"
          >
            Browse all {plan.evidence.length} items
            <ArrowRight aria-hidden className="size-4" />
          </button>
        </section>

        {plan.limitations.length > 0 && (
          <section aria-labelledby="limitations-heading" className="rounded-(--radius-card) bg-warning-bg p-5">
            <h2 id="limitations-heading" className="flex items-center gap-2 font-sans text-sm font-medium text-ink">
              <TriangleAlert aria-hidden className="size-4 text-moderate" />
              Limitations
            </h2>
            <ul className="mt-3 space-y-2">
              {plan.limitations.map((limitation) => (
                <li key={limitation} className="text-sm leading-relaxed text-ink">
                  {limitation}
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>
    </div>
  );
}
