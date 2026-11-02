import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { radius, useTheme } from "@/theme";

import { ThemedText } from "./themed-text";

// Top toast, 3s auto-hide (spec Phần B §0.5). One at a time; a new toast replaces the old one.

type ToastType = "success" | "error" | "info";
type ToastState = { id: number; type: ToastType; message: string };

type ToastContextValue = {
  show: (type: ToastType, message: string) => void;
};

const AUTO_HIDE_MS = 3000;

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const nextId = useRef(0);

  const show = useCallback((type: ToastType, message: string) => {
    nextId.current += 1;
    setToast({ id: nextId.current, type, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext value={value}>
      {children}
      {toast ? <ToastView key={toast.id} toast={toast} /> : null}
    </ToastContext>
  );
}

function ToastView({ toast }: { toast: ToastState }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const accent = toast.type === "success" ? colors.win : toast.type === "error" ? colors.live : colors.brand;

  return (
    <View pointerEvents="none" style={[styles.container, { top: insets.top + 8 }]}>
      <Animated.View
        entering={FadeInUp}
        exiting={FadeOutUp}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={[
          styles.toast,
          { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: accent },
        ]}
      >
        <ThemedText>{toast.message}</ThemedText>
      </Animated.View>
    </View>
  );
}

export function useToast() {
  const context = use(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return useMemo(
    () => ({
      success: (message: string) => context.show("success", message),
      error: (message: string) => context.show("error", message),
      info: (message: string) => context.show("info", message),
    }),
    [context],
  );
}

const styles = StyleSheet.create({
  container: { position: "absolute", left: 16, right: 16, alignItems: "center" },
  toast: {
    maxWidth: 500,
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
