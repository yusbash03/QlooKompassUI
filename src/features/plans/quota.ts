import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/auth/auth-context';
import { api, unwrap } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';

/** Generations used/remaining today (GET /me/quota). */
export function useQuota() {
  const keys = queryKeys.user(useCurrentUser().id);
  return useQuery({
    queryKey: keys.quota,
    queryFn: () => unwrap(api.GET('/api/v1/me/quota')),
    staleTime: 60_000,
  });
}
