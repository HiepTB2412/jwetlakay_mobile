import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fetch } from "expo/fetch";

import { apiRequest, onSessionExpired } from "@/lib/api/client";
import { ApiError, apiErrorMessage } from "@/lib/api/errors";
import { tokenStore } from "@/lib/session/token-store";

jest.mock("expo/fetch", () => ({ fetch: jest.fn() }));
// `apiUrl` lets a test simulate a build without EXPO_PUBLIC_API_URL.
const mockConfig = { apiUrl: "https://api.test" as string | null };
jest.mock("@/lib/config", () => {
  class ConfigError extends Error {}
  return {
    ConfigError,
    getApiUrl: () => {
      if (!mockConfig.apiUrl) throw new ConfigError("EXPO_PUBLIC_API_URL is missing");
      return mockConfig.apiUrl;
    },
  };
});
jest.mock("@/i18n", () => ({
  __esModule: true,
  default: { language: "vi", t: (key: string) => key },
}));
jest.mock("@/lib/secure-storage", () => {
  const store = new Map<string, string>();
  return {
    secureStorage: {
      getItem: async (key: string) => store.get(key) ?? null,
      setItem: async (key: string, value: string) => void store.set(key, value),
      removeItem: async (key: string) => void store.delete(key),
    },
  };
});

const fetchMock = fetch as unknown as ReturnType<typeof jest.fn<(...args: any[]) => any>>;

function jwt(expiresInSeconds: number) {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expiresInSeconds }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `header.${payload}.signature`;
}

function respond(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body) };
}

const envelope = (result: unknown) => ({ requestId: "r", errorCode: "00000", message: "OK", result });

type Route = (url: string, init: { headers: Record<string, string>; body?: string }) => ReturnType<typeof respond>;

function routeFetch(route: Route) {
  fetchMock.mockImplementation(async (url: string, init: { headers: Record<string, string>; body?: string }) =>
    route(url, init),
  );
}

const calls = (fragment: string) => fetchMock.mock.calls.filter(([url]) => String(url).includes(fragment));
const bodyOf = (fragment: string) => JSON.parse((calls(fragment)[0][1] as { body: string }).body);

const REFRESH = jwt(3600);

afterEach(() => {
  jest.restoreAllMocks();
});

// Dev-only failure logs would flood the test output; tests that check them read this spy.
let warn: ReturnType<typeof jest.spyOn>;

beforeEach(async () => {
  fetchMock.mockReset();
  mockConfig.apiUrl = "https://api.test";
  warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  await tokenStore.set({ accessToken: "old-access", refreshToken: REFRESH });
});

