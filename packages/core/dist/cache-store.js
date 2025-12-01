const cache = new Map();
export const cacheStore = {
    get(key) {
        return cache.get(key);
    },
    set(key, entry) {
        cache.set(key, entry);
    },
    delete(key) {
        cache.delete(key);
    },
    clear() {
        cache.clear();
    }
};
