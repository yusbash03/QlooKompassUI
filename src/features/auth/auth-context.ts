import { createContext, useContext } from 'react';
import type { components } from '@/shared/api/schema';
import type { User } from './tokenStore';

export type LoginRequest = components['schemas']['LoginRequest'];
export type RegisterRequest = components['schemas']['RegisterRequest'];

/** `unreachable`: the session couldn't be checked because there is no connection (retried when it returns). */
export type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'unreachable';

export interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  signIn(values: LoginRequest): Promise<void>;
  signUp(values: RegisterRequest): Promise<void>;
  signOut(): Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}

/** For screens under RequireAuth, where a user is guaranteed. */
export function useCurrentUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error('useCurrentUser used outside an authenticated route');
  return user;
}
