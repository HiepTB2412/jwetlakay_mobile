import { Image } from "expo-image";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { CloseImageButton } from "@/components/close-image-button";
import { useOpenWebPath } from "@/lib/navigation/use-web-navigation";
import { SCRIM } from "@/theme";

import { useNewsPopup } from "./use-news-popup";

// Home news popup (web NewsPopupChecker + PopupShowNews, spec Phần B §6.1). Shows the first
// NEWS/URL banner that has an image, every time the home screen mounts (nothing is stored).
// Nothing renders while loading or on error. The image is tappable only with a `referenceId`.

/** [WEB-PARITY] URL banners: an absolute URL loses its host (always an in-app path). */
function bannerPath(type: string, referenceId: string): string {
  if (type === "NEWS") return `/news/detail/${referenceId}`;
  try {
    const url = new URL(referenceId);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return referenceId;
  }
}

export function NewsPopup() {
  const { t } = useTranslation();
  const { data: item } = useNewsPopup();
  const openWebPath = useOpenWebPath();
  const [dismissed, setDismissed] = useState(false);

  if (!item?.image || dismissed) return null;
  const close = () => setDismissed(true);
  const referenceId = item.referenceId ?? "";

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: SCRIM.popup }]}
        onPress={close}
        accessibilityRole="button"
        accessibilityLabel={t("close")}
      />
      <View style={styles.center} pointerEvents="box-none">
        <View style={styles.content}>
          <Pressable
            disabled={referenceId.length === 0}
            accessibilityRole={referenceId ? "link" : "image"}
            onPress={() => {
              close();
              openWebPath(bannerPath(item.type, referenceId));
            }}
          >
            <Image source={{ uri: item.image }} style={styles.image} contentFit="cover" />
          </Pressable>
          <CloseImageButton size={32} onPress={close} style={styles.close} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", paddingHorizontal: 12 },
  content: { maxHeight: "90%", borderRadius: 4, overflow: "hidden" },
  image: { width: "100%", aspectRatio: 360 / 224 },
  close: { position: "absolute", top: 0, right: 0 },
});
