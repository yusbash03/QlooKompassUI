import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import { PageContainer } from '@/shared/layout/PageHeader';
import { ErrorState } from '@/shared/ui/ErrorState';
import { FullPageStatus } from '@/shared/ui/FullPageStatus';
import { PlanView } from './plan-view/PlanView';

/** /sample — the public, clearly labelled synthetic plan (US-A2). The service worker caches it for offline (FE-7). */
export function SamplePlanPage() {
  const sample = useQuery({
    queryKey: queryKeys.samplePlan,
    queryFn: () => unwrap(api.GET('/api/v1/sample-plan')),
    staleTime: 60 * 60_000,
    // Offline, still ask: the service worker answers from its cache (FE-01 §7).
    networkMode: 'offlineFirst',
  });

  if (sample.isPending) return <FullPageStatus label="Loading the sample plan…" />;
  if (sample.isError) {
    return (
      <PageContainer narrow>
        <ErrorState
          title="The sample plan isn't available right now"
          error={sample.error}
          onRetry={() => void sample.refetch()}
        />
      </PageContainer>
    );
  }
  return <PlanView plan={sample.data} mode="sample" />;
}
