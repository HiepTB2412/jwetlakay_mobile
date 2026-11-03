import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { useTranslation } from "react-i18next";

import { CloseImageButton } from "@/components/close-image-button";
import { ModalSafeArea } from "@/components/modal-safe-area";
import { ThemedText } from "@/components/themed-text";
import { useToast } from "@/components/toast";
import { apiErrorMessage } from "@/lib/api/errors";
import { queryKeys } from "@/lib/query/query-client";
import { LUCKY_SPIN, SCRIM } from "@/theme";

import { luckySpinApi } from "../api";
import type { LuckySpinReward, Prize } from "../types";
import { memberSpinRotation, prizeIndex } from "../wheel-math";
import { HistoryModal } from "./history-modal";
import { clampVw, ImageButton } from "./parts";
import { SPIN_DURATION_MS, Wheel } from "./wheel";
import { WinModal } from "./win-modal";

// Signed-in Lucky Spin (web PopupShowLuckySpin `:271-402`, spec Phần B §6.3a).
// [WEB-PARITY] Spin is allowed only with turns left TODAY; closing while spinning still opens the
// win modal when the wheel stops (the timer is cleared only on unmount). Plural "S"/"s" suffixes
// are hard-coded English on the web for every language.

const frameImage = require("@/assets/lucky-spin/wheel-frame.png");
const spinImage = require("@/assets/lucky-spin/btn-spin.png");
const spinDisabledImage = require("@/assets/lucky-spin/btn-spin-disabled.png");
const ticketImage = require("@/assets/lucky-spin/ticket-frame.png");
const historyImage = require("@/assets/lucky-spin/history.png");

type MemberSpinModalProps = {
  visible: boolean;
  prizes: Prize[];
  loading: boolean;
  turnToDay: number;
  turnTomorrow: number;
  onClose: () => void;
};

