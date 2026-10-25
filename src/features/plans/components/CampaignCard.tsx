import { Target } from 'lucide-react';
import { ProvenanceLabel } from '@/features/evidence/ProvenanceLabel';
import type { Campaign } from '@/features/evidence/types';
import { Badge, type BadgeTone } from '@/shared/ui/Badge';
import { AiPanel, CardDisclosure, EvidencePanel, ReportCard } from './ReportPanels';

const EFFORT: Record<Campaign['effortCategory'], { label: string; tone: BadgeTone }> = {
  Low: { label: 'Low effort', tone: 'low' },
  Medium: { label: 'Medium effort', tone: 'medium' },
  High: { label: 'High effort', tone: 'high' },
  Unknown: { label: 'Effort not estimated', tone: 'outline' },
};

/** Campaign idea: the cultural insight is evidence; hypothesis, angle and execution are AI-generated. */
export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const effort = EFFORT[campaign.effortCategory];
  return (
    <ReportCard id={campaign.id}>
      <header className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between md:px-6 md:pt-6">
        <div>
          <p className="text-xs text-ink-muted">Objective · {campaign.objective}</p>
          <h3 className="mt-0.5 text-[22px] leading-snug text-ink">{campaign.title}</h3>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">{campaign.targetHypothesis}</p>
        </div>
        <Badge tone={effort.tone} className="self-start">
          {effort.label}
        </Badge>
      </header>

      <div className="mt-5 grid gap-6 px-5 pb-5 md:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-8">
        <div className="space-y-4">
          <EvidencePanel heading="Cultural insight" evidenceKeys={campaign.evidenceKeys}>
            {campaign.culturalInsight}
          </EvidencePanel>
          <AiPanel heading="Angle">{campaign.angle}</AiPanel>
        </div>
        <div>
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-sans text-sm font-medium text-ink">Execution</h4>
            <ProvenanceLabel kind="ai" variant="plain" />
          </div>
          <ol className="mt-3 space-y-3">
            {campaign.execution.map((step, index) => (
              <li key={step} className="grid grid-cols-[24px_1fr] gap-3 text-sm text-ink">
                <span
                  aria-hidden
                  className="flex size-6 items-center justify-center rounded-full bg-surface-muted font-mono text-[11px] text-ink-muted"
                >
                  {index + 1}
                </span>
                <span className="pt-0.5 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-sm text-ink-muted">
            <Target aria-hidden className="size-4 text-primary" />
            Success metric: <span className="font-medium text-ink">{campaign.successMetric}</span>
          </p>
        </div>
      </div>
      <CardDisclosure label="Assumptions" items={campaign.assumptions} />
    </ReportCard>
  );
}
