import type { components } from '@/shared/api/schema';

type GrowthPlan = components['schemas']['GrowthPlanDto'];

/** One opt-in offline copy of a completed plan (FE-01 §7). Never contains tokens. */
export interface OfflineCopy {
  plan: GrowthPlan;
  savedAt: string;
}

const STORE = 'plans';

/** One IndexedDB database per user, so a user switch can drop exactly the previous user's copies (FE-01 §7). */
export function offlineDbName(userId: string): string {
  return `kc-offline-${userId}`;
}

function available(): boolean {
  return typeof indexedDB !== 'undefined';
}

/**
 * Opens the user's database for one operation and closes it straight after. Keeping a connection open (as idb-keyval
 * does) would block `deleteDatabase` on sign-out, leaving the previous user's plans on the device.
 */
function withStore<T>(
  userId: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
  /** Result for a read when the user has no database (reads must pass it). */
  missing?: T,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(offlineDbName(userId), 1);
    open.onupgradeneeded = () => {
      // Reads never create a database: a user who saved nothing has nothing on this device.
      if (mode === 'readonly') open.transaction?.abort();
      else open.result.createObjectStore(STORE);
    };
    open.onerror = () => (mode === 'readonly' ? resolve(missing as T) : reject(open.error));
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction(STORE, mode);
      const request = run(tx.objectStore(STORE));
      tx.oncomplete = () => {
        db.close();
        resolve(request.result);
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    };
  });
}

export async function saveOfflineCopy(userId: string, plan: GrowthPlan): Promise<void> {
  if (!available()) return;
  const copy: OfflineCopy = { plan, savedAt: new Date().toISOString() };
  await withStore(userId, 'readwrite', (s) => s.put(copy, plan.id));
}

export async function removeOfflineCopy(userId: string, planId: string): Promise<void> {
  if (!available()) return;
  await withStore(userId, 'readwrite', (s) => s.delete(planId));
}

export async function getOfflineCopy(userId: string, planId: string): Promise<OfflineCopy | null> {
  if (!available()) return null;
  const copy = await withStore<OfflineCopy | undefined>(userId, 'readonly', (s) => s.get(planId), undefined);
  return copy ?? null;
}

export async function listOfflineCopies(userId: string): Promise<OfflineCopy[]> {
  if (!available()) return [];
  const copies = await withStore<OfflineCopy[]>(userId, 'readonly', (s) => s.getAll(), []);
  return copies.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function deleteOfflineStore(userId: string): Promise<void> {
  return new Promise((resolve) => {
    if (!available()) {
      resolve();
      return;
    }
    const request = indexedDB.deleteDatabase(offlineDbName(userId));
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    // Another tab holds it open; deletion completes once that tab closes it.
    request.onblocked = () => resolve();
  });
}
