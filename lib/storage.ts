const storage = {
  get: (key: string): string | null => {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  // Defers write to after paint — never blocks render
  set: (key: string, value: string): void => {
    setTimeout(() => {
      try { localStorage.setItem(key, value); } catch {}
    }, 0);
  },
};
export default storage;