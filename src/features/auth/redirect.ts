export const DEFAULT_AUTHED_PATH = '/app/plans';

/** Only same-app paths are honoured, so `?redirect=` can't bounce users to another site. */
export function safeRedirect(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null;
  return value;
}
