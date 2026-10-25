import { screen, waitFor, within } from '@testing-library/react';
import { TAKEN_EMAIL, VALID_PASSWORD } from '@/test/msw/handlers/auth';
import { renderRoute } from '@/test/renderRoute';
import { tokenStore } from './tokenStore';

describe('SignUpPage', () => {
  it('shows the password rules live', async () => {
    const { user } = renderRoute('/sign-up');
    const checklist = await screen.findByRole('list', { name: 'Password requirements' });
    expect(within(checklist).getByText(/10 or more characters/)).toHaveTextContent('not yet met');

    await user.type(screen.getByLabelText('Password'), 'abcdefghij');
    expect(within(checklist).getByText(/10 or more characters/)).toHaveTextContent('— met');
    expect(within(checklist).getByText(/\(1\/4\)/)).toHaveTextContent('not yet met');

    await user.type(screen.getByLabelText('Password'), 'A1');
    expect(within(checklist).getByText(/\(3\/4\)/)).toHaveTextContent('— met');
  });

  it('rejects passwords that miss the backend policy', async () => {
    const { user } = renderRoute('/sign-up');
    await user.type(await screen.findByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'alllowercaseletters');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Mix at least 3 of: lowercase, uppercase, numbers, symbols')).toBeInTheDocument();
  });

  it('puts "email taken" on the email field', async () => {
    const { user } = renderRoute('/sign-up');
    await user.type(await screen.findByLabelText('Email'), TAKEN_EMAIL);
    await user.type(screen.getByLabelText('Password'), VALID_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('An account with this email already exists.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('creates the account, signs in and lands on saved plans', async () => {
    const { user, router } = renderRoute('/sign-up');
    await user.type(await screen.findByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Display name (optional)'), 'Tunde');
    await user.type(screen.getByLabelText('Password'), VALID_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/app/plans'));
    expect(tokenStore.get()?.user).toMatchObject({ email: 'new@example.com', displayName: 'Tunde' });
  });
});
