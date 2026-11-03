import { apiRequest } from "@/lib/api/client";

import type { Balance } from "./types";

export const walletApi = {
  async balance(): Promise<Balance> {
    return (await apiRequest<Balance>("transaction/v1/balance/user")).result;
  },
};
