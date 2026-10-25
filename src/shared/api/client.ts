import createClient, { type Middleware } from 'openapi-fetch';
import { tokenStore, type AuthResponse } from '@/features/auth/tokenStore';
import { reportNetworkFailure, reportNetworkSuccess } from '@/shared/lib/useOnlineStatus';
import { problemFromResponse, problemFromThrown } from './problem';
import type { paths } from './schema';

const AUTH_PREFIX = '/api/v1/auth/';
/** Auth calls whose 401 means "bad credentials / no session", not "access token expired". */
const NO_REFRESH_ON_401 = ['login', 'register', 'refresh', 'logout'].map((p) => `${AUTH_PREFIX}${p}`);
const PROACTIVE_REFRESH_MS = 60_000;
const GET_TIMEOUT_MS = 20_000;
export const CSRF_HEADER = { 'X-Requested-With': 'kc-web' } as const;

// Default base is the page's own origin → same-origin /api (Vite proxy in dev, reverse proxy in prod).
// Absolute rather than '' so Node's fetch (tests) can resolve it too.
const baseUrl = import.meta.env.VITE_API_BASE_URL || globalThis.location.origin;
// fetch is looked up per call (not captured at import) so test interceptors installed later still apply.
const lateFetch = (request: Request) => globalThis.fetch(request);

/** Bare client for /auth/* session calls: no bearer middleware, so a refresh can never recurse into another refresh. */
export const authClient = createClient<paths>({ baseUrl, fetch: lateFetch, credentials: 'include' });

export type RefreshResult = { kind: 'ok'; auth: AuthResponse } | { kind: 'rejected' } | { kind: 'network' };

let inflightRefresh: Promise<RefreshResult> | null = null;

async function performRefresh(): Promise<RefreshResult> {
  try {
    const { data, response } = await authClient.POST('/api/v1/auth/refresh', { params: { header: CSRF_HEADER } });
    if (data) {
      tokenStore.set(data);
      return { kind: 'ok', auth: data };
    }
    if (response.status === 401) {
      tokenStore.clear('expired');
      return { kind: 'rejected' };
    }
    return { kind: 'network' };
  } catch {
    return { kind: 'network' };
  }
}

/**
 * Single-flight refresh: concurrent callers share one request. Across tabs, the Web Locks API serialises refreshes so two
 * tabs never present the same rotating refresh cookie at once (which the backend would treat as token reuse).
 */
export function refreshSession(): Promise<RefreshResult> {
  if (inflightRefresh) return inflightRefresh;
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  // lib.dom types request() as Promise<Promise<T>> for async callbacks; .then flattens it to what the runtime returns.
  const run: Promise<RefreshResult> = locks
    ? locks.request('kc-auth-refresh', performRefresh).then((result) => result)
    : performRefresh();
  const pending = run.finally(() => {
    inflightRefresh = null;
  });
  inflightRefresh = pending;
  return pending;
}

function withTimeout(request: Request): AbortSignal {
  if (request.method !== 'GET' || typeof AbortSignal.any !== 'function') return request.signal;
  return AbortSignal.any([request.signal, AbortSignal.timeout(GET_TIMEOUT_MS)]);
}

// Untouched copies of outgoing requests, so a 401 can be replayed once after refreshing (bodies are single-use).
const replayable = new WeakMap<Request, Request>();

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const path = new URL(request.url).pathname;
    const isAuthCall = path.startsWith(AUTH_PREFIX);

    let session = tokenStore.get();
    if (session && !isAuthCall && session.expiresAt - Date.now() < PROACTIVE_REFRESH_MS) {
      await refreshSession();
      session = tokenStore.get();
    }

    const headers = new Headers(request.headers);
    if (session) headers.set('Authorization', `Bearer ${session.accessToken}`);
    if (isAuthCall) headers.set('X-Requested-With', CSRF_HEADER['X-Requested-With']);

    const next = new Request(request, {
      headers,
      signal: withTimeout(request),
      credentials: isAuthCall ? 'include' : 'same-origin',
    });
    replayable.set(next, next.clone());
    return next;
  },

  async onResponse({ request, response }) {
    reportNetworkSuccess();
    const path = new URL(request.url).pathname;
    if (response.status !== 401 || NO_REFRESH_ON_401.includes(path)) return undefined;

    const copy = replayable.get(request);
    if (!copy || !tokenStore.get()) return undefined;

    const result = await refreshSession();
    // 'rejected' already ended the session (sign-out flow runs via tokenStore listeners); surface the original 401.
    if (result.kind !== 'ok') return undefined;

    const headers = new Headers(copy.headers);
    headers.set('Authorization', `Bearer ${result.auth.accessToken}`);
    return globalThis.fetch(new Request(copy, { headers }));
  },

  onError({ error }) {
    reportNetworkFailure();
    return problemFromThrown(error);
  },
};

export const api = createClient<paths>({ baseUrl, fetch: lateFetch });
api.use(authMiddleware);

/** Like `unwrap`, but keeps the Response for headers such as ETag and Location. */
export async function unwrapResponse<T>(
  pending: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<{ data: T; response: Response }> {
  let result: Awaited<typeof pending>;
  try {
    result = await pending;
  } catch (error) {
    throw problemFromThrown(error);
  }
  if (!result.response.ok) throw problemFromResponse(result.response, result.error);
  // 204 responses have no body; their T is `never`/undefined in the generated types.
  return { data: result.data as T, response: result.response };
}

/** Returns the success body or throws an AppError (contract problem, network failure or timeout). */
export async function unwrap<T>(pending: Promise<{ data?: T; error?: unknown; response: Response }>): Promise<T> {
  return (await unwrapResponse(pending)).data;
}
