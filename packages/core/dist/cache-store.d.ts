interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
    inFlight?: Promise<T>;
}
export declare const cacheStore: {
    get<T>(key: string): CacheEntry<T> | undefined;
    set<T>(key: string, entry: CacheEntry<T>): void;
    delete(key: string): void;
    clear(): void;
};
export {};
