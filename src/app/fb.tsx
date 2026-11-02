import { Redirect } from "expo-router";

// Marketing referral link → register with ref=FB (spec Phần B §1.3).
export default function FBReferral() {
  return <Redirect href={{ pathname: "/auth/register", params: { ref: "FB" } }} />;
}
