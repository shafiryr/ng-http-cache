import { signal, DestroyRef, inject } from "@angular/core";
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

  // auto cleanup on destroy
  const destroyRef = inject(DestroyRef);
  destroyRef.onDestroy(() => {
    cacheStore.delete(url);
  });

  async function fetchData(force = false): Promise<void> {
    const cached = cacheStore.get<T>(url);

    if (cached?.inFlight && !force) {
      try {
        const result = await cached.inFlight;
        data.set(result);
      } catch (e) {
        error.set((e as Error).message);
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

  async function revalidate(): Promise<void> {
    loading.set(true);
    error.set(null);

    let resolveFn!: (value: T) => void;
    let rejectFn!: (error: unknown) => void;

    const inFlightPromise = new Promise<T>((resolve, reject) => {
      resolveFn = resolve;
      rejectFn = reject;
    });

    const previous = cacheStore.get<T>(url);
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
      const json = (await response.json()) as T;

      cacheStore.set(url, {
        data: json,
        timestamp: Date.now(),
        ttl: options.ttl,
        inFlight: undefined,
      });

      resolveFn(json);
      data.set(json);
    } catch (e) {
      rejectFn(e);
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
