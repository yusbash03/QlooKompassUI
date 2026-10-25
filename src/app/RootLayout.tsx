import { Outlet, ScrollRestoration } from 'react-router';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { SkipLink } from '@/shared/layout/SkipLink';

// AuthProvider lives inside the router so auth-aware screens can navigate; QueryClient sits above it (providers.tsx).
// Offline / mock banners are placed by each layout (they sit under the app top bar in the design).
export function RootLayout() {
  return (
    <AuthProvider>
      <SkipLink />
      <Outlet />
      <ScrollRestoration />
    </AuthProvider>
  );
}
