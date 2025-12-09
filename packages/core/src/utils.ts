import { HttpQueryError } from "./types";

export function hasHeader(
  headers: HeadersInit | undefined,
  name: string
): boolean {
  if (!headers) return false;

  if (headers instanceof Headers) {
    return headers.has(name);
  }

  if (Array.isArray(headers)) {
    return headers.some(([key]) => key.toLowerCase() === name.toLowerCase());
  }

  return Object.keys(headers).some(
    (k) => k.toLowerCase() === name.toLowerCase()
  );
}

export function isPlainObject(value: unknown): boolean {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === "object" &&
    !(value instanceof FormData) &&
    !(value instanceof Blob)
  );
}

export function serializeBody(body: unknown): BodyInit | undefined {
  if (body === undefined || body === null) return undefined;
  return isPlainObject(body) ? JSON.stringify(body) : (body as BodyInit);
}

export function toHttpQueryError(
  err: unknown,
  defaultMessage = "Request failed"
): HttpQueryError {
  if (typeof err === "object" && err && "message" in err) {
    const anyErr = err as any;
    return {
      message: String(anyErr.message ?? defaultMessage),
      status: anyErr.status,
      statusText: anyErr.statusText,
      cause: err,
    };
  }
  return { message: defaultMessage, cause: err };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
