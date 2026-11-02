import { Text, type TextProps } from "react-native";

import { type, useTheme, type TypeVariant } from "@/theme";

type ThemedTextProps = TextProps & { variant?: TypeVariant };

export function ThemedText({ variant = "body", style, ...props }: ThemedTextProps) {
  const { colors } = useTheme();
  return <Text style={[type[variant], { color: colors.text }, style]} {...props} />;
}
