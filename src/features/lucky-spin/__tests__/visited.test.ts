import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { hasVisitedWithinPeriod, markLuckySpinVisited, refreshLuckySpinVisited } from "@/features/lucky-spin/visited";

const mockStore = new Map<string, string>();
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: async (key: string) => mockStore.get(key) ?? null,
    setItem: async (key: string, value: string) => void mockStore.set(key, value),
  },
}));

const DAY = 24 * 60 * 60 * 1000;

beforeEach(() => mockStore.clear());

describe("lucky_spin_visited (web cookieUtils)", () => {
  it("is valid for 20 days after a signed-in visit", async () => {
    expect(await hasVisitedWithinPeriod()).toBe(false);
    await markLuckySpinVisited();
    expect(await hasVisitedWithinPeriod()).toBe(true);
    expect(await hasVisitedWithinPeriod(Date.now() + 19 * DAY)).toBe(true);
    expect(await hasVisitedWithinPeriod(Date.now() + 21 * DAY)).toBe(false);
  });

  it("refresh only extends a valid mark", async () => {
    await refreshLuckySpinVisited();
    expect(mockStore.has("lucky_spin_visited")).toBe(false);
    mockStore.set("lucky_spin_visited", String(Date.now() - 10 * DAY));
    await refreshLuckySpinVisited();
    expect(Number(mockStore.get("lucky_spin_visited"))).toBeGreaterThan(Date.now() - DAY);
  });
});
