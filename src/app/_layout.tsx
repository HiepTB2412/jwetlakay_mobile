import "../global.css";

import { useFonts } from "expo-font";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
  Stack,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ToastProvider } from "@/components/toast";
import { AuthProvider, useAuth } from "@/features/auth";
import { languageReady } from "@/i18n";
import { FONT_FAMILY, fontFamilies, ThemeProvider, useTheme } from "@/theme";

// Keep the splash up until the saved theme, fonts, language and session are ready, so the
// app never flashes the wrong colors or the guest UI on launch (spec Phần G §8.3, Phần B §1.5).
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                <ThemedStack />
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedStack() {
  const { colors, isDark, ready } = useTheme();
  const { t } = useTranslation();
  const { isInitializing } = useAuth();
  const [fontsLoaded, fontError] = useFonts(fontFamilies);
  const [languageLoaded, setLanguageLoaded] = useState(false);
  // A font failure falls back to the system font instead of blocking the app.
  const appReady = ready && languageLoaded && !isInitializing && (fontsLoaded || fontError != null);

  useEffect(() => {
    languageReady.then(() => setLanguageLoaded(true));
  }, []);

  useEffect(() => {
    if (appReady) SplashScreen.hide();
  }, [appReady]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg);
  }, [colors.bg]);

  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.brand,
        background: colors.bg,
        card: colors.header,
        text: colors.text,
        border: colors.border,
        notification: colors.live,
      },
    };
  }, [isDark, colors]);

  if (!appReady) return null;

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      {/* iOS 26 defaults to a transparent Liquid Glass header that content
          scrolls under; keep it opaque so screens start below the header. */}
      <Stack
        screenOptions={{
          headerTransparent: false,
          headerTitleStyle: { fontFamily: FONT_FAMILY, fontWeight: "600" },
        }}
      >
        <Stack.Screen name="index" options={{ title: t("home") }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="fb" options={{ headerShown: false }} />
        <Stack.Screen name="sms" options={{ headerShown: false }} />
        <Stack.Screen name="gg" options={{ headerShown: false }} />
      </Stack>
    </NavigationThemeProvider>
  );
}
