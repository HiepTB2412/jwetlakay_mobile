import { describe, expect, it, jest } from "@jest/globals";

import { lotterySignString, signLotteryPurchase } from "@/features/lottery/signature";
import { hmacSha256Hex } from "@/lib/crypto/hmac";

jest.mock("@/lib/config", () => ({ lotterySigning: { accessKey: "", secretKey: "" } }));

const purchase = {
  requestId: "req-1",
  tickets: [{ drawId: "d1", selectedNumber: "05", betAmount: 100, extra: "ignored" }],
  totalAmount: 100,
};

describe("lottery signature (web toSignString / generateSignature)", () => {
  it("signs accessKey + requestId + JSON(tickets) + totalAmount", () => {
    expect(lotterySignString(purchase, "AK")).toBe(
      'AKreq-1[{"drawId":"d1","selectedNumber":"05","betAmount":100}]100',
    );
  });

  it("is the hex HMAC of that string with the secret as UTF-8", () => {
    const signature = signLotteryPurchase(purchase, { accessKey: "AK", secretKey: "SK" });
    expect(signature).toBe(hmacSha256Hex(lotterySignString(purchase, "AK"), "SK"));
    expect(signature).toMatch(/^[0-9a-f]{64}$/);
  });
});
