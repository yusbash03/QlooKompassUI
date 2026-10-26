import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useCurrentUser } from '@/features/auth/auth-context';
import { pollInterval } from '@/features/plans/stages';
import { api, unwrap } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import type { components } from '@/shared/api/schema';

export type Evaluation = components['schemas']['EvaluationDto'];
export type EvaluationMetrics = components['schemas']['EvaluationMetrics'];

const START_TIMEOUT_MS = 30_000;

/** POST /evaluations — never auto-retried; a retry is a user action reusing the same Idempotency-Key. */
export function useStartEvaluation() {
  return useMutation({
    mutationFn: ({ businessProfileId, idempotencyKey }: { businessProfileId: string; idempotencyKey: string }) =>
      unwrap(
        api.POST('/api/v1/evaluations', {
          params: { header: { 'Idempotency-Key': idempotencyKey } },
          body: { businessProfileId },
          signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(START_TIMEOUT_MS) : undefined,
        }),
      ),
  });
}

/** Polls the evaluation (2 s for 30 s, then 5 s) until it is terminal. */
export function useEvaluation(id: string | null) {
  const keys = queryKeys.user(useCurrentUser().id);
  const [startedAt] = useState(() => Date.now());
  return useQuery({
    queryKey: keys.evaluation(id ?? ''),
    queryFn: () => unwrap(api.GET('/api/v1/evaluations/{id}', { params: { path: { id: id ?? '' } } })),
    enabled: id !== null,
    refetchInterval: (query) => pollInterval(query.state.data?.status, Date.now() - startedAt),
    staleTime: 0,
  });
}
