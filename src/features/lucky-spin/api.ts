import { apiRequest } from "@/lib/api/client";

import type { LuckySpinList } from "./types";

// [WEB-PARITY] web-client src/apis/minigame/index.ts `getLuckySpinList` /
// `getLuckySpinListNotRegister`: a null `result` becomes an empty list with no turns.

const EMPTY: LuckySpinList = { spinRes: [], turnToDay: 0, turnTomorrow: 0 };

export const luckySpinApi = {
  /** Signed-in user: rewards plus today's / tomorrow's turns. */
  async list(): Promise<LuckySpinList> {
    return (await apiRequest<LuckySpinList | null>("minigame-service/v1/lucky-spin/list")).result ?? EMPTY;
  },

  /** Guest version, same shape. */
  async listNotRegistered(): Promise<LuckySpinList> {
    return (await apiRequest<LuckySpinList | null>("minigame-service/v1/lucky-spin/list/not-register")).result ?? EMPTY;
  },
};
