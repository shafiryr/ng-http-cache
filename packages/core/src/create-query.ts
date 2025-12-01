import { signal } from "@angular/core";
import { cacheStore } from "./cache-store";
import { HttpQuery, QueryOptions } from "./types";

export function createHttpQuery<T>(
  url: string,
  options: QueryOptions,
  fetchFn: typeof fetch = fetch
): HttpQuery<T> {
  const data = signal<T | null>(null);
  const loading = signal(false);
  const error = signal<string | null>(null);

  async function fetchData(force = false): Promise<void> {
    const cached = cacheStore.get<T>(url);

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

  async function revalidate(): Promise<void> {
    loading.set(true);
    error.set(null);

    try {
      const response = await fetchFn(url, {
        method: options.method ?? "GET",
        headers: { "Content-Type": "application/json" },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const json = (await response.json()) as T;
      cacheStore.set(url, {
        data: json,
        timestamp: Date.now(),
        ttl: options.ttl,
      });
      data.set(json);
    } catch (e) {
      error.set((e as Error).message);
    } finally {
      loading.set(false);
    }
  }

  function invalidate() {
    cacheStore.delete(url);
  }

  return { data, loading, error, fetch: fetchData, invalidate };
}
