import CryptoJS from "crypto-js";

// HMAC-SHA256 for the client-side signatures. React Native has no `crypto.subtle`, so this uses
// crypto-js, the library the web already uses for lottery (spec Phần A §9.1).

export type HmacKey = CryptoJS.lib.WordArray;

/**
 * Key bytes exactly as the server's HmacUtil.decodeKey and the web's `keyBytes`
 * (web-client src/apis/sportsbook/signing.ts): a string that looks like standard Base64 with a
 * valid length is Base64-decoded, anything else is taken as UTF-8. Choosing the other branch
 * makes every signature fail with no visible reason. Used for sport-api and socket secrets.
 */
export function serverHmacKey(secret: string): HmacKey {
  const looksBase64 = /^[A-Za-z0-9+/]+={0,2}$/.test(secret) && secret.length % 4 === 0;
  if (looksBase64) {
    try {
      return CryptoJS.enc.Base64.parse(secret);
    } catch {
      // fall through to UTF-8
    }
  }
  return CryptoJS.enc.Utf8.parse(secret);
}

/** Lowercase hex HMAC-SHA256. A string key is used as UTF-8 (crypto-js default, as web lottery). */
export function hmacSha256Hex(message: string, key: string | HmacKey): string {
  return CryptoJS.HmacSHA256(message, key).toString(CryptoJS.enc.Hex);
}
