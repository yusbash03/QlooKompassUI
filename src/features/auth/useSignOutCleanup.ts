import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { outcomeStore } from '@/features/experiments/outcome-store';
import { deleteOfflineStore } from '@/features/offline/offlineStore';
import { draftStore } from '@/features/profiles/draftStore';
import { clearIdempotencyKeys } from '@/shared/lib/idempotency';

/** Leaves nothing of the previous user behind on this device (US-B3). */
export async function clearUserData(queryClient: QueryClient, userId: string): Promise<void> {
  queryClient.clear();
  clearIdempotencyKeys();
  draftStore.clear(userId);
  outcomeStore.clear();
  await deleteOfflineStore(userId);
}

export function useSignOutCleanup(): (userId: string) => Promise<void> {
  const queryClient = useQueryClient();
  return useCallback((userId: string) => clearUserData(queryClient, userId), [queryClient]);
}
