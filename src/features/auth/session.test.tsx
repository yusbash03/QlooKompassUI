import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { offlineDbName } from '@/features/offline/offlineStore';
import { IDEMPOTENCY_KEY_PREFIX } from '@/shared/lib/idempotency';
import { authState, testUser, VALID_PASSWORD } from '@/test/msw/handlers/auth';
import { server } from '@/test/msw/server';
import { setOnline } from '@/test/online';
import { renderRoute } from '@/test/renderRoute';
import { tokenStore } from './tokenStore';

function createOfflineDb(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('plans');
    request.onsuccess = () => {
      request.result.close();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

async function databaseNames(): Promise<string[]> {
  return (await indexedDB.databases()).map((db) => db.name ?? '');
}

describe('RequireAuth', () => {
  it('redirects anonymous users to sign-in, keeping where they were going', async () => {
    const { router } = renderRoute('/app/plans?view=all');

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/sign-in');
    expect(new URLSearchParams(router.state.location.search).get('redirect')).toBe('/app/plans?view=all');
  });
});

describe('session restore', () => {
  it('silently restores the session from the refresh cookie on start', async () => {
    authState.refreshValid = true;
    renderRoute('/app/plans');

    expect(await screen.findByRole('heading', { level: 1, name: 'Plans' })).toBeInTheDocument();
    expect(await screen.findByText('No plans yet')).toBeInTheDocument();
    expect(authState.refreshCalls).toBe(1);
    expect(tokenStore.get()?.user.id).toBe(testUser.id);
  });

  it('sends a signed-in user away from sign-in to their redirect target', async () => {
    authState.refreshValid = true;
    const { router } = renderRoute('/sign-in?redirect=%2Fapp%2Fexperiments');

    await waitFor(() => expect(router.state.location.pathname).toBe('/app/experiments'));
  });

  it('ignores off-site redirect targets', async () => {
    authState.refreshValid = true;
    const { router } = renderRoute('/sign-in?redirect=%2F%2Fevil.example');

    await waitFor(() => expect(router.state.location.pathname).toBe('/app/plans'));
  });
});

describe('token storage', () => {
  it('never writes the access token to localStorage or sessionStorage', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const { user } = renderRoute('/sign-in');

    await user.type(await screen.findByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), VALID_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await screen.findByRole('heading', { level: 1, name: 'Plans' });

    const token = tokenStore.get()?.accessToken;
    expect(token).toBe('access-login');
    for (const [key, value] of setItem.mock.calls) {
      expect(`${key}=${value}`).not.toContain(token);
    }
    const stored = [...Object.values(localStorage), ...Object.values(sessionStorage)].join('|');
    expect(stored).not.toContain(token);
    setItem.mockRestore();
  });
});

describe('sign-out', () => {
  it('revokes the session and wipes cache, offline copies and idempotency keys', async () => {
    authState.refreshValid = true;
    await createOfflineDb(offlineDbName(testUser.id));
    await createOfflineDb('kc-offline-someone-else');
    sessionStorage.setItem(`${IDEMPOTENCY_KEY_PREFIX}profile-1`, 'key-1');
    sessionStorage.setItem('unrelated', 'keep');

    const { router, queryClient, user } = renderRoute('/app/plans');
    await screen.findByRole('heading', { level: 1, name: 'Plans' });
    queryClient.setQueryData(['u', testUser.id, 'quota'], { remainingToday: 7 });

    await user.click(screen.getAllByRole('button', { name: /account menu|^account$/i })[0]!);
    await user.click(await screen.findByRole('menuitem', { name: 'Sign out' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(authState.logoutCalls).toBe(1);
    expect(tokenStore.get()).toBeNull();
    expect(queryClient.getQueryCache().findAll({ queryKey: ['u'] })).toHaveLength(0);
    expect(sessionStorage.getItem(`${IDEMPOTENCY_KEY_PREFIX}profile-1`)).toBeNull();
    expect(sessionStorage.getItem('unrelated')).toBe('keep');
    const names = await databaseNames();
    expect(names).not.toContain(offlineDbName(testUser.id));
    expect(names).toContain('kc-offline-someone-else');
  });

  it('signs out when another tab broadcasts a logout for this user', async () => {
    authState.refreshValid = true;
    const { router } = renderRoute('/app/plans');
    await screen.findByRole('heading', { level: 1, name: 'Plans' });

    const otherTab = new BroadcastChannel('kc-auth');
    otherTab.postMessage({ type: 'logout', userId: testUser.id });
    otherTab.close();

    await waitFor(() => expect(tokenStore.get()).toBeNull());
    await waitFor(() => expect(router.state.location.pathname).toBe('/sign-in'));
  });
});

describe('starting offline', () => {
  afterEach(() => setOnline(true));

  it('explains the session can’t be restored yet, then restores it when the connection returns', async () => {
    authState.refreshValid = true;
    server.use(http.post('*/api/v1/auth/refresh', () => HttpResponse.error()));
    setOnline(false);
    const { router } = renderRoute('/app/plans');

    expect(await screen.findByRole('heading', { level: 1, name: 'You’re offline' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/app/plans');

    server.resetHandlers();
    setOnline(true);
    expect(await screen.findByRole('heading', { level: 1, name: 'Plans' })).toBeInTheDocument();
  });
});
