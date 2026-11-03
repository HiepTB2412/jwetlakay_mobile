import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query/query-client";

import { findNewsPopup, newsApi } from "./api";

/**
 * Home-page news popup (spec Phần B §6.1). Public, not keyed by language or login, default cache
 * options — [WEB-PARITY] same as web `["get-news-popup"]`. Returns the item to show, or null.
 * On loading or error the web renders nothing; callers should do the same.
 */
export function useNewsPopup() {
  return useQuery({
    queryKey: queryKeys.newsPopup,
    queryFn: () => newsApi.popups({}),
    select: findNewsPopup,
  });
}
