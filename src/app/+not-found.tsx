import { Redirect } from "expo-router";

// Unknown paths (e.g. an outdated deep link) go Home, like the web's MainLayout `*` route
// (spec Phần B §4.4).
export default function NotFound() {
  return <Redirect href="/" />;
}
