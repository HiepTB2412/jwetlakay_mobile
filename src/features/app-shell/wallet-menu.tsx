import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { cubicBezier } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { AnchoredPopover, useAnchoredPopover } from "@/components/anchored-popover";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/features/auth";
import { useBalance } from "@/features/wallet";
import { useTheme, WALLET } from "@/theme";

import { formatMoney, formatWholeMoney } from "./format";
import { Icon } from "./icon";

// Header wallet button + dropdown (web WalletMenu, spec Phần B §3.4). [WEB-PARITY] Button amounts
// are truncated (`Math.trunc`), cards show 0–2 decimals, both en-US. Free Bet appears only when
// non-zero; Commission only for AGENT accounts. Tapping outside closes the dropdown (web:
// mousedown outside / Esc).

const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);
const MENU_WIDTH = 260;

export function WalletMenu({ onDeposit }: { onDeposit: () => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: balance } = useBalance();
  const { width: windowWidth } = useWindowDimensions();
  const { triggerRef, anchor, open, toggle, close } = useAnchoredPopover();

  const narrow = windowWidth <= 420;
  const cards = [
    { key: "main", label: t("mainWallet"), value: balance?.gold, color: WALLET.main, show: true },
    { key: "promo", label: t("promotionWallet"), value: balance?.point, color: WALLET.promo, show: true },
    { key: "free", label: t("freeBetWallet"), value: balance?.freeBet, color: WALLET.freeBet, show: !!balance?.freeBet },
    {
      key: "commission",
      label: t("commissionWallet"),
      value: balance?.commission,
      color: WALLET.commission,
      show: user?.accountType === "AGENT",
    },
  ].filter((card) => card.show);

  return (
    <>
      <Pressable
        ref={triggerRef}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={toggle}
        style={[
          styles.trigger,
          narrow && styles.triggerNarrow,
          { backgroundColor: colors.surfaceAlt, borderColor: open ? colors.brand : colors.border },
        ]}
      >
        <View style={styles.column}>
          <ThemedText style={[styles.short, narrow && styles.shortNarrow, { color: WALLET.main }]}>
            {t("walletMainShort")}
          </ThemedText>
          <ThemedText style={[styles.amount, narrow && styles.amountNarrow, { color: WALLET.main }]}>
            {formatWholeMoney(balance?.gold)}
          </ThemedText>
        </View>
        <View style={[styles.separator, narrow && styles.separatorNarrow, { backgroundColor: colors.borderStrong }]} />
        <View style={styles.column}>
          <ThemedText style={[styles.short, narrow && styles.shortNarrow, { color: WALLET.promo }]}>
            {t("walletPromoShort")}
          </ThemedText>
          <ThemedText style={[styles.amount, narrow && styles.amountNarrow, { color: WALLET.promo }]}>
            {formatWholeMoney(balance?.point)}
          </ThemedText>
        </View>
        <Animated.View
          style={{
            transform: [{ rotate: open ? "180deg" : "0deg" }],
            transitionProperty: "transform",
            transitionDuration: 200,
            transitionTimingFunction: CSS_EASE_OUT,
          }}
        >
          <Icon name="chevronDown" size={14} color={colors.muted} />
        </Animated.View>
      </Pressable>

      <AnchoredPopover anchor={anchor} onClose={close} width={MENU_WIDTH} style={styles.menu}>
        {cards.map((card) => (
          <View
            key={card.key}
            style={[styles.card, { backgroundColor: colors.surfaceAlt, borderLeftColor: card.color }]}
          >
            <ThemedText style={[styles.cardLabel, { color: card.color }]}>{card.label}</ThemedText>
            <View style={styles.cardAmountRow}>
              <ThemedText style={[styles.cardAmount, card.key === "promo" && { color: WALLET.promo }]}>
                {formatMoney(card.value)}
              </ThemedText>
              <ThemedText style={[styles.currency, { color: colors.muted }]}>HTG</ThemedText>
            </View>
          </View>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            close();
            onDeposit();
          }}
          style={[styles.depositButton, { backgroundColor: colors.brand }]}
        >
          <ThemedText style={[styles.depositText, { color: colors.onBrand }]}>{t("depositNow")}</ThemedText>
        </Pressable>
      </AnchoredPopover>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 34,
    paddingLeft: 10,
    paddingRight: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  triggerNarrow: { gap: 6, paddingLeft: 8, paddingRight: 6 },
  column: { gap: 3 },
  short: { fontSize: 10, lineHeight: 11, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" },
  shortNarrow: { fontSize: 9, lineHeight: 10 },
  amount: { fontSize: 13, lineHeight: 14, fontWeight: "700", fontVariant: ["tabular-nums"] },
  amountNarrow: { fontSize: 12, lineHeight: 13 },
  separator: { width: 1, height: 22 },
  separatorNarrow: { height: 18 },
  menu: { padding: 12, gap: 8 },
  card: { gap: 2, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderLeftWidth: 3 },
  cardLabel: { fontSize: 10.5, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  cardAmountRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  cardAmount: { fontSize: 22, lineHeight: 25, fontWeight: "700", fontVariant: ["tabular-nums"] },
  currency: { fontSize: 11, fontWeight: "600" },
  depositButton: { marginTop: 4, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  depositText: { fontSize: 14, fontWeight: "700" },
});