export function MemberSpinModal({ visible, prizes, loading, turnToDay, turnTomorrow, onClose }: MemberSpinModalProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { width: windowWidth } = useWindowDimensions();

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [result, setResult] = useState<LuckySpinReward | null>(null);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [winOpen, setWinOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const outOfTurns = turnToDay <= 0;
  const disabled = spinning || loading || outOfTurns;

  const spin = async () => {
    if (disabled) return;
    setSpinning(true);
    setWinnerIndex(null);
    let reward: LuckySpinReward;
    try {
      reward = await luckySpinApi.spin();
    } catch (error) {
      setSpinning(false);
      toast.error(apiErrorMessage(error) ?? ((error instanceof Error && error.message) || t("spinFailed")));
      return;
    }
    if (reward.itemValue > 0) void queryClient.invalidateQueries({ queryKey: queryKeys.balance });
    // Turns update while the wheel turns, as on the web.
    void queryClient.invalidateQueries({ queryKey: queryKeys.luckySpin });

    const index = prizeIndex(prizes, reward.id);
    setRotation((current) => memberSpinRotation(current, index, prizes.length));
    timer.current = setTimeout(() => {
      setSpinning(false);
      setWinnerIndex(index);
      setResult(reward);
      setWonPrize(prizes[index] ?? null);
      setWinOpen(true);
    }, SPIN_DURATION_MS);
  };

  const closeWin = () => {
    setWinOpen(false);
    setWinnerIndex(null);
    setResult(null);
    setWonPrize(null);
  };

  const close = () => {
    // Unlike the web, closing mid-spin also cancels the pending win modal: on iOS it can only be
    // shown from inside this modal, which is gone once it closes.
    if (timer.current) clearTimeout(timer.current);
    setSpinning(false);
    closeWin();
    onClose();
  };

  const container = Math.min(windowWidth, 500);
  const wheelSize = container * 0.55;
  const total = turnToDay + turnTomorrow;

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
        {/* Tapping the backdrop (any empty area of the scroll) closes; the content swallows its own taps. */}
        <ModalSafeArea style={{ backgroundColor: SCRIM.popup }}>
          <ScrollView contentContainerStyle={styles.grow}>
            <Pressable style={styles.scroll} onPress={close} accessible={false}>
              <View style={styles.content} onStartShouldSetResponder={() => true}>
                <CloseImageButton size={32} onPress={close} style={styles.close} />
                <View style={styles.body}>
                  <View style={{ width: container, height: container }}>
                    <View
                      style={[
                        styles.wheel,
                        {
                          width: wheelSize,
                          height: wheelSize,
                          borderRadius: wheelSize / 2,
                          left: container * 0.495 - wheelSize / 2,
                          top: container * 0.48 - wheelSize / 2,
                        },
                      ]}
                    >
                      <Wheel
                        prizes={prizes}
                        rotation={rotation}
                        size={wheelSize}
                        iconBox={clampVw(windowWidth, 28, 5, 32)}
                        iconScale={1.3}
                        iconDistance={2.8}
                        winnerIndex={winnerIndex}
                      />
                    </View>
                    {/* The frame (with the pointer drawn in) sits above the wheel. */}
                    <Image source={frameImage} style={StyleSheet.absoluteFill} contentFit="contain" pointerEvents="none" />
                  </View>

                  <ImageButton
                    source={outOfTurns ? spinDisabledImage : spinImage}
                    aspectRatio={outOfTurns ? 294 / 95 : 247 / 95}
                    width={container * 0.6}
                    label={outOfTurns ? t("out_of_spin") : t("spin")}
                    disabled={disabled}
                    onPress={spin}
                    style={styles.spinButton}
                  />

                  <View style={styles.info}>
                    <View style={styles.side} />
                    <View style={styles.ticket}>
                      <Image source={ticketImage} style={StyleSheet.absoluteFill} contentFit="cover" />
                      <ThemedText style={styles.ticketTitle}>
                        {t("you_have")} {total} {t("spin_ticket")}
                        {total !== 1 ? "S" : ""}
                      </ThemedText>
                      <TicketLine label={t("today_ticket")} count={turnToDay} />
                      <TicketLine label={t("tomorrow_ticket")} count={turnTomorrow} />
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t("history")}
                      hitSlop={6}
                      onPress={() => setHistoryOpen(true)}
                    >
                      <Image source={historyImage} style={styles.side} contentFit="contain" />
                    </Pressable>
                  </View>
                </View>
              </View>
            </Pressable>
          </ScrollView>
        </ModalSafeArea>

        {/* Inside the wheel's Modal: iOS cannot present a second sibling modal. */}
        <WinModal visible={winOpen} result={result} prize={wonPrize} onClose={closeWin} />
        <HistoryModal visible={historyOpen} onClose={() => setHistoryOpen(false)} />
      </Modal>
    </>
  );
}

function TicketLine({ label, count }: { label: string; count: number }) {
  const { t } = useTranslation();
  return (
    <View style={styles.ticketLine}>
      <ThemedText style={styles.ticketText}>{label}</ThemedText>
      <ThemedText style={styles.ticketText}>
        {count} {t("ticket")}
        {count !== 1 ? "s" : ""}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flexGrow: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", paddingVertical: 30 },
  content: { width: "100%", alignItems: "center" },
  close: { position: "absolute", top: 0, right: 12, zIndex: 2 },
  body: { alignItems: "center", gap: 16, paddingTop: 20 },
  wheel: { position: "absolute", overflow: "hidden", backgroundColor: LUCKY_SPIN.wheelBase },
  spinButton: { marginTop: -20 },
  info: { flexDirection: "row", alignItems: "center", gap: 12 },
  side: { width: 42, height: 42 },
  ticket: { minWidth: 260, paddingVertical: 14, paddingHorizontal: 16, gap: 4, overflow: "hidden", borderRadius: 8 },
  ticketTitle: { color: LUCKY_SPIN.text, fontSize: 13, fontWeight: "700", textTransform: "uppercase" },
  ticketLine: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  ticketText: { color: LUCKY_SPIN.text, fontSize: 12 },
});
