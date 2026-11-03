import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query/query-client";

import { menuApi } from "./api";

/**
 * "King of Odds" ticker data (spec Phần B §3.5). Public. [WEB-PARITY] Same cache options as
 * web-client src/components/layout/Header/noti.winning.tsx: 5 min stale, 10 min gc, no refetch
 * on mount or focus.
 */
export function useTopOddWin() {
  return useQuery({
    queryKey: queryKeys.topOddWin,
    queryFn: menuApi.topOddWin,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
