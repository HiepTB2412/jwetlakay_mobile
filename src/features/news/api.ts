import { apiRequest } from "@/lib/api/client";

import type { NewsPopupItem } from "./types";

/** web `PopupQueryParams` (src/apis/news/index.ts). The home popup sends none. */
export type NewsPopupQuery = { page?: number; size?: number; type?: string };

export const newsApi = {
  // [WEB-PARITY] web `useGetNewsPopup`: returns `result` as is (an array).
  async popups(params: NewsPopupQuery = {}): Promise<NewsPopupItem[]> {
    return (await apiRequest<NewsPopupItem[]>("management-service/v1/banner/popup/end-user", {
      query: params,
    })).result;
  },
};

/**
 * [WEB-PARITY] web NewsPopupChecker: the popup shows the FIRST item whose type is NEWS or URL.
 * Rendering also requires `image` (PopupShowNews: `isOpen && !!data.image`).
 */
export function findNewsPopup(items: NewsPopupItem[] | null | undefined): NewsPopupItem | null {
  return items?.find((item) => item.type === "NEWS" || item.type === "URL") ?? null;
}
