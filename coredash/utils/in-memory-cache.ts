
/**
 * interface CacheEntry<T> { data: T; expiresAt: number; }
 * Volatility: The cache is lost on every server restart
 * Single instance only: If you ever scale to multiple Node.js processes
 * @param ttlMs time in milliseconds
 * @returns T
 */
export function createMemoryCache<T>(ttl: number) {
  const store = new Map<string, { data: T; expiresAt: number }>();

  return {
    get(key: string): T | null {
      const entry = store.get(key);
      if (!entry || Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }
      return entry.data;
    },
    set(key: string, data: T) {
      store.set(key, { data, expiresAt: Date.now() + ttl });
    },
    delete(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}