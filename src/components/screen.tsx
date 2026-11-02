import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import {
  KeyboardAvoidingView,
  KeyboardAwareScrollView,
} from "react-native-keyboard-controller";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

type ScreenProps = {
  children: ReactNode;
  /** Scrollable content that keeps the focused input above the keyboard. Default: true. */
  scroll?: boolean;
  /**
   * Safe-area edges to pad. The top edge is left out by default because the
   * Stack header already covers it; add "top" on screens with `headerShown: false`.
   */
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

const DEFAULT_EDGES: Edge[] = ["left", "right", "bottom"];

export function Screen({
  children,
  scroll = true,
  edges = DEFAULT_EDGES,
  style,
  contentContainerStyle,
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={[{ flex: 1 }, style]}>
      {scroll ? (
        <KeyboardAwareScrollView
          bottomOffset={16}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
        >
          {children}
        </KeyboardAwareScrollView>
      ) : (
        <KeyboardAvoidingView
          behavior="padding"
          style={[{ flex: 1 }, contentContainerStyle]}
        >
          {children}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
