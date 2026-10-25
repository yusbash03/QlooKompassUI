import { CircleAlert } from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '@/shared/lib/cn';
import { useEvidence } from './evidence-context';
import { entityKind } from './types';

/**
 * `ev_004 · Sample Brand B` — opens the evidence drawer. An unknown key should never happen (the backend validates
 * every reference); if it does we show it as a red "missing evidence" chip rather than hiding it, and log it.
 */
export function EvidenceChip({ evidenceKey, showType = false }: { evidenceKey: string; showType?: boolean }) {
  const { get, open } = useEvidence();
  const evidence = get(evidenceKey);

  useEffect(() => {
    if (!evidence) console.error(`[evidence] Plan references unknown evidence key "${evidenceKey}"`);
  }, [evidence, evidenceKey]);

  if (!evidence) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-danger bg-danger-bg px-2.5 py-1 text-xs font-medium text-danger">
        <CircleAlert aria-hidden className="size-3.5" />
        <span className="font-mono text-[11px]">{evidenceKey}</span>
        missing evidence
      </span>
    );
  }

  const kind = entityKind(evidence.entityType);
  const Icon = kind.icon;
  // The accessible name is built from visible text plus sr-only context (no aria-label), so it always contains what
  // sighted voice-control users see: "Open evidence ev_003 Sample Brand B".
  return (
    <button
      type="button"
      onClick={() => open(evidenceKey)}
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full border border-evidence bg-surface px-2.5 py-1 text-xs text-ink',
        'transition-colors duration-150 hover:bg-evidence-bg',
      )}
    >
      <Icon aria-hidden className="size-3 shrink-0 text-ink-muted" />
      <span className="sr-only">Open evidence</span>{' '}
      <span className="font-mono text-[11px] text-evidence">{evidenceKey}</span>
      {/* Whitespace-only text takes no room in a flex row but keeps words apart in the accessible name. */}{' '}
      <span aria-hidden className="text-ink-muted">
        ·
      </span>
      <span className="truncate">{showType ? kind.label : evidence.name}</span>
      {showType && <span className="sr-only">{`: ${evidence.name}`}</span>}
    </button>
  );
}
