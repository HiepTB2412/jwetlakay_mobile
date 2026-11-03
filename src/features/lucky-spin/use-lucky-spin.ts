import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";

import { useAuth } from "@/features/auth";
import { queryKeys } from "@/lib/query/query-client";

import { luckySpinApi } from "./api";
import { luckySpinPreview } from "./preview";
import type { LuckySpinList, LuckySpinReward, Prize } from "./types";

/**
 * Rewards and turns for the floating button and wheels (web ShowLuckySpin `:66-117`): the
 * signed-in list or the guest list. Icons are prefetched before the data is used, like the web
 * waits for every icon to load (or fail) before showing the prizes.
 */
export function useLuckySpinList() {
  const member = useLuckySpinMember();
  return useQuery({
    queryKey: member ? queryKeys.luckySpin : queryKeys.luckySpinGuest,
    queryFn: async (): Promise<LuckySpinList> => {
      const list = member ? await luckySpinApi.list() : await luckySpinApi.listNotRegistered();
      const icons = list.spinRes.map((reward) => reward.icon).filter(Boolean);
      if (icons.length > 0) await Image.prefetch(icons).catch(() => false);
      return list;
    },
  });
}

/** Signed-in Lucky Spin UI: a real session, or the dev preview in "member" mode. */
export function useLuckySpinMember(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated || luckySpinPreview === "member";
}

/** Web prize mapping: `color = palette[index % palette.length]`. */
export function toPrizes(rewards: LuckySpinReward[], palette: readonly string[]): Prize[] {
  return rewards.map((reward, index) => ({
    id: reward.id,
    name: reward.name,
    icon: reward.icon,
    description: reward.description,
    color: palette[index % palette.length],
  }));
}
