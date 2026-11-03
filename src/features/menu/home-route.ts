import type { MenuItem } from "./types";

// [WEB-PARITY] web-client src/hooks/homeRoute.ts.

export type HomeRoute = { code: string | null; path: string | null };

/** A menu link that can be a home page: in-app (starts with "/"), not "//", not "/". */
export function homePathOf(item: MenuItem): string | null {
  const link = item.link?.trim();
  if (link && link.startsWith("/") && !link.startsWith("//") && link !== "/") return link;
  return null;
}

/** Home page = the first menu item with an in-app link (menu already passed through dropAtlas). */
export function pickHome(items: MenuItem[]): HomeRoute {
  const first = items.find((m) => homePathOf(m) !== null);
  return first ? { code: first.code ?? null, path: homePathOf(first) } : { code: null, path: null };
}
