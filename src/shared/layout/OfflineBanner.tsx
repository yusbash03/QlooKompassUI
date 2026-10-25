import { useOnlineStatus } from '@/shared/lib/useOnlineStatus';
import { Banner } from '@/shared/ui/Banner';

/** Dark strip under the top bar (design screen 22). Copy from FE-01 §7. */
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <Banner tone="offline" strip>
      You&apos;re offline. Saved offline plans are available; generating a new plan needs a connection to our research
      service.
    </Banner>
  );
}
