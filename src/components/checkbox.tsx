import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";

import { sizes, useTheme } from "@/theme";

import { ThemedText } from "./themed-text";

type CheckboxProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function Checkbox({ label, checked, onChange }: CheckboxProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      hitSlop={8}
      onPress={() => onChange(!checked)}
      style={styles.row}
    >
      <View
        style={[
          styles.box,
          checked
            ? { backgroundColor: colors.brand, borderColor: colors.brand }
            : { borderColor: colors.borderStrong, backgroundColor: colors.input },
        ]}
      >
        {checked ? (
          <SymbolView
            name={{ ios: "checkmark", android: "check", web: "check" }}
            size={14}
            tintColor={colors.onBrand}
          />
        ) : null}
      </View>
      <ThemedText>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  box: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: sizes.inputBorder,
    alignItems: "center",
    justifyContent: "center",
  },
});
