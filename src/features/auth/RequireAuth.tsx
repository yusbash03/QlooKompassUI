import type { ReactNode } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router';
import { FullPageStatus } from '@/shared/ui/FullPageStatus';
import { useAuth } from './auth-context';
import { DEFAULT_AUTHED_PATH, safeRedirect } from './redirect';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageStatus label="Restoring your session…" />;
  if (status === 'anonymous') {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/sign-in?redirect=${redirect}`} replace />;
  }
  return children;
}

/** Sign-in/up pages: already signed in → go where the user was heading (or saved plans). */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const [params] = useSearchParams();

  if (status === 'loading') return <FullPageStatus label="Checking your session…" />;
  if (status === 'authenticated') {
    return <Navigate to={safeRedirect(params.get('redirect')) ?? DEFAULT_AUTHED_PATH} replace />;
  }
  return children;
}
