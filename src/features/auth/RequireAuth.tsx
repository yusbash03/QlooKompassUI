import { WifiOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router';
import { buttonClasses } from '@/shared/ui/button-classes';
import { EmptyState } from '@/shared/ui/EmptyState';
import { FullPageStatus } from '@/shared/ui/FullPageStatus';
import { useAuth } from './auth-context';
import { DEFAULT_AUTHED_PATH, safeRedirect } from './redirect';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageStatus label="Restoring your session…" />;
  if (status === 'unreachable') return <SessionUnreachable />;
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

/**
 * Opened offline with no session in memory: we can't tell who you are yet, so offline copies (stored per user) can't be
 * opened. Stay on this URL — the session is restored, and this page replaced, as soon as the connection returns.
 */
function SessionUnreachable() {
  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-[768px] px-4 py-16 outline-none">
      <EmptyState
        headingLevel="h1"
        icon={WifiOff}
        title="You’re offline"
        action={
          <Link to="/sample" className={buttonClasses({ variant: 'secondary' })}>
            View the sample plan
          </Link>
        }
      >
        We&apos;ll restore your session as soon as you&apos;re back online. The sample plan works offline.
      </EmptyState>
    </main>
  );
}
