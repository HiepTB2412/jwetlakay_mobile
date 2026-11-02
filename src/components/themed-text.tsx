import { cssInterop } from "nativewind";
import { Text, type TextProps } from "react-native";

import { type, useTheme, type TypeVariant } from "@/theme";

type ThemedTextProps = TextProps & { variant?: TypeVariant };

/**
 * The only text primitive screens should use: Inter + theme text color by default.
 * `className` / `style` override the defaults, e.g. `className="text-live font-bold"`.
 */
export function ThemedText({ variant = "body", style, ...props }: ThemedTextProps) {
  const { colors } = useTheme();
  return <Text style={[type[variant], { color: colors.text }, style]} {...props} />;
}

// Remap className into `style` so class styles land after the defaults above and
// win over them on native (NativeWind "remapped styles" specificity).
cssInterop(ThemedText, { className: "style" });
