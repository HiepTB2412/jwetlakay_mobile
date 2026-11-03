// [WEB-PARITY] web-client src/apis/minigame/index.ts (`ILuckySpinReward`, `ILuckySpinListResult`).

export type LuckySpinReward = {
  id: string;
  name: string;
  description: string;
  icon: string;
  startTime: string;
  endTime: string;
  item: string | null;
  itemValue: number;
  typeItem: string;
  transactionId: string | null;
};

/**
 * The web types the turns as required, but production's guest endpoint (`/list/not-register`)
 * returns only `spinRes` (checked 2026-11-03), so they are optional. The web passes the result
 * through as is; callers treat missing turns as 0.
 */
export type LuckySpinList = {
  spinRes: LuckySpinReward[];
  turnToDay?: number;
  turnTomorrow?: number;
};
