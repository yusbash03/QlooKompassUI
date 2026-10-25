import { EvidenceChip } from '@/features/evidence/EvidenceChip';
import { useEvidence } from '@/features/evidence/evidence-context';
import { ProvenanceLabel } from '@/features/evidence/ProvenanceLabel';
import { QualityPill } from '@/features/evidence/QualityPill';
import { entityKind, type Collaboration } from '@/features/evidence/types';

/** Partnership idea (API `collaborations`; UI label "Partnerships"). The partner itself is always retrieved evidence. */
export function PartnershipCard({ partnership }: { partnership: Collaboration }) {
  const partner = useEvidence().get(partnership.partnerEvidenceKey);
  const kind = partner ? entityKind(partner.entityType).label : null;

  return (
    <article
      id={partnership.id}
      className="flex h-full scroll-mt-24 flex-col rounded-(--radius-card) border border-border bg-surface p-5 md:p-6"
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          {kind && <p className="text-xs text-ink-muted">{kind} partner</p>}
          <h3 className="mt-0.5 text-lg text-ink">{partnership.partnerName}</h3>
        </div>
        <QualityPill quality={partnership.evidenceStrength} />
      </header>

      <p className="mt-4 font-heading text-[22px] leading-snug font-semibold text-ink">{partnership.format}</p>

      <dl className="mt-5 space-y-4 text-sm">
        <div>
          <dt className="flex items-center justify-between gap-2">
            <span className="font-medium text-ink">Connection</span>
            <ProvenanceLabel kind="evidence" variant="plain" />
          </dt>
          <dd className="mt-1.5 leading-relaxed text-ink-muted">{partnership.culturalConnection}</dd>
          <dd className="mt-2">
            <ul aria-label="Evidence" className="flex flex-wrap gap-1.5">
              {partnership.evidenceKeys.map((key) => (
                <li key={key}>
                  <EvidenceChip evidenceKey={key} />
                </li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt className="flex items-center justify-between gap-2">
            <span className="font-medium text-ink">Why it fits</span>
            <ProvenanceLabel kind="ai" variant="plain" />
          </dt>
          <dd className="mt-1.5 leading-relaxed text-ink-muted">{partnership.fitRationale}</dd>
        </div>
      </dl>

      <div className="mt-auto pt-5">
        <div className="rounded-(--radius-input) bg-surface-muted p-4">
          <p className="flex items-center justify-between gap-2 text-sm font-medium text-ink">
            How to test it
            <ProvenanceLabel kind="ai" variant="plain" />
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">{partnership.testIdea}</p>
        </div>
        {partnership.assumptions.length > 0 && (
          <p className="mt-3 text-xs text-ink-muted">Assumes: {partnership.assumptions.join(' ')}</p>
        )}
      </div>
    </article>
  );
}
