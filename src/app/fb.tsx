import { Redirect, useLocalSearchParams } from "expo-router";

// Marketing referral link → register with ref=FB (spec Phần B §1.3). Other query params
// (utm_*) are forwarded so the register screen can store them.
export default function FBReferral() {
  const params = useLocalSearchParams();
  return <Redirect href={{ pathname: "/auth/register", params: { ...params, ref: "FB" } }} />;
}
