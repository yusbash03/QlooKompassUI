import type { ComponentType } from 'react';
import { createBrowserRouter, Navigate, Outlet, type RouteObject } from 'react-router';
import { RedirectIfAuthenticated, RequireAuth } from '@/features/auth/RequireAuth';
import { PublicLayout } from '@/shared/layout/PublicLayout';
import { FullPageStatus } from '@/shared/ui/FullPageStatus';
import { RouteErrorBoundary } from './ErrorBoundary';
import { EvaluationGate } from './EvaluationGate';
import { NotFoundPage } from './NotFoundPage';
import { PlaceholderPage } from './PlaceholderPage';
import { RootLayout } from './RootLayout';

/** Route-level code splitting: `lazy` resolves a module's export into the route's Component. */
function page<M>(load: () => Promise<M>, pick: (module: M) => ComponentType): Pick<RouteObject, 'lazy'> {
  return { lazy: async () => ({ Component: pick(await load()) }) };
}

function placeholder(title: string, slice: string): Pick<RouteObject, 'element'> {
  return { element: <PlaceholderPage title={title} slice={slice} /> };
}

const appRoutes: RouteObject[] = [
  { index: true, element: <Navigate to="/app/plans" replace /> },
  {
    path: 'plans',
    ...page(
      () => import('@/features/plans/SavedPlansPage'),
      (m) => m.SavedPlansPage,
    ),
  },
  {
    path: 'profiles/new',
    ...page(
      () => import('@/features/profiles/ProfileFormPage'),
      (m) => m.ProfileFormPage,
    ),
  },
  {
    path: 'profiles/:profileId/edit',
    ...page(
      () => import('@/features/profiles/ProfileEditPage'),
      (m) => m.ProfileEditPage,
    ),
  },
  { path: 'profiles/:profileId/generate', ...placeholder('Generate growth plan', 'FE-4') },
  { path: 'plans/:planId/progress', ...placeholder('Research progress', 'FE-4') },
  { path: 'plans/:planId', ...placeholder('Growth plan', 'FE-5') },
  { path: 'experiments', ...placeholder('Experiments', 'FE-6b') },
  { path: 'evaluate', element: <EvaluationGate /> },
];

// FE-01 §3
export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    // Shown while the first matched lazy route chunk downloads on a cold start.
    hydrateFallbackElement: <FullPageStatus label="Loading…" />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          {
            index: true,
            ...page(
              () => import('@/features/landing/LandingPage'),
              (m) => m.LandingPage,
            ),
          },
          { path: 'sample', ...placeholder('Sample plan', 'FE-5') },
          { path: 'offline', ...placeholder("You're offline", 'FE-7') },
        ],
      },
      {
        element: (
          <RedirectIfAuthenticated>
            <Outlet />
          </RedirectIfAuthenticated>
        ),
        children: [
          {
            path: 'sign-in',
            ...page(
              () => import('@/features/auth/SignInPage'),
              (m) => m.SignInPage,
            ),
          },
          {
            path: 'sign-up',
            ...page(
              () => import('@/features/auth/SignUpPage'),
              (m) => m.SignUpPage,
            ),
          },
        ],
      },
      {
        path: 'app',
        element: (
          <RequireAuth>
            <Outlet />
          </RequireAuth>
        ),
        // The app shell (sidebar, Radix menu) is its own chunk; anonymous visitors never download it.
        children: [
          {
            ...page(
              () => import('@/shared/layout/AppLayout'),
              (m) => m.AppLayout,
            ),
            children: appRoutes,
          },
        ],
      },
      // Dev-only component gallery (FE-3). `import.meta.env.DEV` is false in production builds, so the route and its
      // chunk are dropped from the bundle.
      ...(import.meta.env.DEV
        ? [
            {
              path: 'dev/ui',
              ...page(
                () => import('@/dev/UiGallery'),
                (m) => m.UiGallery,
              ),
            },
          ]
        : []),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
