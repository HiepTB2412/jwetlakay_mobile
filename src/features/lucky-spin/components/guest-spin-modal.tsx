import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/button";
import { PhoneField } from "@/components/text-field";
import { CloseImageButton } from "@/components/close-image-button";
import { ModalSafeArea } from "@/components/modal-safe-area";
import { ThemedText } from "@/components/themed-text";
import { useToast } from "@/components/toast";
import { authApi } from "@/features/auth/api";
import { validatePhone } from "@/features/auth/validation";
import { apiErrorMessage } from "@/lib/api/errors";
import { getMultilingualValue } from "@/lib/i18n/multilingual";
import { useGoToLogin } from "@/lib/navigation/use-web-navigation";
import { LUCKY_SPIN, SCRIM } from "@/theme";

import { luckySpinApi } from "../api";
import { luckySpinPreview } from "../preview";
import type { LuckySpinReward, Prize } from "../types";
import { guestSpinRotation, prizeIndex } from "../wheel-math";
import { clampVw, ImageButton } from "./parts";
import { SPIN_DURATION_MS, Wheel } from "./wheel";

// Guest Lucky Spin (web PopupShowHalfLuckySpin, spec Phần B §6.4). The sector list is the
// prize list twice; spins are not limited on the client. The reward modal asks for a phone
// number, requests a register OTP and continues on the Register screen with the spin's
// transactionId (web Redux registerInitial*). Differences from the web: the Register button is
// guarded against double taps (spec Phần B §5.9), and the +509 prefix is the app's phone field
// (no flag dropdown; the web dropdown has only Haiti and its value is not sent).

const frameImage = require("@/assets/lucky-spin/wheel-frame-half.png");
/** Part of the box above its top edge that stays visible (web clip-path starts at −20%/−10%). */
const CLIP_ABOVE = 0.2;
const CLIP_SIDE = 20;
const tryImage = require("@/assets/lucky-spin/btn-try.webp");

type GuestSpinModalProps = {
  visible: boolean;
  /** Already doubled and colored with the HALF palette. */
  prizes: Prize[];
  loading: boolean;
  onClose: () => void;
};

