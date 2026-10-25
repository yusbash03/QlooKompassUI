import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Circle } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { isAppError } from '@/shared/api/problem';
import { cn } from '@/shared/lib/cn';
import { applyFieldErrors } from '@/shared/lib/forms';
import { Banner } from '@/shared/ui/Banner';
import { Button } from '@/shared/ui/Button';
import { PasswordField, TextField } from '@/shared/ui/TextField';
import { useAuth } from './auth-context';
import { authErrorMessage } from './authErrors';
import { AuthShell } from './AuthShell';
import { DEFAULT_AUTHED_PATH, safeRedirect } from './redirect';
import {
  checkPassword,
  PASSWORD_MIN_CLASSES,
  PASSWORD_MIN_LENGTH,
  signUpSchema,
  type SignUpValues,
} from './signUpSchema';

export function SignUpPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = safeRedirect(params.get('redirect'));
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', displayName: '', password: '' },
  });
  const password = useWatch({ control, name: 'password' });

  const onSubmit = handleSubmit(async ({ email, displayName, password }) => {
    setFormError(null);
    try {
      await signUp({ email, password, displayName: displayName || null });
      navigate(redirect ?? DEFAULT_AUTHED_PATH, { replace: true });
    } catch (error) {
      if (isAppError(error) && error.code === 'email_taken') {
        setError('email', { type: 'server', message: authErrorMessage(error) });
        return;
      }
      if (isAppError(error) && error.code === 'validation_failed') {
        const rest = applyFieldErrors(setError, error.fieldErrors, ['email', 'displayName', 'password']);
        if (rest.length > 0) setFormError(rest.join(' '));
        return;
      }
      setFormError(authErrorMessage(error));
    }
  });

  const switchHref = redirect ? `/sign-in?redirect=${encodeURIComponent(redirect)}` : '/sign-in';

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start with a brand brief. Your first plans are free."
      footer={
        <>
          <p>
            Already have an account?{' '}
            <Link to={switchHref} className="font-medium text-primary underline-offset-4 hover:underline">
              Sign in
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
          label="Display name"
          optional
          autoComplete="nickname"
          error={errors.displayName?.message}
          {...register('displayName')}
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          error={errors.password?.message}
          below={<PasswordChecklist password={password} />}
          {...register('password')}
        />
        <Button type="submit" loading={isSubmitting} className="mt-1 w-full">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}

function PasswordChecklist({ password }: { password: string }) {
  const checks = checkPassword(password);
  const items = [
    { met: checks.length, label: `${PASSWORD_MIN_LENGTH} or more characters` },
    {
      met: checks.classCount >= PASSWORD_MIN_CLASSES,
      label: `${PASSWORD_MIN_CLASSES} of: lowercase, uppercase, numbers, symbols (${checks.classCount}/4)`,
    },
  ];
  return (
    <ul aria-label="Password requirements" className="flex flex-col gap-1 text-xs">
      {items.map(({ met, label }) => (
        <li key={label} className={cn('flex items-center gap-2', met ? 'text-strong' : 'text-ink-muted')}>
          {met ? <Check aria-hidden className="size-3.5" /> : <Circle aria-hidden className="size-3.5" />}
          <span>
            {label}
            <span className="sr-only">{met ? ' — met' : ' — not yet met'}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
