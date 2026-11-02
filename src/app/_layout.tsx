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
import { useEffect, useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { FONT_FAMILY, fontFamilies, ThemeProvider, useTheme } from "@/theme";

// Keep the splash up until the saved theme and fonts are ready, so the app
// never flashes the wrong colors on launch (spec Phần G §1, §8.3).
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <ThemeProvider>
            <ThemedStack />
          </ThemeProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedStack() {
  const { colors, isDark, ready } = useTheme();
  const [fontsLoaded, fontError] = useFonts(fontFamilies);
  // A font failure falls back to the system font instead of blocking the app.
  const appReady = ready && (fontsLoaded || fontError != null);

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
      />
    </NavigationThemeProvider>
  );
}
