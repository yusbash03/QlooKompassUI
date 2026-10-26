import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/auth/auth-context';
import type { Experiment } from '@/features/evidence/types';
import { api, unwrap } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import type { components } from '@/shared/api/schema';

type Schemas = components['schemas'];
export type UpdateExperimentRequest = Schemas['UpdateExperimentRequest'];
export type ExperimentSummary = Schemas['ExperimentSummary'];
type GrowthPlan = Schemas['GrowthPlanDto'];

/** The ETag for an experiment is its quoted version (01-api-contract §1 concurrency). */
const etagOf = (experiment: Experiment) => `"${experiment.version}"`;

/**
 * PATCH an experiment's tracking fields (Launch → Measure). Sends If-Match; a 412 means it changed elsewhere and the
 * caller offers a reload. On success the cached plan is patched in place and the hub refetches.
 */
export function useUpdateExperiment() {
  const queryClient = useQueryClient();
  const keys = queryKeys.user(useCurrentUser().id);
  return useMutation({
    mutationFn: ({
      planId,
      experiment,
      body,
    }: {
      planId: string;
      experiment: Experiment;
      body: UpdateExperimentRequest;
    }) =>
      unwrap(
        api.PATCH('/api/v1/growth-plans/{id}/experiments/{experimentId}', {
          params: { path: { id: planId, experimentId: experiment.id }, header: { 'If-Match': etagOf(experiment) } },
          body,
        }),
      ),
    onSuccess: (updated, { planId }) => {
      queryClient.setQueryData<GrowthPlan>(keys.plan(planId), (plan) =>
        plan ? { ...plan, experiments: plan.experiments.map((e) => (e.id === updated.id ? updated : e)) } : plan,
      );
      void queryClient.invalidateQueries({ queryKey: [...keys.all, 'experiments'] });
    },
  });
}

/** Cross-plan experiments hub (GET /experiments). One page of up to 50 — the contract's maximum. */
export function useExperimentsHub() {
  const keys = queryKeys.user(useCurrentUser().id);
  return useQuery({
    queryKey: keys.experiments({ pageSize: 50 }),
    queryFn: () => unwrap(api.GET('/api/v1/experiments', { params: { query: { page: 1, pageSize: 50 } } })),
  });
}
