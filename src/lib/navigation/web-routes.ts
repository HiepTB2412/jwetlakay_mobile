import type { Href } from "expo-router";

// Web paths → app routes. CMS data (menu links, banners, the King of Odds `destinationUrl`) and
// the web's navigation targets are web paths; this table is the one place that turns them into
// app routes. A path with no entry has no screen yet: callers show "coming soon" (product
// decision 2026-11-03). Add a line here when a module ships its screens.

const ROUTES: Record<string, Href> = {
  "/": "/",
  "/auth/login": "/auth/login",
  "/auth/register": "/auth/register",
  "/auth/forgot-password": "/auth/forgot-password",
};

/** Hosts whose URLs are treated as in-app paths (the web's own domain). */
const WEB_HOSTS = new Set(["jwetlakay.com", "www.jwetlakay.com"]);

/** Web paths the app shell navigates to (web ROUTER_PAGE). */
export const WEB_PATHS = {
  home: "/",
  login: "/auth/login",
  register: "/auth/register",
  deposit: "/profile/deposit",
  withdraw: "/profile/withdraw",
  transactionsHistory: "/profile/transactions-history",
  betsHistory: "/profile/bets-history",
  notifications: "/profile/notifications",
  invite: "/profile/invite",
  information: "/profile/information",
  promotions: "/promotions",
  news: "/news",
  faq: "/faq",
  giftCode: "/giftcode",
  funbet: "/WCFunbet",
  jackpot: "/WCJackpot",
  hotGame: "/hot-game",
  casino: "/game/casino",
  slots: "/game/slots",
} as const;

export type WebTarget =
  | { kind: "route"; href: Href }
  | { kind: "external"; url: string }
  | { kind: "unavailable"; path: string };

/**
 * Classifies a web path or URL. URLs on the web's own domain become paths (like the web's news
 * popup, which strips the host); other absolute http(s) URLs open outside the app.
 */
export function resolveWebTarget(target: string): WebTarget {
  const value = target.trim();
  let path = value;
  if (/^https?:\/\//i.test(value)) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return { kind: "unavailable", path: value };
    }
    if (!WEB_HOSTS.has(url.hostname.toLowerCase())) return { kind: "external", url: value };
    path = `${url.pathname}${url.search}`;
  }
  const [pathname] = path.split(/[?#]/);
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const href = ROUTES[normalized];
  return href ? { kind: "route", href } : { kind: "unavailable", path: normalized || value };
}
