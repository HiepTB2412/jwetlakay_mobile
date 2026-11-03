import type { Paginated } from "@/lib/api/client";

import type { LuckySpinHistoryItem, LuckySpinList, LuckySpinReward } from "./types";

// Dev-only Lucky Spin preview, to check the UI while production has no prizes configured.
// Set EXPO_PUBLIC_LUCKY_SPIN_PREVIEW in .env.local:
//   guest  → sample prizes with the real sign-in state (guest wheel when logged out)
//   member → sample prizes and the signed-in wheel even when logged out
// Nothing here reaches the server: list, spin and history return sample data; each spin uses
// one of today's turns so "Out of spin" can be seen. Ignored in release builds (`__DEV__`).

const RAW = process.env.EXPO_PUBLIC_LUCKY_SPIN_PREVIEW;

export const luckySpinPreview: "guest" | "member" | null =
  __DEV__ && RAW ? (RAW.trim() === "member" ? "member" : "guest") : null;

const FLAGS = ["ht", "us", "fr", "ca", "br", "gb", "jp", "de"];
const NAMES = ["50 HTG", "Free Bet 20", "100 HTG", "Bonus 5%", "500 HTG", "1 Turn", "10 HTG", "Jackpot"];

const REWARDS: LuckySpinReward[] = FLAGS.map((flag, index) => ({
  id: `preview-${index}`,
  name: NAMES[index],
  description: "",
  icon: `https://flagcdn.com/w80/${flag}.png`,
  startTime: "",
  endTime: "",
  item: null,
  itemValue: index % 2 === 0 ? 50 * (index + 1) : 0,
  typeItem: "GOLD",
  transactionId: null,
}));

const turns = { today: 3, tomorrow: 2 };

export function previewList(member: boolean): LuckySpinList {
  // Guest list: five prizes and no turns, like production's guest endpoint shape.
  return member
    ? { spinRes: REWARDS, turnToDay: turns.today, turnTomorrow: turns.tomorrow }
    : { spinRes: REWARDS.slice(0, 5), turnToDay: 0, turnTomorrow: 0 };
}

export function previewSpin(member: boolean): LuckySpinReward {
  if (member) {
    if (turns.today <= 0) throw new Error("Out of spin");
    turns.today -= 1;
  }
  const pool = member ? REWARDS : REWARDS.slice(0, 5);
  const reward = pool[Math.floor(Math.random() * pool.length)];
  return { ...reward, transactionId: `preview-tx-${Date.now()}` };
}

const STATUSES = ["REWARDED", "FAIL", "REWARDED_PENDING"];
const WALLETS = ["GOLD", "POINT", "TURN_GAME", "FREE_BET", "COMMISSION"];
const HISTORY_TOTAL = 26;

export function previewHistory(page: number, size: number): Paginated<LuckySpinHistoryItem> {
  const start = (page - 1) * size;
  const count = Math.max(0, Math.min(size, HISTORY_TOTAL - start));
  return {
    data: Array.from({ length: count }, (_, offset) => {
      const n = start + offset;
      return {
        createdAt: new Date(Date.now() - n * 86_400_000).toISOString(),
        luckySpinName: NAMES[n % NAMES.length],
        rewardValue: 10 * (n + 1),
        rewardWallet: WALLETS[n % WALLETS.length],
        status: STATUSES[n % STATUSES.length],
      };
    }),
    pageNumber: page - 1,
    pageSize: size,
    totalElements: HISTORY_TOTAL,
    totalPages: Math.ceil(HISTORY_TOTAL / size),
  };
}
