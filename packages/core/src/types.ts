import { Signal } from "@angular/core";

export interface HttpQuery<T> {
  data: Signal<T | null>;
  loading: Signal<boolean>;
  error: Signal<string | null>;

  fetch(force?: boolean): Promise<void>;
  invalidate(): void;
}

export interface QueryOptions extends RequestInit {
  ttl: number;
  staleWhileRevalidate?: boolean;
}
