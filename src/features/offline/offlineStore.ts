/** One IndexedDB database per user, so a user switch can drop exactly the previous user's copies (FE-01 §7). */
export function offlineDbName(userId: string): string {
  return `kc-offline-${userId}`;
}

export function deleteOfflineStore(userId: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
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
