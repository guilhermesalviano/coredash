
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

export interface SwrCacheOptions {
  /** How long an entry is served without contacting the loader. */
  ttlMs: number;
  /**
   * Extra time after `ttlMs` during which the old entry is still served
   * immediately while a background refresh runs, and used as a fallback when
   * the loader fails. Defaults to 0 (no stale serving).
   */
  staleMs?: number;
  /** Minimum gap between background refreshes after a failed one. */
  failureCooldownMs?: number;
  now?: () => number;
}

export interface SwrCacheEntry<T> {
  data: T;
  fetchedAt: number;
  /** True while the entry is inside `ttlMs`. */
  fresh: boolean;
}

export interface SwrCacheResult<T> {
  data: T;
  /** True when the value came from the cache instead of this call's loader. */
  fromCache: boolean;
}

/**
 * In-memory cache with in-flight deduplication, stale-while-revalidate and
 * stale-on-error. Single process only, lost on restart.
 */
export function createSwrCache<T>(options: SwrCacheOptions) {
  const { ttlMs, staleMs = 0, failureCooldownMs = 30_000, now = Date.now } = options;
  const entries = new Map<string, { data: T; fetchedAt: number }>();
  const inflight = new Map<string, { id: number; promise: Promise<T> }>();
  let nextLoadId = 0;
  const lastFailureAt = new Map<string, number>();

  function prune() {
    const limit = now() - ttlMs - staleMs;
    for (const [key, entry] of entries) {
      if (entry.fetchedAt < limit) entries.delete(key);
    }
  }

  function load(key: string, loader: () => Promise<T>): Promise<T> {
    const pending = inflight.get(key);
    if (pending) return pending.promise;

    const id = nextLoadId++;
    // False once the key was invalidated (or reloaded) while this load ran.
    const isCurrent = () => inflight.get(key)?.id === id;
    const promise = (async () => {
      try {
        // Deferred so a loader that throws synchronously still rejects the promise.
        const data = await Promise.resolve().then(loader);
        if (isCurrent()) {
          entries.set(key, { data, fetchedAt: now() });
          lastFailureAt.delete(key);
          prune();
        }
        return data;
      } catch (error: unknown) {
        if (isCurrent()) lastFailureAt.set(key, now());
        throw error;
      } finally {
        if (isCurrent()) inflight.delete(key);
      }
    })();
    inflight.set(key, { id, promise });
    return promise;
  }

  function peek(key: string): SwrCacheEntry<T> | null {
    const entry = entries.get(key);
    if (!entry) return null;
    const age = now() - entry.fetchedAt;
    if (age >= ttlMs + staleMs) {
      entries.delete(key);
      return null;
    }
    return { data: entry.data, fetchedAt: entry.fetchedAt, fresh: age < ttlMs };
  }

  async function resolve(key: string, loader: () => Promise<T>): Promise<SwrCacheResult<T>> {
    const entry = peek(key);
    if (entry?.fresh) return { data: entry.data, fromCache: true };

    if (entry) {
      const failedAt = lastFailureAt.get(key);
      if (failedAt === undefined || now() - failedAt >= failureCooldownMs) {
        // Refresh in the background; the stale entry answers this call.
        load(key, loader).catch(() => {});
      }
      return { data: entry.data, fromCache: true };
    }

    return { data: await load(key, loader), fromCache: false };
  }

  return {
    resolve,
    async get(key: string, loader: () => Promise<T>): Promise<T> {
      return (await resolve(key, loader)).data;
    },
    peek,
    set(key: string, data: T) {
      entries.set(key, { data, fetchedAt: now() });
    },
    delete(key: string) {
      entries.delete(key);
      inflight.delete(key);
      lastFailureAt.delete(key);
    },
    clear() {
      entries.clear();
      inflight.clear();
      lastFailureAt.clear();
    },
  };
}
