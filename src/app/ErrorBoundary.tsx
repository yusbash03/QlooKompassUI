import { CircleAlert } from 'lucide-react';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { isAppError } from '@/shared/api/problem';
import { Button } from '@/shared/ui/Button';
import { NotFoundPage } from './NotFoundPage';

/** Route-level error element: unexpected render/loader errors get a calm page with a reload, never a stack trace. */
export function RouteErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;

  console.error(error);
  const traceId = isAppError(error) ? error.traceId : null;

  return (
    <main
      id="main"
      tabIndex={-1}
      className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-4 text-center outline-none"
    >
      <CircleAlert aria-hidden className="size-12 text-danger" />
      <h1 className="text-3xl text-ink">Something went wrong</h1>
      <p className="max-w-md text-ink-muted">
        An unexpected error stopped this page from loading. Reloading usually fixes it.
        {traceId && <span className="mt-2 block text-sm">Reference: {traceId}</span>}
      </p>
      <Button onClick={() => window.location.reload()}>Reload</Button>
    </main>
  );
}
