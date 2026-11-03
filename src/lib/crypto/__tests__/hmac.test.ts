import { describe, expect, it } from "@jest/globals";

import { hmacSha256Hex, serverHmacKey } from "@/lib/crypto/hmac";

// Well-known HMAC-SHA256 vector (key "key").
const FOX = "The quick brown fox jumps over the lazy dog";
const FOX_DIGEST = "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8";

describe("hmacSha256Hex", () => {
  it("matches the reference vector with a UTF-8 string key", () => {
    expect(hmacSha256Hex(FOX, "key")).toBe(FOX_DIGEST);
  });
});

describe("serverHmacKey (web keyBytes / server HmacUtil.decodeKey)", () => {
  it("Base64-decodes a secret that is valid standard Base64", () => {
    // "a2V5" is Base64 for "key".
    expect(hmacSha256Hex(FOX, serverHmacKey("a2V5"))).toBe(FOX_DIGEST);
  });

  it("uses UTF-8 bytes when the secret is not Base64", () => {
    expect(hmacSha256Hex(FOX, serverHmacKey("key"))).toBe(FOX_DIGEST); // length 3, not a multiple of 4
    expect(hmacSha256Hex(FOX, serverHmacKey("my-secret"))).toBe(hmacSha256Hex(FOX, "my-secret")); // '-' is not Base64
  });
});