export function GuestSpinModal({ visible, prizes, loading, onClose }: GuestSpinModalProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const { width: windowWidth } = useWindowDimensions();

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [result, setResult] = useState<LuckySpinReward | null>(null);
  const [rewardOpen, setRewardOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const spin = async () => {
    if (spinning || loading) return;
    setSpinning(true);
    setWinnerIndex(null);
    let reward: LuckySpinReward;
    try {
      reward = await luckySpinApi.spinNotRegistered();
    } catch (error) {
      setSpinning(false);
      toast.error(apiErrorMessage(error) || (error instanceof Error && error.message) || t("spinFailed"));
      return;
    }
    // Always the first copy in the doubled list, like the web.
    const index = prizeIndex(prizes, reward.id);
    setRotation((current) => guestSpinRotation(current, index, prizes.length));
    timer.current = setTimeout(() => {
      setSpinning(false);
      setWinnerIndex(index);
      setResult(reward);
      setRewardOpen(true);
    }, SPIN_DURATION_MS);
  };

  const close = () => {
    // Unlike the web, closing mid-spin also cancels the pending reward: on iOS a modal can only be
    // shown from inside the wheel's modal, which is gone once it closes.
    if (timer.current) clearTimeout(timer.current);
    setSpinning(false);
    setRewardOpen(false);
    setWinnerIndex(null);
    setResult(null);
    onClose();
  };

  const container = windowWidth * 0.95;
  const wheelSize = container * 0.65;

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
        <ModalSafeArea style={{ backgroundColor: SCRIM.popup }}>
          <ScrollView contentContainerStyle={styles.grow}>
            <Pressable style={styles.scroll} onPress={close} accessible={false}>
              <View style={[styles.content, { width: container }]} onStartShouldSetResponder={() => true}>
                <CloseImageButton size={28} onPress={close} style={styles.close} />
                <View style={styles.body}>
                  {/* The box keeps its full square in the layout (the button below overlaps it), but
                      like the web's clip-path only the top half shows: from 20% above to 50% down. */}
                  <View style={{ width: container, height: container }}>
                    <View style={[styles.clip, { top: -container * CLIP_ABOVE, height: container * (CLIP_ABOVE + 0.5) }]}>
                      <View style={{ width: container, height: container, top: container * CLIP_ABOVE, left: CLIP_SIDE }}>
                        <View
                          style={[
                            styles.wheel,
                            {
                              width: wheelSize,
                              height: wheelSize,
                              borderRadius: wheelSize / 2,
                              left: container / 2 - wheelSize / 2,
                              top: container * 0.48 - wheelSize / 2,
                            },
                          ]}
                        >
                          <Wheel
                            prizes={prizes}
                            rotation={rotation}
                            size={wheelSize}
                            iconBox={clampVw(windowWidth, 20, 4, 24)}
                            iconScale={1.6}
                            iconDistance={3.5}
                            winnerIndex={winnerIndex}
                          />
                        </View>
                        {/* Web: 105% of the box, centered by flex (so −2.5%), then translate(2%, −22%). */}
                        <Image
                          source={frameImage}
                          pointerEvents="none"
                          contentFit="contain"
                          style={[
                            styles.frame,
                            {
                              width: container * 1.05,
                              height: container * 1.05,
                              left: container * 1.05 * 0.02 - container * 0.025,
                              top: -container * 1.05 * 0.22 - container * 0.025,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>

                  <ImageButton
                    source={tryImage}
                    aspectRatio={413 / 95}
                    width={container * 0.7}
                    label={t("try_your_lucky_now")}
                    labelStyle={styles.tryLabel}
                    disabled={spinning || loading}
                    onPress={spin}
                    style={styles.tryButton}
                  />
                  <ThemedText style={styles.noAccount}>{t("NoAccount")}</ThemedText>
                </View>
              </View>
            </Pressable>
          </ScrollView>
        </ModalSafeArea>

        {/* Inside the wheel's Modal: iOS cannot present a second sibling modal. */}
        <GuestRewardModal
          visible={rewardOpen}
          result={result}
          onClose={() => setRewardOpen(false)}
          onDone={close}
        />
      </Modal>
    </>
  );
}

type GuestRewardModalProps = {
  visible: boolean;
  result: LuckySpinReward | null;
  /** X: closes the reward card only. */
  onClose: () => void;
  /** Register / Login now: closes the reward card and the wheel. */
  onDone: () => void;
};

function GuestRewardModal({ visible, result, onClose, onDone }: GuestRewardModalProps) {
  const { t, i18n } = useTranslation();
  const goToLogin = useGoToLogin();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const name = getMultilingualValue(result, "name", i18n.language) || result?.name || "";

  const onChangePhone = (value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    setPhone(value);
    const invalid = validatePhone(value, "invalidPhoneNumber");
    setError(invalid ? t(invalid) : undefined);
  };

  const register = async () => {
    if (busy) return;
    const invalid = validatePhone(phone, "invalidPhoneNumber");
    if (invalid) {
      setError(t(invalid));
      return;
    }
    if (luckySpinPreview) {
      // Dev preview: no OTP is requested (no SMS); continue on Register with the number filled in.
      onDone();
      router.push({ pathname: "/auth/register", params: { msisdn: phone } });
      return;
    }
    setBusy(true);
    try {
      // [WEB-PARITY] msisdn is the 8 typed digits, without 509.
      const transactionId = await authApi.registerRequest(phone);
      const params: Record<string, string> = { msisdn: phone, transactionId };
      if (result?.transactionId) params.luckSpinTransaction = result.transactionId;
      onDone();
      router.push({ pathname: "/auth/register", params });
    } catch (requestError) {
      setError(apiErrorMessage(requestError) || t("something_went_wrong"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <ModalSafeArea style={{ backgroundColor: SCRIM.popupStrong }}>
        <ScrollView contentContainerStyle={styles.grow} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.rewardScroll} onPress={onClose} accessible={false}>
            <View style={styles.rewardContent} onStartShouldSetResponder={() => true}>
              <View style={[styles.card, { backgroundColor: LUCKY_SPIN.rewardCard }]}>
                <CloseImageButton size={24} bordered={false} onPress={onClose} style={styles.cardClose} />
                <ThemedText style={styles.cardTitle}>{t("congratulations")}</ThemedText>
                <ThemedText style={styles.cardSubtitle}>{t("lucky_you_have_received_the_reward")}</ThemedText>
                <View style={styles.giftWrap}>
                  <View style={styles.gift}>
                    {result?.icon ? <Image source={{ uri: result.icon }} style={styles.giftIcon} contentFit="contain" /> : null}
                  </View>
                </View>
                <ThemedText style={styles.prizeName}>{name}</ThemedText>

                <View style={styles.form}>
                  <ThemedText style={styles.formLabel}>{t("enter_your_phone")}</ThemedText>
                  <PhoneField
                    value={phone}
                    onChangeText={onChangePhone}
                    placeholder={t("phoneNumber")}
                    error={error}
                    editable={!busy}
                  />
                  <Button title={t("register")} onPress={register} loading={busy} />
                </View>

                <ThemedText style={styles.newOnly}>{t("reward_for_new")}</ThemedText>
                <View style={styles.loginRow}>
                  <ThemedText style={styles.loginPrompt}>{t("alreadyHaveAccount")} </ThemedText>
                  <Pressable
                    accessibilityRole="link"
                    hitSlop={8}
                    onPress={() => {
                      onDone();
                      goToLogin();
                    }}
                  >
                    <ThemedText style={[styles.loginLink, { color: LUCKY_SPIN.loginLink }]}>{t("loginNow")}</ThemedText>
                  </Pressable>
                </View>
              </View>
            </View>
          </Pressable>
        </ScrollView>
      </ModalSafeArea>
    </Modal>
  );
}

const styles = StyleSheet.create({
  grow: { flexGrow: 1 },
  scroll: { flexGrow: 1, alignItems: "center", paddingVertical: 20 },
  content: { paddingVertical: 30, overflow: "hidden" },
  close: { position: "absolute", top: 10, right: 10, zIndex: 3 },
  body: { alignItems: "center", gap: 12, paddingTop: 30 },
  // Wider than the box so the 105% frame is not cut at the sides.
  clip: { position: "absolute", left: -CLIP_SIDE, right: -CLIP_SIDE, overflow: "hidden" },
  wheel: { position: "absolute", overflow: "hidden", backgroundColor: LUCKY_SPIN.wheelBase },
  frame: { position: "absolute" },
  tryButton: { marginTop: -180, zIndex: 2 },
  tryLabel: { color: LUCKY_SPIN.tryText, fontSize: 12, fontWeight: "600" },
  noAccount: { color: LUCKY_SPIN.text, fontSize: 12, paddingHorizontal: 16, textAlign: "center" },
  rewardScroll: { flexGrow: 1, alignItems: "center", paddingVertical: 20 },
  rewardContent: { width: "90%", paddingHorizontal: 12 },
  card: { borderRadius: 16, paddingTop: 24, paddingHorizontal: 16, paddingBottom: 16, alignItems: "center", overflow: "hidden", gap: 6 },
  cardClose: { position: "absolute", top: 12, right: 12, zIndex: 2 },
  cardTitle: { color: LUCKY_SPIN.text, fontSize: 18, fontWeight: "700" },
  cardSubtitle: { color: LUCKY_SPIN.text, fontSize: 12 },
  giftWrap: { minHeight: 180, alignItems: "center", justifyContent: "center" },
  gift: { width: 140, height: 140, alignItems: "center", justifyContent: "center", transform: [{ translateY: -17 }] },
  giftIcon: { width: "60%", height: "60%" },
  prizeName: { color: LUCKY_SPIN.text, fontSize: 14, fontWeight: "600", textAlign: "center" },
  form: { alignSelf: "stretch", gap: 10, marginTop: 8 },
  formLabel: { color: LUCKY_SPIN.text, fontSize: 12 },
  newOnly: { color: LUCKY_SPIN.text, fontSize: 12, lineHeight: 20, textAlign: "center", marginTop: 8 },
  loginRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", justifyContent: "center" },
  loginPrompt: { color: LUCKY_SPIN.text, fontSize: 14 },
  loginLink: { fontSize: 14, fontWeight: "600" },
});
