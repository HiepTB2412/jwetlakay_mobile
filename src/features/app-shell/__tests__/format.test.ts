import { describe, expect, it } from "@jest/globals";

import {
  countdownEnd,
  countdownLabel,
  formatAmountK,
  formatMoney,
  formatWholeMoney,
  haitiWallClock,
  initials,
  maskMsisdn,
} from "@/features/app-shell/format";

describe("money formatting (web WalletMenu / Sidebar)", () => {
  it("shows 0–2 decimals en-US on cards", () => {
    expect(formatMoney(1234.5)).toBe("1,234.5");
    expect(formatMoney(1234.567)).toBe("1,234.57");
    expect(formatMoney(null)).toBe("0");
  });

  it("truncates (not rounds) on the header button", () => {
    expect(formatWholeMoney(1234.99)).toBe("1,234");
    expect(formatWholeMoney(undefined)).toBe("0");
  });

  it("abbreviates thousands with K", () => {
    expect(formatAmountK(20000)).toBe("20K");
    expect(formatAmountK(1500)).toBe("1.5K");
    expect(formatAmountK(999)).toBe("999");
    expect(formatAmountK("abc")).toBe("0");
    expect(formatAmountK(null)).toBe("0");
  });
});

describe("maskMsisdn / initials", () => {
  it("masks the middle of a phone number", () => {
    expect(maskMsisdn("50933312")).toBe("509***12");
    expect(maskMsisdn("12345")).toBe("12345");
  });

  it("builds avatar letters like the web", () => {
    expect(initials("Jean Baptiste")).toBe("JB");
    expect(initials("test")).toBe("TES");
    expect(initials("")).toBe("?");
  });
});

describe("King of Odds countdown", () => {
  const end = countdownEnd("2026-11-08")!;

  it("ends at 23:59:59 of the end date and rejects bad dates", () => {
    expect(end.getHours()).toBe(23);
    expect(end.getSeconds()).toBe(59);
    expect(countdownEnd("not-a-date")).toBeNull();
    expect(countdownEnd(undefined)).toBeNull();
  });

  it("shows the largest non-zero unit", () => {
    expect(countdownLabel(end, new Date(2026, 10, 5, 12, 0, 0))).toEqual({ unit: "days", count: 3 });
    expect(countdownLabel(end, new Date(2026, 10, 8, 20, 0, 0))).toEqual({ unit: "hours", count: 3 });
    expect(countdownLabel(end, new Date(2026, 10, 8, 23, 50, 0))).toEqual({ unit: "minutes", count: 9 });
    expect(countdownLabel(end, new Date(2026, 10, 8, 23, 59, 30))).toEqual({ unit: "seconds", count: 29 });
    expect(countdownLabel(end, new Date(2026, 10, 9))).toEqual({ unit: "seconds", count: 0 });
  });

  it("reads the wall clock in Haiti", () => {
    // 2026-11-03 17:00:00 UTC is 12:00:00 in Port-au-Prince (UTC-5 in November).
    const haiti = haitiWallClock(new Date(Date.UTC(2026, 10, 3, 17, 0, 0)));
    expect([haiti.getDate(), haiti.getHours(), haiti.getMinutes()]).toEqual([3, 12, 0]);
  });
});
