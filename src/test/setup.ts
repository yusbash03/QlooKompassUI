import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { tokenStore } from '@/features/auth/tokenStore';
import { draftStore } from '@/features/profiles/draftStore';
import { resetAuthState } from './msw/handlers/auth';
import { resetEvaluationState } from './msw/handlers/evaluations';
import { resetGrowthState } from './msw/handlers/growthPlans';
import { resetProfilesState } from './msw/handlers/profiles';
import { resetQuotaState } from './msw/handlers/quota';
import { server } from './msw/server';
import { resetInstallState } from '@/features/pwa/install-store';
import { pwaStub } from './pwa-register-stub';

// Route pages are lazy chunks; under a parallel full run the first transform in a file can take several seconds.
configure({ asyncUtilTimeout: 10_000 });

// jsdom gaps that Radix primitives touch.
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};
// <ScrollRestoration> scrolls on navigation; jsdom only logs "not implemented".
window.scrollTo = () => {};
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(async () => {
  cleanup();
  tokenStore.clear('signed-out');
  server.resetHandlers();
  resetAuthState();
  resetProfilesState();
  resetGrowthState();
  resetQuotaState();
  resetEvaluationState();
  resetInstallState();
  pwaStub.needRefresh = false;
  pwaStub.updateServiceWorker.mockClear();
  draftStore.clearAll();
  localStorage.clear();
  sessionStorage.clear();
  // fake-indexeddb persists across tests in a file; start each test with no offline databases.
  await Promise.all(
    (await indexedDB.databases()).map(
      ({ name }) =>
        new Promise<void>((resolve) => {
          if (!name) return resolve();
          const request = indexedDB.deleteDatabase(name);
          request.onsuccess = request.onerror = request.onblocked = () => resolve();
        }),
    ),
  );
});
afterAll(() => server.close());
