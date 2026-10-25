import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { tokenStore } from '@/features/auth/tokenStore';
import { draftStore } from '@/features/profiles/draftStore';
import { resetAuthState } from './msw/handlers/auth';
import { resetProfilesState } from './msw/handlers/profiles';
import { server } from './msw/server';

// Route pages are lazy chunks; the first import in a test file can exceed RTL's 1 s default under load.
configure({ asyncUtilTimeout: 5000 });

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
afterEach(() => {
  cleanup();
  tokenStore.clear('signed-out');
  server.resetHandlers();
  resetAuthState();
  resetProfilesState();
  draftStore.clearAll();
  localStorage.clear();
  sessionStorage.clear();
});
afterAll(() => server.close());
