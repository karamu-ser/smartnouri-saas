// Keep the current session usable when browser storage is blocked or full.
const sessionValues = new Map<string, string | null>();

export const safeStorage = {
  getItem(key: string): string | null {
    if (sessionValues.has(key)) return sessionValues.get(key) ?? null;

    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
      sessionValues.delete(key);
    } catch {
      sessionValues.set(key, value);
    }
  },

  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key);
      sessionValues.delete(key);
    } catch {
      // A tombstone also prevents a stale token being restored after logout.
      sessionValues.set(key, null);
    }
  },
};
