import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { useTopOddWin } from "@/features/menu";
import { useOpenWebPath } from "@/lib/navigation/use-web-navigation";
import { useTheme } from "@/theme";

import { countdownEnd, countdownLabel, formatAmountK, haitiWallClock, maskMsisdn } from "./format";
import { Icon } from "./icon";

// "King of Odds" strip under the header (web noti.winning `variant="strip"`, spec Phần B §3.5).
// [WEB-PARITY] Shows betWins[0] only; hidden entirely when there is no winner. Text, masking,
// "K" amounts and the Haiti-time countdown follow the web.
// Tap: the web shows a "Loading…" overlay and does a full page load of `destinationUrl`; the app
// opens it through the web-path table instead (a screen, the browser, or "coming soon").

const cupIcon = require("@/assets/icons/cup.svg");

/** One loop of the marquee, as on the web (two copies scroll by half their total width). */
const MARQUEE = {
  animationName: { from: { transform: [{ translateX: "0%" }] }, to: { transform: [{ translateX: "-50%" }] } },
  animationDuration: "22s",
  animationTimingFunction: "linear",
  animationIterationCount: "infinite",
} as const;

const ODD_PULSE = {
  animationName: { "0%": { opacity: 1 }, "50%": { opacity: 0.55 }, "100%": { opacity: 1 } },
  animationDuration: "1.2s",
  animationTimingFunction: "ease-in-out",
  animationIterationCount: "infinite",
} as const;

export function KingOfOddsTicker() {
  const { colors } = useTheme();
  const { data } = useTopOddWin();
  const reducedMotion = useReducedMotion();
  const openWebPath = useOpenWebPath();

  const winner = data?.betWins?.[0];
  if (!winner) return null;

  const content = (
    <TickerContent
      player={maskMsisdn(winner.msisdn)}
      odds={`${winner.odds}`}
      reward={data?.reward}
      endDate={data?.endDate}
      animate={!reducedMotion}
    />
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        if (data?.destinationUrl) openWebPath(data.destinationUrl);
      }}
      style={[styles.strip, { backgroundColor: colors.brandSoft, borderTopColor: colors.border }]}
    >
      {/* A non-scrolling horizontal ScrollView lets the track be wider than the screen. */}
      <ScrollView
        horizontal
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        pointerEvents="none"
        // ScrollView grows by default, which pins the content to the top of the strip.
        style={styles.scroller}
      >
        {reducedMotion ? (
          <View style={styles.track}>{content}</View>
        ) : (
          <Animated.View style={[styles.track, MARQUEE]}>
            {content}
            {/* Second copy makes the loop seamless; hidden from screen readers. */}
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {content}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </Pressable>
  );
}

type TickerContentProps = {
  player: string;
  odds: string;
  reward: number | undefined;
  endDate: string | undefined;
  animate: boolean;
};

function TickerContent({ player, odds, reward, endDate, animate }: TickerContentProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.item}>
      <Image source={cupIcon} style={styles.cup} contentFit="contain" />
      {/* Separate Text views (not nested spans) so the odds can run its own CSS animation. */}
      <View style={styles.sentence}>
        <ThemedText style={styles.text}>
          {t("king_of_odd")}: {player} {t("leading_at")}
        </ThemedText>
        <Animated.View style={animate ? ODD_PULSE : undefined}>
          <ThemedText style={[styles.text, styles.odd, { color: colors.tickerOdd }]}>{odds}</ThemedText>
        </Animated.View>
        <ThemedText style={styles.text}>
          {t("odd")}. {t("prize")}
        </ThemedText>
        <ThemedText style={[styles.text, styles.prize, { color: colors.brand }]}>{formatAmountK(reward ?? 0)} HTG</ThemedText>
      </View>
      <CountdownChip endDate={endDate} />
    </View>
  );
}

function CountdownChip({ endDate }: { endDate: string | undefined }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const end = useMemo(() => countdownEnd(endDate), [endDate]);
  const [now, setNow] = useState(() => haitiWallClock());

  useEffect(() => {
    if (!end) return;
    const timer = setInterval(() => setNow(haitiWallClock()), 1000);
    return () => clearInterval(timer);
  }, [end]);

  if (!end) return null;
  const { unit, count } = countdownLabel(end, now);
  const label =
    unit === "days"
      ? t("countdownDays", { count })
      : unit === "hours"
        ? t("countdownHours", { count })
        : unit === "minutes"
          ? t("countdownMinutes", { count })
          : t("countdownSeconds", { count });

  return (
    <View style={[styles.chip, { backgroundColor: colors.live }]}>
      <ThemedText style={[styles.chipText, { color: colors.onBrand }]}>{label}</ThemedText>
      <Icon name="play" size={8} color={colors.onBrand} />
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { height: 34, overflow: "hidden", borderTopWidth: 1, justifyContent: "center" },
  scroller: { flexGrow: 0 },
  track: { flexDirection: "row", alignSelf: "flex-start", paddingLeft: 12 },
  item: { flexDirection: "row", alignItems: "center", gap: 8, paddingRight: 40, flexShrink: 0 },
  cup: { width: 18, height: 18 },
  sentence: { flexDirection: "row", alignItems: "center", gap: 4 },
  text: { fontSize: 12.5, fontWeight: "500" },
  odd: { fontWeight: "800", fontVariant: ["tabular-nums"] },
  prize: { fontWeight: "700" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  chipText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" },
});
