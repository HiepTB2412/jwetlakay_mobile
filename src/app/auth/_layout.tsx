import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import { FONT_FAMILY } from "@/theme";

// Auth stack: no app header, bottom nav or drawer; screens draw their own top bar
// (spec Phần B §1.0). No guard — signed-in users may still open these pages, like the web.
export default function AuthLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="policy"
        options={{
          presentation: "modal",
          headerShown: true,
          headerTransparent: false,
          headerTitleStyle: { fontFamily: FONT_FAMILY, fontWeight: "600" },
          headerBackTitle: t("close"),
        }}
      />
    </Stack>
  );
}
