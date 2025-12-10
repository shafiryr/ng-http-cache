export interface CacheEntry<T> {
    data: T | null;
    timestamp: number;
    ttl: number;
    inFlight?: Promise<T>;
    abortController?: AbortController;
    refCount: number;
}
export declare const cacheStore: {
    get<T>(key: string): CacheEntry<T> | undefined;
    has(key: string): boolean;
    keys(): string[];
    set<T>(key: string, entry: CacheEntry<T>): void;
    delete(key: string): void;
    clear(): void;
    incrementRef(key: string): void;
    decrementRef(key: string): boolean;
    size(): number;
};
