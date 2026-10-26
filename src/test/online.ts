import { act } from '@testing-library/react';

/** Flip jsdom's connectivity (navigator.onLine + the matching window event) for offline tests. */
export function setOnline(online: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value: online, configurable: true });
  act(() => {
    window.dispatchEvent(new Event(online ? 'online' : 'offline'));
  });
}
