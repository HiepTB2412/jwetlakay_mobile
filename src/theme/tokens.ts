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
  /** King of Odds ticker: odds value (web noti.winning OddTag). */
  tickerOdd: "#C2540A",
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
  tickerOdd: "#39FF6A",
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
  /** Web DrawerModal.css `.jw-drawer-scrim`. */
  drawer: "rgba(0,0,0,0.5)",
  /** Web dialogStyle overlay (ConfirmModal). */
  dialog: "rgba(0,0,0,0.55)",
  /** Full-screen promo popups (news popup, Lucky Spin wheel). */
  popup: "rgba(0,0,0,0.75)",
  /** Lucky Spin win / history / guest reward modals. */
  popupStrong: "rgba(0,0,0,0.85)",
  /** Ring around the round close artwork (web `ic_btn_close` with 2px #ccc). */
  closeRing: "#CCCCCC",
  /** Disc behind the small round close button. */
  closeDisc: "rgba(0,0,0,0.35)",
} as const;

// Lucky Spin artwork colors (web minigame `DEFAULT_COLORS*`, PopupShowLuckySpin /
// PopupShowHalfLuckySpin). Same in light and dark: they are part of the wheel artwork.
export const LUCKY_SPIN_SECTORS = [
  "#C1172E",
  "#C016AF",
  "#6317C1",
  "#1732C1",
  "#175BC0",
  "#16C099",
  "#16C144",
  "#E88726",
  "#F1C40F",
] as const;

export const LUCKY_SPIN_SECTORS_HALF = ["#16C144", "#F1C40F", "#C1172E", "#1732C1", "#16C099"] as const;

export const LUCKY_SPIN = {
  wheelBase: "#000000",
  sectorEdge: "rgba(255,255,255,0.4)",
  winnerGlow: "#FFD700",
  text: "#FFFFFF",
  tryText: "#5F2F0B",
  rewardCard: "#081930",
  historyTable: "rgba(0,0,0,0.4)",
  amount: "#F1C40F",
  failed: "#FF5A5A",
  success: "#3CCF5C",
  loginLink: "#69A9F9",
  miniToggle: "#0F8663",
  miniArrow: "#FFE92B",
  shadow: "#000000",
} as const;

