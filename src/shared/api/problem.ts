import type { components } from './schema';

type ContractCode = components['schemas']['ProblemDetails']['code'];
/** Contract codes plus client-side ones for failures that never reached (or never came back from) the API. */
export type AppErrorCode = ContractCode | 'network_error' | 'timeout' | 'unknown_error';

const CONTRACT_CODES = [
  'validation_failed',
  'idempotency_key_missing',
  'unauthenticated',
  'invalid_credentials',
  'refresh_invalid',
  'token_reused',
  'email_taken',
  'account_locked',
  'not_found',
  'idempotency_key_reused',
  'plan_in_progress',
  'version_mismatch',
  'precondition_required',
  'payload_too_large',
  'rate_limited',
  'generation_quota_exceeded',
  'feature_disabled',
  'internal_error',
] as const satisfies readonly ContractCode[];

interface ParsedProblem {
  title?: string;
  detail?: string;
  code?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
}

// Hand-rolled rather than Zod: this runs on every error and sits in the entry chunk, where Zod would add ~60 kB gzip.
function parseProblem(body: unknown): ParsedProblem {
  if (typeof body !== 'object' || body === null) return {};
  const record = body as Record<string, unknown>;
  const str = (key: string) => (typeof record[key] === 'string' ? (record[key] as string) : undefined);

  let errors: Record<string, string[]> | undefined;
  if (typeof record.errors === 'object' && record.errors !== null) {
    errors = {};
    for (const [field, messages] of Object.entries(record.errors)) {
      if (Array.isArray(messages)) errors[field] = messages.filter((m): m is string => typeof m === 'string');
    }
  }
  return { title: str('title'), detail: str('detail'), code: str('code'), traceId: str('traceId'), errors };
}

export class AppError extends Error {
  readonly status: number;
  readonly code: AppErrorCode;
  readonly title: string;
  readonly detail: string | null;
  readonly fieldErrors: Record<string, string[]>;
  readonly traceId: string | null;
  /** Seconds from the `Retry-After` header (429s), when present. */
  readonly retryAfterSeconds: number | null;

  constructor(init: {
    status: number;
    code: AppErrorCode;
    title: string;
    detail?: string | null;
    fieldErrors?: Record<string, string[]>;
    traceId?: string | null;
    retryAfterSeconds?: number | null;
    cause?: unknown;
  }) {
    super(init.detail ?? init.title, { cause: init.cause });
    this.name = 'AppError';
    this.status = init.status;
    this.code = init.code;
    this.title = init.title;
    this.detail = init.detail ?? null;
    this.fieldErrors = init.fieldErrors ?? {};
    this.traceId = init.traceId ?? null;
    this.retryAfterSeconds = init.retryAfterSeconds ?? null;
  }

  get isNetwork(): boolean {
    return this.code === 'network_error' || this.code === 'timeout';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

function isContractCode(value: string | undefined): value is ContractCode {
  return CONTRACT_CODES.some((code) => code === value);
}

function fallbackCode(status: number): AppErrorCode {
  if (status === 401) return 'unauthenticated';
  if (status === 404) return 'not_found';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'internal_error';
  return 'unknown_error';
}

/** Builds an AppError from an error response and its already-parsed body (openapi-fetch parses JSON bodies for us). */
export function problemFromResponse(response: Response, body: unknown): AppError {
  const problem = parseProblem(body);
  const retryAfter = Number(response.headers.get('Retry-After'));

  return new AppError({
    status: response.status,
    code: isContractCode(problem.code) ? problem.code : fallbackCode(response.status),
    title: problem.title ?? (response.statusText || 'Request failed'),
    detail: problem.detail ?? null,
    fieldErrors: problem.errors ?? {},
    traceId: problem.traceId ?? null,
    retryAfterSeconds: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
  });
}

export function problemFromThrown(error: unknown): AppError {
  if (isAppError(error)) return error;
  const timedOut = error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError');
  return new AppError({
    status: 0,
    code: timedOut ? 'timeout' : 'network_error',
    title: timedOut ? 'The request timed out' : 'Network request failed',
    cause: error,
  });
}
