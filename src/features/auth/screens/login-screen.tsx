import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { OtpField } from "@/components/otp-field";
import { PasswordField, PhoneField } from "@/components/text-field";
import { ThemedText } from "@/components/themed-text";
import { useAutoFocus } from "@/hooks/use-auto-focus";
import type { TranslationKey } from "@/i18n";
import { ApiError, apiErrorMessage } from "@/lib/api/errors";
import { useTheme } from "@/theme";

import { authApi } from "../api";
import { useAuth } from "../auth-provider";
import { AuthLayout } from "../components/auth-layout";
import {
  AccountLockedNotice,
  AuthSwitchLink,
  FormError,
  ResendOtp,
} from "../components/form-parts";
import { rememberedLogin } from "../remembered-login";
import { resolveReturnTo } from "../return-to";
import { useCountdown } from "../use-countdown";
import {
  validateOtp,
  validatePassword,
  validatePasswordConfirm,
  validatePhone,
} from "../validation";

// Spec Phần B §1.1. Flow: PHONE → PASSWORD, or PHONE → OTP → SET_PASSWORD → login.

type Step = "phone" | "otp" | "password" | "setPassword";
type Field = "phone" | "otp" | "password" | "rePassword";

/** Login errorCodes that mean "too many wrong passwords". */
const LOCKED_CODES = ["01007", "01023"];
const RESEND_SECONDS = 60;

export function LoginScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { login } = useAuth();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const countdown = useCountdown(RESEND_SECONDS);

  const [step, setStep] = useState<Step>("phone");
  // Keyboard opens on the first input of each step.
  const firstInput = useAutoFocus(step);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [transactionId, setTransactionId] = useState("");

  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  // Guards against a second tap before the re-render disables the button.
  const busy = useRef(false);

  useEffect(() => {
    rememberedLogin.get().then((saved) => {
      if (!saved) return;
      setPhone((current) => current || saved.phone);
      setPassword((current) => current || saved.password);
    });
  }, []);

  const fieldError = (field: Field, key: TranslationKey | undefined) =>
    setErrors((previous) => ({
      ...previous,
      [field]: key ? t(key) : undefined,
    }));

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

  const signIn = async (passwordToUse: string) => {
    try {
      const ok = await login({ phone, password: passwordToUse, remember });
      if (ok) router.replace(resolveReturnTo(returnTo));
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.errorCode &&
        LOCKED_CODES.includes(error.errorCode)
      ) {
        setLocked(true);
      } else {
        setApiError(
          apiErrorMessage(error, t("loginFailed")) ?? t("loginFailed"),
        );
      }
    }
  };

  const submitPhone = () => {
    const invalid = validatePhone(phone, "invalidFormatPhoneNumber");
    setErrors({ phone: invalid ? t(invalid) : undefined });
    if (invalid) return;

    run(async () => {
      try {
        const result = await authApi.checkMsisdn(phone);
        if (result == null) {
          setStep("password");
        } else if (result !== "") {
          setTransactionId(result);
          setOtp("");
          setStep("otp");
          // The server has just sent the OTP, so the resend countdown starts now
          // (the web forgets to start it, spec Phần H §6).
          countdown.start();
        } else {
          // Undocumented "" result (spec Phần B §5.2): show a generic error instead of a dead button.
          setErrors({ phone: t("something_went_wrong") });
        }
      } catch (error) {
        setErrors({ phone: apiErrorMessage(error) });
      }
    });
  };

  const submitOtp = () => {
    const invalid = validateOtp(otp);
    fieldError("otp", invalid);
    if (invalid) return;

    run(async () => {
      try {
        await authApi.verifyMsisdn({ msisdn: phone, transactionId, otp });
        setPassword("");
        setRePassword("");
        setErrors({});
        setStep("setPassword");
      } catch (error) {
        setErrors({ otp: apiErrorMessage(error) });
      }
    });
  };

  const resendOtp = async () => {
    if (resending) return;
    setResending(true);
    try {
      // Same endpoint the web uses for the login OTP (spec Phần B §5.1 — needs BE confirmation).
      setTransactionId(await authApi.forgotPasswordRequest(phone));
      fieldError("otp", undefined);
      countdown.start();
    } catch (error) {
      setErrors({ otp: apiErrorMessage(error) });
    } finally {
      setResending(false);
    }
  };

  const submitSetPassword = () => {
    const passwordError = validatePassword(password);
    const confirmError = validatePasswordConfirm(password, rePassword, {
      empty: "reenterPasswordEmpty",
      mismatch: "newPasswordMismatch",
    });
    setErrors({
      password: passwordError ? t(passwordError) : undefined,
      rePassword: confirmError ? t(confirmError) : undefined,
    });
    if (passwordError || confirmError) return;

    run(async () => {
      try {
        await authApi.setPassword({ password, transactionId });
      } catch (error) {
        setApiError(apiErrorMessage(error) ?? t("anErrorOccurred"));
        return;
      }
      setStep("password");
      await signIn(password);
    });
  };

  const submitPassword = () => {
    const invalid = validatePassword(password);
    setErrors({ password: invalid ? t(invalid) : undefined });
    if (invalid) return;
    run(() => signIn(password));
  };

  const backToPhone = () => {
    setStep("phone");
    setErrors({});
    setApiError(null);
    setLocked(false);
    countdown.reset();
  };

  const onSubmit = {
    phone: submitPhone,
    otp: submitOtp,
    password: submitPassword,
    setPassword: submitSetPassword,
  }[step];

  return (
    <AuthLayout
      step={step}
      title={step === "phone" ? t("login") : t("password")}
      onBack={step === "phone" ? undefined : backToPhone}
    >
      {locked ? <AccountLockedNotice /> : null}

      {step === "phone" ? (
        <PhoneField
          ref={firstInput}
          value={phone}
          onChangeText={setPhone}
          placeholder={t("phoneNumber")}
          error={errors.phone}
          editable={!submitting}
          returnKeyType="next"
          onSubmitEditing={submitPhone}
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

      {step === "password" ? (
        <PasswordField
          ref={firstInput}
          value={password}
          onChangeText={setPassword}
          placeholder={t("password")}
          autoComplete="current-password"
          textContentType="password"
          error={errors.password}
          editable={!submitting}
          returnKeyType="go"
          onSubmitEditing={submitPassword}
        />
      ) : null}

      {step === "setPassword" ? (
        <>
          <PasswordField
            ref={firstInput}
            value={password}
            onChangeText={setPassword}
            placeholder={t("newPassword")}
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
            returnKeyType="go"
            onSubmitEditing={submitSetPassword}
          />
        </>
      ) : null}

      <FormError message={apiError} />

      {step === "password" || step === "setPassword" ? (
        <View style={styles.optionsRow}>
          <Checkbox
            label={t("rememberLogin")}
            checked={remember}
            onChange={setRemember}
          />
          {step === "password" ? (
            <Pressable
              accessibilityRole="link"
              hitSlop={8}
              onPress={() => router.push("/auth/forgot-password")}
            >
              <ThemedText variant="link" style={{ color: colors.brand }}>
                {t("forgotPassword")}
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <Button
        title={step === "phone" || step === "otp" ? t("next") : t("login")}
        loading={submitting}
        onPress={onSubmit}
      />

      <AuthSwitchLink
        prompt={t("NoAccount")}
        action={t("registerNow")}
        href="/auth/register"
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
