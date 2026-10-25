/** sessionStorage prefix for pending generation Idempotency-Keys (keyed by profileId) — FE-01 §4. */
export const IDEMPOTENCY_KEY_PREFIX = 'kc-idem:';

export function clearIdempotencyKeys(): void {
  try {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith(IDEMPOTENCY_KEY_PREFIX)) sessionStorage.removeItem(key);
    }
  } catch {
    // Storage can be unavailable (private mode, blocked site data); nothing to clear then.
  }
}
