// Gateway origin for every service (identity, transaction, sport-api, …), spec Phần A §0.
// Mobile counterpart of the web's VITE_API_URL:
//   production  https://api.jwetlakay.com
//   UAT         https://api-betting.gaog.co
//
// Deliberately no default: a build that forgot the variable must fail loudly instead of
// silently sending UAT traffic to production (same rule as web AxiosClient.ts).

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
