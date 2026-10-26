import type { ManifestOptions, VitePWAOptions } from 'vite-plugin-pwa';

type RuntimeCaching = NonNullable<NonNullable<VitePWAOptions['workbox']>['runtimeCaching']>[number];

const DAY = 24 * 60 * 60;

// FE-01 §7. Workbox registers routes in order and the first match wins, so the public API reads come before the
// catch-all NetworkOnly rule. The matcher functions are serialised into sw.js — keep them self-contained.
export const runtimeCaching: RuntimeCaching[] = [
  {
    // Public, non-user data: lets the sample plan and feature flags work offline after one visit.
    urlPattern: ({ url, sameOrigin }) =>
      sameOrigin && (url.pathname === '/api/v1/sample-plan' || url.pathname === '/api/v1/meta'),
    handler: 'StaleWhileRevalidate',
    method: 'GET',
    options: {
      cacheName: 'kc-public-api',
      expiration: { maxEntries: 2, maxAgeSeconds: 7 * DAY },
      cacheableResponse: { statuses: [200] },
    },
  },
  {
    urlPattern: ({ url }) =>
      url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
    handler: 'CacheFirst',
    options: {
      cacheName: 'kc-google-fonts',
      expiration: { maxEntries: 30, maxAgeSeconds: 365 * DAY },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
  // Everything else under /api/ — authenticated responses are never put in the SW cache.
  ...(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const).map((method): RuntimeCaching => ({
    urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/api/'),
    handler: 'NetworkOnly',
    method,
  })),
];

export const manifest: Partial<ManifestOptions> = {
  id: '/',
  name: 'Kulture Compass',
  short_name: 'Kompass',
  description: 'Cultural growth plans for brands, grounded in Qloo evidence.',
  start_url: '/app/plans?source=pwa',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait-primary',
  theme_color: '#14122B',
  background_color: '#FAF7F2',
  categories: ['business', 'productivity'],
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
  shortcuts: [
    { name: 'New brief', url: '/app/profiles/new', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    { name: 'Saved plans', url: '/app/plans', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
  ],
};

export const pwaOptions: Partial<VitePWAOptions> = {
  // Users choose when to reload into a new version (UpdatePrompt) — never mid-form.
  registerType: 'prompt',
  injectRegister: false,
  includeAssets: ['favicon.svg', 'robots.txt', 'icons/apple-touch-icon-180.png'],
  manifest,
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,jpg,woff2}'],
    navigateFallback: '/index.html',
    navigateFallbackDenylist: [/^\/api\//],
    cleanupOutdatedCaches: true,
    runtimeCaching,
  },
};
