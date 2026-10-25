import type { components } from '@/shared/api/schema';

export type AuthResponse = components['schemas']['AuthResponse'];
export type User = components['schemas']['UserDto'];

export interface Session {
  accessToken: string;
  /** Epoch ms. */
  expiresAt: number;
  user: User;
}

/** Why a session ended: the user asked, the refresh token was rejected, or another tab signed out. */
export type EndReason = 'signed-out' | 'expired' | 'remote';

type Listener = (event: { session: Session | null; previous: Session | null; reason?: EndReason }) => void;

// Memory only — never Web Storage or IndexedDB (02-security §1). A reload restores via the refresh cookie.
let current: Session | null = null;
const listeners = new Set<Listener>();

function emit(previous: Session | null, reason?: EndReason) {
  for (const listener of listeners) listener({ session: current, previous, reason });
}

export const tokenStore = {
  get(): Session | null {
    return current;
  },

  set(auth: AuthResponse): Session {
    const previous = current;
    current = { accessToken: auth.accessToken, expiresAt: Date.parse(auth.expiresAt), user: auth.user };
    emit(previous);
    return current;
  },

  clear(reason: EndReason): void {
    if (!current) return;
    const previous = current;
    current = null;
    emit(previous, reason);
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
