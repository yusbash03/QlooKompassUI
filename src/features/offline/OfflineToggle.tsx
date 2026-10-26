import { useEffect, useRef } from 'react';
import type { components } from '@/shared/api/schema';
import { Switch } from '@/shared/ui/Switch';
import { useToast } from '@/shared/ui/toast-context';
import { useOfflineCopy, useSetOffline } from './useOfflineCopies';

type GrowthPlan = components['schemas']['GrowthPlanDto'];

/** "Available offline" switch on a completed plan (FE-6). Saving is a deliberate opt-in per plan. */
export function OfflineToggle({ plan }: { plan: GrowthPlan }) {
  const copy = useOfflineCopy(plan.id);
  const setOffline = useSetOffline();
  const toast = useToast();
  const saved = copy.data != null;
  const lastSynced = useRef<GrowthPlan | null>(null);

  // Keep a saved copy current when the plan changes online (e.g. an experiment is started).
  useEffect(() => {
    if (!saved || lastSynced.current === plan) return;
    lastSynced.current = plan;
    if (copy.data && JSON.stringify(copy.data.plan) !== JSON.stringify(plan))
      setOffline.mutate({ plan, offline: true });
  }, [saved, plan, copy.data, setOffline]);

  return (
    <Switch
      label="Available offline"
      checked={saved}
      disabled={copy.isPending || setOffline.isPending}
      onCheckedChange={(offline) =>
        setOffline.mutate(
          { plan, offline },
          {
            onSuccess: () =>
              toast({ message: offline ? 'Saved on this device for offline reading' : 'Offline copy removed' }),
            onError: () => toast({ message: 'Couldn’t update the offline copy on this device' }),
          },
        )
      }
    />
  );
}
