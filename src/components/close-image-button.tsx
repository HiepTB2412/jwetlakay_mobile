import { Image } from "expo-image";
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";

import { SCRIM } from "@/theme";

// Round close artwork used by the promo popups (web `images.ic_btn_close`, btn_x.png).

const closeImage = require("@/assets/icons/close-round.png");

/** Web `ic_btn_close` with a 2px #ccc ring (`bordered`) or a translucent disc. */
export function CloseImageButton({
  size,
  onPress,
  bordered = true,
  style,
}: {
  size: number;
  onPress: () => void;
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("close")}
      hitSlop={10}
      onPress={onPress}
      style={[
        { width: size, height: size, borderRadius: size / 2 },
        bordered ? { borderWidth: 2, borderColor: SCRIM.closeRing } : { backgroundColor: SCRIM.closeDisc },
        styles.close,
        style,
      ]}
    >
      <Image source={closeImage} style={styles.fill} contentFit="contain" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  close: { overflow: "hidden", alignItems: "center", justifyContent: "center" },
  fill: { width: "100%", height: "100%" },
});
