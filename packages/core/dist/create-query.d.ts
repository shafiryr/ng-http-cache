import { HttpQuery, QueryKey, QueryOptions } from "./types";
export declare function createHttpQuery<T>(key: QueryKey, options: QueryOptions, fetchFn?: typeof fetch): HttpQuery<T>;
