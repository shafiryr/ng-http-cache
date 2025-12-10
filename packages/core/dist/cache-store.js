const cache = new Map();
export const cacheStore = {
    get(key) {
        return cache.get(key);
    },
    has(key) {
        return cache.has(key);
    },
    keys() {
        return Array.from(cache.keys());
    },
    set(key, entry) {
        cache.set(key, entry);
    },
    delete(key) {
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
    incrementRef(key) {
        const entry = cache.get(key);
        if (entry) {
            entry.refCount++;
        }
    },
    decrementRef(key) {
        const entry = cache.get(key);
        if (entry) {
            entry.refCount--;
            if (entry.refCount <= 0) {
                this.delete(key);
                return true;
            }
        }
        return false;
    },
    size() {
        return cache.size;
    },
};
