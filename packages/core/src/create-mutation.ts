import { createBaseMutation } from "./create-base-mutation";
import { HttpMutation, HttpMutationOptions } from "./types";
import { hasHeader, isPlainObject, serializeBody } from "./utils";

export function createMutation<TData, TBody = void>(
  url: string,
  options: HttpMutationOptions = {}
): HttpMutation<TData, TBody> {
  const {
    method = "POST",
    headers,
    onSuccess,
    onError,
    onFinally,
    invalidateKeys,
    retry,
    retryDelay,
    ...fetchOptions
  } = options;

  return createBaseMutation<TData, TBody>({
    onSuccess: onSuccess ? () => onSuccess() : undefined,
    onError: onError ? (err) => onError(err) : undefined,
    onFinally: onFinally ? () => onFinally() : undefined,
    invalidateKeys,
    retry,
    retryDelay,
    mutationFn: async (body) => {
      const needsJsonContentType =
        isPlainObject(body) && !hasHeader(headers, "Content-Type");

      const res = await fetch(url, {
        ...fetchOptions,
        method,
        headers: {
          ...(needsJsonContentType && { "Content-Type": "application/json" }),
          ...headers,
        },
        body: serializeBody(body),
      });

      if (!res.ok) {
        throw {
          message: `HTTP ${res.status}`,
          status: res.status,
          statusText: res.statusText,
        };
      }

      //return res.json();
      const text = await res.text();
      return text ? JSON.parse(text) : ({} as TData);
    },
  });
}
