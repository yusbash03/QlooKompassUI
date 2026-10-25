import { QualityPill } from '@/features/evidence/QualityPill';
import type { Insight } from '@/features/evidence/types';
import { AiPanel, CardDisclosure, EvidencePanel, ReportCard } from './ReportPanels';

/** Finding (evidence-backed) beside "Why it matters" (AI), each labelled (FE-01 §6, US-E1). */
export function InsightCard({ insight }: { insight: Insight }) {
  return (
    <ReportCard id={insight.id}>
      <header className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between md:px-6 md:pt-6">
        <h3 className="text-lg leading-snug text-ink">{insight.title}</h3>
        <QualityPill quality={insight.evidenceStrength} className="self-start" />
      </header>
      <div className="mt-4 grid gap-3 px-5 md:grid-cols-2 md:px-6">
        <EvidencePanel heading="What the data shows" evidenceKeys={insight.evidenceKeys}>
          {insight.finding}
        </EvidencePanel>
        <AiPanel heading="Why it matters for your brand">{insight.whyItMatters}</AiPanel>
      </div>
      <CardDisclosure label="Assumptions & limitations" items={[...insight.assumptions, ...insight.limitations]} />
      {insight.assumptions.length + insight.limitations.length === 0 && <div className="h-5 md:h-6" />}
    </ReportCard>
  );
}
