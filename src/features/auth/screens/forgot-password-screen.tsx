import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/button";
import { OtpField } from "@/components/otp-field";
import { PasswordField, PhoneField } from "@/components/text-field";
import { useToast } from "@/components/toast";
import { useAutoFocus } from "@/hooks/use-auto-focus";
import { apiErrorMessage } from "@/lib/api/errors";

import { authApi } from "../api";
import { AuthLayout, closeAuth } from "../components/auth-layout";
import { FormError, ResendOtp } from "../components/form-parts";
import { rememberedLogin } from "../remembered-login";
import { useCountdown } from "../use-countdown";
import {
  validateOtp,
  validatePassword,
  validatePasswordConfirm,
  validatePhone,
} from "../validation";

// Spec Phần B §1.4. Flow: phone → OTP → new password.

type Step = "phone" | "otp" | "password";
type Field = "phone" | "otp" | "password" | "rePassword";

const RESEND_SECONDS = 60;

export function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const countdown = useCountdown(RESEND_SECONDS);

  const [step, setStep] = useState<Step>("phone");
  // Keyboard opens on the first input of each step.
  const firstInput = useAutoFocus(step);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [transactionId, setTransactionId] = useState("");

  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const busy = useRef(false);

  // The countdown runs as soon as the OTP step opens (spec Phần B §1.4).
  useEffect(() => {
    if (step === "otp") countdown.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

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

  const requestOtp = () => {
    const invalid = validatePhone(phone);
    setErrors({ phone: invalid ? t(invalid) : undefined });
    if (invalid) return;

    run(async () => {
      try {
        setTransactionId(await authApi.forgotPasswordRequest(phone));
        setOtp("");
        setStep("otp");
      } catch (error) {
        setErrors({ phone: apiErrorMessage(error) });
      }
    });
  };

  const resendOtp = async () => {
    if (resending) return;
    setResending(true);
    try {
      setTransactionId(await authApi.forgotPasswordRequest(phone));
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
        await authApi.forgotPasswordVerifyOtp({
          msisdn: phone,
          transactionId,
          otp,
        });
        setErrors({});
        setStep("password");
      } catch (error) {
        setErrors({ otp: apiErrorMessage(error) });
      }
    });
  };

  const confirmPassword = () => {
    const passwordError = validatePassword(password);
    const confirmError = validatePasswordConfirm(password, rePassword, {
      empty: "pleaseReenterPassword",
      mismatch: "reenterPasswordMismatch",
    });
    setErrors({
      password: passwordError ? t(passwordError) : undefined,
      rePassword: confirmError ? t(confirmError) : undefined,
    });
    if (passwordError || confirmError) return;

    run(async () => {
      try {
        await authApi.forgotPasswordConfirm({ transactionId, password });
      } catch (error) {
        setApiError(apiErrorMessage(error) || t("anErrorOccurred"));
        return;
      }
      await rememberedLogin.clearPassword();
      toast.success(t("passwordChanged"));
      router.replace("/auth/login");
    });
  };

  // Back is always shown: from any later step it returns to step 1 (spec Phần B §1.4).
  const onBack = () => {
    if (step === "phone") {
      closeAuth();
      return;
    }
    setStep("phone");
    setErrors({});
    setApiError(null);
    countdown.reset();
  };

  const description = {
    phone: t("enterRegisteredPhone"),
    otp: t("enterVerificationCode"),
    password: t("createNewPasst"),
  }[step];

  const onSubmit = {
    phone: requestOtp,
    otp: verifyOtp,
    password: confirmPassword,
  }[step];

  return (
    <AuthLayout
      step={step}
      title={step === "password" ? t("createNewPasst") : t("forgotPassword")}
      description={step === "password" ? undefined : description}
      onBack={onBack}
    >
      {step === "phone" ? (
        <PhoneField
          ref={firstInput}
          value={phone}
          // The web strips leading zeros on this screen only (spec Phần B §1.4).
          onChangeText={(text) => setPhone(text.replace(/^0+/, ""))}
          placeholder={t("phoneNumber")}
          error={errors.phone}
          editable={!submitting}
          returnKeyType="next"
          onSubmitEditing={requestOtp}
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
        <>
          <PasswordField
            ref={firstInput}
            value={password}
            onChangeText={setPassword}
            placeholder={t("enterNewPassword")}
            autoComplete="new-password"
            textContentType="newPassword"
            error={errors.password}
            editable={!submitting}
          />
          <PasswordField
            value={rePassword}
            onChangeText={setRePassword}
            placeholder={t("reenterNewPassword")}
            autoComplete="new-password"
            textContentType="newPassword"
            error={errors.rePassword}
            editable={!submitting}
            returnKeyType="done"
            onSubmitEditing={confirmPassword}
          />
        </>
      ) : null}

      <FormError message={apiError} />

      <Button
        title={step === "password" ? t("complete") : t("next")}
        loading={submitting}
        onPress={onSubmit}
      />
    </AuthLayout>
  );
}
