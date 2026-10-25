import { QueryClient } from '@tanstack/react-query';
import { isAppError } from '@/shared/api/problem';

const MAX_QUERY_RETRIES = 2;

/** Queries are GETs: retry only transient failures (network, timeout, 5xx). Never retry 4xx — they won't change. */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_QUERY_RETRIES || !isAppError(error)) return false;
  return error.isNetwork || error.status >= 500;
}

// FE-01 §4 defaults. Mutations never auto-retry (generation safety: retries are manual and reuse the idempotency key).
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: shouldRetryQuery },
      mutations: { retry: false },
    },
  });
}
