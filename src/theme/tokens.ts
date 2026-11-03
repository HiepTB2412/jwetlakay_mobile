// Sportsbook color tokens used across the whole app (spec Phần G §8.1–8.2).
// Only light and dark exist; other web palettes and hybrid/brand modes are dropped.

export const light = {
  bg: "#F3F4F7",
  surface: "#FFFFFF",
  surfaceAlt: "#FFFFFF",
  input: "#F3F4F7",
  oddBg: "#F6F7FA",
  rowHead: "#FFF6EE",
  border: "#E4E7EE",
  borderStrong: "#D9DDE6",
  cardBorderWidth: 1,
  deep: "#D7DFEE",
  selectedSoft: "#E4EFFF",
  text: "#161A23",
  textSub: "#3D404A",
  muted: "#677085",
  hint: "#9AA6B8",
  brand: "#F26A0F",
  onBrand: "#FFFFFF",
  brandPressed: "#DD5F0A",
  brandSoft: "rgba(242,106,15,0.10)",
  brandInk: "#C2540A",
  live: "#EF4444",
  /** Error banner / locked-account box background. */
  liveSoft: "rgba(239,68,68,0.10)",
  up: "#22C55E",
  win: "#16A34A",
  header: "#FFFFFF",
  nav: "#FFFFFF",
};

export const dark: typeof light = {
  bg: "#07122A",
  surface: "#0D1C3D",
  surfaceAlt: "#122745",
  input: "#0A1733",
  oddBg: "#0F2249",
  rowHead: "#132A5A",
  border: "#1C3567",
  borderStrong: "#26437E",
  cardBorderWidth: 0,
  deep: "#050F1C",
  selectedSoft: "#122745",
  text: "#FFFFFF",
  textSub: "#CCD6E2",
  muted: "#93A3C6",
  hint: "#BBD4F6",
  brand: "#FF7A1A",
  onBrand: "#FFFFFF",
  brandPressed: "#FF8F3D",
  brandSoft: "rgba(255,122,26,0.14)",
  brandInk: "#FF9A4D",
  live: "#EF4444",
  liveSoft: "rgba(239,68,68,0.16)",
  up: "#22C55E",
  win: "#34D399",
  header: "#050E22",
  nav: "#081631",
};

export type ThemeTokens = typeof light;

/** Wallet colors stay the same in both modes (spec §5). */
export const WALLET = {
  main: "#3DD351",
  promo: "#FF8C00",
  freeBet: "#00B4D8",
  commission: "#B266F5",
} as const;

/** Scrims stay the same in both modes. `loading` = web LoadingSpinner backdrop (spec Phần B §0.6). */
export const SCRIM = {
  loading: "rgba(0,0,0,0.6)",
} as const;
