import { fetch } from "expo/fetch";

import i18n from "@/i18n";
import { getApiUrl } from "@/lib/config";
import { isJwtUnexpired, tokenStore, type Tokens } from "@/lib/session/token-store";

import { ApiError, isAuthRejection, type ApiErrorBody } from "./errors";

/** Success envelope; `errorCode` is "00000" on success (spec Phần A §0). */
export type ApiEnvelope<T> = {
  requestId: string;
  errorCode: string;
  message: string;
  result: T;
};

type Method = "GET" | "POST" | "PUT" | "DELETE";

export type RequestOptions = {
  method?: Method;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
};

const TIMEOUT_MS = 30_000;

// 401 from these must never trigger a refresh (the refresh would wait on itself).
const AUTH_PATHS = ["auth/login", "auth/refreshToken", "auth/logout"];

const LOGOUT_PATH = "identity-service/v1/auth/logout";
const REFRESH_PATH = "identity-service/v1/auth/refreshToken";

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = `${getApiUrl()}/${path.replace(/^\/+/, "")}`;
  if (!query) return url;
  const params = Object.entries(query)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
  return params ? `${url}?${params}` : url;
}

async function send<T>(path: string, options: RequestOptions, token: string | null): Promise<ApiEnvelope<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Accept-Language": i18n.language || "en",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  // Outside the try below: a missing EXPO_PUBLIC_API_URL must surface as a ConfigError,
  // not be reported as "no connection".
  const url = buildUrl(path, options.query);
  const method = options.method ?? "GET";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  let text: string;
  try {
    response = (await fetch(url, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    })) as unknown as Response;
    text = await response.text();
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : "Network request failed";
    // Dev-only: the UI shows a generic message, so log the real cause (no headers or body).
    if (__DEV__) console.warn(`[api] ${method} ${url} failed: ${reason}`);
    throw new ApiError(0, undefined, reason);
  } finally {
    clearTimeout(timer);
  }

  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (__DEV__) logFailure(method, url, response.status, data);

  if (!response.ok) throw new ApiError(response.status, data as ApiErrorBody | string | undefined);
  return data as ApiEnvelope<T>;
}

/**
 * Dev-only: logs HTTP errors and HTTP 200 envelopes carrying an errorCode, so the server's
 * reason is visible in the Metro terminal. Only status, errorCode and message are printed —
 * never request bodies (passwords, OTPs) or `result` (tokens).
 */
function logFailure(method: string, url: string, status: number, data: unknown) {
  const body = typeof data === "object" && data !== null ? (data as ApiErrorBody) : undefined;
  const hasErrorCode = Boolean(body?.errorCode) && body?.errorCode !== "00000";
  if (status < 400 && !hasErrorCode) return;
  const detail = body
    ? `errorCode=${body.errorCode ?? "-"} message=${JSON.stringify(body.message ?? null)}`
    : `body=${JSON.stringify(typeof data === "string" ? data.slice(0, 200) : data)}`;
  console.warn(`[api] ${method} ${url} → HTTP ${status} ${detail}`);
}

// ---- Session expiry -------------------------------------------------------------------------

type Listener = () => void;
const sessionExpiredListeners = new Set<Listener>();

/** Called when the server rejects the refresh token; AuthProvider resets to guest. */
export function onSessionExpired(listener: Listener): () => void {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener);
}

/** Web `handleLogout`: drop tokens, revoke the refresh token in the background, notify. */
async function expireSession(): Promise<void> {
  const refreshToken = tokenStore.getRefreshToken();
  await tokenStore.clear();
  if (refreshToken) {
    send(LOGOUT_PATH, { method: "POST", body: { refreshToken } }, null).catch(() => {});
  }
  sessionExpiredListeners.forEach((listener) => listener());
}

// ---- Refresh (spec Phần B §0.3) -------------------------------------------------------------

let refreshPromise: Promise<string> | null = null;

export class SessionExpiredError extends Error {
  name = "SessionExpiredError";
}

/**
 * Exchanges the single-use refresh token for a new pair. Concurrent callers share one
 * in-flight promise, so a burst of 401s spends the refresh token only once.
 * Logs out only when the server rejects the token (400/401/403) or the JWT has expired;
 * network errors and 5xx keep the session.
 */
export function refreshSession(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const current = tokenStore.getRefreshToken();
    if (!current) throw new SessionExpiredError("No refresh token available.");
    if (!isJwtUnexpired(current)) {
      await expireSession();
      throw new SessionExpiredError("Refresh token expired.");
    }

    let envelope: ApiEnvelope<Tokens>;
    try {
      envelope = await send<Tokens>(
        REFRESH_PATH,
        { method: "POST", body: { refreshToken: current } },
        tokenStore.getAccessToken(),
      );
    } catch (error) {
      if (isAuthRejection(error)) {
        await expireSession();
        throw new SessionExpiredError("Refresh token rejected.");
      }
      throw error;
    }

    const next = envelope?.result;
    if (!next?.accessToken || !next?.refreshToken) {
      await expireSession();
      throw new SessionExpiredError("Refresh response had no tokens.");
    }
    await tokenStore.set(next);
    return next.accessToken;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

/**
 * Sends a request through the gateway. A 401 (outside the auth endpoints) triggers one
 * refresh and one retry. Resolves with the whole envelope; rejects with ApiError.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  try {
    return await send<T>(path, options, tokenStore.getAccessToken());
  } catch (error) {
    const isAuthPath = AUTH_PATHS.some((p) => path.includes(p));
    if (!(error instanceof ApiError) || error.status !== 401 || isAuthPath) throw error;
    if (!tokenStore.getRefreshToken()) throw error;

    const token = await refreshSession();
    return send<T>(path, options, token);
  }
}
