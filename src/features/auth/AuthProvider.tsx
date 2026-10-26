import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { authClient, CSRF_HEADER, refreshSession, unwrap } from '@/shared/api/client';
import { AuthContext, type AuthContextValue, type LoginRequest, type RegisterRequest } from './auth-context';
import { openAuthChannel, type AuthChannel } from './authBroadcast';
import { tokenStore } from './tokenStore';
import { clearUserData } from './useSignOutCleanup';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const session = useSyncExternalStore(tokenStore.subscribe, tokenStore.get, tokenStore.get);
  const [restoring, setRestoring] = useState(() => tokenStore.get() === null);
  const [unreachable, setUnreachable] = useState(false);
  const channel = useRef<AuthChannel | null>(null);
  const pendingCleanup = useRef<Promise<void>>(Promise.resolve());

  // Silent session restore from the refresh cookie, once per app start. Single-flight, so StrictMode's double effect is harmless.
  useEffect(() => {
    if (!restoring) return;
    let active = true;
    void refreshSession()
      .then((result) => {
        if (active) setUnreachable(result.kind === 'network');
      })
      .finally(() => {
        if (active) setRestoring(false);
      });
    return () => {
      active = false;
    };
  }, [restoring]);

  // Started offline: try again as soon as the connection is back, so the user lands where they were heading.
  useEffect(() => {
    if (!unreachable) return;
    const retry = () => setRestoring(true);
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [unreachable]);

  // Every way a session ends or changes hands (sign-out, refresh rejected, other tab, user switch) cleans up here.
  useEffect(
    () =>
      tokenStore.subscribe(({ session: next, previous, reason }) => {
        if (!previous || next?.user.id === previous.user.id) return;
        pendingCleanup.current = clearUserData(queryClient, previous.user.id);
        if (reason === 'signed-out' || reason === 'expired') {
          channel.current?.post({ type: 'logout', userId: previous.user.id });
        }
      }),
    [queryClient],
  );

  useEffect(() => {
    const opened = openAuthChannel((message) => {
      const mine = tokenStore.get();
      if (message.type === 'logout') {
        if (mine?.user.id === message.userId) tokenStore.clear('remote');
      } else if (mine?.user.id !== message.userId) {
        // Another tab signed in (possibly as someone else): adopt that session from the shared cookie.
        void refreshSession();
      }
    });
    channel.current = opened;
    return () => {
      opened.close();
      channel.current = null;
    };
  }, []);

  const signIn = useCallback(async (values: LoginRequest) => {
    const auth = await unwrap(authClient.POST('/api/v1/auth/login', { body: values }));
    tokenStore.set(auth);
    channel.current?.post({ type: 'login', userId: auth.user.id });
  }, []);

  const signUp = useCallback(async (values: RegisterRequest) => {
    const auth = await unwrap(authClient.POST('/api/v1/auth/register', { body: values }));
    tokenStore.set(auth);
    channel.current?.post({ type: 'login', userId: auth.user.id });
  }, []);

  const signOut = useCallback(async () => {
    const current = tokenStore.get();
    if (!current) return;
    try {
      await authClient.POST('/api/v1/auth/logout', {
        params: { header: CSRF_HEADER },
        headers: { Authorization: `Bearer ${current.accessToken}` },
      });
    } catch {
      // Offline or server down: still wipe this device. The refresh cookie expires on its own.
    }
    tokenStore.clear('signed-out');
    await pendingCleanup.current;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: session ? 'authenticated' : restoring ? 'loading' : unreachable ? 'unreachable' : 'anonymous',
      user: session?.user ?? null,
      signIn,
      signUp,
      signOut,
    }),
    [session, restoring, unreachable, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
