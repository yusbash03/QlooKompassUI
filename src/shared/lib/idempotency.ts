/** sessionStorage prefix for pending generation Idempotency-Keys (keyed by profileId) — FE-01 §4. */
export const IDEMPOTENCY_KEY_PREFIX = 'kc-idem:';

interface PendingKey {
  key: string;
  /** What the key was issued for. Reusing a key with a different body is a 409 on the server, so we never do. */
  fingerprint: string;
}

const storageKey = (scope: string) => `${IDEMPOTENCY_KEY_PREFIX}${scope}`;

function read(scope: string): PendingKey | null {
  try {
    const raw = sessionStorage.getItem(storageKey(scope));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as PendingKey).key === 'string' &&
      typeof (parsed as PendingKey).fingerprint === 'string'
    ) {
      return parsed as PendingKey;
    }
  } catch {
    // Unavailable or corrupt storage: behave as if nothing is pending.
  }
  return null;
}

/**
 * The key for one user intent ("generate a plan for this brief with these options"), created when the user presses
 * Generate. If an earlier attempt for the same intent never got a definite answer (network failure, timeout, reload
 * mid-request), its key is returned so a manual retry cannot start a second plan or use up quota twice (US-D3).
 * Only the key and an options fingerprint are stored — never brief content or tokens.
 */
export function idempotencyKeyFor(scope: string, fingerprint: string): string {
  const pending = read(scope);
  if (pending && pending.fingerprint === fingerprint) return pending.key;
  const fresh: PendingKey = { key: crypto.randomUUID(), fingerprint };
  try {
    sessionStorage.setItem(storageKey(scope), JSON.stringify(fresh));
  } catch {
    // Without storage the key still lives for this attempt; only reload-survival is lost.
  }
  return fresh.key;
}

/** The server answered definitively (2xx or 4xx): the intent is settled and the next press is a new intent. */
export function settleIdempotencyKey(scope: string): void {
  try {
    sessionStorage.removeItem(storageKey(scope));
  } catch {
    // Nothing to clear.
  }
}

export function hasPendingIdempotencyKey(scope: string): boolean {
  return read(scope) !== null;
}

export function clearIdempotencyKeys(): void {
  try {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith(IDEMPOTENCY_KEY_PREFIX)) sessionStorage.removeItem(key);
    }
  } catch {
    // Storage can be unavailable (private mode, blocked site data); nothing to clear then.
  }
}
