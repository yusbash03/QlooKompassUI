import { useEvidence } from '@/features/evidence/evidence-context';
import { ProvenanceLabel } from '@/features/evidence/ProvenanceLabel';
import { entityKind, type Evidence } from '@/features/evidence/types';
import { Tooltip } from '@/shared/ui/Tooltip';

const TOP_N = 10;

/**
 * "Top affinity scores returned by Qloo" — the only chart in the plan (FE-01 §6). Single series of real returned values,
 * one hue (evidence teal), ≤ 24px bars from a shared baseline, value at each bar end, per-bar tooltip; the evidence
 * table below is its table view. Items without an affinity are left out, never estimated.
 */
export function AffinityChart({ evidence }: { evidence: Evidence[] }) {
  const { open } = useEvidence();
  const rows = evidence
    .filter((e): e is Evidence & { affinity: number } => e.affinity != null)
    .sort((a, b) => b.affinity - a.affinity)
    .slice(0, TOP_N);

  if (rows.length === 0) return null;

  return (
    <figure className="rounded-(--radius-card) border border-border bg-surface p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <figcaption className="text-sm font-medium text-ink">Top affinity scores returned by Qloo</figcaption>
        <ProvenanceLabel kind="evidence" />
      </div>
      <ol className="mt-4 flex flex-col gap-1">
        {rows.map((item) => (
          <li key={item.key}>
            <Tooltip
              content={
                <span className="flex flex-col gap-0.5">
                  <span className="font-mono">{item.key}</span>
                  <span>
                    {item.name} · {entityKind(item.entityType).label}
                  </span>
                  <span>
                    Affinity {item.affinity.toFixed(2)}
                    {item.popularity != null && ` · Popularity ${item.popularity.toFixed(2)}`}
                  </span>
                  <span>{item.quality} evidence</span>
                </span>
              }
            >
              <button
                type="button"
                onClick={() => open(item.key)}
                className="grid w-full grid-cols-[minmax(6rem,11rem)_1fr_3rem] items-center gap-3 rounded-md px-1 py-1.5 text-left text-sm hover:bg-surface-muted"
              >
                <span className="truncate text-ink">{item.name}</span>
                <span
                  aria-hidden
                  className="h-2.5 rounded-r-[4px] bg-evidence"
                  style={{ width: `${item.affinity * 100}%` }}
                />
                <span className="text-right font-mono text-xs text-ink">
                  <span className="sr-only">Affinity </span>
                  {item.affinity.toFixed(2)}
                </span>
              </button>
            </Tooltip>
          </li>
        ))}
      </ol>
    </figure>
  );
}
