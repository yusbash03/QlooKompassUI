import { DataTable } from '@/shared/ui/DataTable';
import type { EvaluationMetrics } from './api';

interface Row {
  id: string;
  measure: string;
  value: (m: EvaluationMetrics) => string;
}

const pct = (value: number | null) => (value === null ? 'n/a' : `${Math.round(value)}%`);

// Deterministic scorer output (BE-04 §4), shown as returned — no derived scores, no colours, no winner.
const ROWS: Row[] = [
  { id: 'named', measure: 'Named entities', value: (m) => String(m.namedEntities) },
  {
    id: 'traceable',
    measure: 'Traceable to retrieved data',
    value: (m) => `${m.traceableEntities} of ${m.namedEntities}`,
  },
  { id: 'unverified', measure: 'Unverified names', value: (m) => String(m.unsupportedEntities) },
  { id: 'evidence', measure: 'Recommendations with evidence', value: (m) => pct(m.recommendationsWithEvidencePct) },
  { id: 'numbers', measure: 'Numbers not found in inputs', value: (m) => String(m.unsupportedNumericClaims) },
  {
    id: 'specificity',
    measure: 'Entities per recommendation',
    value: (m) => m.avgEntitiesPerRecommendation.toFixed(1),
  },
  { id: 'coverage', measure: 'Brief coverage', value: (m) => pct(m.briefTermCoveragePct) },
];

export function MetricsTable({
  grounded,
  llmOnly,
}: {
  grounded: EvaluationMetrics | null | undefined;
  llmOnly: EvaluationMetrics | null | undefined;
}) {
  const cell = (metrics: EvaluationMetrics | null | undefined, row: Row) => (
    <span className="font-mono">{metrics ? row.value(metrics) : '—'}</span>
  );
  return (
    <DataTable
      caption="Comparison measures: Qloo-grounded plan and AI-only plan"
      rows={ROWS}
      rowKey={(row) => row.id}
      columns={[
        { key: 'measure', header: 'Measure', cell: (row) => row.measure },
        { key: 'grounded', header: 'Qloo-grounded plan', cell: (row) => cell(grounded, row) },
        { key: 'llm', header: 'AI-only plan', cell: (row) => cell(llmOnly, row) },
      ]}
    />
  );
}
