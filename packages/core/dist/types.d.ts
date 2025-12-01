import { Signal } from '@angular/core';
export interface HttpQuery<T> {
    data: Signal<T | null>;
    loading: Signal<boolean>;
    error: Signal<string | null>;
    fetch(force?: boolean): Promise<void>;
    invalidate(): void;
}
export interface QueryOptions {
    ttl: number;
    staleWhileRevalidate?: boolean;
    method?: 'GET' | 'POST';
    body?: any;
}
