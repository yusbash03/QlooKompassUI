import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { isAppError } from '@/shared/api/problem';
import { applyFieldErrors } from '@/shared/lib/forms';
import { Banner } from '@/shared/ui/Banner';
import { Button } from '@/shared/ui/Button';
import { PasswordField, TextField } from '@/shared/ui/TextField';
import { useAuth } from './auth-context';
import { authErrorMessage } from './authErrors';
import { AuthShell } from './AuthShell';
import { DEFAULT_AUTHED_PATH, safeRedirect } from './redirect';
import { signInSchema, type SignInValues } from './signInSchema';

export function SignInPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = safeRedirect(params.get('redirect'));
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({ resolver: zodResolver(signInSchema), defaultValues: { email: '', password: '' } });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await signIn(values);
      navigate(redirect ?? DEFAULT_AUTHED_PATH, { replace: true });
    } catch (error) {
      if (isAppError(error) && error.code === 'validation_failed') {
        const rest = applyFieldErrors(setError, error.fieldErrors, ['email', 'password']);
        if (rest.length > 0) setFormError(rest.join(' '));
        return;
      }
      setFormError(authErrorMessage(error));
    }
  });

  const switchHref = redirect ? `/sign-up?redirect=${encodeURIComponent(redirect)}` : '/sign-up';

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to see your plans and experiments."
      footer={
        <>
          <p>
            New to Kulture Compass?{' '}
            <Link to={switchHref} className="font-medium text-primary underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
          <Link to="/sample" className="underline-offset-4 hover:underline">
            View a sample plan without an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {formError && <Banner tone="danger">{formError}</Banner>}
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" loading={isSubmitting} className="mt-1 w-full">
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
