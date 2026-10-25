import type { ProfileFormInput } from './profileSchema';

// FE-01 §5: an unsaved new brief survives navigating away and back — in memory only (never Web Storage), per user,
// and wiped on sign-out. A reload loses it by design.
const drafts = new Map<string, ProfileFormInput>();

export const draftStore = {
  get: (userId: string) => drafts.get(userId),
  set: (userId: string, draft: ProfileFormInput) => void drafts.set(userId, draft),
  clear: (userId: string) => void drafts.delete(userId),
  clearAll: () => drafts.clear(),
};
