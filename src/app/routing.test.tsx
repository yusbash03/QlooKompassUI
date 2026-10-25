import { screen } from '@testing-library/react';
import { authState } from '@/test/msw/handlers/auth';
import { renderRoute } from '@/test/renderRoute';
import { shouldRetryQuery } from './query-client';
import { AppError } from '@/shared/api/problem';

describe('routing', () => {
  it('renders the landing page with the mock-mode banner from /meta', async () => {
    renderRoute('/');
    expect(await screen.findByRole('heading', { level: 1, name: /Grow your clothing brand/ })).toBeInTheDocument();
    expect(await screen.findByText('MOCK DATA — not real Qloo intelligence')).toBeInTheDocument();
  });

  it('shows a 404 for unknown paths', async () => {
    renderRoute('/nope');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  it('hides evaluation unless both flags are on', async () => {
    authState.refreshValid = true;
    renderRoute('/app/evaluate');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Evaluation/ })).not.toBeInTheDocument();
  });

  it('redirects /app to saved plans', async () => {
    authState.refreshValid = true;
    renderRoute('/app');
    expect(await screen.findByRole('heading', { level: 1, name: 'Plans' })).toBeInTheDocument();
  });
});

describe('query retry policy', () => {
  const error = (status: number, code: AppError['code']) => new AppError({ status, code, title: code });

  it('retries transient failures at most twice', () => {
    expect(shouldRetryQuery(0, error(0, 'network_error'))).toBe(true);
    expect(shouldRetryQuery(1, error(503, 'internal_error'))).toBe(true);
    expect(shouldRetryQuery(2, error(503, 'internal_error'))).toBe(false);
  });

  it('never retries client errors', () => {
    expect(shouldRetryQuery(0, error(404, 'not_found'))).toBe(false);
    expect(shouldRetryQuery(0, error(401, 'unauthenticated'))).toBe(false);
  });
});
