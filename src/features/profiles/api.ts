import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/auth/auth-context';
import { api, unwrap, unwrapResponse } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import type { BusinessProfileDto, BusinessProfileRequest } from './profileSchema';

export interface ProfileWithEtag {
  profile: BusinessProfileDto;
  /** Sent back as If-Match on PUT (01-api-contract §1 concurrency). */
  etag: string;
}

function withEtag(profile: BusinessProfileDto, response: Response): ProfileWithEtag {
  // The contract defines ETag as the quoted version; fall back to that if a proxy strips the header.
  return { profile, etag: response.headers.get('ETag') ?? `"${profile.version}"` };
}

export function useProfile(profileId: string) {
  const keys = queryKeys.user(useCurrentUser().id);
  return useQuery({
    queryKey: keys.profile(profileId),
    queryFn: async () => {
      const { data, response } = await unwrapResponse(
        api.GET('/api/v1/business-profiles/{id}', { params: { path: { id: profileId } } }),
      );
      return withEtag(data, response);
    },
  });
}

export function useProfiles(page = 1) {
  const keys = queryKeys.user(useCurrentUser().id);
  return useQuery({
    queryKey: keys.profiles(page),
    queryFn: () => unwrap(api.GET('/api/v1/business-profiles', { params: { query: { page, pageSize: 20 } } })),
    placeholderData: keepPreviousData,
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  const keys = queryKeys.user(useCurrentUser().id);
  return useMutation({
    mutationFn: async (body: BusinessProfileRequest) => {
      const { data, response } = await unwrapResponse(api.POST('/api/v1/business-profiles', { body }));
      return withEtag(data, response);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(keys.profile(saved.profile.id), saved);
      void queryClient.invalidateQueries({ queryKey: [...keys.all, 'profiles'] });
    },
  });
}

export function useUpdateProfile(profileId: string) {
  const queryClient = useQueryClient();
  const keys = queryKeys.user(useCurrentUser().id);
  return useMutation({
    mutationFn: async ({ body, etag }: { body: BusinessProfileRequest; etag: string }) => {
      const { data, response } = await unwrapResponse(
        api.PUT('/api/v1/business-profiles/{id}', {
          params: { path: { id: profileId }, header: { 'If-Match': etag } },
          body,
        }),
      );
      return withEtag(data, response);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(keys.profile(profileId), saved);
      void queryClient.invalidateQueries({ queryKey: [...keys.all, 'profiles'] });
    },
  });
}
