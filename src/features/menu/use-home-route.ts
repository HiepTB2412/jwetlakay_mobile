import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";

import { pickHome, type HomeRoute } from "./home-route";
import { useHomeMenu } from "./use-home-menu";

// Home page chosen by the CMS (web hooks/useHomeRoute.ts, spec Phần B §3.8): the first menu
// item with an in-app link, cached as `home-route` so the next launch knows it before the menu
// loads. `ready` once the menu, the cache or a menu error is in.

const CACHE_KEY = "home-route";

export function useHomeRoute() {
  const { data, isSuccess, isError } = useHomeMenu();
  const fromMenu = useMemo(() => (isSuccess ? pickHome(data ?? []) : undefined), [isSuccess, data]);

  // undefined = still reading the cache; null = nothing cached.
  const [cached, setCached] = useState<HomeRoute | null | undefined>(undefined);
  useEffect(() => {
    AsyncStorage.getItem(CACHE_KEY)
      .then((raw) => {
        const value = raw ? (JSON.parse(raw) as Partial<HomeRoute>) : null;
        setCached(value && typeof value === "object" ? { code: value.code ?? null, path: value.path ?? null } : null);
      })
      .catch(() => setCached(null));
  }, []);

  const code = fromMenu?.code;
  const path = fromMenu?.path;
  useEffect(() => {
    if (code === undefined) return;
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ code, path })).catch(() => {});
  }, [code, path]);

  const home = fromMenu ?? cached ?? null;
  return { home, homeCode: home?.code ?? null, ready: Boolean(fromMenu || cached || isError) };
}
