import { useSyncExternalStore } from 'react';

// navigator.onLine misses "connected to Wi-Fi but no internet", so failed fetches also flip us offline
// until the next successful response or `online` event.
let fetchFailed = false;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

export function reportNetworkFailure(): void {
  if (fetchFailed) return;
  fetchFailed = true;
  notify();
}

export function reportNetworkSuccess(): void {
  if (!fetchFailed) return;
  fetchFailed = false;
  notify();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onOnline = () => {
    fetchFailed = false;
    listener();
  };
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', listener);
  };
}

function getSnapshot(): boolean {
  return navigator.onLine && !fetchFailed;
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}
