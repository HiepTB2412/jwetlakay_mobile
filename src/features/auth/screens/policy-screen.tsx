import { router, Stack, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, type WebViewNavigation } from "react-native-webview";

import { Button } from "@/components/button";
import { ThemedText } from "@/components/themed-text";
import { apiErrorMessage } from "@/lib/api/errors";
import { useTheme, type ThemeTokens } from "@/theme";

import { authApi, POLICY_TYPES, type PolicyType } from "../api";

// Terms of use / Privacy policy (spec Phần B §2.4): full-screen, CMS HTML, "I understand".

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; html: string | null };

function wrapHtml(content: string, colors: ThemeTokens) {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>
  body{margin:0;padding:16px;font-family:-apple-system,Roboto,"Segoe UI",sans-serif;font-size:14px;line-height:1.55;color:${colors.text};background:${colors.bg};word-wrap:break-word}
  a{color:${colors.brand}} img,table{max-width:100%;height:auto}
</style></head><body>${content}</body></html>`;
}

export function PolicyScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type?: string }>();
  const type: PolicyType = POLICY_TYPES.includes(params.type as PolicyType)
    ? (params.type as PolicyType)
    : "TERMS_OR_USER";

  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    authApi
      .getPolicyContent(type, i18n.language)
      .then((html) => active && setState({ status: "ready", html }))
      .catch(
        (error) =>
          active &&
          setState({
            status: "error",
            message: apiErrorMessage(error) ?? t("something_went_wrong"),
          }),
      );
    return () => {
      active = false;
    };
  }, [type, i18n.language, t, attempt]);

  const retry = () => {
    setState({ status: "loading" });
    setAttempt((value) => value + 1);
  };

  const source = useMemo(
    () =>
      state.status === "ready" && state.html
        ? { html: wrapHtml(state.html, colors) }
        : null,
    [state, colors],
  );

  // CMS content stays inside the inline document; links open in the system browser
  // so untrusted pages never load inside the app.
  const onNavigate = useCallback((request: WebViewNavigation) => {
    if (request.url.startsWith("about:") || request.url.startsWith("data:"))
      return true;
    if (/^https?:\/\//i.test(request.url))
      WebBrowser.openBrowserAsync(request.url).catch(() => {});
    return false;
  }, []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.bg, paddingBottom: insets.bottom + 16 },
      ]}
    >
      <Stack.Screen
        options={{
          title:
            type === "TERMS_OR_USER" ? t("termsOfUse") : t("privacyPolicy"),
        }}
      />

      <View style={styles.body}>
        {state.status === "loading" ? (
          <ActivityIndicator style={styles.center} color={colors.brand} />
        ) : state.status === "error" ? (
          <View style={[styles.center, styles.message]}>
            <ThemedText style={{ textAlign: "center", color: colors.muted }}>
              {state.message}
            </ThemedText>
            <Button
              title={t("retry")}
              variant="outline"
              onPress={retry}
              style={styles.retry}
            />
          </View>
        ) : source ? (
          <WebView
            source={source}
            originWhitelist={["about:*", "data:*"]}
            onShouldStartLoadWithRequest={onNavigate}
            javaScriptEnabled={false}
            setSupportMultipleWindows={false}
            style={{ backgroundColor: colors.bg }}
          />
        ) : (
          <ThemedText
            style={[
              styles.center,
              { textAlign: "center", color: colors.muted },
            ]}
          >
            {t("noContent")}
          </ThemedText>
        )}
      </View>

      <Button
        title={t("iUnderstand")}
        onPress={() => router.back()}
        style={styles.confirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1 },
  center: { flex: 1, alignSelf: "center", justifyContent: "center" },
  message: { gap: 16, paddingHorizontal: 24 },
  retry: { minWidth: 160 },
  confirm: { marginHorizontal: 16, marginTop: 12 },
});
