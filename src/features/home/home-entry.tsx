import { Redirect } from "expo-router";
import { StyleSheet, View } from "react-native";

import { useHomeRoute } from "@/features/menu";
import { resolveWebTarget } from "@/lib/navigation/web-routes";

import { HomeExtras } from "./home-extras";

/**
 * Route "/" (web HomeEntry, spec Phần B §3.8): blank until the home route is known, then
 * `replace` to the CMS home page. Without a home page, "/" is a blank page with the popups.
 * While the home page's screen is not built yet (production home is /sport), "/" stands in for
 * it and shows the popups, so they are reachable.
 */
export function HomeEntry() {
  const { home, ready } = useHomeRoute();
  if (!ready) return <View style={styles.fill} />;

  const target = home?.path ? resolveWebTarget(home.path) : null;
  if (target?.kind === "route" && target.href !== "/") return <Redirect href={target.href} />;

  return (
    <View style={styles.fill}>
      <HomeExtras />
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
