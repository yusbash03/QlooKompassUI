import { defineConfig, devices } from '@playwright/test';

const MOCK_API_PORT = 5299;
// Point at an already-running build (e.g. the nginx image) instead of `vite preview`.
const externalBaseUrl = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  // The stand-in API keeps one in-memory backend, so specs run one at a time.
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: externalBaseUrl ?? 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      // MSW fake API over HTTP (e2e/mock-api) until the backend serves every endpoint.
      command: `node e2e/mock-api/server.ts`,
      url: `http://localhost:${MOCK_API_PORT}/health`,
      env: { MOCK_API_PORT: String(MOCK_API_PORT) },
      reuseExistingServer: !process.env.CI,
    },
    ...(externalBaseUrl
      ? []
      : [
          {
            command: 'npm run build && npm run preview -- --port 4173 --strictPort',
            url: 'http://localhost:4173',
            env: { VITE_DEV_API_PROXY_TARGET: `http://localhost:${MOCK_API_PORT}` },
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
          },
        ]),
  ],
});
