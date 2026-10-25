import { ChevronDown } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { EvidenceChip } from '@/features/evidence/EvidenceChip';
import { ProvenanceLabel } from '@/features/evidence/ProvenanceLabel';
import { cn } from '@/shared/lib/cn';

// Panels are labelled groups, not <section> landmarks: a plan repeats them per card, and repeated landmarks with the
// same name make landmark navigation useless (axe landmark-unique).

/** Teal "retrieved data" panel with the evidence chips that back it. */
export function EvidencePanel({
  heading,
  children,
  evidenceKeys,
}: {
  heading: string;
  children: ReactNode;
  evidenceKeys: string[];
}) {
  const headingId = useId();
  return (
    <div role="group" aria-labelledby={headingId} className="rounded-(--radius-input) bg-evidence-bg p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 id={headingId} className="font-sans text-sm font-medium text-ink">
          {heading}
        </h4>
        <ProvenanceLabel kind="evidence" variant="plain" />
      </div>
      <div className="mt-2 text-sm leading-relaxed text-ink">{children}</div>
      {evidenceKeys.length > 0 && (
        <ul aria-label="Evidence" className="mt-3 flex flex-wrap gap-1.5">
          {evidenceKeys.map((key) => (
            <li key={key}>
              <EvidenceChip evidenceKey={key} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Violet "AI interpretation" panel. */
export function AiPanel({ heading, children }: { heading: string; children: ReactNode }) {
  const headingId = useId();
  return (
    <div role="group" aria-labelledby={headingId} className="rounded-(--radius-input) bg-ai-bg p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 id={headingId} className="font-sans text-sm font-medium text-ink">
          {heading}
        </h4>
        <ProvenanceLabel kind="ai" variant="plain" />
      </div>
      <div className="mt-2 text-sm leading-relaxed text-ink">{children}</div>
    </div>
  );
}

/** Card footer disclosure ("Assumptions & limitations (2)") — native <details> for free keyboard support. */
export function CardDisclosure({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <details className="group mt-4 border-t border-border">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3 text-sm text-ink-muted hover:text-ink md:px-6 [&::-webkit-details-marker]:hidden">
        <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
        {label} ({items.length})
      </summary>
      <ul className="space-y-1.5 px-5 pb-5 md:px-6">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-ink-muted">
            <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-ink-muted" />
            {item}
          </li>
        ))}
      </ul>
    </details>
  );
}

export function ReportCard({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <article id={id} className={cn('scroll-mt-24 rounded-(--radius-card) border border-border bg-surface', className)}>
      {children}
    </article>
  );
}
