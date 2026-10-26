import { lazy, Suspense } from 'react';
import { useEvaluationEnabled, useMeta } from '@/shared/api/useMeta';
import { FullPageStatus } from '@/shared/ui/FullPageStatus';
import { NotFoundPage } from './NotFoundPage';

const EvaluationPage = lazy(() =>
  import('@/features/evaluation/EvaluationPage').then((m) => ({ default: m.EvaluationPage })),
);

/** Evaluation is invisible (404) unless both the server and build flags are on (FE-01 §3). */
export function EvaluationGate() {
  const meta = useMeta();
  const enabled = useEvaluationEnabled();
  if (meta.isPending) return <FullPageStatus label="Loading…" />;
  if (!enabled) return <NotFoundPage embedded />;
  return (
    <Suspense fallback={<FullPageStatus label="Loading…" />}>
      <EvaluationPage />
    </Suspense>
  );
}
