import { isAppError } from '@/shared/api/problem';

/** User-facing copy for auth failures (design brief §4.2). Field-level errors are handled by the forms. */
export function authErrorMessage(error: unknown): string {
  if (!isAppError(error)) return 'Something went wrong. Please try again.';
  switch (error.code) {
    case 'invalid_credentials':
      return 'Email or password is incorrect.';
    case 'account_locked':
      return 'Too many attempts — try again in 15 minutes.';
    case 'rate_limited':
      return 'Too many attempts. Please wait a minute and try again.';
    case 'email_taken':
      return 'An account with this email already exists.';
    case 'network_error':
    case 'timeout':
      return "We couldn't reach Kulture Compass. Check your connection and try again.";
    case 'validation_failed':
      return 'Please check the highlighted fields.';
    default:
      return error.traceId
        ? `Something went wrong. Please try again. (Reference: ${error.traceId})`
        : 'Something went wrong. Please try again.';
  }
}
