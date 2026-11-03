import type { MenuItem } from "./types";

// [WEB-PARITY] Copied from web-client src/apis/menu/dropAtlas.ts.

/** Menu code of the Atlas (iframe) sportsbook — retired since 06/10/2026. */
export const ATLAS_MENU_CODE = "BETTING";
export const SPORTSBOOK_MENU_CODE = "SPORTSBOOK";

/**
 * Removes the Atlas item from the CMS menu. Our sportsbook (when enabled) takes Atlas's place,
 * so the first item — the home page — is still the sportsbook as before.
 */
export function dropAtlas(items: MenuItem[] | null | undefined): MenuItem[] {
  const list = items ?? [];
  const atlasIndex = list.findIndex((m) => m.code === ATLAS_MENU_CODE);
  if (atlasIndex < 0) return list;

  const sportsbook = list.find((m) => m.code === SPORTSBOOK_MENU_CODE);
  const rest = list.filter((m) => m.code !== ATLAS_MENU_CODE && m !== sportsbook);
  if (!sportsbook) return rest;

  const at = list.slice(0, atlasIndex).filter((m) => m !== sportsbook).length;
  return [...rest.slice(0, at), sportsbook, ...rest.slice(at)];
}
