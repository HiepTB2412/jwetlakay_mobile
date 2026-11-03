import { apiRequest, type Paginated } from "@/lib/api/client";

import { luckySpinPreview, previewHistory, previewList, previewSpin } from "./preview";
import type { LuckySpinHistoryItem, LuckySpinList, LuckySpinReward } from "./types";

// [WEB-PARITY] web-client src/apis/minigame/index.ts. A null list `result` becomes an empty list
// with no turns; a null spin `result` is an error ("Spin result is empty").
// With the dev preview on (preview.ts), every call returns sample data instead.

const EMPTY: LuckySpinList = { spinRes: [], turnToDay: 0, turnTomorrow: 0 };
const HISTORY_PAGE_SIZE = 20;

async function spinResult(path: string): Promise<LuckySpinReward> {
  const result = (await apiRequest<LuckySpinReward | null>(path)).result;
  if (!result) throw new Error("Spin result is empty");
  return result;
}

export const luckySpinApi = {
  /** Signed-in user: rewards plus today's / tomorrow's turns. */
  async list(): Promise<LuckySpinList> {
    if (luckySpinPreview) return previewList(true);
    return (await apiRequest<LuckySpinList | null>("minigame-service/v1/lucky-spin/list")).result ?? EMPTY;
  },

  /** Guest version. Production returns only `spinRes` (no turns) for guests. */
  async listNotRegistered(): Promise<LuckySpinList> {
    if (luckySpinPreview) return previewList(false);
    return (await apiRequest<LuckySpinList | null>("minigame-service/v1/lucky-spin/list/not-register")).result ?? EMPTY;
  },

  /** Uses one of today's turns. GET with no payload, as on the web. */
  spin(): Promise<LuckySpinReward> {
    if (luckySpinPreview) return Promise.resolve().then(() => previewSpin(true));
    return spinResult("minigame-service/v1/lucky-spin/spin");
  },

  /** Guest trial spin; its `transactionId` is passed on to registration. */
  spinNotRegistered(): Promise<LuckySpinReward> {
    if (luckySpinPreview) return Promise.resolve().then(() => previewSpin(false));
    return spinResult("minigame-service/v1/lucky-spin/spin/not-register");
  },

  /** Spin history; `page` is 1-based like the web. */
  async history(page: number): Promise<Paginated<LuckySpinHistoryItem>> {
    if (luckySpinPreview) return previewHistory(page, HISTORY_PAGE_SIZE);
    return (await apiRequest<Paginated<LuckySpinHistoryItem>>("minigame-service/v1/lucky-spin/history", {
      query: { page, size: HISTORY_PAGE_SIZE },
    })).result;
  },
};
