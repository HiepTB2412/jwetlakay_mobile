import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

import { radius, sizes, useTheme } from "@/theme";

import { ThemedText } from "./themed-text";

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline";
  /** Shows a spinner and blocks presses (spec Phần B §1.1 LinearButton). */
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Full-width form button: 50px high, radius 12, 16px label (spec Phần G §6). */
export function Button({ title, onPress, variant = "primary", loading = false, disabled = false, style }: ButtonProps) {
  const { colors } = useTheme();
  // Pressed state is tracked here because NativeWind's Pressable interop drops a
  // function-form `style` ({ pressed }) => …, leaving the button unstyled.
  const [pressed, setPressed] = useState(false);
  const inactive = disabled || loading;
  const primary = variant === "primary";
  const labelColor = primary ? colors.onBrand : colors.brand;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.base,
        primary
          ? { backgroundColor: pressed ? colors.brandPressed : colors.brand }
          : { borderColor: colors.brand, borderWidth: sizes.inputBorder, backgroundColor: pressed ? colors.brandSoft : "transparent" },
        disabled && !loading && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <ThemedText variant="button" style={{ color: labelColor }}>
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: sizes.button,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  disabled: { opacity: 0.5 },
});
