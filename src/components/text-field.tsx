import { SymbolView } from "expo-symbols";
import { useState, type ComponentRef, type ReactNode, type Ref } from "react";
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { useTranslation } from "react-i18next";

import { radius, sizes, type, useTheme } from "@/theme";

import { ThemedText } from "./themed-text";

/** Instance behind the shared inputs' `ref` (focus, blur, clear). */
export type TextFieldRef = ComponentRef<typeof TextInput>;

export type TextFieldProps = TextInputProps & {
  /** Shown under the field in the error color; also turns the border red. */
  error?: string;
  left?: ReactNode;
  right?: ReactNode;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

/**
 * Themed input: 52px high, radius 12, 1.5px border, brand border on focus,
 * `live` border on error (spec Phần G §6).
 */
export function TextField({ error, left, right, editable = true, style, onFocus, onBlur, ref, ...props }: TextFieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.live : focused ? colors.brand : colors.borderStrong;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.field,
          {
            borderColor,
            borderWidth: focused ? sizes.focusBorder : sizes.inputBorder,
            backgroundColor: colors.input,
            opacity: editable ? 1 : 0.6,
          },
        ]}
      >
        {left}
        <TextInput
          ref={ref}
          editable={editable}
          placeholderTextColor={colors.hint}
          selectionColor={colors.brand}
          cursorColor={colors.brand}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[styles.input, { color: colors.text }, style]}
          {...props}
        />
        {right}
      </View>
      {error ? (
        <ThemedText variant="caption" style={{ color: colors.live }}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

/** Secure input with a show/hide toggle. */
export function PasswordField(props: Omit<TextFieldProps, "secureTextEntry" | "right">) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      autoCapitalize="none"
      autoCorrect={false}
      {...props}
      secureTextEntry={!visible}
      right={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? t("hidePassword") : t("showPassword")}
          hitSlop={8}
          onPress={() => setVisible((v) => !v)}
          style={styles.adornment}
        >
          <SymbolView
            name={
              visible
                ? { ios: "eye.slash", android: "visibility_off", web: "visibility_off" }
                : { ios: "eye", android: "visibility", web: "visibility" }
            }
            size={20}
            tintColor={colors.muted}
          />
        </Pressable>
      }
    />
  );
}

/** Country code shown in front of phone inputs; Haiti is the only option (spec Phần B §0.7). */
export const PHONE_PREFIX = "+509";
export const PHONE_MAX_LENGTH = 8;

/**
 * Haiti phone input: fixed "+509" prefix (display only, not sent), digits only, 8 characters.
 */
export function PhoneField({ onChangeText, ...props }: Omit<TextFieldProps, "left" | "keyboardType" | "maxLength">) {
  const { colors } = useTheme();

  return (
    <TextField
      keyboardType="number-pad"
      textContentType="telephoneNumber"
      maxLength={PHONE_MAX_LENGTH}
      {...props}
      onChangeText={(text) => onChangeText?.(text.replace(/\D/g, ""))}
      left={
        <View style={[styles.prefix, { borderRightColor: colors.borderStrong }]}>
          <ThemedText variant="input">{PHONE_PREFIX}</ThemedText>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  field: {
    height: sizes.input,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  input: {
    ...type.input,
    flex: 1,
    height: "100%",
    paddingVertical: 0,
  },
  adornment: { paddingLeft: 8 },
  prefix: {
    paddingRight: 12,
    marginRight: 12,
    borderRightWidth: 1,
    height: "50%",
    justifyContent: "center",
  },
});
