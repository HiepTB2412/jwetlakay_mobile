import { Image } from "expo-image";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { useTranslation } from "react-i18next";

import { CloseImageButton } from "@/components/close-image-button";
import { ThemedText } from "@/components/themed-text";
import { useBalance } from "@/features/wallet";
import { onDepositSuccess } from "@/lib/events";
import { LUCKY_SPIN, LUCKY_SPIN_SECTORS, LUCKY_SPIN_SECTORS_HALF } from "@/theme";

import { luckySpinPreview } from "../preview";
import { toPrizes, useLuckySpinList, useLuckySpinMember } from "../use-lucky-spin";
import { hasVisitedWithinPeriod } from "../visited";
import { GuestSpinModal } from "./guest-spin-modal";
import { MemberSpinModal } from "./member-spin-modal";

// Floating Lucky Spin button (web ShowLuckySpin, spec Phần B §6.2). Shown when there is at least
// one prize and the user is signed in, or is a guest whose 20-day "visited" mark has expired.
// Draggable within a 16px margin (not remembered); X swaps it for a small tab on the right edge
// (not remembered either). Opens the signed-in or the guest popup.

const buttonImage = require("@/assets/lucky-spin/spin-button.png");
const badgeImage = require("@/assets/lucky-spin/turn-badge.png");

/** spin_mb.png natural size. */
const BUTTON = { width: 92, height: 73 };
const MARGIN = 16;

const BLINK = {
  animationName: {
    "0%": { transform: [{ scale: 1 }], opacity: 1 },
    "50%": { transform: [{ scale: 1.03 }], opacity: 0.8 },
    "100%": { transform: [{ scale: 1 }], opacity: 1 },
  },
  animationDuration: "1.4s",
  animationTimingFunction: "ease-in-out",
  animationIterationCount: "infinite",
} as const;

export function LuckySpinButton() {
  const { t } = useTranslation();
  const isAuthenticated = useLuckySpinMember();
  const { data, isLoading, refetch } = useLuckySpinList();
  const { data: balance } = useBalance();
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [visited, setVisited] = useState<boolean | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    let active = true;
    void hasVisitedWithinPeriod().then((value) => active && setVisited(value));
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  // ---- Turn refreshes (signed in only): on open, 300ms after close, 500ms after the main
  // balance goes up, 1s after a deposit succeeds (web ShowLuckySpin :191-267). ----
  const refreshTurns = () => {
    if (isAuthenticated) void refetch();
  };
  const refreshTurnsLater = useEffectEvent((ms: number) => setTimeout(refreshTurns, ms));

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const unsubscribe = onDepositSuccess(() => timers.push(refreshTurnsLater(1000)));
    return () => {
      unsubscribe();
      timers.forEach(clearTimeout);
    };
  }, []);

  const lastGold = useRef<number | null | undefined>(undefined);
  const gold = balance?.gold;
  useEffect(() => {
    const previous = lastGold.current;
    lastGold.current = gold;
    if (previous != null && gold != null && gold > previous) {
      const timer = refreshTurnsLater(500);
      return () => clearTimeout(timer);
    }
  }, [gold]);

  const [closedAt, setClosedAt] = useState(0);
  useEffect(() => {
    if (!closedAt) return;
    const timer = refreshTurnsLater(300);
    return () => clearTimeout(timer);
  }, [closedAt]);

  const openPopup = () => {
    setPopupOpen(true);
    refreshTurns();
  };
  const closePopup = () => {
    setPopupOpen(false);
    setClosedAt(Date.now());
  };

  // ---- Drag ----
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const minX = -(windowWidth - 2 * MARGIN - BUTTON.width);
  const minY = -(windowHeight - 2 * MARGIN - BUTTON.height - insets.top - insets.bottom);

  const pan = Gesture.Pan()
    .minDistance(6)
    .onStart(() => {
      startX.set(offsetX.get());
      startY.set(offsetY.get());
    })
    .onUpdate((event) => {
      offsetX.set(Math.min(0, Math.max(minX, startX.get() + event.translationX)));
      offsetY.set(Math.min(0, Math.max(minY, startY.get() + event.translationY)));
    });
  const tap = Gesture.Tap().onEnd(() => scheduleOnRN(openPopup));
  const gesture = Gesture.Exclusive(pan, tap);

  const dragStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.get() }, { translateY: offsetY.get() }],
  }));

  const spinRes = useMemo(() => data?.spinRes ?? [], [data?.spinRes]);
  const memberPrizes = useMemo(() => toPrizes(spinRes, LUCKY_SPIN_SECTORS), [spinRes]);
  const guestPrizes = useMemo(() => toPrizes([...spinRes, ...spinRes], LUCKY_SPIN_SECTORS_HALF), [spinRes]);

  const turnToDay = data?.turnToDay ?? 0;
  const turnTomorrow = data?.turnTomorrow ?? 0;
  const totalTurns = turnToDay + turnTomorrow;
  // The dev preview ignores the 20-day "visited" mark so the guest button always shows.
  const visible = spinRes.length > 0 && (isAuthenticated || visited === false || luckySpinPreview !== null);

  if (!visible) return null;

  return (
    <>
      {minimized ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("luckySpin")}
          onPress={() => setMinimized(false)}
          style={[styles.mini, { backgroundColor: LUCKY_SPIN.miniToggle }]}
        >
          <View style={[styles.miniArrow, { borderLeftColor: LUCKY_SPIN.miniArrow }]} />
        </Pressable>
      ) : (
        <Animated.View style={[styles.wrapper, { right: MARGIN, bottom: MARGIN + insets.bottom }, dragStyle]}>
          <GestureDetector gesture={gesture}>
            <View accessible accessibilityRole="button" accessibilityLabel={t("luckySpin")}>
              <Animated.View style={reducedMotion ? undefined : BLINK}>
                <Image source={buttonImage} style={BUTTON} contentFit="contain" />
              </Animated.View>
              {isAuthenticated && totalTurns > 0 ? (
                <View style={styles.badge} pointerEvents="none">
                  <Image source={badgeImage} style={styles.badgeFrame} contentFit="contain" />
                  <ThemedText style={styles.badgeText}>{totalTurns}</ThemedText>
                </View>
              ) : null}
            </View>
          </GestureDetector>
          <CloseImageButton size={24} bordered={false} onPress={() => setMinimized(true)} style={styles.close} />
        </Animated.View>
      )}

      {isAuthenticated ? (
        <MemberSpinModal
          visible={popupOpen}
          prizes={memberPrizes}
          loading={isLoading}
          turnToDay={turnToDay}
          turnTomorrow={turnTomorrow}
          onClose={closePopup}
        />
      ) : (
        <GuestSpinModal visible={popupOpen} prizes={guestPrizes} loading={isLoading} onClose={closePopup} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "absolute" },
  badge: { position: "absolute", top: 2, right: 2, width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  badgeFrame: { position: "absolute", width: 34, height: 34 },
  badgeText: {
    color: LUCKY_SPIN.text,
    fontSize: 16,
    fontWeight: "700",
    textShadowColor: LUCKY_SPIN.shadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  close: { position: "absolute", top: -20, right: -12 },
  mini: {
    position: "absolute",
    right: 0,
    bottom: 140,
    width: 32,
    height: 64,
    borderRadius: 999,
    transform: [{ translateX: 16 }],
    justifyContent: "center",
    paddingLeft: 4,
    shadowColor: LUCKY_SPIN.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  miniArrow: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 8,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
});
