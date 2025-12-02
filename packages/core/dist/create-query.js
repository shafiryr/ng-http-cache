import { signal, DestroyRef, inject } from "@angular/core";
import { cacheStore } from "./cache-store";
export function createHttpQuery(url, options, fetchFn = fetch) {
    const data = signal(null);
    const loading = signal(false);
    const error = signal(null);
    // auto cleanup on destroy
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => {
        cacheStore.delete(url);
    });
    async function fetchData(force = false) {
        const cached = cacheStore.get(url);
        if (cached?.inFlight && !force) {
            try {
                const result = await cached.inFlight;
                data.set(result);
            }
            catch (e) {
                error.set(e.message);
            }
            return;
        }
        if (cached && !force) {
            const expired = Date.now() - cached.timestamp > options.ttl;
            if (!expired) {
                data.set(cached.data);
                return;
            }
            if (options.staleWhileRevalidate) {
                data.set(cached.data);
                return revalidate();
            }
        }
        return revalidate();
    }
    async function revalidate() {
        loading.set(true);
        error.set(null);
        let resolveFn;
        let rejectFn;
        const inFlightPromise = new Promise((resolve, reject) => {
            resolveFn = resolve;
            rejectFn = reject;
        });
        const previous = cacheStore.get(url);
        cacheStore.set(url, {
            data: previous?.data ?? null,
            timestamp: previous?.timestamp ?? 0,
            ttl: options.ttl,
            inFlight: inFlightPromise,
        });
        try {
            const response = await fetchFn(url, {
                method: options.method ?? "GET",
                headers: { "Content-Type": "application/json" },
                body: options.body ? JSON.stringify(options.body) : undefined,
            });
            const json = (await response.json());
            cacheStore.set(url, {
                data: json,
                timestamp: Date.now(),
                ttl: options.ttl,
                inFlight: undefined,
            });
            resolveFn(json);
            data.set(json);
        }
        catch (e) {
            rejectFn(e);
            error.set(e.message);
        }
        finally {
            loading.set(false);
        }
    }
    function invalidate() {
        cacheStore.delete(url);
    }
    return { data, loading, error, fetch: fetchData, invalidate };
}
