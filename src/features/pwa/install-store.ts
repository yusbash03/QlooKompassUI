import { useSyncExternalStore } from 'react';

/** Chromium's install event (not in lib.dom). */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'kc-install-dismissed-at';
const DISMISS_FOR_MS = 14 * 24 * 60 * 60 * 1000;

let deferred: BeforeInstallPromptEvent | null = null;
let planViewed = false;
let dismissedAt = readDismissedAt();
let listening = false;
const listeners = new Set<() => void>();

export interface InstallState {
  /** The browser offered an install prompt we can show. */
  canPrompt: boolean;
  planViewed: boolean;
  dismissedRecently: boolean;
}

let snapshot = computeSnapshot();

function computeSnapshot(): InstallState {
  return {
    canPrompt: deferred !== null,
    planViewed,
    dismissedRecently: dismissedAt !== null && Date.now() - dismissedAt < DISMISS_FOR_MS,
  };
}

function notify() {
  snapshot = computeSnapshot();
  for (const listener of listeners) listener();
}

// The dismissal time is the only thing stored, and it is not sensitive (FE-01 §7).
function readDismissedAt(): number | null {
  try {
    const value = Number(localStorage.getItem(DISMISSED_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

/** Call once at startup: the browser may fire `beforeinstallprompt` before React mounts. */
export function listenForInstallPrompt(): void {
  if (listening) return;
  listening = true;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
}

/** The install card only appears once someone has seen what a plan looks like. */
export function markPlanViewed(): void {
  if (planViewed) return;
  planViewed = true;
  notify();
}

export function dismissInstall(): void {
  dismissedAt = Date.now();
  try {
    localStorage.setItem(DISMISSED_KEY, String(dismissedAt));
  } catch {
    // Storage blocked: the card stays dismissed for this session only.
  }
  notify();
}

/** Shows the browser's install dialog. Declining counts as a dismissal. */
export async function promptInstall(): Promise<void> {
  const event = deferred;
  if (!event) return;
  deferred = null;
  await event.prompt();
  const choice = await event.userChoice;
  if (choice.outcome === 'dismissed') dismissInstall();
  else notify();
}

export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia?.('(display-mode: standalone)').matches === true || nav.standalone === true;
}

/** iOS Safari never fires `beforeinstallprompt`; installing is manual (Share → Add to Home Screen). */
export function isIos(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useInstallState(): InstallState {
  return useSyncExternalStore(subscribe, () => snapshot);
}

/** Tests only. */
export function resetInstallState(): void {
  deferred = null;
  planViewed = false;
  dismissedAt = null;
  notify();
}
