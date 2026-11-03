import { router } from "expo-router";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";

import { useToast } from "@/components/toast";
import { luckySpinApi } from "@/features/lucky-spin/api";
import { markLuckySpinVisited, refreshLuckySpinVisited } from "@/features/lucky-spin/visited";
import { applyUserLanguage } from "@/i18n";
import { onSessionExpired, SessionExpiredError } from "@/lib/api/client";
import { apiErrorMessage, isAuthRejection } from "@/lib/api/errors";
import { clearUserQueries } from "@/lib/query/query-client";
import { tokenStore } from "@/lib/session/token-store";

import { authApi } from "./api";
import { rememberedLogin } from "./remembered-login";
import type { User } from "./types";

// Session lifecycle (web AuthContext.tsx, spec Phần B §4.1–4.3).

/** Splash is released after this even if account/info is still pending (spec Phần B §4.1). */
const INIT_TIMEOUT_MS = 3000;

type LoginInput = { phone: string; password: string; remember: boolean };

type AuthContextValue = {
  /** True until stored tokens are read and account/info settles (or 3s pass). */
  isInitializing: boolean;
  isAuthenticated: boolean;
  user: User | null;
  /**
   * Logs in by phone + password. Rejects with ApiError when the credentials are refused;
   * resolves `false` if login worked but the profile could not be loaded (a toast is shown).
   */
  login: (input: LoginInput) => Promise<boolean>;
  logout: () => Promise<void>;
  /** Reloads account/info, e.g. after a profile change. */
  getUser: () => Promise<void>;
  updateUser: (patch: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function goHome() {
  if (router.canDismiss()) router.dismissAll();
  router.replace("/");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const { t } = useTranslation();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const loadUser = useCallback(async () => {
    const info = await authApi.accountInfo();
    setUser(info);
    applyUserLanguage(info.language);
    return info;
  }, []);

  // Startup: restore the stored session.
  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => active && setIsInitializing(false), INIT_TIMEOUT_MS);

    (async () => {
      const tokens = await tokenStore.hydrate();
      if (!tokens) {
        await tokenStore.clear();
        return;
      }
      if (active) setIsAuthenticated(true);
      try {
        // React Query `retry: 1` on the web: one more try for network / server errors.
        await loadUser().catch((error) => {
          if (isAuthRejection(error) || error instanceof SessionExpiredError) throw error;
          return loadUser();
        });
        void refreshLuckySpinVisited();
      } catch (error) {
        if (!active) return;
        if (isAuthRejection(error) || error instanceof SessionExpiredError) {
          await tokenStore.clear();
        }
        // Network failure keeps the tokens so the next launch can retry, but the user is
        // treated as a guest for now (same as the web).
        setIsAuthenticated(false);
        setUser(null);
      }
    })().finally(() => {
      clearTimeout(timeout);
      if (active) setIsInitializing(false);
    });

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [loadUser]);

  // Refresh token rejected by the server → back to guest on Home.
  useEffect(
    () =>
      onSessionExpired(() => {
        clearUserQueries();
        setIsAuthenticated(false);
        setUser(null);
        goHome();
      }),
    [],
  );

  const login = useCallback(
    async ({ phone, password, remember }: LoginInput) => {
      const tokens = await authApi.login({ username: phone, password });
      await tokenStore.set(tokens);
      clearUserQueries();
      setIsAuthenticated(true);

      if (remember) await rememberedLogin.save(phone, password);
      else await rememberedLogin.clear();

      try {
        await loadUser();
        // Web AuthContext after login: mark the Lucky Spin visit and load the list (result unused).
        void markLuckySpinVisited();
        luckySpinApi.list().catch(() => {});
        return true;
      } catch (error) {
        toast.error(apiErrorMessage(error) ?? t("something_went_wrong"));
        return false;
      }
    },
    [loadUser, toast, t],
  );

  const logout = useCallback(async () => {
    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) return;
    // Revoke in the background; the local session ends immediately either way.
    authApi.logout(refreshToken).catch(() => {});
    await tokenStore.clear();
    // The web keeps the cached balance until the next login; dropping it now is equivalent
    // and keeps the previous account's figures out of memory.
    clearUserQueries();
    setIsAuthenticated(false);
    setUser(null);
    goHome();
  }, []);

  const getUser = useCallback(async () => {
    try {
      await loadUser();
      void refreshLuckySpinVisited();
    } catch {
      // Keep the current profile.
    }
  }, [loadUser]);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((previous) => (previous ? { ...previous, ...patch } : previous));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ isInitializing, isAuthenticated, user, login, logout, getUser, updateUser }),
    [isInitializing, isAuthenticated, user, login, logout, getUser, updateUser],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const context = use(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
