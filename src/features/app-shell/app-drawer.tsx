import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { useTranslation } from "react-i18next";

import { SCRIM, useTheme } from "@/theme";

import { DrawerContent } from "./drawer-content";
import { useDrawer } from "./drawer-context";

// Left drawer (web MobileDrawerModal + DrawerModal.css, spec Phần B §3.6): width min(300, 84%),
// right corners 16, scrim rgba(0,0,0,.5), tap the scrim or Android back to close.
// [WEB-PARITY] 200ms slide like the web's CSS transition; swiping the panel left also closes it
// (native expectation, the web has no gesture).

const SLIDE_MS = 200;
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
/** A flick faster than this (px/s) or a drag past a third of the width closes the drawer. */
const CLOSE_VELOCITY = 500;

export function AppDrawer() {
  const { visible, close } = useDrawer();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(300, windowWidth * 0.84);

  // Stay mounted until the slide-out finishes; mount as soon as it opens (adjusted during render).
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);
  /** 0 = closed, 1 = open. */
  const progress = useSharedValue(0);
  const dragX = useSharedValue(0);

  useEffect(() => {
    const timing = { duration: SLIDE_MS, easing: EASE_OUT, reduceMotion: ReduceMotion.System };
    if (visible) {
      progress.set(withTiming(1, timing));
    } else {
      progress.set(
        withTiming(0, timing, (finished) => {
          if (finished) scheduleOnRN(setMounted, false);
        }),
      );
    }
  }, [visible, progress]);

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-12, 12])
    .onUpdate((event) => {
      dragX.set(Math.min(0, event.translationX));
    })
    .onEnd((event) => {
      if (event.translationX < -width / 3 || event.velocityX < -CLOSE_VELOCITY) {
        // Hand the drag over to the slide-out so the panel continues from where the finger left it.
        progress.set(Math.max(0, 1 + dragX.get() / width));
        dragX.set(0);
        scheduleOnRN(close);
      } else {
        dragX.set(withSpring(0, { duration: 300, dampingRatio: 0.8, velocity: event.velocityX }));
      }
    });

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -width * (1 - progress.get()) + dragX.get() }],
  }));
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: progress.get() * (1 + dragX.get() / width),
  }));

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={close}
    >
      {/* A Modal is a separate native window: it needs its own safe-area provider (otherwise the
          insets read 0 on Android) and its own gesture-handler root. */}
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.root}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: SCRIM.drawer }, scrimStyle]}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel={t("close")}
            />
          </Animated.View>
          <GestureDetector gesture={pan}>
            <Animated.View
              accessibilityViewIsModal
              style={[
                styles.panel,
                { width, backgroundColor: colors.surface, borderColor: colors.border },
                panelStyle,
              ]}
            >
              <DrawerScroll onClose={close} />
            </Animated.View>
          </GestureDetector>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </Modal>
  );
}

/** Reads the insets of the Modal's own provider, so it must render inside it. */
function DrawerScroll({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <DrawerContent onClose={onClose} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    borderRightWidth: 1,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 4, height: 0 },
    elevation: 12,
  },
});
