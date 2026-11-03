import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { SafeAreaProvider, SafeAreaView, type Edge } from "react-native-safe-area-context";

/**
 * Safe-area padding inside an RN Modal. A Modal is its own native window, so it needs its own
 * provider (the app root's insets read 0 there on Android).
 */
export function ModalSafeArea({
  children,
  edges = ["top", "bottom"],
  style,
}: {
  children: ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <SafeAreaProvider>
      <SafeAreaView edges={edges} style={[{ flex: 1 }, style]}>
        {children}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
