import { useState, type ComponentRef, type Ref } from "react";
import { Platform, StyleSheet, TextInput, View } from "react-native";

import { radius, sizes, useTheme } from "@/theme";

import { ThemedText } from "./themed-text";

export const OTP_LENGTH = 6;

type OtpFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  autoFocus?: boolean;
  editable?: boolean;
  accessibilityLabel?: string;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

/**
 * Six digit boxes backed by one transparent TextInput laid over them, so typing, paste
 * and SMS autofill (iOS oneTimeCode / Android sms-otp) all work natively.
 */
export function OtpField({
  value,
  onChangeText,
  error,
  autoFocus,
  editable = true,
  accessibilityLabel,
  ref,
}: OtpFieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const activeIndex = Math.min(value.length, OTP_LENGTH - 1);

  return (
    <View style={styles.wrapper}>
      <View>
        <View style={styles.row}>
          {Array.from({ length: OTP_LENGTH }, (_, index) => {
            const active = focused && index === activeIndex;
            return (
              <View
                key={index}
                style={[
                  styles.box,
                  {
                    backgroundColor: colors.input,
                    borderColor: error ? colors.live : active ? colors.brand : colors.borderStrong,
                    borderWidth: active ? sizes.focusBorder : sizes.inputBorder,
                  },
                ]}
              >
                <ThemedText variant="title">{value[index] ?? ""}</ThemedText>
              </View>
            );
          })}
        </View>
        <TextInput
          ref={ref}
          value={value}
          onChangeText={(text) => onChangeText(text.replace(/\D/g, "").slice(0, OTP_LENGTH))}
          maxLength={OTP_LENGTH}
          keyboardType="number-pad"
          {...Platform.select({
            ios: { textContentType: "oneTimeCode" as const },
            default: { autoComplete: "sms-otp" as const },
          })}
          autoFocus={autoFocus}
          editable={editable}
          caretHidden
          accessibilityLabel={accessibilityLabel}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.hiddenInput}
        />
      </View>
      {error ? (
        <ThemedText variant="caption" style={{ color: colors.live }}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  row: { flexDirection: "row", gap: 8 },
  box: {
    flex: 1,
    height: sizes.input,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  hiddenInput: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    color: "transparent",
    opacity: 0.02,
  },
});
