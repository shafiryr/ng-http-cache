interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  inFlight?: Promise<T>;
  abortController?: AbortController;
}

const cache = new Map<string, CacheEntry<any>>();

export const cacheStore = {
  get<T>(key: string) {
    return cache.get(key) as CacheEntry<T> | undefined;
  },
  set<T>(key: string, entry: CacheEntry<T>) {
    cache.set(key, entry);
  },
  delete(key: string) {
    const entry = cache.get(key);
    entry?.abortController?.abort();
    cache.delete(key);
  },
  clear() {
    for (const [, entry] of cache.entries()) {
      entry.abortController?.abort();
    }
    cache.clear();
  },
};
