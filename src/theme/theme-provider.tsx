import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Appearance, useColorScheme } from "react-native";

import { dark, light, type ThemeTokens } from "./tokens";

export type ThemeMode = "light" | "dark";

/** Same key as the web client (`localStorage["jw-theme"]`). */
const STORAGE_KEY = "jw-theme";

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeTokens;
  /** False until the saved choice has been read; keep the splash screen up until then. */
  ready: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  // null = the user never picked a mode, so follow the OS (spec §2, §8.3).
  const [savedMode, setSavedMode] = useState<ThemeMode | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (isThemeMode(value)) setSavedMode(value);
      })
      .catch(() => {
        // Unreadable storage falls back to the OS scheme.
      })
      .finally(() => setReady(true));
  }, []);

  // Keep native UI (keyboard, switches, system header) in the chosen scheme.
  useEffect(() => {
    if (ready) Appearance.setColorScheme(savedMode ?? "unspecified");
  }, [ready, savedMode]);

  const mode: ThemeMode = savedMode ?? (systemScheme === "dark" ? "dark" : "light");

  const setMode = useCallback((next: ThemeMode) => {
    setSavedMode(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // The in-memory choice still applies for this session.
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(mode === "dark" ? "light" : "dark");
  }, [mode, setMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      isDark: mode === "dark",
      colors: mode === "dark" ? dark : light,
      ready,
      setMode,
      toggleTheme,
    }),
    [mode, ready, setMode, toggleTheme],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme() {
  const context = use(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
