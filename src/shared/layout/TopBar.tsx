import { Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router';
import { useQuota } from '@/features/plans/quota';
import { useOnlineStatus } from '@/shared/lib/useOnlineStatus';
import { LogoMark } from '@/shared/ui/Logo';

const pill =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-surface px-2.5 py-1';

/** Sticky app top bar: logo on phones, today's quota and connection status (Magic Patterns). */
export function TopBar() {
  const online = useOnlineStatus();
  const quota = useQuota();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-bg px-4 md:justify-end md:px-8">
      <Link to="/app/plans" className="rounded-md md:hidden" aria-label="Kulture Compass — plans">
        <LogoMark />
      </Link>
      <div className="flex items-center gap-2 text-xs text-ink-muted">
        {quota.data && (
          <span className={pill}>
            <span className="font-medium text-ink">
              {quota.data.remainingToday} of {quota.data.dailyLimit}
            </span>
            plans left today
          </span>
        )}
        <span className={pill}>
          {online ? (
            <Wifi aria-hidden className="size-3.5 text-strong" />
          ) : (
            <WifiOff aria-hidden className="size-3.5 text-ink-muted" />
          )}
          {online ? 'Online' : 'Offline'}
        </span>
      </div>
    </header>
  );
}
