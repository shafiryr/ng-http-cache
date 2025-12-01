interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  inFlight?: Promise<T>;
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
    cache.delete(key);
  },
  clear() {
    cache.clear();
  }
};
