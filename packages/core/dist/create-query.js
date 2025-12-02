import { signal } from "@angular/core";
import { cacheStore } from "./cache-store";
export function createHttpQuery(url, options, fetchFn = fetch) {
    const data = signal(null);
    const loading = signal(false);
    const error = signal(null);
    async function fetchData(force = false) {
        const cached = cacheStore.get(url);
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
            });
            data.set(json);
        }
        catch (e) {
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
