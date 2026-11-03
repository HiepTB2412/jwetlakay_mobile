import { describe, expect, it, jest } from "@jest/globals";

import { getActiveCodeFromPath, getEffectiveCode, menuItemActions } from "@/features/app-shell/menu-actions";
import { pickHome } from "@/features/menu/home-route";
import type { MenuItem } from "@/features/menu/types";

jest.mock("@/lib/api/client", () => ({ apiRequest: jest.fn() }));

const item = (fields: Partial<MenuItem>) =>
  ({ id: "1", code: null, name: "", image: "", imageMobile: "", order: 0, link: "", type: "OTHER", isHot: false, ...fields }) as MenuItem;

// Production menu on 2026-11-03.
const PROD_MENU = [
  item({ code: "BETCORE-EL-CASINO", link: "/sport", name: "Sport" }),
  item({ code: "SLOT", name: "Casino" }),
  item({ code: null, link: "/giftcode", name: "GIFTCODE", isHot: true }),
  item({ code: "LOTTERY", link: "/lottery", name: "Lottery" }),
  item({ code: "HOT-GAME", link: "/hot-game", name: "Hot Game" }),
  item({ code: "NEWS", name: "PROMO" }),
  item({ code: "FAQ", link: "/faq", name: "FAQ" }),
];

describe("pickHome (web homeRoute)", () => {
  it("picks the first item with an in-app link", () => {
    expect(pickHome(PROD_MENU)).toEqual({ code: "BETCORE-EL-CASINO", path: "/sport" });
    expect(pickHome([item({ link: "/" }), item({ link: "//cdn" })])).toEqual({ code: null, path: null });
  });
});

describe("getEffectiveCode", () => {
  it("infers a code from the link or name when missing", () => {
    expect(getEffectiveCode(PROD_MENU[2])).toBe("GIFTCODE");
    expect(getEffectiveCode(item({ name: "World Jackpot" }))).toBe("MINIGAME");
    expect(getEffectiveCode(item({ code: "SLOT" }))).toBe("SLOT");
  });
});

describe("getActiveCodeFromPath", () => {
  it("maps routes to menu codes like the web", () => {
    expect(getActiveCodeFromPath("/", PROD_MENU, "BETCORE-EL-CASINO")).toBe("BETCORE-EL-CASINO");
    expect(getActiveCodeFromPath("/lottery", PROD_MENU, null)).toBe("LOTTERY");
    expect(getActiveCodeFromPath("/faq", PROD_MENU, null)).toBe("FAQ");
    expect(getActiveCodeFromPath("/auth/login", PROD_MENU, null)).toBeNull();
    expect(getActiveCodeFromPath("/sport/match/1", PROD_MENU, null)).toBe("BETCORE-EL-CASINO");
  });
});

describe("menuItemActions (web handleMenuItemClick)", () => {
  it("sends guests to login for GAME items and opens the game for members", () => {
    const game = item({ type: "GAME", id: "g1", referenceId: "ref-9", name: "Aviator" });
    expect(menuItemActions(game, false, "/")).toEqual([{ kind: "login" }]);
    expect(menuItemActions(game, true, "/")).toEqual([{ kind: "openGame", gameId: "ref-9", name: "Aviator" }]);
  });

  it("opens Betcore for IFRAME items and still runs the code switch", () => {
    const iframe = item({ type: "IFRAME", code: "TVBET", name: "TV", link: "/betcore" });
    expect(menuItemActions(iframe, true, "/")).toEqual([
      { kind: "openBetcore", code: "TVBET", name: "TV" },
      { kind: "navigate", path: "/betcore", replace: true },
    ]);
  });

  it("routes production items", () => {
    expect(menuItemActions(PROD_MENU[0], false, "/")).toEqual([{ kind: "navigate", path: "/sport", replace: true }]);
    expect(menuItemActions(PROD_MENU[1], false, "/")).toEqual([{ kind: "navigate", path: "/game/slots", replace: true }]);
    expect(menuItemActions(PROD_MENU[2], false, "/")).toEqual([{ kind: "navigate", path: "/giftcode", replace: false }]);
    expect(menuItemActions(PROD_MENU[2], false, "/giftcode")).toEqual([]);
    expect(menuItemActions(PROD_MENU[5], false, "/")).toEqual([{ kind: "navigate", path: "/news", replace: true }]);
  });

  it("requires login for BETCORE", () => {
    expect(menuItemActions(item({ code: "BETCORE" }), false, "/")).toEqual([{ kind: "login" }]);
  });
});
