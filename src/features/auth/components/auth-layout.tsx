import { Image } from "expo-image";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import { KeyboardFitScrollView } from "@/components/keyboard-fit-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/theme";

const logoDark = require("@/assets/images/logo-dark.png");
const logoLight = require("@/assets/images/logo-light.png");

/**
 * Gap between the end of the form and the keyboard. Larger than the usual 16 because the
 * iOS 26 keyboard's rounded glass top starts slightly above the frame it reports.
 */
const KEYBOARD_GAP = 28;

type AuthLayoutProps = {
  title: string;
  description?: string;
  /** Shows the Back button (left) when set. */
  onBack?: () => void;
  /** Current form step; the keyboard fit is recomputed when it changes. */
  step?: string;
  children: ReactNode;
};

/** X / swipe-back target: previous screen, or Home when the auth screen was opened directly. */
export function closeAuth() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

/**
 * Auth page frame (spec Phần B §1.0): own top bar (Back left, X right), theme logo, title,
 * content centered vertically with a 500px max width. No app header or drawer.
 */
export function AuthLayout({
  title,
  description,
  onBack,
  step,
  children,
}: AuthLayoutProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  // Outside the scroll view so Back / X stay on screen when the form scrolls.
  const topBar = (
    <View style={styles.topBar}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={onBack}
          style={styles.back}
        >
          <SymbolView
            name={{
              ios: "chevron.left",
              android: "arrow_back",
              web: "arrow_back",
            }}
            size={22}
            tintColor={colors.text}
          />
          <ThemedText variant="link" style={{ color: colors.text }}>
            {t("back")}
          </ThemedText>
        </Pressable>
      ) : (
        <View />
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("close")}
        hitSlop={8}
        onPress={closeAuth}
      >
        <SymbolView
          name={{ ios: "xmark", android: "close", web: "close" }}
          size={22}
          tintColor={colors.text}
        />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      style={[styles.screen, { backgroundColor: colors.bg }]}
    >
      {topBar}
      {/* Keeps logo, title and the whole form above the keyboard when they fit (see component). */}
      <KeyboardFitScrollView
        fitKey={step}
        gap={KEYBOARD_GAP}
        contentStyle={styles.body}
      >
        <View style={styles.content}>
          <Pressable
            accessibilityRole="imagebutton"
            onPress={() => router.replace("/")}
            style={styles.logoWrap}
          >
            <Image
              source={isDark ? logoDark : logoLight}
              contentFit="contain"
              style={styles.logo}
            />
          </Pressable>
          <ThemedText
            variant="title"
            accessibilityRole="header"
            style={styles.title}
          >
            {title}
          </ThemedText>
          {description ? (
            <ThemedText style={[styles.description, { color: colors.muted }]}>
              {description}
            </ThemedText>
          ) : null}
          <View style={styles.form}>{children}</View>
        </View>
      </KeyboardFitScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: { flexDirection: "row", alignItems: "center", gap: 4 },
  screen: { flex: 1 },
  body: { padding: 16 },
  content: { width: "100%", maxWidth: 500, alignSelf: "center" },
  logoWrap: { alignSelf: "center", marginBottom: 28 },
  // 489×48 source; 32px high per spec, capped at 220px wide.
  logo: { height: 32, width: 220, maxWidth: "100%" },
  title: { textAlign: "center", marginBottom: 8 },
  description: { textAlign: "center", marginBottom: 8 },
  form: { gap: 14, marginTop: 12 },
});
