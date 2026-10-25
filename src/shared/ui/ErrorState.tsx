import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { isAppError } from '@/shared/api/problem';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  error?: unknown;
  children?: ReactNode;
  onRetry?: () => void;
}

/** Inline failure for a data view: plain-language message, optional Retry, trace reference for support. */
export function ErrorState({ title = 'Something went wrong', error, children, onRetry }: ErrorStateProps) {
  const appError = isAppError(error) ? error : null;
  const message =
    children ??
    (appError?.isNetwork
      ? "We couldn't reach Kulture Compass. Check your connection and try again."
      : 'This could not be loaded. Please try again.');

  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-(--radius-card) border border-border bg-surface px-6 py-10 text-center"
    >
      <CircleAlert aria-hidden className="size-8 text-danger" />
      <h2 className="text-lg text-ink">{title}</h2>
      <div className="max-w-md text-ink-muted">{message}</div>
      {appError?.traceId && <p className="text-xs text-ink-muted">Reference: {appError.traceId}</p>}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
