export type AuthMessage = { type: 'login'; userId: string } | { type: 'logout'; userId: string };

const CHANNEL_NAME = 'kc-auth';

function isAuthMessage(value: unknown): value is AuthMessage {
  if (typeof value !== 'object' || value === null) return false;
  const { type, userId } = value as Record<string, unknown>;
  return (type === 'login' || type === 'logout') && typeof userId === 'string';
}

export interface AuthChannel {
  post(message: AuthMessage): void;
  close(): void;
}

/** Cross-tab sign-in/sign-out sync. A no-op where BroadcastChannel is unavailable. */
export function openAuthChannel(onMessage: (message: AuthMessage) => void): AuthChannel {
  if (typeof BroadcastChannel === 'undefined') return { post: () => {}, close: () => {} };

  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (event: MessageEvent<unknown>) => {
    if (isAuthMessage(event.data)) onMessage(event.data);
  };
  return {
    post: (message) => channel.postMessage(message),
    close: () => channel.close(),
  };
}
