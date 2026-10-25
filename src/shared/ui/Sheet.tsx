import * as RadixDialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { useReturnFocus } from './use-return-focus';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  /** Small line above the title, e.g. the mono evidence key. */
  eyebrow?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}

/**
 * Side drawer on ≥ 640px, bottom sheet on phones (component sheet §10). Radix traps focus, closes on Escape and returns
 * focus to whatever opened it.
 */
export function Sheet({ open, onOpenChange, title, eyebrow, description, children }: SheetProps) {
  const returnFocus = useReturnFocus();
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-[#14122B]/45" />
        <RadixDialog.Content
          {...returnFocus}
          className={
            'fixed z-50 flex flex-col overflow-hidden bg-surface text-ink shadow-2xl ' +
            'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-[18px] border-t border-border ' +
            'sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[420px] sm:rounded-none sm:border-t-0 sm:border-l'
          }
        >
          <span aria-hidden className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-border-strong sm:hidden" />
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
            <div className="min-w-0">
              {eyebrow}
              <RadixDialog.Title className="font-heading text-2xl font-semibold text-ink">{title}</RadixDialog.Title>
              {description ? (
                <RadixDialog.Description className="text-sm text-ink-muted">{description}</RadixDialog.Description>
              ) : (
                <RadixDialog.Description className="sr-only">Details</RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close className="shrink-0 rounded-lg bg-surface-muted px-3 py-1.5 text-[13px] font-semibold text-ink hover:bg-border">
              Close
            </RadixDialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-6">{children}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
