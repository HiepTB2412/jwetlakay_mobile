import type { MenuItem } from "@/features/menu";
import { WEB_PATHS } from "@/lib/navigation/web-routes";

// CMS menu behaviour, ported from web-client src/components/layout/Header/SubHeader.tsx.
// [WEB-PARITY] Pure functions so the routing rules can be tested without the UI.

/** `item.code`, or a code inferred from the link / name (web `getEffectiveCode`). */
export function getEffectiveCode(item: MenuItem): string | null {
  if (item.code) return item.code;
  if (item.link === WEB_PATHS.funbet) return "FUNBET";
  if (item.link === WEB_PATHS.jackpot) return "MINIGAME";
  if (item.link === WEB_PATHS.giftCode) return "GIFTCODE";
  if (item.name?.toLowerCase().includes("jackpot")) return "MINIGAME";
  return null;
}

/** Which menu code the current path belongs to (web `getActiveHeaderFromPath`). */
export function getActiveCodeFromPath(pathname: string, items: MenuItem[], homeCode: string | null): string | null {
  const exact = items.find((item) => item.link === pathname && item.code != null);
  if (exact) return exact.code;

  if (pathname.startsWith("/game/casino")) return "CASINO";
  if (pathname.startsWith("/game/slots")) return "SLOT";
  if (pathname.startsWith("/game/")) return null;
  if (pathname === WEB_PATHS.home) return homeCode;
  if (pathname.startsWith("/sports/")) return "SPORTSBOOK";
  if (pathname === WEB_PATHS.hotGame) return "HOTGAME";
  if (pathname === WEB_PATHS.funbet) return "FUNBET";
  if (pathname === WEB_PATHS.jackpot) return "MINIGAME";
  if (pathname === WEB_PATHS.giftCode) return "GIFTCODE";
  if (pathname === WEB_PATHS.promotions) return "PROMO";
  if (pathname === WEB_PATHS.news) return "NEWS";
  if (pathname === WEB_PATHS.faq) return "FAQ";
  if (pathname === "/lottery") return "LOTTERY";
  if (pathname === "/betcore") return "BETCORE";
  if (pathname.startsWith("/profile/") || pathname.startsWith("/auth/")) return null;

  const partial = items.find((item) => item.link && item.link !== "/" && pathname.startsWith(item.link));
  return partial ? partial.code : null;
}

/** What tapping a menu item does (web `handleMenuItemClick`), in order. */
export type MenuAction =
  | { kind: "login" }
  | { kind: "openGame"; gameId: string; name: string }
  | { kind: "openBetcore"; code: string; name: string }
  | { kind: "navigate"; path: string; replace: boolean };

export function menuItemActions(item: MenuItem, isAuthenticated: boolean, pathname: string): MenuAction[] {
  const actions: MenuAction[] = [];

  if (item.type === "GAME") {
    if (!isAuthenticated) return [{ kind: "login" }];
    return [{ kind: "openGame", gameId: item.referenceId || item.id, name: item.name }];
  }
  if (item.type === "IFRAME") {
    if (!isAuthenticated) return [{ kind: "login" }];
    // The web opens the Betcore popup and then still runs the switch below.
    actions.push({ kind: "openBetcore", code: item.code ?? "", name: item.name });
  }

  const goOnce = (path: string) => (pathname !== path ? [{ kind: "navigate", path, replace: false } as const] : []);

  switch (getEffectiveCode(item)) {
    case "MINIGAME":
      return [...actions, ...goOnce(WEB_PATHS.jackpot)];
    case "GIFTCODE":
      return [...actions, ...goOnce(WEB_PATHS.giftCode)];
    case "FUNBET":
      return [...actions, ...goOnce(WEB_PATHS.funbet)];
    case "HOTGAME":
      return pathname !== WEB_PATHS.home ? [...actions, { kind: "navigate", path: WEB_PATHS.hotGame, replace: false }] : actions;
    case "CASINO":
      return [...actions, { kind: "navigate", path: WEB_PATHS.casino, replace: false }];
    case "SLOT":
      return [...actions, { kind: "navigate", path: WEB_PATHS.slots, replace: true }];
    case "BETCORE":
      if (!isAuthenticated) return [...actions, { kind: "login" }];
      return [...actions, { kind: "openBetcore", code: item.code ?? "", name: item.name }];
    case "PROMO":
      return [...actions, { kind: "navigate", path: WEB_PATHS.promotions, replace: true }];
    case "NEWS":
      return [...actions, { kind: "navigate", path: WEB_PATHS.news, replace: true }];
    case "FAQ":
      return [...actions, { kind: "navigate", path: WEB_PATHS.faq, replace: true }];
    default:
      return item.link ? [...actions, { kind: "navigate", path: item.link, replace: true }] : actions;
  }
}
