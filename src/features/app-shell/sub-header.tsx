import { Image } from "expo-image";
import { usePathname } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type ScrollViewInstance } from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { useToast } from "@/components/toast";
import { useAuth } from "@/features/auth";
import { useHomeMenu, useHomeRoute, type MenuItem } from "@/features/menu";
import { useGoToLogin, useOpenWebPath } from "@/lib/navigation/use-web-navigation";
import { useTheme } from "@/theme";

import { getActiveCodeFromPath, getEffectiveCode, menuItemActions } from "./menu-actions";

// CMS main menu bar (web SubHeader, spec Phần B §3.4b). [WEB-PARITY] Items render only once the
// menu has loaded; the active item gets an orange underline and is scrolled to the center.
// GamePopup / BetcorePopup are not built yet: those actions show "coming soon".

export function SubHeader() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { data: items, isSuccess } = useHomeMenu();
  const openWebPath = useOpenWebPath();
  const goToLogin = useGoToLogin();
  const { width: windowWidth } = useWindowDimensions();

  const menu = useMemo(() => items ?? [], [items]);
  const { homeCode } = useHomeRoute();
  // Web `activeHeader`: a tap marks the item at once (even when its screen is not built yet).
  // Whenever the route changes, the route's code replaces it if the route has one, otherwise
  // the previous item stays marked. Adjusted during render instead of in an effect.
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [syncedPath, setSyncedPath] = useState<string | null>(null);
  if (isSuccess && syncedPath !== pathname) {
    setSyncedPath(pathname);
    const fromPath = getActiveCodeFromPath(pathname, menu, homeCode);
    if (fromPath) setActiveCode(fromPath);
  }

  // Center the active item.
  const scrollRef = useRef<ScrollViewInstance>(null);
  const layouts = useRef(new Map<number, { x: number; width: number }>());
  const [viewportWidth, setViewportWidth] = useState(windowWidth);
  const activeIndex = menu.findIndex((item) => getEffectiveCode(item) === activeCode);

  useEffect(() => {
    const box = layouts.current.get(activeIndex);
    if (activeIndex < 0 || !box) return;
    scrollRef.current?.scrollTo({ x: Math.max(0, box.x - (viewportWidth - box.width) / 2), animated: true });
  }, [activeIndex, viewportWidth]);

  const onPressItem = (item: MenuItem) => {
    const code = getEffectiveCode(item);
    if (code) setActiveCode(code);
    for (const action of menuItemActions(item, isAuthenticated, pathname)) {
      if (action.kind === "login") goToLogin();
      else if (action.kind === "navigate") openWebPath(action.path, { replace: action.replace });
      // Game / Betcore WebView screens belong to the Casino module.
      else toast.info(t("featureComingSoon"));
    }
  };

  return (
    <View style={[styles.bar, { backgroundColor: colors.nav, borderTopColor: colors.border }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
        contentContainerStyle={styles.list}
      >
        {isSuccess &&
          menu.map((item, index) => {
            const on = getEffectiveCode(item) === activeCode;
            return (
              <Pressable
                key={`${item.id}-${index}`}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onLayout={(event) => {
                  const { x, width } = event.nativeEvent.layout;
                  layouts.current.set(index, { x, width });
                }}
                onPress={() => onPressItem(item)}
                style={styles.item}
              >
                {item.isHot ? (
                  <View style={[styles.hot, { backgroundColor: colors.live }]}>
                    <ThemedText style={[styles.hotText, { color: colors.onBrand }]}>{t("hotTag")}</ThemedText>
                  </View>
                ) : null}
                {item.type === "GAME" && item.imageMobile ? <MenuImage uri={item.imageMobile} /> : null}
                <ThemedText style={[styles.label, { color: on ? colors.text : colors.muted }]}>{item.name}</ThemedText>
                {on ? <View style={[styles.underline, { backgroundColor: colors.brand }]} /> : null}
              </Pressable>
            );
          })}
      </ScrollView>
    </View>
  );
}

/** GAME item image; hidden when it fails to load (web `onError` → display:none). */
function MenuImage({ uri }: { uri: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <Image source={{ uri }} style={styles.image} contentFit="contain" onError={() => setFailed(true)} />;
}

const styles = StyleSheet.create({
  bar: { height: 40, borderTopWidth: 1, paddingHorizontal: 4 },
  list: { gap: 2, alignItems: "center" },
  item: { height: 40, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 6 },
  label: { fontSize: 13, fontWeight: "600" },
  underline: { position: "absolute", left: 0, right: 0, bottom: 0, height: 3 },
  hot: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  hotText: { fontSize: 9.5, fontWeight: "800" },
  image: { height: 22, width: 22 },
});
