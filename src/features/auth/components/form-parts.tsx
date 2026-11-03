import { router, type Href } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { radius, useTheme } from "@/theme";

/** Red API error banner shown above the submit button (spec Phần B §0.4). */
export function FormError({ message }: { message?: string | null }) {
  const { colors } = useTheme();
  if (!message) return null;
  return (
    <View accessibilityRole="alert" style={[styles.banner, { backgroundColor: colors.liveSoft }]}>
      <ThemedText variant="caption" style={{ color: colors.live }}>
        {message}
      </ThemedText>
    </View>
  );
}

/** "Account temporarily locked" box for login errorCode 01007 / 01023 (spec Phần B §1.1). */
export function AccountLockedNotice() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View
      accessibilityRole="alert"
      style={[styles.banner, styles.locked, { backgroundColor: colors.liveSoft, borderColor: colors.live }]}
    >
      <View style={styles.lockedTitle}>
        <SymbolView
          name={{ ios: "exclamationmark.triangle.fill", android: "warning", web: "warning" }}
          size={18}
          tintColor={colors.live}
        />
        <ThemedText variant="link" style={{ color: colors.live }}>
          {t("account_locked_title")}
        </ThemedText>
      </View>
      <ThemedText variant="caption">
        {t("account_locked_msg_prefix")}{" "}
        <ThemedText
          variant="caption"
          accessibilityRole="link"
          onPress={() => router.push("/auth/forgot-password")}
          style={[styles.inlineLink, { color: colors.brand }]}
        >
          {t("forgotPasswordLink")}
        </ThemedText>{" "}
        {t("account_locked_msg_suffix")}
      </ThemedText>
    </View>
  );
}

type ResendOtpProps = {
  remaining: number;
  sending: boolean;
  onResend: () => void;
  /**
   * Text while counting down: login/forgot show "Resend after (Ns)", register shows
   * "Resend verification code (Ns)" (spec Phần B §1.2).
   */
  countdownLabel?: "resendAfter" | "resendVerificationCode";
};

/** "Didn't receive the code?" + resend link with a 60s countdown. */
export function ResendOtp({ remaining, sending, onResend, countdownLabel = "resendAfter" }: ResendOtpProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const disabled = remaining > 0 || sending;

  return (
    <View style={styles.resendRow}>
      <ThemedText variant="caption" style={{ color: colors.muted, flexShrink: 1 }}>
        {t("notGetOtp")}
      </ThemedText>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} hitSlop={8} onPress={onResend}>
        <ThemedText variant="link" style={{ color: disabled ? colors.muted : colors.brand }}>
          {remaining > 0 ? `${t(countdownLabel)} (${remaining}s)` : t("resendVerificationCode")}
        </ThemedText>
      </Pressable>
    </View>
  );
}

/** "Don't have an account? Register now" style footer line. */
export function AuthSwitchLink({ prompt, action, href }: { prompt: string; action: string; href: Href }) {
  const { colors } = useTheme();
  return (
    <View style={styles.switchRow}>
      <ThemedText style={{ color: colors.muted }}>{prompt} </ThemedText>
      <Pressable accessibilityRole="link" hitSlop={8} onPress={() => router.replace(href)}>
        <ThemedText variant="link" style={{ color: colors.brand }}>
          {action}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 12 },
  locked: { borderWidth: 1, gap: 6 },
  lockedTitle: { flexDirection: "row", alignItems: "center", gap: 6 },
  inlineLink: { fontWeight: "600" },
  resendRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  switchRow: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap", marginTop: 4 },
});
