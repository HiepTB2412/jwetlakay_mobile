import { Image, type ImageSource } from "expo-image";
import { Pressable, StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { LUCKY_SPIN } from "@/theme";

// Building blocks shared by the Lucky Spin popups (web PopupShowLuckySpin / PopupShowHalfLuckySpin).

/** CSS `clamp(min, vw%, max)` against the window width. */
export function clampVw(windowWidth: number, min: number, vw: number, max: number): number {
  return Math.min(max, Math.max(min, (windowWidth * vw) / 100));
}

/** Artwork button with a centered label on top (web SpinButton / PrizeButton). */
export function ImageButton({
  source,
  aspectRatio,
  width,
  label,
  labelStyle,
  disabled,
  onPress,
  style,
}: {
  source: ImageSource;
  aspectRatio: number;
  width: number;
  label: string;
  labelStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      // Plain style (not a function): NativeWind's Pressable interop drops function styles.
      style={[{ width, aspectRatio }, disabled && styles.disabled, style]}
    >
      <Image source={source} style={styles.fill} contentFit="fill" />
      <View style={styles.labelWrap} pointerEvents="none">
        <ThemedText style={[styles.label, labelStyle]}>{label}</ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { width: "100%", height: "100%" },
  disabled: { opacity: 0.9 },
  labelWrap: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" },
  // Web SpinButtonText: dark brown on the gold artwork.
  label: { color: LUCKY_SPIN.tryText, fontSize: 16, fontWeight: "600", textTransform: "uppercase" },
});
