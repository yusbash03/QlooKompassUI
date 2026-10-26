import { ChevronRight, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import type { EvidenceUsage } from '@/features/evidence/evidence-context';
import { EvidenceProvider } from '@/features/evidence/EvidenceProvider';
import type { Experiment } from '@/features/evidence/types';
import { ExperimentCard } from '@/features/experiments/ExperimentCard';
import { markPlanViewed } from '@/features/pwa/install-store';
import { useMeta } from '@/shared/api/useMeta';
import { formatDate } from '@/shared/lib/format';
import { StatusChip } from '@/shared/ui/Badge';
import { Banner } from '@/shared/ui/Banner';
import { buttonClasses } from '@/shared/ui/button-classes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/Tabs';
import type { GrowthPlan } from '../api';
import { CampaignCard } from '../components/CampaignCard';
import { InsightCard } from '../components/InsightCard';
import { PartnershipCard } from '../components/PartnershipCard';
import { UnlinkedMentions } from '../components/UnlinkedMentions';
import { AffinityChart } from './AffinityChart';
import { EvidenceTable } from './EvidenceTable';
import { OverviewTab } from './OverviewTab';
import { byStrength, toPlanTab, type PlanTab } from './plan-order';
import { revealElement } from './reveal';

const TAB_LABEL: Record<PlanTab, string> = {
  overview: 'Overview',
  insights: 'Insights',
  partnerships: 'Partnerships', // API: collaborations
  campaigns: 'Campaigns',
  experiments: 'Experiments',
  evidence: 'Evidence',
};

interface PlanViewProps {
  plan: GrowthPlan;
  /** "sample" = public /sample (no account actions); "app" = the user's own plan. */
  mode: 'app' | 'sample';
  /** Extra header controls (e.g. the "Available offline" switch, FE-6). */
  headerActions?: ReactNode;
  /** Banner for a plan shown from an offline copy (FE-6). */
  offlineNotice?: ReactNode;
  /** Renders an experiment card with actions (FE-6b); defaults to the read-only card. */
  renderExperiment?: (experiment: Experiment, campaignName: string | undefined) => ReactNode;
}

/** The growth-plan report (FE-5): header, provenance-aware banners, six tabs driven by `?tab=`. */
export function PlanView({ plan, mode, headerActions, offlineNotice, renderExperiment }: PlanViewProps) {
  const [params, setParams] = useSearchParams();
  const tab = toPlanTab(params.get('tab'));
  const [pendingReveal, setPendingReveal] = useState<string | null>(null);
  const meta = useMeta();

  useEffect(markPlanViewed, []);

  const showTab = useCallback(
    (next: PlanTab) =>
      setParams(
        (p) => {
          const copy = new URLSearchParams(p);
          if (next === 'overview') copy.delete('tab');
          else copy.set('tab', next);
          return copy;
        },
        { replace: true },
      ),
    [setParams],
  );

  const reveal = useCallback(
    (targetTab: PlanTab, id: string) => {
      showTab(targetTab);
      setPendingReveal(id);
    },
    [showTab],
  );

  // After the target tab has rendered, scroll to and focus the card.
  useEffect(() => {
    if (!pendingReveal) return;
    const frame = requestAnimationFrame(() => {
      revealElement(pendingReveal);
      setPendingReveal(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [pendingReveal, tab]);

  const usedIn = useCallback(
    (key: string, close: () => void): EvidenceUsage[] => {
      const go = (targetTab: PlanTab, id: string) => () => {
        close();
        reveal(targetTab, id);
      };
      return [
        ...plan.insights
          .filter((i) => i.evidenceKeys.includes(key))
          .map((i) => ({ label: `Insight · ${i.title}`, onSelect: go('insights', i.id) })),
        ...plan.collaborations
          .filter((c) => c.evidenceKeys.includes(key) || c.partnerEvidenceKey === key)
          .map((c) => ({ label: `Partnership · ${c.partnerName}`, onSelect: go('partnerships', c.id) })),
        ...plan.campaigns
          .filter((c) => c.evidenceKeys.includes(key))
          .map((c) => ({ label: `Campaign · ${c.title}`, onSelect: go('campaigns', c.id) })),
      ];
    },
    [plan, reveal],
  );

  const campaignName = (experiment: Experiment) =>
    plan.campaigns.find((c) => c.id === experiment.linkedRecommendationId)?.title;
  const generated = plan.completedAt ?? plan.createdAt;
  // The app-wide banner already says "mock mode" when the backend is mocked; a plan made in mock mode under a live
  // backend still gets its own banner.
  const showMockBanner = plan.isMock && !meta.data?.isMockMode;

  return (
    <EvidenceProvider evidence={plan.evidence} usedIn={usedIn}>
      {plan.isSample && (
        <Banner tone="sample" strip className="justify-center text-center font-medium">
          Sample plan · synthetic data
        </Banner>
      )}
      {showMockBanner && (
        <Banner tone="mock" strip>
          MOCK DATA — not real Qloo intelligence
        </Banner>
      )}
      {offlineNotice}

      <Tabs value={tab} onValueChange={(v) => showTab(toPlanTab(v))}>
        <div className="border-b border-border bg-surface">
          <div className="mx-auto max-w-(--container-page) px-4 pt-6 md:px-8">
            <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
              <ol className="flex items-center gap-1.5">
                <li>
                  <Link to={mode === 'sample' ? '/' : '/app/plans'} className="rounded-sm hover:text-ink">
                    {mode === 'sample' ? 'Home' : 'Plans'}
                  </Link>
                </li>
                <li aria-hidden>
                  <ChevronRight className="size-3.5" />
                </li>
                <li aria-current="page" className="text-ink">
                  {mode === 'sample' ? 'Sample plan' : plan.brandName}
                </li>
              </ol>
            </nav>
            <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h1 className="text-[28px] leading-tight tracking-tight text-ink md:text-[36px]">{plan.brandName}</h1>
                  <StatusChip status={plan.status} />
                </div>
                {plan.summary?.headline && (
                  <p className="mt-2 leading-relaxed text-ink-muted md:text-lg">{plan.summary.headline}</p>
                )}
                <p className="mt-2 text-xs text-ink-muted">Generated {formatDate(generated)}</p>
              </div>
              {mode === 'app' && (
                <div className="flex shrink-0 flex-wrap items-center gap-4">
                  {headerActions}
                  <Link
                    to={`/app/profiles/${plan.businessProfileId}/generate`}
                    className={buttonClasses({ variant: 'secondary' })}
                  >
                    <RefreshCw aria-hidden className="size-4" />
                    Regenerate
                  </Link>
                </div>
              )}
            </div>
            <TabsList aria-label="Plan sections" className="-mx-4 mt-6 gap-6 px-4 font-normal md:mx-0 md:px-0">
              {Object.entries(TAB_LABEL).map(([value, label]) => (
                <TabsTrigger key={value} value={value} className="font-normal data-[state=active]:font-medium">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        <div className="mx-auto max-w-(--container-page) px-4 py-8 md:px-8 md:py-10">
          {plan.status === 'CompletedWithLimitations' && (
            <Banner tone="limitations" title="Completed with limitations" className="mb-6">
              Some sections have less evidence than usual. Read the limitations before acting on them.
            </Banner>
          )}

          <TabsContent value="overview">
            <OverviewTab plan={plan} onShowTab={showTab} onRevealExperiment={(id) => reveal('experiments', id)} />
          </TabsContent>

          <TabsContent value="insights" className="space-y-5">
            <h2 className="sr-only">Insights</h2>
            <p className="max-w-3xl text-sm text-ink-muted">
              {plan.insights.length} insights, strongest first. Open any teal chip to see exactly what Qloo returned.
            </p>
            {plan.insights.length === 0 ? (
              <EmptySection>No insights in this plan.</EmptySection>
            ) : (
              byStrength(plan.insights).map((insight) => <InsightCard key={insight.id} insight={insight} />)
            )}
          </TabsContent>

          <TabsContent value="partnerships" className="space-y-8">
            <h2 className="sr-only">Partnerships</h2>
            {plan.collaborations.length === 0 ? (
              <EmptySection>
                No partnership ideas in this plan. Regenerate with partnership ideas switched on to get some.
              </EmptySection>
            ) : (
              <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {byStrength(plan.collaborations).map((c) => (
                  <li key={c.id} className="flex">
                    <PartnershipCard partnership={c} />
                  </li>
                ))}
              </ul>
            )}
            <UnlinkedMentions mentions={plan.unlinkedMentions} />
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-5">
            <h2 className="sr-only">Campaigns</h2>
            {plan.campaigns.length === 0 ? (
              <EmptySection>No campaign ideas in this plan.</EmptySection>
            ) : (
              plan.campaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)
            )}
          </TabsContent>

          <TabsContent value="experiments" className="space-y-5">
            <h2 className="sr-only">Experiments</h2>
            <p className="max-w-3xl text-sm text-ink-muted">
              Each experiment is a short test brief. Agree the threshold and decision before you start, then record what
              happened.
            </p>
            {plan.experiments.length === 0 ? (
              <EmptySection>No experiments in this plan.</EmptySection>
            ) : (
              plan.experiments.map((experiment) =>
                renderExperiment ? (
                  <div key={experiment.id}>{renderExperiment(experiment, campaignName(experiment))}</div>
                ) : (
                  <ExperimentCard key={experiment.id} experiment={experiment} campaignName={campaignName(experiment)} />
                ),
              )
            )}
          </TabsContent>

          <TabsContent value="evidence" className="space-y-6">
            {plan.evidence.length === 0 ? (
              <EmptySection>No evidence was retrieved for this plan.</EmptySection>
            ) : (
              <>
                <AffinityChart evidence={plan.evidence} />
                <EvidenceTable evidence={plan.evidence} />
              </>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </EvidenceProvider>
  );
}

function EmptySection({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-(--radius-card) border border-dashed border-border px-6 py-10 text-center text-sm text-ink-muted">
      {children}
    </p>
  );
}
