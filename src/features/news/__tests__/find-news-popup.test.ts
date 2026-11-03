import { describe, expect, it, jest } from "@jest/globals";

import { findNewsPopup } from "@/features/news/api";

jest.mock("@/lib/api/client", () => ({ apiRequest: jest.fn() }));

describe("findNewsPopup (web NewsPopupChecker)", () => {
  it("picks the first NEWS or URL item and skips other types", () => {
    const items = [
      { type: "BANNER", image: "a.png" },
      { type: "URL", image: "b.png", referenceId: "/promotions" },
      { type: "NEWS", image: "c.png", referenceId: "42" },
    ];
    expect(findNewsPopup(items)).toBe(items[1]);
  });

  it("returns null when nothing qualifies", () => {
    expect(findNewsPopup([{ type: "BANNER" }])).toBeNull();
    expect(findNewsPopup(null)).toBeNull();
  });
});
