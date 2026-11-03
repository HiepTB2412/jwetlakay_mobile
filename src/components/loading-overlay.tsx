import { createContext, use, useMemo, useState, type ReactNode } from "react";
import { ActivityIndicator, Modal, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { SCRIM, useTheme } from "@/theme";

// Global blocking loader (web LoadingContext + LoadingSpinner, spec Phần B §0.6).
// [WEB-PARITY] A single boolean, not a counter: with nested show/hide calls the first
// `hideLoading` closes the overlay, exactly like the web. Callers that overlap must coordinate.

type LoadingContextValue = {
  isLoading: boolean;
  showLoading: () => void;
  hideLoading: () => void;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  const value = useMemo<LoadingContextValue>(
    () => ({ isLoading, showLoading: () => setIsLoading(true), hideLoading: () => setIsLoading(false) }),
    [isLoading],
  );

  return (
    <LoadingContext value={value}>
      {children}
      <LoadingOverlay visible={isLoading} />
    </LoadingContext>
  );
}

/**
 * Full-screen scrim with the brand spinner that blocks every touch. A transparent Modal keeps it
 * above native headers and sheets, and swallows the Android back button like the web's
 * `pointer-events: all` overlay. Web spinner is 48px; `large` is the closest native size.
 */
function LoadingOverlay({ visible }: { visible: boolean }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <View
        style={styles.scrim}
        accessibilityRole="progressbar"
        accessibilityLabel={t("loading")}
        accessibilityLiveRegion="polite"
      >
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    </Modal>
  );
}

export function useLoading() {
  const context = use(LoadingContext);
  if (!context) throw new Error("useLoading must be used inside LoadingProvider");
  return context;
}

const styles = StyleSheet.create({
  scrim: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: SCRIM.loading },
});
