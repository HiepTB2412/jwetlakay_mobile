import { useCallback, useRef, useState, type ReactNode } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewInstance,
  type ViewStyle,
} from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/theme";

// Dropdown anchored under a trigger, right-aligned to it (web WalletMenu dropdown, react-select
// language menu). A transparent Modal keeps it above headers and other modals (e.g. the drawer);
// tapping outside or Android back closes it.

type Anchor = { top: number; right: number };

/** Ref for the trigger + the measured position of the open popover. */
export function useAnchoredPopover() {
  const triggerRef = useRef<ViewInstance>(null);
  const { width: windowWidth } = useWindowDimensions();
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  const close = useCallback(() => setAnchor(null), []);
  const toggle = useCallback(() => {
    if (anchor) {
      setAnchor(null);
      return;
    }
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ top: y + height + 8, right: Math.max(12, windowWidth - (x + width)) });
    });
  }, [anchor, windowWidth]);

  return { triggerRef, anchor, open: anchor !== null, toggle, close };
}

type AnchoredPopoverProps = {
  anchor: Anchor | null;
  onClose: () => void;
  width: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function AnchoredPopover({ anchor, onClose, width, children, style }: AnchoredPopoverProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();

  return (
    <Modal visible={anchor !== null} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t("close")}
      />
      {anchor ? (
        <View
          accessibilityViewIsModal
          style={[
            styles.panel,
            {
              top: anchor.top,
              right: anchor.right,
              width: Math.min(width, windowWidth - 24),
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
            style,
          ]}
        >
          {children}
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 16 },
    elevation: 16,
  },
});
