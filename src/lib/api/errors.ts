import i18n from "@/i18n";
import { ConfigError } from "@/lib/config";

/** Server error body: `{ requestId, errorCode, message, result }` (spec Phần A §0). */
export type ApiErrorBody = {
  requestId?: string;
  errorCode?: string;
  message?: string;
  result?: unknown;
};

/**
 * Thrown for every failed request. `status` is 0 when no response arrived
 * (offline, DNS, timeout) — the web's "no err.response" case.
 */
export class ApiError extends Error {
  name = "ApiError";

  constructor(
    readonly status: number,
    readonly body: ApiErrorBody | string | undefined,
    message?: string,
  ) {
    super(message ?? (typeof body === "object" ? body?.message : undefined) ?? `HTTP ${status}`);
  }

  get errorCode(): string | undefined {
    return typeof this.body === "object" ? this.body?.errorCode : undefined;
  }
}

export function isNetworkError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 0;
}

/** 400/401/403 = the server rejected the credentials; anything else keeps the session. */
export function isAuthRejection(err: unknown): boolean {
  return err instanceof ApiError && [400, 401, 403].includes(err.status);
}

/**
 * User-facing message for a failed request (web `apiErrorMessage`, spec Phần B §0.4):
 * - no response → `fallback` or the generic "Something went wrong";
 * - plain-text body → used if short and not HTML;
 * - otherwise the server `message`, which may be undefined.
 */
export function apiErrorMessage(err: unknown, fallback?: string): string | undefined {
  const generic = fallback ?? i18n.t("something_went_wrong");
  // A misconfigured build (e.g. no EXPO_PUBLIC_API_URL) names the problem in development.
  if (__DEV__ && err instanceof ConfigError) return err.message;
  if (!(err instanceof ApiError) || err.status === 0) return generic;
  if (typeof err.body === "string") {
    const text = err.body.trim();
    return text && text.length < 200 && !text.startsWith("<") ? text : generic;
  }
  return err.body?.message;
}
