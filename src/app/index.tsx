import { router } from "expo-router";
import { Alert, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/button";
import { Screen } from "@/components/screen";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/features/auth";

// Temporary home: entry points for login/register/logout until the CMS-driven home,
// Header and Drawer (spec Phần B §3.3, §3.6, §3.8) are built.
export default function Index() {
  const { t } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();

  const confirmLogout = () =>
    Alert.alert(t("logOut"), t("logoutDescription"), [
      { text: t("close"), style: "cancel" },
      { text: t("ok"), style: "destructive", onPress: () => void logout() },
    ]);

  return (
    <Screen contentContainerStyle={styles.container}>
      {isAuthenticated ? (
        <>
          <ThemedText variant="title">{t("hello", { name: user?.fullName || user?.username || "" })}</ThemedText>
          <Button title={t("logOut")} variant="outline" onPress={confirmLogout} />
        </>
      ) : (
        <View style={styles.actions}>
          <Button title={t("login")} onPress={() => router.push("/auth/login")} />
          <Button title={t("register")} variant="outline" onPress={() => router.push("/auth/register")} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, justifyContent: "center" },
  actions: { gap: 12 },
});
