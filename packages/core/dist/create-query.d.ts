import { HttpQuery, QueryOptions } from "./types";
export declare function createHttpQuery<T>(url: string, options: QueryOptions, fetchFn?: typeof fetch): HttpQuery<T>;
