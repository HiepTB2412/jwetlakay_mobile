import { router, useGlobalSearchParams, usePathname, type Href } from "expo-router";
import { useCallback, useMemo } from "react";
import { Linking } from "react-native";
import { useTranslation } from "react-i18next";

import { useToast } from "@/components/toast";

import { resolveWebTarget, WEB_PATHS } from "./web-routes";

/** Current path with its query, the web's `pathname + search` (used as login `returnTo`). */
export function useCurrentPath(): string {
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  return useMemo(() => {
    const query = Object.entries(params)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join("&");
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, params]);
}

/**
 * Opens a web path / URL: in-app route when the screen exists, the browser for other sites,
 * otherwise a "coming soon" toast.
 */
export function useOpenWebPath() {
  const toast = useToast();
  const { t } = useTranslation();

  return useCallback(
    (target: string, options: { replace?: boolean } = {}) => {
      const resolved = resolveWebTarget(target);
      if (resolved.kind === "route") {
        if (options.replace) router.replace(resolved.href);
        else router.push(resolved.href);
      } else if (resolved.kind === "external") {
        Linking.openURL(resolved.url).catch(() => toast.error(t("something_went_wrong")));
      } else {
        if (__DEV__) console.info(`[nav] no screen yet for ${resolved.path}`);
        toast.info(t("featureComingSoon"));
      }
    },
    [toast, t],
  );
}

/** Web `setReturnUrl(pathname + search)` + navigate to login. */
export function useGoToLogin() {
  const currentPath = useCurrentPath();
  return useCallback(() => {
    const href: Href = { pathname: WEB_PATHS.login, params: { returnTo: currentPath } };
    router.push(href);
  }, [currentPath]);
}
