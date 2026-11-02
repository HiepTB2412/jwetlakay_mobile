import { apiRequest } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { Tokens } from "@/lib/session/token-store";

import type { RegisterConfirmPayload, User } from "./types";

// identity-service auth endpoints (spec Phần A §1, Phần B §1). Payloads match the web
// client (src/apis/auth/index.ts). Only the login flow is MSISDN-based; type is fixed.

const LOGIN_TYPE = "MSISDN";

export const authApi = {
  /** Throws ApiError when the server returns HTTP 200 with an errorCode and no result. */
  async login(payload: { username: string; password: string }): Promise<Tokens> {
    const envelope = await apiRequest<Tokens | null>("identity-service/v1/auth/login", {
      method: "POST",
      body: { ...payload, type: LOGIN_TYPE },
    });
    if (envelope.errorCode && !envelope.result) throw new ApiError(200, envelope);
    return envelope.result as Tokens;
  },

  async logout(refreshToken: string): Promise<void> {
    await apiRequest("identity-service/v1/auth/logout", { method: "POST", body: { refreshToken } });
  },

  async accountInfo(): Promise<User> {
    return (await apiRequest<User>("identity-service/v1/account/info")).result;
  },

  // ---- Login by phone ----

  /**
   * null → the account already has a password; non-empty string → transactionId of the OTP
   * the server just sent (first login, password not set yet).
   */
  async checkMsisdn(msisdn: string): Promise<string | null> {
    return (await apiRequest<string | null>("identity-service/v1/auth/login/msisdn", {
      method: "POST",
      body: { msisdn },
    })).result;
  },

  async verifyMsisdn(payload: { msisdn: string; transactionId: string; otp: string }): Promise<void> {
    await apiRequest("identity-service/v1/auth/login/verify-msisdn", { method: "POST", body: payload });
  },

  async setPassword(payload: { password: string; transactionId: string }): Promise<void> {
    await apiRequest("identity-service/v1/auth/login/set-password", { method: "POST", body: payload });
  },

  // ---- Forgot password (also used to resend the login OTP, as the web does) ----

  /** Returns the transactionId of the OTP sent to `msisdn`. */
  async forgotPasswordRequest(msisdn: string): Promise<string> {
    return (await apiRequest<string>("identity-service/v1/auth/forgotPassword/request", {
      method: "POST",
      body: { msisdn, email: msisdn, type: LOGIN_TYPE },
    })).result;
  },

  async forgotPasswordVerifyOtp(payload: { msisdn: string; transactionId: string; otp: string }): Promise<void> {
    await apiRequest("identity-service/v1/auth/forgotPassword/verify-otp", {
      method: "POST",
      body: { ...payload, email: payload.msisdn, type: LOGIN_TYPE },
    });
  },

  async forgotPasswordConfirm(payload: { transactionId: string; password: string }): Promise<void> {
    await apiRequest("identity-service/v1/auth/forgotPassword/confirm", { method: "POST", body: payload });
  },

  // ---- Register ----

  /** Returns the transactionId of the OTP sent to `msisdn`. */
  async registerRequest(msisdn: string): Promise<string> {
    return (await apiRequest<string>("identity-service/v1/auth/register/request", {
      method: "POST",
      body: { msisdn },
    })).result;
  },

  /** Returns the new transactionId. */
  async resendOtp(transactionId: string): Promise<string> {
    return (await apiRequest<string>("identity-service/v1/auth/resend/otp", {
      method: "POST",
      body: { transactionId },
    })).result;
  },

  async registerVerifyOtp(payload: { msisdn: string; otp: string; transactionId: string }): Promise<void> {
    await apiRequest("identity-service/v1/auth/register/verify-otp", { method: "POST", body: payload });
  },

  async registerConfirm(payload: RegisterConfirmPayload): Promise<void> {
    await apiRequest("identity-service/v1/auth/register/confirm", { method: "POST", body: payload });
  },

  // ---- Terms / privacy (spec Phần B §2.4) ----

  async getPolicyContent(type: PolicyType, language: string): Promise<string | null> {
    const envelope = await apiRequest<{ content?: string | null } | null>("management-service/v1/config", {
      query: { type, language },
    });
    return envelope.result?.content ?? null;
  },
};

export const POLICY_TYPES = ["TERMS_OR_USER", "PRIVACY_POLICY"] as const;
export type PolicyType = (typeof POLICY_TYPES)[number];
