import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { queryKeys } from "@/lib/query/query-client";

import { walletApi } from "./api";

/**
 * Wallet balance for the header, drawer and Bet Slip (spec Phần B §3.4). Runs only while
 * signed in; callers refetch after a bet, cashout, deposit or withdrawal.
 */
export function useBalance() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: queryKeys.balance,
    queryFn: walletApi.balance,
    enabled: isAuthenticated,
  });
}
