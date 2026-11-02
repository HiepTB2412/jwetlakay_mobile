/** `GET identity-service/v1/account/info` result (web `IUser`, src/constants/types.ts). */
export type User = {
  id: string;
  fullName: string;
  email: string;
  msisdn: string;
  username: string;
  dob: string;
  gender: "MALE" | "FEMALE";
  paperType: string;
  paperNumber: string;
  paperIssueDate: string;
  address: string;
  country: string;
  countryId: string;
  currency: string;
  language: string;
  lastLoginAt: string;
  accountLevel: number;
  accountType: string;
  balance: number;
  userReferralCode: string;
  profileProgress: number;
  avatar: string;
};

export type UtmParams = Partial<
  Record<"utmId" | "utmSource" | "utmMedium" | "utmCampaign" | "utmTerm" | "utmContent", string>
>;

/** `POST identity-service/v1/auth/register/confirm` body (spec Phần B §1.2 step 4). */
export type RegisterConfirmPayload = {
  msisdn: string;
  username: string;
  password: string;
  currency: string;
  fullName: string;
  email: string;
  referralCode: string;
  luckSpinTransaction?: string;
} & UtmParams;
