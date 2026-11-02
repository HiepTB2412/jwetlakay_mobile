import { OTP_LENGTH } from "@/components/otp-field";
import type { TranslationKey } from "@/i18n";

// Rules from the web forms (spec Phần B §0.7, §1.1–1.4). Each validator returns the
// translation key of the first failing rule, or undefined when valid.

/** Haiti numbers: optional 00509/509/0 prefix, a carrier code, then 6 digits. */
export const PHONE_REGEX =
  /^(?:00509|509|0)?(22|25|28|29|30|31|32|33|34|35|36|37|38|39|40|41|42|43|55|56|58)\d{6}$/;

export const PASSWORD_MIN_LENGTH = 6;

const OTP_REGEX = new RegExp(`^\\d{${OTP_LENGTH}}$`);

export function validatePhone(
  phone: string,
  invalidKey: "invalidFormatPhoneNumber" | "invalidPhoneNumber" = "invalidPhoneNumber",
): TranslationKey | undefined {
  if (!phone) return "phoneNumberEmpty";
  if (!PHONE_REGEX.test(phone)) return invalidKey;
  return undefined;
}

export function validateOtp(otp: string): TranslationKey | undefined {
  if (!otp) return "verificationCodeEmpty";
  if (!OTP_REGEX.test(otp)) return "otpMustBe6Digits";
  return undefined;
}

export function validatePassword(password: string): TranslationKey | undefined {
  if (!password) return "passwordEmpty";
  if (password.length < PASSWORD_MIN_LENGTH) return "passwordMinLength";
  return undefined;
}

/** Re-entered password; the empty/mismatch messages differ per screen. */
export function validatePasswordConfirm(
  password: string,
  confirm: string,
  messages: { empty: TranslationKey; mismatch: TranslationKey },
): TranslationKey | undefined {
  if (!confirm) return messages.empty;
  if (confirm.length < PASSWORD_MIN_LENGTH) return "passwordMinLength";
  if (confirm !== password) return messages.mismatch;
  return undefined;
}
