import { signal, DestroyRef, inject } from "@angular/core";
import { cacheStore } from "./cache-store";
import { toHttpQueryError } from "./utils";
function resolveQueryKey(key) {
    if (typeof key === "string") {
        return { cacheKey: key, url: key };
    }
    const [url] = key;
    const cacheKey = JSON.stringify(key);
    return { cacheKey, url };
}
export function createQuery(key, options, fetchFn = fetch) {
    const { cacheKey, url } = resolveQueryKey(key);
    const data = signal(null);
    const loading = signal(false);
    const error = signal(null);
    const existing = cacheStore.get(cacheKey);
    if (existing) {
        cacheStore.incrementRef(cacheKey);
        // hydrate signal with existing cached data
        if (existing.data !== null) {
            data.set(existing.data);
        }
    }
    // auto cleanup on destroy
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => {
        cacheStore.decrementRef(cacheKey);
    });
    async function fetchData(force = false) {
        const cached = cacheStore.get(cacheKey);
        if (cached?.inFlight) {
            if (force) {
                cached.abortController?.abort();
            }
            else {
                try {
                    const result = await cached.inFlight;
                    error.set(null);
                    data.set(result);
                }
                catch (e) {
                    error.set(toHttpQueryError(e));
                }
                return;
            }
        }
        if (cached && !force) {
            const expired = Date.now() - cached.timestamp > options.ttl;
            if (!expired) {
                error.set(null);
                data.set(cached.data);
                return;
            }
            if (options.staleWhileRevalidate) {
                error.set(null);
                data.set(cached.data);
                return revalidate();
            }
        }
        return revalidate();
    }
    async function revalidate() {
        const abortController = new AbortController();
        loading.set(true);
        error.set(null);
        let resolveFn;
        let rejectFn;
        const inFlightPromise = new Promise((resolve, reject) => {
            resolveFn = resolve;
            rejectFn = reject;
        });
        const previous = cacheStore.get(cacheKey);
        cacheStore.set(cacheKey, {
            data: previous?.data ?? null,
            timestamp: previous?.timestamp ?? 0,
            ttl: options.ttl,
            inFlight: inFlightPromise,
            abortController,
            refCount: previous?.refCount ?? 1,
        });
        try {
            const response = await fetchFn(url, {
                ...options,
                method: "GET",
                headers: options.headers,
                signal: abortController.signal,
            });
            if (!response.ok) {
                throw {
                    message: `HTTP ${response.status}`,
                    status: response.status,
                    statusText: response.statusText,
                };
            }
            const json = (await response.json());
            cacheStore.set(cacheKey, {
                data: json,
                timestamp: Date.now(),
                ttl: options.ttl,
                inFlight: undefined,
                abortController: undefined,
                refCount: cacheStore.get(cacheKey)?.refCount ?? 1,
            });
            resolveFn(json);
            data.set(json);
        }
        catch (e) {
            if (e instanceof DOMException && e.name === "AbortError") {
                return;
            }
            rejectFn(e);
            error.set(toHttpQueryError(e));
        }
        finally {
            loading.set(false);
        }
    }
    function invalidate() {
        const entry = cacheStore.get(cacheKey);
        if (entry) {
            entry.abortController?.abort();
            entry.timestamp = 0;
        }
    }
    return {
        data: data.asReadonly(),
        loading: loading.asReadonly(),
        error: error.asReadonly(),
        fetch: fetchData,
        invalidate,
    };
}
