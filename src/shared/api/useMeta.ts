import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from './client';
import { queryKeys } from './queryKeys';

export function useMeta() {
  return useQuery({
    queryKey: queryKeys.meta,
    queryFn: () => unwrap(api.GET('/api/v1/meta')),
    staleTime: 5 * 60_000,
    // Offline, still ask: the service worker answers from its cache (FE-01 §7).
    networkMode: 'offlineFirst',
  });
}

/** Evaluation needs both the server flag and the build flag (FE-01 §3). */
export function useEvaluationEnabled(): boolean {
  const meta = useMeta();
  return import.meta.env.VITE_ENABLE_EVALUATION === 'true' && meta.data?.features.evaluationMode === true;
}
