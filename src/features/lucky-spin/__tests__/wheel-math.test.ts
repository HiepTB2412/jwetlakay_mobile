import { describe, expect, it } from "@jest/globals";

import { guestSpinRotation, memberSpinRotation, prizeIndex, sectorCenter } from "@/features/lucky-spin/wheel-math";

/** Where the middle of sector `index` ends up (clockwise degrees from 12 o'clock) after `rotation`. */
function landed(rotation: number, index: number, count: number) {
  const size = 360 / count;
  // Sector 0 starts at 9 o'clock = 270° from 12 o'clock, clockwise.
  return (((270 + (index + 0.5) * size + rotation) % 360) + 360) % 360;
}

describe("wheel math (web PopupShowLuckySpin)", () => {
  it("computes sector centers with the web's -90° offset", () => {
    expect(sectorCenter(0, 4)).toBe(-45);
    expect(sectorCenter(3, 4)).toBe(-135);
  });

  it("lands the won sector under the pointer after at least 5 turns", () => {
    for (const [index, count] of [[0, 8], [3, 8], [7, 8], [2, 5]] as const) {
      const total = memberSpinRotation(720, index, count);
      expect(total).toBeGreaterThanOrEqual(720 + 5 * 360);
      expect(total - 720).toBeLessThan(6 * 360 + 360);
      expect(landed(total, index, count)).toBeCloseTo(0, 6);
    }
  });

  it("guest spins 5–8 turns and lands the same way", () => {
    for (const random of [0, 0.5, 0.999]) {
      const total = guestSpinRotation(100, 4, 16, random);
      expect(total - 100).toBeGreaterThanOrEqual(5 * 360);
      expect(total - 100).toBeLessThan(9 * 360);
      expect(landed(total, 4, 16)).toBeCloseTo(0, 6);
    }
  });

  it("falls back to the first sector for an unknown reward", () => {
    expect(prizeIndex([{ id: "a" }, { id: "b" }, { id: "b" }], "b")).toBe(1);
    expect(prizeIndex([{ id: "a" }], "zzz")).toBe(0);
  });
});
