import { http, HttpResponse } from 'msw';
import { tokenStore } from '@/features/auth/tokenStore';
import { authResponse, authState, problem } from '@/test/msw/handlers/auth';
import { server } from '@/test/msw/server';
import { api, refreshSession, unwrap } from './client';
import { AppError } from './problem';

const quota = { dailyLimit: 10, usedToday: 3, remainingToday: 7, resetsAt: '2026-10-26T00:00:00Z' };

/** /me/quota that only accepts refreshed tokens, recording the Authorization header of each call. */
function quotaAcceptingRefreshedTokens(seen: (string | null)[] = []) {
  server.use(
    http.get('*/api/v1/me/quota', ({ request }) => {
      const auth = request.headers.get('Authorization');
      seen.push(auth);
      return auth?.startsWith('Bearer access-refreshed-') ? HttpResponse.json(quota) : problem(401, 'unauthenticated');
    }),
  );
  return seen;
}

describe('api client auth middleware', () => {
  it('attaches the in-memory access token as a Bearer header', async () => {
    tokenStore.set(authResponse('access-refreshed-0'));
    const seen = quotaAcceptingRefreshedTokens();

    await expect(unwrap(api.GET('/api/v1/me/quota'))).resolves.toEqual(quota);
    expect(seen).toEqual(['Bearer access-refreshed-0']);
  });

  it('refreshes ONCE for concurrent 401s, then replays each request once', async () => {
    tokenStore.set(authResponse('access-stale'));
    authState.refreshValid = true;
    const seen = quotaAcceptingRefreshedTokens();

    const results = await Promise.all([
      unwrap(api.GET('/api/v1/me/quota')),
      unwrap(api.GET('/api/v1/me/quota')),
      unwrap(api.GET('/api/v1/me/quota')),
    ]);

    expect(results).toEqual([quota, quota, quota]);
    expect(authState.refreshCalls).toBe(1);
    expect(seen.filter((h) => h === 'Bearer access-stale')).toHaveLength(3);
    expect(seen.filter((h) => h === 'Bearer access-refreshed-1')).toHaveLength(3);
    expect(tokenStore.get()?.accessToken).toBe('access-refreshed-1');
  });

  it('ends the session when the refresh token is rejected', async () => {
    tokenStore.set(authResponse('access-stale'));
    authState.refreshValid = false;
    quotaAcceptingRefreshedTokens();
    const reasons: (string | undefined)[] = [];
    const unsubscribe = tokenStore.subscribe(({ reason }) => reasons.push(reason));

    const failure = unwrap(api.GET('/api/v1/me/quota'));

    await expect(failure).rejects.toBeInstanceOf(AppError);
    await expect(failure).rejects.toMatchObject({ status: 401 });
    expect(tokenStore.get()).toBeNull();
    expect(reasons).toEqual(['expired']);
    unsubscribe();
  });

  it('refreshes proactively when the token expires within 60 s', async () => {
    tokenStore.set(authResponse('access-expiring', undefined, 30_000));
    authState.refreshValid = true;
    const seen = quotaAcceptingRefreshedTokens();

    await unwrap(api.GET('/api/v1/me/quota'));

    expect(authState.refreshCalls).toBe(1);
    expect(seen).toEqual(['Bearer access-refreshed-1']);
  });

  it('sends the CSRF header on refresh', async () => {
    authState.refreshValid = true;
    await expect(refreshSession()).resolves.toMatchObject({ kind: 'ok' });
    expect(authState.lastRefreshHeaders?.get('X-Requested-With')).toBe('kc-web');
  });

  it('turns network failures into AppError network_error', async () => {
    server.use(http.get('*/api/v1/me/quota', () => HttpResponse.error()));
    await expect(unwrap(api.GET('/api/v1/me/quota'))).rejects.toMatchObject({ code: 'network_error', status: 0 });
  });
});
