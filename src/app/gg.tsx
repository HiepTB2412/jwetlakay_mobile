import { Redirect } from "expo-router";

// Marketing referral link → register with ref=GG (spec Phần B §1.3).
export default function GGReferral() {
  return <Redirect href={{ pathname: "/auth/register", params: { ref: "GG" } }} />;
}
