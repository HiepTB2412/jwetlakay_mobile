import { router, useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/button";
import { OtpField } from "@/components/otp-field";
import { PasswordField, PhoneField, TextField } from "@/components/text-field";
import { ThemedText } from "@/components/themed-text";
import { useAutoFocus } from "@/hooks/use-auto-focus";
import { useToast } from "@/components/toast";
import { apiErrorMessage } from "@/lib/api/errors";
import { useTheme } from "@/theme";

import { authApi, type PolicyType } from "../api";
import { AuthLayout } from "../components/auth-layout";
import { AuthSwitchLink, FormError, ResendOtp } from "../components/form-parts";
import {
  clearReferralCode,
  getReferralCode,
  getUtmPayload,
  saveReferralCode,
  saveUtmFromParams,
} from "../referral";
import { useCountdown } from "../use-countdown";
import {
  validateOtp,
  validatePassword,
  validatePasswordConfirm,
  validatePhone,
} from "../validation";

// Spec Phần B §1.2. Flow: phone → OTP → account details. Only Haiti / HTG exists.

type Step = "phone" | "otp" | "details";
type Field = "phone" | "otp" | "password" | "rePassword" | "fullName";

const CURRENCY = "HTG";
const RESEND_SECONDS = 60;

type RegisterParams = {
  /** Referral code from `/fb`, `/sms`, `/gg` or a marketing link. */
  ref?: string;
  referral_code?: string;
  /** Prefill from Lucky Spin guest flow (web redux `registerInitial*`). */
  msisdn?: string;
  transactionId?: string;
  luckSpinTransaction?: string;
  [utm: `utm_${string}`]: string | undefined;
};

export function RegisterScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams<RegisterParams>();
  const countdown = useCountdown(RESEND_SECONDS);

  const linkRef = params.ref || params.referral_code || "";
  const [step, setStep] = useState<Step>(
    params.transactionId ? "otp" : "phone",
  );
  // Keyboard opens on the first input of each step.
  const firstInput = useAutoFocus(step);
  const [msisdn, setMsisdn] = useState(params.msisdn ?? "");
  const [transactionId, setTransactionId] = useState(
    params.transactionId ?? "",
  );
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [referralCode, setReferralCode] = useState(linkRef);
  const [referralLocked, setReferralLocked] = useState(Boolean(linkRef));
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const busy = useRef(false);

  // Referral / UTM tracking (7 days); a stored code fills and locks the field like a link code.
  useEffect(() => {
    saveUtmFromParams(params);
    if (linkRef) {
      saveReferralCode(linkRef);
      return;
    }
    getReferralCode().then((stored) => {
      if (!stored) return;
      setReferralCode(stored);
      setReferralLocked(true);
    });
    // Params are read once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A prefilled transactionId means an OTP was just sent.
  useEffect(() => {
    if (params.transactionId) countdown.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async (task: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    setSubmitting(true);
    setApiError(null);
    try {
      await task();
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  };

  const sendOtp = () => {
    const invalid = validatePhone(msisdn);
    setErrors({ phone: invalid ? t(invalid) : undefined });
    if (invalid) return;

    run(async () => {
      try {
        setTransactionId(await authApi.registerRequest(msisdn));
        setOtp("");
        setStep("otp");
        countdown.start();
      } catch (error) {
        setErrors({ phone: apiErrorMessage(error) });
      }
    });
  };

  const resendOtp = async () => {
    if (resending) return;
    setResending(true);
    try {
      setTransactionId(await authApi.resendOtp(transactionId));
      setErrors({});
      countdown.start();
    } catch (error) {
      setErrors({ otp: apiErrorMessage(error) });
    } finally {
      setResending(false);
    }
  };

  const verifyOtp = () => {
    const invalid = validateOtp(otp);
    setErrors({ otp: invalid ? t(invalid) : undefined });
    if (invalid) return;

    run(async () => {
      try {
        await authApi.registerVerifyOtp({ msisdn, otp, transactionId });
        setErrors({});
        setStep("details");
      } catch (error) {
        setApiError(apiErrorMessage(error) ?? t("anErrorOccurred"));
      }
    });
  };

  const submitRegister = () => {
    const next: Partial<Record<Field, string>> = {};
    const passwordError = validatePassword(password);
    const confirmError = validatePasswordConfirm(password, rePassword, {
      empty: "passwordEmpty",
      mismatch: "passwordMismatch",
    });
    if (passwordError) next.password = t(passwordError);
    if (confirmError) next.rePassword = t(confirmError);
    if (!fullName.trim()) next.fullName = t("fullNameEmpty");
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    run(async () => {
      try {
        await authApi.registerConfirm({
          msisdn,
          username: fullName,
          password,
          currency: CURRENCY,
          fullName,
          email,
          referralCode,
          luckSpinTransaction: params.luckSpinTransaction,
          ...(await getUtmPayload()),
        });
      } catch (error) {
        setApiError(apiErrorMessage(error) ?? t("anErrorOccurred"));
        return;
      }
      await clearReferralCode();
      toast.success(t("registerSuccess"));
      // No auto-login after registering (spec Phần B §1.2 "Sau thành công").
      router.replace("/auth/login");
    });
  };

  const openPolicy = (type: PolicyType) =>
    router.push({ pathname: "/auth/policy", params: { type } });

  const backToPhone = () => {
    setStep("phone");
    setErrors({});
    setApiError(null);
    countdown.reset();
  };

  const onSubmit = { phone: sendOtp, otp: verifyOtp, details: submitRegister }[
    step
  ];

  return (
    <AuthLayout
      step={step}
      title={t("register")}
      onBack={step === "phone" ? undefined : backToPhone}
    >
      <FormError message={apiError} />

      {step === "phone" ? (
        <PhoneField
          ref={firstInput}
          value={msisdn}
          onChangeText={setMsisdn}
          placeholder={t("phoneNumber")}
          error={errors.phone}
          editable={!submitting}
          returnKeyType="next"
          onSubmitEditing={sendOtp}
        />
      ) : null}

      {step === "otp" ? (
        <>
          <OtpField
            ref={firstInput}
            value={otp}
            onChangeText={setOtp}
            error={errors.otp}
            editable={!submitting}
            accessibilityLabel={t("enterVerificationCodeLabel")}
          />
          <ResendOtp
            remaining={countdown.remaining}
            sending={resending}
            onResend={resendOtp}
          />
        </>
      ) : null}

      {step === "details" ? (
        <>
          <PhoneField
            value={msisdn}
            editable={false}
            right={
              <SymbolView
                name={{
                  ios: "checkmark.seal.fill",
                  android: "verified",
                  web: "verified",
                }}
                size={20}
                tintColor={colors.win}
              />
            }
          />
          <PasswordField
            ref={firstInput}
            value={password}
            onChangeText={setPassword}
            placeholder={t("enterPassword")}
            autoComplete="new-password"
            textContentType="newPassword"
            error={errors.password}
            editable={!submitting}
          />
          <PasswordField
            value={rePassword}
            onChangeText={setRePassword}
            placeholder={t("confirmPassword")}
            autoComplete="new-password"
            textContentType="newPassword"
            error={errors.rePassword}
            editable={!submitting}
          />
          <TextField
            value={CURRENCY}
            editable={false}
            accessibilityLabel={t("selectCurrency")}
          />
          <TextField
            value={referralCode}
            onChangeText={setReferralCode}
            placeholder={t("enterReferralCode")}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!submitting && !referralLocked}
          />
          <TextField
            value={fullName}
            onChangeText={setFullName}
            placeholder={t("enterFullName")}
            autoComplete="name"
            textContentType="name"
            error={errors.fullName}
            editable={!submitting}
          />
          <TextField
            value={email}
            onChangeText={setEmail}
            placeholder={t("email")}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            editable={!submitting}
          />
          <ThemedText
            variant="caption"
            style={[styles.terms, { color: colors.muted }]}
          >
            {t("agreewithOur")}{" "}
            <ThemedText
              variant="caption"
              accessibilityRole="link"
              onPress={() => openPolicy("TERMS_OR_USER")}
              style={[styles.termsLink, { color: colors.brand }]}
            >
              {t("termsOfUse")}
            </ThemedText>{" "}
            {t("and")}{" "}
            <ThemedText
              variant="caption"
              accessibilityRole="link"
              onPress={() => openPolicy("PRIVACY_POLICY")}
              style={[styles.termsLink, { color: colors.brand }]}
            >
              {t("privacyPolicy")}
            </ThemedText>{" "}
            {t("ofOur")}
          </ThemedText>
        </>
      ) : null}

      <Button
        title={step === "details" ? t("register") : t("next")}
        loading={submitting}
        onPress={onSubmit}
      />

      <AuthSwitchLink
        prompt={t("alreadyHaveAccount")}
        action={t("loginNow")}
        href="/auth/login"
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  terms: { textAlign: "center", lineHeight: 18 },
  termsLink: { fontWeight: "600" },
});
