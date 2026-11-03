import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGlobalSearchParams } from "expo-router";
import { useEffect } from "react";

import type { UtmParams } from "./types";

// Referral code and UTM tracking kept for 7 days (spec Phần B §1.3, web referralTracking.ts).
// Key names and value shape match the web's localStorage.

const REF_KEY = "ref_tracking";
const UTM_KEY = "utm_tracking";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Deep-link query name → register payload field. */
const UTM_FIELDS = {
  utm_id: "utmId",
  utm_source: "utmSource",
  utm_medium: "utmMedium",
  utm_campaign: "utmCampaign",
  utm_term: "utmTerm",
  utm_content: "utmContent",
} as const satisfies Record<string, keyof UtmParams>;

async function readFresh<T extends { timestamp: number }>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const value = JSON.parse(raw) as T;
    if (typeof value.timestamp !== "number" || Date.now() - value.timestamp > TTL_MS) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

export async function saveReferralCode(code: string): Promise<void> {
  await AsyncStorage.setItem(REF_KEY, JSON.stringify({ code, timestamp: Date.now() })).catch(() => {});
}

export async function getReferralCode(): Promise<string | null> {
  return (await readFresh<{ code: string; timestamp: number }>(REF_KEY))?.code ?? null;
}

export async function clearReferralCode(): Promise<void> {
  await AsyncStorage.removeItem(REF_KEY).catch(() => {});
}

/** Stores any `utm_*` values from deep-link params; no-op when there are none. */
export async function saveUtmFromParams(params: Record<string, string | string[] | undefined>): Promise<void> {
  const entries = Object.keys(UTM_FIELDS)
    .map((key) => [key, params[key]] as const)
    .filter((entry): entry is readonly [string, string] => typeof entry[1] === "string" && entry[1] !== "");
  if (entries.length === 0) return;
  await AsyncStorage.setItem(UTM_KEY, JSON.stringify({ ...Object.fromEntries(entries), timestamp: Date.now() })).catch(
    () => {},
  );
}

/** Register payload fields; only keys with a value are included (spec Phần B §1.2). */
export async function getUtmPayload(): Promise<UtmParams> {
  const stored = await readFresh<Record<string, string> & { timestamp: number }>(UTM_KEY);
  if (!stored) return {};
  const payload: UtmParams = {};
  for (const [query, field] of Object.entries(UTM_FIELDS)) {
    if (stored[query]) payload[field] = stored[query];
  }
  return payload;
}

/**
 * Stores `ref` / `referral_code` and `utm_*` from whatever link opened the app, not only the
 * register screen (web QueryProvider reads them from any landing URL). Mount once at the root.
 */
export function useCaptureReferralParams(): void {
  const params = useGlobalSearchParams();
  const ref = params.ref ?? params.referral_code;
  const code = typeof ref === "string" ? ref : undefined;
  const utmKey = Object.keys(UTM_FIELDS)
    .map((key) => params[key])
    .join("|");

  useEffect(() => {
    if (code) void saveReferralCode(code);
    // utmKey stands in for `params`, which is a new object on every navigation.
    void saveUtmFromParams(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, utmKey]);
}
