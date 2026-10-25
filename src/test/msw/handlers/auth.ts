import { http, HttpResponse } from 'msw';
import type { AuthResponse, User } from '@/features/auth/tokenStore';
import type { components } from '@/shared/api/schema';

type ProblemCode = components['schemas']['ProblemDetails']['code'];

export const testUser: User = {
  id: '6f1c2b8e-3d4a-4e5f-9a1b-2c3d4e5f6a7b',
  email: 'ada@example.com',
  displayName: 'Ada',
  createdAt: '2026-10-01T09:00:00Z',
};

export const VALID_PASSWORD = 'Correct-horse-1';
export const TAKEN_EMAIL = 'taken@example.com';
export const LOCKED_EMAIL = 'locked@example.com';

export function authResponse(accessToken: string, user: User = testUser, ttlMs = 15 * 60_000): AuthResponse {
  return { accessToken, tokenType: 'Bearer', expiresAt: new Date(Date.now() + ttlMs).toISOString(), user };
}

export function problem(status: number, code: ProblemCode, extra: Record<string, unknown> = {}) {
  return HttpResponse.json(
    { type: 'about:blank', title: code, status, code, traceId: 'trace-test', ...extra },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

/** Mutable fake-backend state; tests flip it, setup.ts resets it after each test. */
export const authState = {
  refreshValid: false,
  refreshUser: testUser,
  refreshCalls: 0,
  logoutCalls: 0,
  lastRefreshHeaders: null as Headers | null,
};

export function resetAuthState(): void {
  authState.refreshValid = false;
  authState.refreshUser = testUser;
  authState.refreshCalls = 0;
  authState.logoutCalls = 0;
  authState.lastRefreshHeaders = null;
}

export const authHandlers = [
  http.post('*/api/v1/auth/refresh', ({ request }) => {
    authState.refreshCalls += 1;
    authState.lastRefreshHeaders = request.headers;
    if (request.headers.get('X-Requested-With') !== 'kc-web') return problem(400, 'validation_failed');
    if (!authState.refreshValid) return problem(401, 'refresh_invalid');
    return HttpResponse.json(authResponse(`access-refreshed-${authState.refreshCalls}`, authState.refreshUser));
  }),

  http.post('*/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.email === LOCKED_EMAIL) return problem(423, 'account_locked');
    if (body.password !== VALID_PASSWORD) return problem(401, 'invalid_credentials');
    authState.refreshValid = true;
    return HttpResponse.json(authResponse('access-login', { ...testUser, email: body.email }));
  }),

  http.post('*/api/v1/auth/register', async ({ request }) => {
    const body = (await request.json()) as { email: string; displayName?: string | null };
    if (body.email === TAKEN_EMAIL) return problem(409, 'email_taken');
    authState.refreshValid = true;
    return HttpResponse.json(
      authResponse('access-register', { ...testUser, email: body.email, displayName: body.displayName ?? null }),
      { status: 201 },
    );
  }),

  http.post('*/api/v1/auth/logout', () => {
    authState.logoutCalls += 1;
    authState.refreshValid = false;
    return new HttpResponse(null, { status: 204 });
  }),
];
