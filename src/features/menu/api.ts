import { apiRequest } from "@/lib/api/client";

import { dropAtlas } from "./drop-atlas";
import type { MenuItem, TopOddWin } from "./types";

// [WEB-PARITY] web-client src/apis/menu/index.tsx `getMenuHeader`.
export const menuApi = {
  /** `result` is a plain array (not paged, despite `size=20`), filtered through `dropAtlas`. */
  async homeMenu(): Promise<MenuItem[]> {
    return dropAtlas((await apiRequest<MenuItem[] | null>("management-service/v1/home-menu/end-user", {
      query: { size: 20 },
    })).result);
  },

  // [WEB-PARITY] web `getTopOddWin`.
  async topOddWin(): Promise<TopOddWin> {
    return (await apiRequest<TopOddWin>("management-service/v1/home-menu/end-user/top-odd-win")).result;
  },
};
