import { Redirect } from "expo-router";

// Marketing referral link → register with ref=SMS (spec Phần B §1.3).
export default function SMSReferral() {
  return <Redirect href={{ pathname: "/auth/register", params: { ref: "SMS" } }} />;
}
