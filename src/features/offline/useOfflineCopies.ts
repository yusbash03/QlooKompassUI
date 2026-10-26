import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/auth/auth-context';
import { queryKeys } from '@/shared/api/queryKeys';
import type { components } from '@/shared/api/schema';
import {
  deleteOfflineStore,
  getOfflineCopy,
  listOfflineCopies,
  removeOfflineCopy,
  saveOfflineCopy,
} from './offlineStore';

type GrowthPlan = components['schemas']['GrowthPlanDto'];

// IndexedDB reads are local: run them regardless of connectivity (networkMode 'always').
const local = { networkMode: 'always' as const, staleTime: Infinity, retry: false };

export function useOfflineCopies() {
  const userId = useCurrentUser().id;
  return useQuery({
    queryKey: [...queryKeys.user(userId).all, 'offline'],
    queryFn: () => listOfflineCopies(userId),
    ...local,
  });
}

export function useOfflineCopy(planId: string) {
  const userId = useCurrentUser().id;
  return useQuery({
    queryKey: [...queryKeys.user(userId).all, 'offline', planId],
    queryFn: () => getOfflineCopy(userId, planId),
    ...local,
  });
}

function useInvalidateOffline() {
  const queryClient = useQueryClient();
  const userId = useCurrentUser().id;
  return () => queryClient.invalidateQueries({ queryKey: [...queryKeys.user(userId).all, 'offline'] });
}

export function useSetOffline() {
  const userId = useCurrentUser().id;
  const invalidate = useInvalidateOffline();
  return useMutation({
    networkMode: 'always',
    mutationFn: ({ plan, offline }: { plan: GrowthPlan; offline: boolean }) =>
      offline ? saveOfflineCopy(userId, plan) : removeOfflineCopy(userId, plan.id),
    onSettled: invalidate,
  });
}

/** Account menu → "Remove offline copies": drops this user's whole offline database. */
export function useRemoveAllOfflineCopies() {
  const userId = useCurrentUser().id;
  const invalidate = useInvalidateOffline();
  return useMutation({
    networkMode: 'always',
    mutationFn: () => deleteOfflineStore(userId),
    onSettled: invalidate,
  });
}
