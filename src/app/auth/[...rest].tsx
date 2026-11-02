import { Redirect } from "expo-router";

// `/auth` and unknown `/auth/*` fall back to login (spec Phần B §1.0).
export default function AuthIndex() {
  return <Redirect href="/auth/login" />;
}
