import { useSyncExternalStore } from "react";

import { sportApiSigning } from "@/lib/config";
import { hmacSha256Hex, serverHmacKey } from "@/lib/crypto/hmac";

// Sport-api request signing (spec Phần A §0, Phần C §0.2).
//
// [WEB-PARITY] Every request to `/core-read/v1/web/**` carries X-Client-Id / X-Timestamp /
// X-Signature = lowercase hex HMAC-SHA256("clientId:timestamp") signed in the app with
// EXPO_PUBLIC_SPORT_API_SECRET, exactly like web-client src/apis/sportsbook/signing.ts (see the
// security note in src/lib/config.ts). No secret → unsigned, the web's dev mode.
// [WEB-PARITY] X-Timestamp is the raw device clock (`Date.now()`), as on the web. Spec Phần A §9.3
// suggests correcting it with the server clock for RN; not done, to match the web. A device more
// than 60s off gets 401 01402 and the clock-skew notice, same as the web.

const SIGNED_PREFIX = "/core-read/v1/web/";

/** Server error codes on signed endpoints (web signatureErrors.ts). */
export const SIGNATURE_REJECTED_CODE = "01401";
export const CLOCK_SKEW_CODE = "01402";

export function isSignedPath(path: string): boolean {
  return `/${path.replace(/^\/+/, "")}`.includes(SIGNED_PREFIX);
}

// ---- Signer ---------------------------------------------------------------------------------

/** Returns the signing headers for `timestamp` (epoch ms, device clock), or null. */
export type RequestSigner = (timestamp: number) => Promise<Record<string, string> | null>;

/** The web's `signRequest`. Signs on every request; the server accepts ±60s. */
const webParitySigner: RequestSigner = async (timestamp) => {
  const { clientId, secret } = sportApiSigning;
  if (!secret) return null;
  return {
    "X-Client-Id": clientId,
    "X-Timestamp": String(timestamp),
    "X-Signature": hmacSha256Hex(`${clientId}:${timestamp}`, serverHmacKey(secret)),
  };
};

let signer: RequestSigner | null = webParitySigner;

/** Swaps the signer (tests, or a backend-issued scheme later); `null` sends requests unsigned. */
export function setRequestSigner(next: RequestSigner | null): void {
  signer = next;
}

/** Restores the default web-parity signer. */
export function resetRequestSigner(): void {
  signer = webParitySigner;
}

/** Fresh headers for every request (the server accepts ±60s). */
export async function signingHeaders(): Promise<Record<string, string>> {
  return (signer && (await signer(Date.now()))) ?? {};
}

// ---- Clock skew notice (spec Phần C §0.2, §21) ----------------------------------------------

/** `result` of a 01402 response; both values are epoch ms. */
export type ClockSkew = { serverTime?: number; clientTime?: number };

let clockSkew: ClockSkew | null = null;
const skewListeners = new Set<() => void>();

function setClockSkew(next: ClockSkew | null) {
  if (next === clockSkew) return;
  clockSkew = next;
  skewListeners.forEach((listener) => listener());
}

/** Clears the notice, e.g. from the "Try again" button before refetching. */
export function resetClockSkew(): void {
  setClockSkew(null);
}

function subscribeClockSkew(listener: () => void) {
  skewListeners.add(listener);
  return () => skewListeners.delete(listener);
}

export function getClockSkew(): ClockSkew | null {
  return clockSkew;
}

/** Non-null while the server rejects requests for clock skew; sportsbook screens show a notice. */
export function useClockSkew(): ClockSkew | null {
  return useSyncExternalStore(subscribeClockSkew, getClockSkew, getClockSkew);
}

// ---- Signature rejected (01401) -------------------------------------------------------------

const rejectedListeners = new Set<() => void>();

/** Fires on every 01401; the root layout turns it into the "odds unavailable" toast. */
export function onSignatureRejected(listener: () => void): () => void {
  rejectedListeners.add(listener);
  return () => rejectedListeners.delete(listener);
}

// ---- Response hook for the API client -------------------------------------------------------

/** Called by the client after every signed request (web AxiosClient.ts:192-212). */
export function handleSignedResponse(status: number, errorCode: string | undefined, result: unknown): void {
  if (status >= 200 && status < 300) {
    setClockSkew(null);
    return;
  }
  if (status !== 401) return;
  if (errorCode === CLOCK_SKEW_CODE) {
    // First report wins: later ones would only move the times shown in the notice.
    if (!clockSkew) setClockSkew(typeof result === "object" && result !== null ? (result as ClockSkew) : {});
  } else if (errorCode === SIGNATURE_REJECTED_CODE) {
    rejectedListeners.forEach((listener) => listener());
  }
}
