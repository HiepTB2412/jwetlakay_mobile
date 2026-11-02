import { describe, expect, it, jest } from "@jest/globals";

import { validateOtp, validatePassword, validatePasswordConfirm, validatePhone } from "../validation";

jest.mock("@/components/otp-field", () => ({ OTP_LENGTH: 6 }));

describe("validatePhone", () => {
  it.each(["34123456", "55123456", "50934123456", "0050934123456", "034123456"])("accepts %s", (phone) => {
    expect(validatePhone(phone)).toBeUndefined();
  });

  it("rejects empty input", () => {
    expect(validatePhone("")).toBe("phoneNumberEmpty");
  });

  it.each(["12345678", "3412345", "341234567a", "44123456"])("rejects %s", (phone) => {
    expect(validatePhone(phone)).toBe("invalidPhoneNumber");
  });

  it("uses the login wording when asked", () => {
    expect(validatePhone("1", "invalidFormatPhoneNumber")).toBe("invalidFormatPhoneNumber");
  });
});

describe("validateOtp", () => {
  it("requires exactly 6 digits", () => {
    expect(validateOtp("")).toBe("verificationCodeEmpty");
    expect(validateOtp("12345")).toBe("otpMustBe6Digits");
    expect(validateOtp("12345a")).toBe("otpMustBe6Digits");
    expect(validateOtp("123456")).toBeUndefined();
  });
});

describe("validatePassword", () => {
  it("requires at least 6 characters", () => {
    expect(validatePassword("")).toBe("passwordEmpty");
    expect(validatePassword("12345")).toBe("passwordMinLength");
    expect(validatePassword("123456")).toBeUndefined();
  });
});

describe("validatePasswordConfirm", () => {
  const messages = { empty: "pleaseReenterPassword", mismatch: "reenterPasswordMismatch" } as const;

  it("checks empty, length, then match", () => {
    expect(validatePasswordConfirm("secret1", "", messages)).toBe("pleaseReenterPassword");
    expect(validatePasswordConfirm("secret1", "abc", messages)).toBe("passwordMinLength");
    expect(validatePasswordConfirm("secret1", "secret2", messages)).toBe("reenterPasswordMismatch");
    expect(validatePasswordConfirm("secret1", "secret1", messages)).toBeUndefined();
  });
});
