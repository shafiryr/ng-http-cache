import { HttpQuery, QueryKey, QueryOptions } from "./types";
export declare function createQuery<T>(key: QueryKey, options: Omit<QueryOptions, "method">, fetchFn?: typeof fetch): HttpQuery<T>;
