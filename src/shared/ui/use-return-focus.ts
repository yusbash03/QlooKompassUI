import { useRef } from 'react';

/**
 * Radix returns focus only to its own <Dialog.Trigger>. Our overlays open programmatically (an evidence chip, a failed
 * save), so we remember whatever was focused when the overlay opened and put focus back there when it closes.
 * `onOpenAutoFocus` fires before Radix moves focus into the content, so activeElement is still the opener.
 */
export function useReturnFocus() {
  const opener = useRef<HTMLElement | null>(null);
  return {
    onOpenAutoFocus: () => {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    },
    onCloseAutoFocus: (event: Event) => {
      const target = opener.current;
      if (target?.isConnected) {
        event.preventDefault();
        target.focus();
      }
    },
  };
}
