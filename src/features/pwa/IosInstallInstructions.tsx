import { Share, SquarePlus } from 'lucide-react';
import { Sheet } from '@/shared/ui/Sheet';

/** iOS Safari has no install prompt: explain the manual steps (FE-01 §7). */
export function IosInstallInstructions({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Install on iPhone or iPad"
      description="Add Kulture Compass to your Home Screen to open it like an app."
    >
      <ol className="flex list-decimal flex-col gap-4 pl-5 text-[15px] text-ink marker:text-ink-muted">
        <li>
          In Safari, tap <Share aria-hidden className="inline size-4 align-text-bottom" />{' '}
          <strong className="font-medium">Share</strong> in the toolbar.
        </li>
        <li>
          Scroll down and tap <SquarePlus aria-hidden className="inline size-4 align-text-bottom" />{' '}
          <strong className="font-medium">Add to Home Screen</strong>.
        </li>
        <li>
          Tap <strong className="font-medium">Add</strong>. Kulture Compass appears on your Home Screen.
        </li>
      </ol>
    </Sheet>
  );
}
