import { describe, expect, it } from "@jest/globals";

import { dropAtlas } from "@/features/menu/drop-atlas";
import type { MenuItem } from "@/features/menu/types";

const item = (code: string) => ({ id: code, code }) as MenuItem;
const codes = (items: MenuItem[]) => items.map((m) => m.code);

describe("dropAtlas (web src/apis/menu/dropAtlas.ts)", () => {
  it("returns the list unchanged when there is no Atlas item", () => {
    const list = [item("CASINO"), item("SPORTSBOOK")];
    expect(dropAtlas(list)).toBe(list);
  });

  it("moves the sportsbook into Atlas's place", () => {
    const list = [item("BETTING"), item("CASINO"), item("SPORTSBOOK"), item("PROMO")];
    expect(codes(dropAtlas(list))).toEqual(["SPORTSBOOK", "CASINO", "PROMO"]);
  });

  it("keeps the position when the sportsbook came before Atlas", () => {
    const list = [item("CASINO"), item("SPORTSBOOK"), item("SLOT"), item("BETTING")];
    expect(codes(dropAtlas(list))).toEqual(["CASINO", "SLOT", "SPORTSBOOK"]);
  });

  it("just removes Atlas when the sportsbook is disabled", () => {
    expect(codes(dropAtlas([item("CASINO"), item("BETTING")]))).toEqual(["CASINO"]);
  });

  it("treats a null result as an empty menu", () => {
    expect(dropAtlas(null)).toEqual([]);
  });
});
