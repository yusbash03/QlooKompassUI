import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

/**
 * Puts server `errors` (ProblemDetails) onto matching form fields. Backend keys may be PascalCase ("Email") or dotted
 * ("References[0].Name"); we match on a camelCased form. Returns messages for keys no field claimed.
 */
export function applyFieldErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fieldErrors: Record<string, string[]>,
  fields: readonly Path<T>[],
): string[] {
  const unmatched: string[] = [];
  for (const [key, messages] of Object.entries(fieldErrors)) {
    const camel = key
      .split('.')
      .map((part) => part.charAt(0).toLowerCase() + part.slice(1))
      .join('.')
      .replace(/\[(\d+)\]/g, '.$1');
    const field = fields.find((f) => f === camel);
    const message = messages.join(' ');
    if (field) setError(field, { type: 'server', message });
    else unmatched.push(message);
  }
  return unmatched;
}
