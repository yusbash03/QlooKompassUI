import { screen, waitFor } from '@testing-library/react';
import { http } from 'msw';
import { LOCKED_EMAIL, problem, VALID_PASSWORD } from '@/test/msw/handlers/auth';
import { server } from '@/test/msw/server';
import { renderRoute } from '@/test/renderRoute';

async function fillAndSubmit(user: ReturnType<typeof renderRoute>['user'], email: string, password: string) {
  if (email) await user.type(await screen.findByLabelText('Email'), email);
  if (password) await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
}

describe('SignInPage', () => {
  it('validates before calling the API', async () => {
    const { user } = renderRoute('/sign-in');
    await screen.findByLabelText('Email');
    await fillAndSubmit(user, '', '');

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Enter your password')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows one generic message for wrong credentials', async () => {
    const { user } = renderRoute('/sign-in');
    await fillAndSubmit(user, 'ada@example.com', 'wrong-password');

    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.');
  });

  it('explains a locked account', async () => {
    const { user } = renderRoute('/sign-in');
    await fillAndSubmit(user, LOCKED_EMAIL, VALID_PASSWORD);

    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts — try again in 15 minutes.');
  });

  it('maps server field errors onto the form', async () => {
    server.use(
      http.post('*/api/v1/auth/login', () =>
        problem(400, 'validation_failed', { errors: { Email: ['Email is not allowed.'] } }),
      ),
    );
    const { user } = renderRoute('/sign-in');
    await fillAndSubmit(user, 'ada@example.com', VALID_PASSWORD);

    expect(await screen.findByText('Email is not allowed.')).toBeInTheDocument();
  });

  it('signs in and continues to the redirect target', async () => {
    const { user, router } = renderRoute('/sign-in?redirect=%2Fapp%2Fexperiments');
    await fillAndSubmit(user, 'ada@example.com', VALID_PASSWORD);

    await waitFor(() => expect(router.state.location.pathname).toBe('/app/experiments'));
  });

  it('toggles password visibility', async () => {
    const { user } = renderRoute('/sign-in');
    const password = await screen.findByLabelText('Password');
    expect(password).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
  });
});
