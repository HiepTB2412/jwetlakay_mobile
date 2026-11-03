import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { SCRIM, useTheme } from "@/theme";

import { Button } from "./button";
import { ThemedText } from "./themed-text";

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Shared confirm dialog (web ConfirmModal, spec Phần B §2.6): centered title, muted description,
 * [Close outline] [OK solid]. Tapping the backdrop or Android back cancels.
 * The web also posts `{logout:true}` to game iframes on OK; the app has no iframes yet.
 */
export function ConfirmModal({ visible, title, description, onConfirm, onCancel }: ConfirmModalProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel} accessibilityRole="button" accessibilityLabel={t("close")}>
        {/* Inner Pressable swallows taps so only the backdrop cancels. */}
        <Pressable
          accessibilityViewIsModal
          style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <ThemedText variant="title" style={styles.center}>
            {title}
          </ThemedText>
          <ThemedText style={[styles.center, styles.description, { color: colors.muted }]}>{description}</ThemedText>
          <View style={styles.actions}>
            <Button title={t("close")} variant="outline" onPress={onCancel} style={styles.action} />
            <Button title={t("ok")} onPress={onConfirm} style={styles.action} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "center", padding: 16, backgroundColor: SCRIM.dialog },
  dialog: { alignSelf: "center", width: "100%", maxWidth: 440, padding: 22, borderRadius: 18, borderWidth: 1, gap: 12 },
  center: { textAlign: "center" },
  description: { fontSize: 14.5 },
  actions: { flexDirection: "row", gap: 12, marginTop: 8 },
  action: { flex: 1 },
});
