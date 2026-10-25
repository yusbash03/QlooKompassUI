import { useEvaluationEnabled } from '@/shared/api/useMeta';
import { NotFoundPage } from './NotFoundPage';
import { PlaceholderPage } from './PlaceholderPage';

/** Evaluation is invisible (404) unless both the server and build flags are on (FE-01 §3). */
export function EvaluationGate() {
  return useEvaluationEnabled() ? <PlaceholderPage title="Evaluation" slice="FE-8" /> : <NotFoundPage />;
}
