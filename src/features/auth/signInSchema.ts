import { z } from 'zod';

export const signInSchema = z.object({
  email: z.email('Enter a valid email address').max(256),
  password: z.string().min(1, 'Enter your password').max(128),
});

export type SignInValues = z.infer<typeof signInSchema>;
