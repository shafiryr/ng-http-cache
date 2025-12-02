import { Signal } from "@angular/core";

export interface HttpQueryError {
  message: string;
  status?: number;
  statusText?: string;
  cause?: unknown;
}
export interface HttpQuery<T> {
  data: Signal<T | null>;
  loading: Signal<boolean>;
  error: Signal<HttpQueryError | null>;
  fetch(force?: boolean): Promise<void>;
  invalidate(): void;
}

export interface QueryOptions extends RequestInit {
  ttl: number;
  staleWhileRevalidate?: boolean;
}