describe("apiRequest", () => {
  it("sends the bearer token and language, and resolves the envelope", async () => {
    routeFetch(() => respond(200, envelope({ id: "u1" })));

    const result = await apiRequest<{ id: string }>("identity-service/v1/account/info");

    expect(result.result).toEqual({ id: "u1" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.test/identity-service/v1/account/info");
    expect(init.headers.Authorization).toBe("Bearer old-access");
    expect(init.headers["Accept-Language"]).toBe("vi");
  });

  it("refreshes once on 401 and retries with the new token", async () => {
    routeFetch((url, init) => {
      if (url.includes("auth/refreshToken")) {
        return respond(200, envelope({ accessToken: "new-access", refreshToken: jwt(3600) }));
      }
      return init.headers.Authorization === "Bearer new-access"
        ? respond(200, envelope("ok"))
        : respond(401, { errorCode: "401", message: "expired" });
    });

    const result = await apiRequest("transaction/v1/balance/user");

    expect(result.result).toBe("ok");
    expect(calls("auth/refreshToken")).toHaveLength(1);
    expect(bodyOf("auth/refreshToken")).toEqual({ refreshToken: REFRESH });
    expect(tokenStore.getAccessToken()).toBe("new-access");
  });

  it("shares one refresh between concurrent 401s (refresh token is single-use)", async () => {
    let releaseRefresh: () => void = () => {};
    const refreshGate = new Promise<void>((resolve) => (releaseRefresh = resolve));

    fetchMock.mockImplementation(async (url: string, init: { headers: Record<string, string> }) => {
      if (url.includes("auth/refreshToken")) {
        await refreshGate;
        return respond(200, envelope({ accessToken: "new-access", refreshToken: jwt(3600) }));
      }
      return init.headers.Authorization === "Bearer new-access"
        ? respond(200, envelope(url))
        : respond(401, {});
    });

    const pending = Promise.all([apiRequest("a"), apiRequest("b"), apiRequest("c")]);
    // Let all three 401s arrive before the refresh resolves.
    await new Promise((resolve) => setTimeout(resolve, 0));
    releaseRefresh();
    const results = await pending;

    expect(calls("auth/refreshToken")).toHaveLength(1);
    expect(results.map((r) => r.result)).toEqual(["https://api.test/a", "https://api.test/b", "https://api.test/c"]);
  });

  it("ends the session when the server rejects the refresh token", async () => {
    const expired = jest.fn();
    const unsubscribe = onSessionExpired(expired);
    routeFetch((url) => {
      if (url.includes("auth/refreshToken")) return respond(400, { errorCode: "01001", message: "invalid" });
      if (url.includes("auth/logout")) return respond(200, envelope(null));
      return respond(401, {});
    });

    await expect(apiRequest("transaction/v1/balance/user")).rejects.toThrow("Refresh token rejected.");

    expect(expired).toHaveBeenCalledTimes(1);
    expect(tokenStore.getAccessToken()).toBeNull();
    expect(tokenStore.getRefreshToken()).toBeNull();
    expect(bodyOf("auth/logout")).toEqual({ refreshToken: REFRESH });
    unsubscribe();
  });

  it("keeps the session when the refresh fails with a 5xx", async () => {
    const expired = jest.fn();
    const unsubscribe = onSessionExpired(expired);
    routeFetch((url) => (url.includes("auth/refreshToken") ? respond(503, "Service Unavailable") : respond(401, {})));

    await expect(apiRequest("transaction/v1/balance/user")).rejects.toBeInstanceOf(ApiError);

    expect(expired).not.toHaveBeenCalled();
    expect(tokenStore.getRefreshToken()).toBe(REFRESH);
    unsubscribe();
  });

  it("ends the session without calling the server when the refresh JWT has expired", async () => {
    await tokenStore.set({ accessToken: "old-access", refreshToken: jwt(-10) });
    routeFetch((url) => (url.includes("auth/logout") ? respond(200, envelope(null)) : respond(401, {})));

    await expect(apiRequest("x")).rejects.toThrow("Refresh token expired.");

    expect(calls("auth/refreshToken")).toHaveLength(0);
    expect(tokenStore.getRefreshToken()).toBeNull();
  });

  it("never refreshes for a 401 from the login endpoint", async () => {
    routeFetch(() => respond(401, { errorCode: "01002", message: "Wrong password" }));

    const error = await apiRequest("identity-service/v1/auth/login", { method: "POST", body: {} }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.errorCode).toBe("01002");
    expect(apiErrorMessage(error)).toBe("Wrong password");
    expect(calls("auth/refreshToken")).toHaveLength(0);
  });

  it("maps a network failure to status 0 and the generic message", async () => {
    fetchMock.mockRejectedValue(new TypeError("Network request failed"));

    const error = await apiRequest("x").catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(apiErrorMessage(error)).toBe("something_went_wrong");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("GET https://api.test/x failed"));
  });

  it("logs the server's reason for a rejected login without the password", async () => {
    routeFetch(() =>
      respond(200, { requestId: "r", errorCode: "01002", message: "Wrong username or password", result: null }),
    );

    await apiRequest("identity-service/v1/auth/login", {
      method: "POST",
      body: { username: "34000000", password: "secret-pass", type: "MSISDN" },
    });

    const line = String(warn.mock.calls[0]?.[0]);
    expect(line).toContain("HTTP 200 errorCode=01002");
    expect(line).toContain("Wrong username or password");
    expect(line).not.toContain("secret-pass");
  });

  it("reports a missing API URL as a config error, not as a network failure", async () => {
    mockConfig.apiUrl = null;

    const error = await apiRequest("identity-service/v1/auth/register/request", { method: "POST" }).catch((e) => e);

    expect(error).not.toBeInstanceOf(ApiError);
    expect(apiErrorMessage(error)).toBe("EXPO_PUBLIC_API_URL is missing");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
