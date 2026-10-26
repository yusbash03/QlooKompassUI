import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useCurrentUser } from '@/features/auth/auth-context';
import { api, unwrap } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import type { components } from '@/shared/api/schema';
import { pollInterval, type GenerationStatus } from './stages';

type Schemas = components['schemas'];
export type StartGrowthPlanRequest = Schemas['StartGrowthPlanRequest'];
export type GrowthPlanAccepted = Schemas['GrowthPlanAcceptedDto'];
export type GrowthPlanStatusDto = Schemas['GrowthPlanStatusDto'];
export type GrowthPlan = Schemas['GrowthPlanDto'];

/** A generation POST that hasn't answered in this long is treated as "unconfirmed" — retry safely with the same key. */
const START_TIMEOUT_MS = 30_000;

function timeoutSignal(ms: number): AbortSignal | undefined {
  return typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(ms) : undefined;
}

/**
 * POST /growth-plans. Never retried automatically (mutations default to retry: false) — a retry is always a user action
 * that reuses the same Idempotency-Key (FE-01 §4, US-D3).
 */
export function useStartGeneration() {
  const queryClient = useQueryClient();
  const keys = queryKeys.user(useCurrentUser().id);
  return useMutation({
    mutationFn: ({ body, idempotencyKey }: { body: StartGrowthPlanRequest; idempotencyKey: string }) =>
      unwrap(
        api.POST('/api/v1/growth-plans', {
          params: { header: { 'Idempotency-Key': idempotencyKey } },
          body,
          signal: timeoutSignal(START_TIMEOUT_MS),
        }),
      ),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: keys.quota });
      void queryClient.invalidateQueries({ queryKey: [...keys.all, 'profiles'] });
    },
  });
}

/**
 * The 409 plan_in_progress problem doesn't carry the running plan's id, so look it up: the newest Running plan for the
 * brief, else the newest Queued one.
 */
export async function findActivePlanId(profileId: string): Promise<string | null> {
  for (const status of ['Running', 'Queued'] as const) {
    const page = await unwrap(
      api.GET('/api/v1/growth-plans', { params: { query: { businessProfileId: profileId, status, pageSize: 1 } } }),
    );
    const first = page.items[0];
    if (first) return first.id;
  }
  return null;
}

export function usePlan(planId: string, options: { refetchWhenTerminal?: boolean } = {}) {
  const keys = queryKeys.user(useCurrentUser().id);
  return useQuery({
    queryKey: keys.plan(planId),
    queryFn: () => unwrap(api.GET('/api/v1/growth-plans/{id}', { params: { path: { id: planId } } })),
    staleTime: options.refetchWhenTerminal ? 0 : 30_000,
  });
}

/**
 * Polls /status (2 s for 30 s, then 5 s) until the plan is terminal. TanStack Query already pauses polling while the
 * tab is hidden (refetchIntervalInBackground: false) and while offline (networkMode: 'online').
 */
export function usePlanStatus(planId: string) {
  const keys = queryKeys.user(useCurrentUser().id);
  // When this screen started watching the plan; the lazy initialiser runs once, on mount.
  const [startedAt] = useState(() => Date.now());
  return useQuery({
    queryKey: keys.planStatus(planId),
    queryFn: () => unwrap(api.GET('/api/v1/growth-plans/{id}/status', { params: { path: { id: planId } } })),
    refetchInterval: (query) =>
      pollInterval(query.state.data?.status as GenerationStatus | undefined, Date.now() - startedAt),
    staleTime: 0,
  });
}

export type GrowthPlanSummary = Schemas['GrowthPlanSummary'];
export type PlanFilters = { page: number; businessProfileId?: string; status?: GrowthPlanSummary['status'] };
export const PLANS_PAGE_SIZE = 12;

/** Saved plans, newest first, paged (FE-6). */
export function usePlans(filters: PlanFilters) {
  const keys = queryKeys.user(useCurrentUser().id);
  return useQuery({
    queryKey: keys.plans(filters),
    queryFn: () =>
      unwrap(
        api.GET('/api/v1/growth-plans', {
          params: {
            query: {
              page: filters.page,
              pageSize: PLANS_PAGE_SIZE,
              businessProfileId: filters.businessProfileId,
              status: filters.status,
            },
          },
        }),
      ),
    placeholderData: keepPreviousData,
  });
}
