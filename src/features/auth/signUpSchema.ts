import { z } from 'zod';

// Mirrors the backend Identity policy (02-security §1): ≥ 10 characters, 3 of the 4 character classes.
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MIN_CLASSES = 3;

export interface PasswordChecks {
  length: boolean;
  lower: boolean;
  upper: boolean;
  digit: boolean;
  symbol: boolean;
  classCount: number;
}

export function checkPassword(password: string): PasswordChecks {
  const lower = /[a-z]/.test(password);
  const upper = /[A-Z]/.test(password);
  const digit = /\d/.test(password);
  const symbol = /[^A-Za-z0-9]/.test(password);
  return {
    length: password.length >= PASSWORD_MIN_LENGTH,
    lower,
    upper,
    digit,
    symbol,
    classCount: [lower, upper, digit, symbol].filter(Boolean).length,
  };
}

export const signUpSchema = z.object({
  email: z.email('Enter a valid email address').max(256),
  displayName: z.string().trim().max(80, 'Use 80 characters or fewer').optional(),
  password: z
    .string()
    .max(128, 'Use 128 characters or fewer')
    .refine((value) => checkPassword(value).length, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
    .refine(
      (value) => checkPassword(value).classCount >= PASSWORD_MIN_CLASSES,
      'Mix at least 3 of: lowercase, uppercase, numbers, symbols',
    ),
});

export type SignUpValues = z.infer<typeof signUpSchema>;
