import { X } from 'lucide-react';
import { useId } from 'react';
import { Button } from '@/shared/ui/Button';
import { LogoMark } from '@/shared/ui/Logo';
import { dismissInstall, isStandalone, promptInstall, useInstallState } from './install-store';

/** Install card — sits above the toast area (FE-01 §7): only after a plan has been viewed, not within 14 days of a dismissal, never when installed. */
export function InstallPrompt() {
  const { canPrompt, planViewed, dismissedRecently } = useInstallState();
  const titleId = useId();
  if (!canPrompt || !planViewed || dismissedRecently || isStandalone()) return null;

  return (
    <aside
      aria-labelledby={titleId}
      className="fixed inset-x-4 bottom-20 z-40 flex items-start gap-3 rounded-(--radius-card) border border-border bg-surface p-4 shadow-[0_8px_24px_rgba(20,18,43,0.12)] md:inset-x-auto md:right-6 md:bottom-24 md:w-96"
    >
      <LogoMark className="size-10" />
      <div className="min-w-0 flex-1">
        <h2 id={titleId} className="font-sans text-sm font-semibold text-ink">
          Install Kulture Compass
        </h2>
        <p className="mt-0.5 text-sm text-ink-muted">
          Open your plans from your home screen — saved ones work offline.
        </p>
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={() => void promptInstall()}>
            Install
          </Button>
          <Button size="sm" variant="ghost" onClick={dismissInstall}>
            Not now
          </Button>
        </div>
      </div>
      <button
        type="button"
        aria-label="Dismiss install suggestion"
        onClick={dismissInstall}
        className="-mt-1 -mr-1 rounded p-1 text-ink-muted hover:text-ink"
      >
        <X aria-hidden className="size-4" />
      </button>
    </aside>
  );
}
