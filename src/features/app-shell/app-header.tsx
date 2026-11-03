import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/features/auth";
import { useGoToLogin, useOpenWebPath } from "@/lib/navigation/use-web-navigation";
import { WEB_PATHS } from "@/lib/navigation/web-routes";
import { useTheme } from "@/theme";

import { useDrawer } from "./drawer-context";
import { Icon } from "./icon";
import { KingOfOddsTicker } from "./king-of-odds-ticker";
import { SubHeader } from "./sub-header";
import { WalletMenu } from "./wallet-menu";

// Global header (web Header, spec Phần B §3.3), used as the Stack `header` of main screens.
// Row 1 (48px): logo · Register/Login or wallet · menu button. Row 2: King of Odds strip, CMS menu.
// [WEB-PARITY] Deposit/bell/gift/avatar are hidden on mobile web (≤899px), so they are not here.
// Collapsing row 2 on scroll only happens on sportsbook routes; it lands with that module.

const logoDark = require("@/assets/images/logo-dark.png");
const logoLight = require("@/assets/images/logo-light.png");

export function AppHeader() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isAuthenticated } = useAuth();
  const { open: openDrawer } = useDrawer();
  const goToLogin = useGoToLogin();
  const openWebPath = useOpenWebPath();
  const small = width <= 379;

  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top, backgroundColor: colors.header, borderBottomColor: colors.border },
      ]}
    >
      <View style={[styles.row, { paddingLeft: 12 + insets.left, paddingRight: 12 + insets.right }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Jwetlakay"
          onPress={() => router.navigate("/")}
          style={styles.logoButton}
        >
          <Image
            source={isDark ? logoDark : logoLight}
            style={small ? styles.logoSmall : styles.logo}
            contentFit="contain"
            contentPosition="left"
          />
        </Pressable>

        {isAuthenticated ? (
          <WalletMenu onDeposit={() => openWebPath(WEB_PATHS.deposit)} />
        ) : (
          <View style={styles.auth}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(WEB_PATHS.register)}
              style={[styles.authButton, { borderColor: colors.borderStrong, borderWidth: 1 }]}
            >
              <ThemedText style={[styles.authText, { color: colors.text }]}>{t("register")}</ThemedText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={goToLogin}
              style={[styles.authButton, { backgroundColor: colors.brand }]}
            >
              <ThemedText style={[styles.authText, { color: colors.onBrand }]}>{t("login")}</ThemedText>
            </Pressable>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("menu")}
          onPress={openDrawer}
          style={[styles.iconButton, { borderColor: colors.border }]}
        >
          <Icon name="menu" size={20} color={colors.text} />
        </Pressable>
      </View>

      <KingOfOddsTicker />
      <SubHeader />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { borderBottomWidth: 1 },
  row: { height: 48, flexDirection: "row", alignItems: "center", gap: 10 },
  logoButton: { marginRight: "auto", flexShrink: 1, minWidth: 0 },
  logo: { height: 23, width: 132 },
  logoSmall: { height: 20, width: 112 },
  auth: { flexDirection: "row", alignItems: "center", gap: 8 },
  authButton: { height: 34, paddingHorizontal: 12, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  authText: { fontSize: 13, fontWeight: "700", letterSpacing: 0.3 },
  iconButton: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
