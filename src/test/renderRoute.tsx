import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Providers } from '@/app/providers';
import { routes } from '@/app/router';

/** Renders the real route tree at `path` (under StrictMode, like main.tsx) with a fresh, non-retrying QueryClient. */
export function renderRoute(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const user = userEvent.setup();
  render(
    <StrictMode>
      <Providers client={queryClient}>
        <RouterProvider router={router} />
      </Providers>
    </StrictMode>,
  );
  return { router, queryClient, user };
}
