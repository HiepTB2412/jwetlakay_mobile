import { Image } from "expo-image";
import LottieView from "lottie-react-native";
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { getMultilingualValue } from "@/lib/i18n/multilingual";
import { LUCKY_SPIN, SCRIM } from "@/theme";

import type { LuckySpinReward, Prize } from "../types";
import { clampVw, ImageButton } from "./parts";

// Signed-in win modal (web PopupShowLuckySpin `:404-522`, spec Phần B §6.3b): fireworks Lottie
// on two layers (the lower one turned 180° on mobile), title frame, reward frame with the prize
// icon bouncing in, the localized prize name and a Close button. Tapping the backdrop closes.

const fireworks = require("@/assets/lottie/winner.json");
const titleFrame = require("@/assets/lucky-spin/title-frame.png");
const rewardFrame = require("@/assets/lucky-spin/reward-frame.png");
const buttonImage = require("@/assets/lucky-spin/btn-spin.png");

const BOUNCE = {
  animationName: {
    "0%": { transform: [{ scale: 1 }] },
    "50%": { transform: [{ scale: 1.05 }] },
    "100%": { transform: [{ scale: 1 }] },
  },
  animationDuration: "0.6s",
  animationTimingFunction: "ease-in-out",
} as const;

type WinModalProps = {
  visible: boolean;
  result: LuckySpinReward | null;
  prize: Prize | null;
  onClose: () => void;
};

export function WinModal({ visible, result, prize, onClose }: WinModalProps) {
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const icon = result?.icon ?? prize?.icon;
  const name = getMultilingualValue(result, "name", i18n.language) || result?.name || prize?.name || "";

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: SCRIM.popupStrong }]} onPress={onClose} />
      {reducedMotion ? null : (
        <>
          <View style={[StyleSheet.absoluteFill, styles.flipped]} pointerEvents="none">
            <LottieView source={fireworks} autoPlay loop style={styles.fill} />
          </View>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <LottieView source={fireworks} autoPlay loop style={styles.fill} />
          </View>
        </>
      )}

      <View style={styles.center} pointerEvents="box-none">
        <View style={styles.wrapper}>
          <View style={styles.title}>
            <Image source={titleFrame} style={StyleSheet.absoluteFill} contentFit="contain" />
            <ThemedText style={[styles.titleText, { fontSize: clampVw(width, 22, 5, 30) }]}>{t("text_title")}</ThemedText>
            <ThemedText style={[styles.subtitle, { fontSize: clampVw(width, 14, 3, 18) }]}>{t("text_des")}</ThemedText>
          </View>

          {/* Web RewardGift*: the frame holds only the prize; Close sits below it. */}
          <View style={styles.content}>
            <Image source={rewardFrame} style={StyleSheet.absoluteFill} contentFit="fill" />
            <View style={styles.giftWrap}>
              <Animated.View style={[styles.circle, reducedMotion ? null : BOUNCE]}>
                {icon ? <Image source={{ uri: icon }} style={styles.icon} contentFit="contain" /> : null}
              </Animated.View>
            </View>
            <ThemedText style={styles.name}>{name}</ThemedText>
          </View>

          <ImageButton
            source={buttonImage}
            aspectRatio={247 / 95}
            width={width * 0.9 * 0.6}
            label={t("close")}
            onPress={onClose}
            style={styles.closeButton}
          />
        </View>
      </View>
    </Modal>
  );
}

const textShadow = { textShadowColor: LUCKY_SPIN.shadow, textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 };

const styles = StyleSheet.create({
  flipped: { transform: [{ rotate: "180deg" }] },
  fill: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 30 },
  wrapper: { width: "90%", alignItems: "center" },
  title: { minHeight: 80, width: "100%", paddingVertical: 18, marginBottom: -10, alignItems: "center", justifyContent: "center" },
  titleText: { color: LUCKY_SPIN.text, fontWeight: "700", ...textShadow },
  subtitle: { color: LUCKY_SPIN.text, fontWeight: "700", ...textShadow },
  content: {
    width: "100%",
    borderRadius: 20,
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 24,
    alignItems: "center",
    overflow: "hidden",
  },
  giftWrap: { width: "100%", minHeight: 150, padding: 10, marginTop: 6, marginBottom: 4, alignItems: "center", justifyContent: "center" },
  // translateY(-12%) of 120.
  circle: { width: 120, height: 120, padding: 8, alignItems: "center", justifyContent: "center", top: -14 },
  icon: { width: "86%", height: "86%" },
  name: { color: LUCKY_SPIN.text, fontSize: 14, fontWeight: "700", textAlign: "center", marginTop: 12 },
  closeButton: { marginTop: 16 },
});
