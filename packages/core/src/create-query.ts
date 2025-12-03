import { signal, DestroyRef, inject } from "@angular/core";
import { cacheStore } from "./cache-store";
import { HttpQuery, HttpQueryError, QueryKey, QueryOptions } from "./types";

function resolveQueryKey(key: QueryKey): { cacheKey: string; url: string } {
  if (typeof key === "string") {
    return { cacheKey: key, url: key };
  }

  const [url] = key;
  const cacheKey = JSON.stringify(key);
  return { cacheKey, url };
}

function normalizeBody(body: any) {
  if (body === undefined || body === null) return undefined;
  return typeof body === "string" ? body : JSON.stringify(body);
}

function toHttpQueryError(err: unknown): HttpQueryError {
  if (typeof err === "object" && err && "message" in err) {
    const anyErr = err as any;
    return {
      message: String(anyErr.message ?? "Request failed"),
      status: anyErr.status,
      statusText: anyErr.statusText,
      cause: err,
    };
  }

  return {
    message: "Request failed",
    cause: err,
  };
}

export function createHttpQuery<T>(
  key: QueryKey,
  options: QueryOptions,
  fetchFn: typeof fetch = fetch
): HttpQuery<T> {
  const { cacheKey, url } = resolveQueryKey(key);
  const data = signal<T | null>(null);
  const loading = signal(false);
  const error = signal<HttpQueryError | null>(null);
  const existing = cacheStore.get<T>(cacheKey);

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

  async function fetchData(force = false): Promise<void> {
    const cached = cacheStore.get<T>(cacheKey);

    if (cached?.inFlight) {
      if (force) {
        cached.abortController?.abort();
      } else {
        try {
          const result = await cached.inFlight;
          error.set(null);
          data.set(result);
        } catch (e) {
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

  async function revalidate(): Promise<void> {
    const abortController = new AbortController();

    loading.set(true);
    error.set(null);

    let resolveFn!: (value: T) => void;
    let rejectFn!: (error: unknown) => void;

    const inFlightPromise = new Promise<T>((resolve, reject) => {
      resolveFn = resolve;
      rejectFn = reject;
    });

    const previous = cacheStore.get<T>(cacheKey);

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
        method: options.method ?? "GET",
        body: normalizeBody(options.body),
        headers: {
          ...(options.body &&
          typeof options.body === "object" &&
          !(options.body instanceof FormData)
            ? { "Content-Type": "application/json" }
            : {}),
          ...(options.headers ?? {}),
        },
        signal: abortController.signal,
      });
      if (!response.ok) {
        throw {
          message: `HTTP ${response.status}`,
          status: response.status,
          statusText: response.statusText,
        };
      }
      const json = (await response.json()) as T;

      cacheStore.set(cacheKey, {
        data: json,
        timestamp: Date.now(),
        ttl: options.ttl,
        inFlight: undefined,
        abortController: undefined,
        refCount: cacheStore.get<T>(cacheKey)?.refCount ?? 1,
      });

      resolveFn(json);
      data.set(json);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return;
      }
      rejectFn(e);
      error.set(toHttpQueryError(e));
    } finally {
      loading.set(false);
    }
  }

  function invalidate() {
    const entry = cacheStore.get<T>(cacheKey);
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
