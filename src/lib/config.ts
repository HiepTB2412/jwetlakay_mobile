// Gateway origin for every service (identity, transaction, sport-api, …), spec Phần A §0.
// Mobile counterpart of the web's VITE_API_URL:
//   production  https://api.jwetlakay.com  (the environment this project develops against)
//
// Deliberately no default: a build that forgot the variable must fail loudly instead of
// silently sending traffic to the wrong environment (same rule as web AxiosClient.ts).

const RAW_API_URL = process.env.EXPO_PUBLIC_API_URL;

export class ConfigError extends Error {
  name = "ConfigError";
}

export function getApiUrl(): string {
  const value = typeof RAW_API_URL === "string" ? RAW_API_URL.trim().replace(/\/+$/, "") : "";
  if (!/^https?:\/\/[^/\s]+(\/[^\s]*)?$/.test(value)) {
    throw new ConfigError(
      `EXPO_PUBLIC_API_URL is missing or not a full http(s) origin (got: ${JSON.stringify(RAW_API_URL)}). ` +
        "Set it in .env.local and restart the dev server.",
    );
  }
  return value;
}

// Odds WebSocket endpoint (web VITE_ODDS_WS_URL, spec Phần C §0.4), production
// wss://api.jwetlakay.com/ws. Unlike the web there is no built-in default, for
// the same reason as the API URL: when unset the socket simply stays off.
const RAW_ODDS_WS_URL = process.env.EXPO_PUBLIC_ODDS_WS_URL;

export function getOddsWsUrl(): string | null {
  const value = typeof RAW_ODDS_WS_URL === "string" ? RAW_ODDS_WS_URL.trim() : "";
  return /^wss?:\/\/[^/\s]+(\/[^\s]*)?$/.test(value) ? value : null;
}

// ---- Client-side signing credentials ----------------------------------------------------------
// [WEB-PARITY] Same model as web mobile mode (web-client release-v2 08bf9d9): the HMAC secrets
// are build-time variables, so they are inlined in the JS bundle and can be extracted from the
// app. The server's own comment calls the sport-api signature "a scraping speed bump, not strong
// auth". This goes against the project rule "never embed HMAC secrets" and was chosen explicitly
// by the product owner to match the web; replace with backend signing when available (Phần H §1).
// Defaults copy the web's `?? default` (an empty value stays empty).

/** Sport-api REST signature (web VITE_SPORT_API_CLIENT_ID / VITE_SPORT_API_SECRET). Empty secret = unsigned. */
export const sportApiSigning = {
  clientId: process.env.EXPO_PUBLIC_SPORT_API_CLIENT_ID ?? "web-app",
  secret: process.env.EXPO_PUBLIC_SPORT_API_SECRET ?? "",
};

/**
 * Socket handshake (web VITE_SOCKET_*). The signature is normally fetched from `signatureUrl`;
 * the secret is only the web's fallback when that request fails, or when the URL is set empty.
 */
export const socketSigning = {
  signatureUrl: process.env.EXPO_PUBLIC_SOCKET_SIGNATURE_URL ?? "/core-read/v1/web/socket-signature",
  clientId: process.env.EXPO_PUBLIC_SOCKET_CLIENT_ID ?? "web-prod",
  secret: process.env.EXPO_PUBLIC_SOCKET_SECRET ?? "",
};

/** Lottery ticket purchase signature (web VITE_LOTTERY_ACCESS_KEY / VITE_LOTTERY_SECRET_KEY). */
export const lotterySigning = {
  accessKey: process.env.EXPO_PUBLIC_LOTTERY_ACCESS_KEY ?? "",
  secretKey: process.env.EXPO_PUBLIC_LOTTERY_SECRET_KEY ?? "",
};

// Images: [WEB-PARITY] the web defines VITE_IMAGE_URL_PREFIX and `getPathImage(path) =
// prefix + path`, but nothing calls it — every screen renders the image URL the API returns
// (e.g. `src={item.imageMobile}`). The app does the same, so no image prefix is configured.
