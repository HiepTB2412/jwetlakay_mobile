/**
 * `GET /transaction/v1/balance/user` result (web `IBalance`, spec Phần E). Amounts can be null
 * (Bet Slip treats "both gold and point null" as unknown), and freeBet may be missing.
 */
export type Balance = {
  id: string;
  accountId: string;
  /** Main wallet. */
  gold: number | null;
  /** Promotion wallet. */
  point: number | null;
  commission: number | null;
  freeBet?: number | null;
  /** Defaults to "HTG" where shown (spec Phần C Bet Slip). */
  currency?: string | null;
  createdAt: string;
};
