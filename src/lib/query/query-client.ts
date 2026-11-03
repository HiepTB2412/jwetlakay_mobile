import { QueryClient } from "@tanstack/react-query";

// Defaults copied from the web QueryProvider (spec Phần B §0.2). The web's refetchOnWindowFocus
// is off, so no AppState focus manager is wired up.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Query keys. Everything that belongs to the signed-in account lives under `USER_SCOPE`, so
 * `clearUserQueries()` on logout / session expiry drops it in one call and the next account
 * never sees the previous one's data.
 */
const USER_SCOPE = "user";

export const queryKeys = {
  balance: [USER_SCOPE, "balance"] as const,
  homeMenu: ["home-menu"] as const,
  topOddWin: ["top-odd-win"] as const,
  newsPopup: ["news-popup"] as const,
  luckySpin: [USER_SCOPE, "lucky-spin"] as const,
  luckySpinGuest: ["lucky-spin-guest"] as const,
  luckySpinHistory: (page: number) => [USER_SCOPE, "lucky-spin-history", page] as const,
};

export function clearUserQueries(): void {
  queryClient.removeQueries({ queryKey: [USER_SCOPE] });
}
