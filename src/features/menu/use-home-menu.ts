import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query/query-client";

import { menuApi } from "./api";

/**
 * CMS main menu (spec Phần B §3.4b). Decides the home page (first item with an internal link)
 * and whether the sportsbook is enabled (an item with code SPORTSBOOK). Public: no login needed.
 */
export function useHomeMenu() {
  return useQuery({ queryKey: queryKeys.homeMenu, queryFn: menuApi.homeMenu });
}
