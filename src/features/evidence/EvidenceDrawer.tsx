import { formatDateTime } from '@/shared/lib/format';
import { Sheet } from '@/shared/ui/Sheet';
import type { EvidenceUsage } from './evidence-context';
import { ProvenanceLabel } from './ProvenanceLabel';
import { QualityPill } from './QualityPill';
import { entityKind, QUALITY_TOOLTIP, type Evidence } from './types';

interface EvidenceDrawerProps {
  evidence: Evidence | null;
  usedIn: EvidenceUsage[];
  onOpenChange: (open: boolean) => void;
}

/** Everything we know about one evidence item, exactly as retrieved (design 4f / screen 11, US-E5). */
export function EvidenceDrawer({ evidence, usedIn, onOpenChange }: EvidenceDrawerProps) {
  return (
    <Sheet
      open={evidence !== null}
      onOpenChange={onOpenChange}
      eyebrow={evidence && <p className="font-mono text-xs text-evidence">{evidence.key}</p>}
      title={evidence?.name ?? ''}
      description={evidence ? entityKind(evidence.entityType).label : undefined}
    >
      {evidence && (
        <div className="flex flex-col gap-5">
          <ProvenanceLabel kind="evidence" className="self-start" />

          {(evidence.affinity != null || evidence.popularity != null) && (
            <dl className="grid grid-cols-2 gap-2.5">
              {evidence.affinity != null && <Stat label="Affinity" value={evidence.affinity} />}
              {evidence.popularity != null && <Stat label="Popularity" value={evidence.popularity} />}
            </dl>
          )}

          {evidence.tags.length > 0 && (
            <ul aria-label="Tags" className="flex flex-wrap gap-1.5">
              {evidence.tags.map((tag) => (
                <li key={tag} className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-ink">
                  {tag}
                </li>
              ))}
            </ul>
          )}

          <section aria-labelledby="ev-strength" className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h3 id="ev-strength" className="text-sm text-ink">
                Evidence strength
              </h3>
              <QualityPill quality={evidence.quality} />
            </div>
            <p className="text-xs text-ink-muted">{QUALITY_TOOLTIP}</p>
            {evidence.qualityReasons.length > 0 && (
              <ul className="list-disc pl-5 text-[13px] text-ink">
                {evidence.qualityReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            )}
          </section>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
            <dt className="text-ink-muted">Source</dt>
            <dd className="text-ink">
              {evidence.sourceOperation}
              {evidence.sourceSignals.length > 0 && ` · ${evidence.sourceSignals.join(', ')}`}
            </dd>
            <dt className="text-ink-muted">Retrieved</dt>
            <dd className="text-ink">{formatDateTime(evidence.retrievedAt)}</dd>
          </dl>

          {usedIn.length > 0 && (
            <section aria-labelledby="ev-used-in" className="flex flex-col gap-2 border-t border-hairline pt-4">
              <h3 id="ev-used-in" className="text-sm text-ink">
                Used in
              </h3>
              <ul className="flex flex-col gap-1.5">
                {usedIn.map((use) => (
                  <li key={use.label}>
                    <button
                      type="button"
                      onClick={use.onSelect}
                      className="text-left text-sm font-semibold text-primary hover:underline"
                    >
                      {use.label}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </Sheet>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-(--radius-input) bg-surface-muted p-3.5">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="font-mono text-2xl text-ink">{value.toFixed(2)}</dd>
    </div>
  );
}
