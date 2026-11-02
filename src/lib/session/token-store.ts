import { secureStorage } from "@/lib/secure-storage";

// Access token (~120s) and single-use refresh token (spec Phần B §0.3, §0.10).
// Kept in memory so every request can read them synchronously, persisted to secure storage.
// Key names match the web's localStorage keys.

const ACCESS_KEY = "token";
const REFRESH_KEY = "refresh_token";

export type Tokens = { accessToken: string; refreshToken: string };

let accessToken: string | null = null;
let refreshToken: string | null = null;

export const tokenStore = {
  /** Reads persisted tokens into memory. Call once at startup before any request. */
  async hydrate(): Promise<Tokens | null> {
    try {
      const [access, refresh] = await Promise.all([
        secureStorage.getItem(ACCESS_KEY),
        secureStorage.getItem(REFRESH_KEY),
      ]);
      accessToken = access;
      refreshToken = refresh;
    } catch {
      // Unreadable keychain entry (e.g. restored backup): start as guest.
      accessToken = null;
      refreshToken = null;
    }
    return accessToken && refreshToken ? { accessToken, refreshToken } : null;
  },

  getAccessToken: () => accessToken,
  getRefreshToken: () => refreshToken,

  async set(tokens: Tokens): Promise<void> {
    accessToken = tokens.accessToken;
    refreshToken = tokens.refreshToken;
    await Promise.all([
      secureStorage.setItem(ACCESS_KEY, tokens.accessToken),
      secureStorage.setItem(REFRESH_KEY, tokens.refreshToken),
    ]);
  },

  async clear(): Promise<void> {
    accessToken = null;
    refreshToken = null;
    await Promise.all([
      secureStorage.removeItem(ACCESS_KEY),
      secureStorage.removeItem(REFRESH_KEY),
    ]).catch(() => {
      // Memory is already cleared; a stale keychain entry is rejected by the server later.
    });
  },
};

/** True if the JWT has an `exp` claim in the future (web `isJwtTokenValid`). */
export function isJwtUnexpired(token: string): boolean {
  try {
    const payload = token.split(".")[1];
    if (!payload) return false;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const { exp } = JSON.parse(atob(padded)) as { exp?: number };
    return typeof exp === "number" && exp > Date.now() / 1000;
  } catch {
    return false;
  }
}
