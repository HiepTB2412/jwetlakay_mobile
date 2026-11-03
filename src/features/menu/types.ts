/**
 * Menu item of `GET /management-service/v1/home-menu/end-user` (web `IMenuHeader`,
 * src/constants/types.ts). Checked against production on 2026-11-03: `referenceId` is returned
 * and `gameTypes` is not (the web types it as required), so it is optional here; its shape
 * belongs to the Casino module.
 */
export type MenuItem = {
  id: string;
  /** Can be null on production (e.g. the GIFTCODE item, checked 2026-11-03). */
  code: string | null;
  name: string;
  image: string;
  imageMobile: string;
  order: number;
  link: string;
  gameTypes?: unknown[];
  /** "GAME" | "IFRAME" | … */
  type: string;
  isHot: boolean;
  referenceId?: string;
};

/** One winner in `top-odd-win` (web `IBetWin`, src/apis/menu/index.tsx). */
export type BetWin = {
  msisdn: string;
  contentProvider: string;
  betId: string;
  settleTime: number;
  betAmount: number;
  payoutAmount: number;
  odds: number;
};

/**
 * `GET /management-service/v1/home-menu/end-user/top-odd-win` result — the "King of Odds" ticker
 * (spec Phần B §3.5). The ticker shows `betWins[0]`; no `betWins` hides it entirely.
 */
export type TopOddWin = {
  betWins: BetWin[];
  startDate: string;
  endDate: string;
  reward?: number;
  destinationUrl?: string;
  eventConfig?: string | null;
  /** Returned by production (2026-11-03), not in the web type. */
  minBet?: number;
};
