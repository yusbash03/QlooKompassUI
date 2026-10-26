import { useState } from 'react';

/** Stand-in for `virtual:pwa-register/react` in Vitest; tests drive it through `pwaStub`. */
export const pwaStub = { needRefresh: false, updateServiceWorker: vi.fn(() => Promise.resolve()) };

export function useRegisterSW() {
  const needRefresh = useState(pwaStub.needRefresh);
  const offlineReady = useState(false);
  return { needRefresh, offlineReady, updateServiceWorker: pwaStub.updateServiceWorker };
}
