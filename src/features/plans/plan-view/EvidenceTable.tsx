import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useEvidence } from '@/features/evidence/evidence-context';
import { QualityPill } from '@/features/evidence/QualityPill';
import { entityKind, type Evidence, type EvidenceQuality } from '@/features/evidence/types';
import { cn } from '@/shared/lib/cn';
import { controlClasses } from '@/shared/ui/field-classes';

type SortKey = 'key' | 'name' | 'type' | 'affinity' | 'popularity' | 'quality';
type SortDir = 'asc' | 'desc';

const QUALITY_RANK: Record<EvidenceQuality, number> = { Strong: 3, Moderate: 2, Weak: 1 };

function compare(a: Evidence, b: Evidence, key: SortKey): number {
  switch (key) {
    case 'key':
      return a.key.localeCompare(b.key);
    case 'name':
      return a.name.localeCompare(b.name);
    case 'type':
      return entityKind(a.entityType).label.localeCompare(entityKind(b.entityType).label);
    case 'affinity':
      return (a.affinity ?? -1) - (b.affinity ?? -1);
    case 'popularity':
      return (a.popularity ?? -1) - (b.popularity ?? -1);
    case 'quality':
      return QUALITY_RANK[a.quality] - QUALITY_RANK[b.quality];
  }
}

const source = (e: Evidence) => ['Qloo', e.sourceSignals.join(', ') || e.sourceOperation.toLowerCase()].join(' · ');
const num = (v: number | null | undefined) => (v == null ? '—' : v.toFixed(2));

/** Evidence tab table: search, type & strength filters, sortable columns; cards on phones (design 4f). */
export function EvidenceTable({ evidence }: { evidence: Evidence[] }) {
  const { open } = useEvidence();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [quality, setQuality] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'key', dir: 'asc' });

  const types = useMemo(() => [...new Set(evidence.map((e) => entityKind(e.entityType).label))].sort(), [evidence]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return evidence
      .filter((e) => !q || e.name.toLowerCase().includes(q) || e.key.toLowerCase().includes(q))
      .filter((e) => !type || entityKind(e.entityType).label === type)
      .filter((e) => !quality || e.quality === quality)
      .sort((a, b) => (sort.dir === 'asc' ? 1 : -1) * compare(a, b, sort.key));
  }, [evidence, query, type, quality, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => ({
      key,
      dir: s.key === key ? (s.dir === 'asc' ? 'desc' : 'asc') : key === 'key' || key === 'name' ? 'asc' : 'desc',
    }));

  const header = (key: SortKey, label: string, className?: string) => (
    <th
      scope="col"
      aria-sort={sort.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('px-4 py-2.5 font-medium', className)}
    >
      <button type="button" onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 hover:text-ink">
        {label}
        {sort.key === key ? (
          sort.dir === 'asc' ? (
            <ArrowUp aria-hidden className="size-3" />
          ) : (
            <ArrowDown aria-hidden className="size-3" />
          )
        ) : (
          <ArrowUpDown aria-hidden className="size-3 opacity-40" />
        )}
      </button>
    </th>
  );

  return (
    <section aria-labelledby="evidence-table-heading" className="flex flex-col gap-4">
      <h2 id="evidence-table-heading" className="sr-only">
        All evidence
      </h2>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
          />
          <input
            type="search"
            aria-label="Search evidence by name or key"
            placeholder="Search by name or key"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={cn(controlClasses, 'h-10 pl-9')}
          />
        </div>
        <FilterSelect label="Type" value={type} onChange={setType} allLabel="All types">
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Strength" value={quality} onChange={setQuality} allLabel="All strengths">
          {(['Strong', 'Moderate', 'Weak'] as const).map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </FilterSelect>
      </div>
      <p aria-live="polite" className="text-xs text-ink-muted">
        Showing {rows.length} of {evidence.length} items
      </p>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-(--radius-card) border border-border bg-surface md:block">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">Evidence retrieved from Qloo for this plan</caption>
          <thead className="bg-surface-muted text-xs text-ink-muted">
            <tr>
              {header('key', 'Key')}
              {header('name', 'Name')}
              {header('type', 'Type')}
              {header('affinity', 'Affinity')}
              {header('popularity', 'Popularity')}
              {header('quality', 'Strength')}
              <th scope="col" className="px-4 py-2.5 font-medium">
                Source
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const kind = entityKind(e.entityType);
              return (
                <tr key={e.key} className="border-t border-border">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => open(e.key)}
                      className="font-mono text-xs text-evidence underline-offset-2 hover:underline"
                    >
                      <span className="sr-only">Open evidence </span>
                      {e.key}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">{e.name}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <kind.icon aria-hidden className="size-3.5" />
                      {kind.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {e.affinity == null ? (
                      <span className="text-ink-muted">—</span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <span aria-hidden className="h-1.5 w-16 rounded-full bg-surface-muted">
                          <span
                            className="block h-full rounded-full bg-evidence"
                            style={{ width: `${e.affinity * 100}%` }}
                          />
                        </span>
                        <span className="font-mono text-xs">{num(e.affinity)}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{num(e.popularity)}</td>
                  <td className="px-4 py-3">
                    <QualityPill quality={e.quality} />
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">{source(e)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-ink-muted">No evidence matches these filters.</p>
        )}
      </div>

      {/* Phone cards */}
      <ul className="flex flex-col gap-2 md:hidden">
        {rows.map((e) => {
          const kind = entityKind(e.entityType);
          return (
            <li key={e.key}>
              <button
                type="button"
                onClick={() => open(e.key)}
                className="flex w-full flex-col gap-2 rounded-(--radius-card) border border-border bg-surface p-4 text-left"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-evidence">
                    <span className="sr-only">Open evidence </span>
                    {e.key}
                  </span>
                  <span className="text-xs text-ink-muted">{kind.label}</span>
                </span>
                <span className="font-medium text-ink">{e.name}</span>
                <span className="flex flex-wrap gap-x-4 text-xs text-ink-muted">
                  <span>Affinity {num(e.affinity)}</span>
                  <span>Popularity {num(e.popularity)}</span>
                  <span>{e.quality} evidence</span>
                </span>
              </button>
            </li>
          );
        })}
        {rows.length === 0 && (
          <li className="py-6 text-center text-sm text-ink-muted">No evidence matches these filters.</li>
        )}
      </ul>
    </section>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  allLabel,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  allLabel: string;
  children: ReactNode;
}) {
  return (
    <select
      aria-label={`Filter by ${label.toLowerCase()}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(controlClasses, 'h-10 sm:w-40')}
    >
      <option value="">{allLabel}</option>
      {children}
    </select>
  );
}
