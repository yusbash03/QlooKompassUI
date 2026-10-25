import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useReturnFocus } from './use-return-focus';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  /** Footer buttons; wrap a closing one in <DialogClose asChild>. */
  actions: ReactNode;
  children?: ReactNode;
}

export const DialogClose = RadixDialog.Close;

/**
 * Modal dialog (Magic Patterns "Record result"): header with close button, body, footer actions separated by hairlines.
 * Radix traps focus, closes on Escape and returns focus to the trigger.
 */
export function Dialog({ open, onOpenChange, title, description, actions, children }: DialogProps) {
  const returnFocus = useReturnFocus();
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-[#14122B]/50" />
        <RadixDialog.Content
          {...returnFocus}
          className="fixed top-1/2 left-1/2 z-50 flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-(--radius-card) border border-border bg-surface shadow-xl"
        >
          <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
            <div>
              <RadixDialog.Title className="font-heading text-[22px] font-semibold text-ink">{title}</RadixDialog.Title>
              {description ? (
                <RadixDialog.Description className="mt-1 text-sm text-ink-muted">{description}</RadixDialog.Description>
              ) : (
                <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close aria-label="Close" className="rounded-md p-1 text-ink-muted hover:text-ink">
              <X aria-hidden className="size-5" />
            </RadixDialog.Close>
          </div>
          {children && <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>}
          <div className="flex flex-wrap justify-end gap-2 border-t border-border px-6 py-4">{actions}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
