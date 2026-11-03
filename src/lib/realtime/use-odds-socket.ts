import { useEffect, useSyncExternalStore } from "react";

import { oddsSocket, type OddsSocketStatus, type RoomType } from "./odds-socket";

/** Connection + staleness for the "feed disconnected / stale" banners (spec Phần C §0.4). */
export function useOddsSocketStatus(): OddsSocketStatus {
  return useSyncExternalStore(oddsSocket.subscribeStatus, oddsSocket.getStatus, oddsSocket.getStatus);
}

/**
 * Holds the given rooms for `matchId` while mounted and `enabled` (e.g. the row is on screen).
 * `priority` is for match detail and Bet Slip.
 */
export function useOddsRooms(
  matchId: string | number | null | undefined,
  types: readonly RoomType[],
  { priority = false, enabled = true }: { priority?: boolean; enabled?: boolean } = {},
): void {
  // Joined so callers can pass a fresh array literal each render.
  const typeList = types.join(",");

  useEffect(() => {
    if (!enabled || matchId == null || matchId === "" || !typeList) return;
    const releases = (typeList.split(",") as RoomType[]).map((type) => oddsSocket.acquire(type, matchId, priority));
    return () => releases.forEach((release) => release());
  }, [matchId, typeList, priority, enabled]);
}
