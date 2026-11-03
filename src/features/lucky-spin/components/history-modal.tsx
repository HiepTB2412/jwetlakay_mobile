import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { CloseImageButton } from "@/components/close-image-button";
import { ThemedText } from "@/components/themed-text";
import { useToast } from "@/components/toast";
import { Icon } from "@/features/app-shell/icon";
import { apiErrorMessage } from "@/lib/api/errors";
import { getMultilingualValue } from "@/lib/i18n/multilingual";
import { queryKeys } from "@/lib/query/query-client";
import type { TranslationKey } from "@/i18n";
import { LUCKY_SPIN, SCRIM } from "@/theme";

import { luckySpinApi } from "../api";
import type { LuckySpinHistoryItem } from "../types";

// Spin history (web PopupShowLuckySpin `:524-654`, spec Phần B §6.3c). Five columns
// 1.2/1.4/1/1/1.1, `DD/MM` dates, amounts as "{value} HTG" without number formatting, wallet and
// status codes mapped to labels. Pages are 1-based; closing resets to page 1.

const historyIcon = require("@/assets/lucky-spin/history.png");

const COLUMNS = [1.2, 1.4, 1, 1, 1.1] as const;

const WALLET_LABELS: Record<string, TranslationKey> = {
  GOLD: "mainWallet",
  POINT: "promotionWallet",
  COMMISSION: "commissionWallet",
  FREE_BET: "freeBetWallet",
  TURN_GAME: "turn",
};

const STATUS: Record<string, { label: TranslationKey; color?: string }> = {
  FAIL: { label: "failed", color: LUCKY_SPIN.failed },
  REWARDED: { label: "success", color: LUCKY_SPIN.success },
  REWARDED_PENDING: { label: "pending" },
};

/** dayjs(createdAt).format("DD/MM"). */
function dayMonth(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function HistoryModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [page, setPage] = useState(1);

  const { data, isFetching, error } = useQuery({
    queryKey: queryKeys.luckySpinHistory(page),
    queryFn: () => luckySpinApi.history(page),
    enabled: visible,
  });

  useEffect(() => {
    if (error) toast.error(apiErrorMessage(error) ?? t("historyFailed"));
  }, [error, toast, t]);

  const close = () => {
    setPage(1);
    onClose();
  };

  const rows = data?.data ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: SCRIM.popupStrong }]} onPress={close} />
      <View style={styles.center} pointerEvents="box-none">
        <View style={[styles.frame, { backgroundColor: LUCKY_SPIN.rewardCard }]}>
          <View style={styles.header}>
            <Image source={historyIcon} style={styles.headerIcon} contentFit="contain" />
            <ThemedText style={styles.headerText}>{t("history")}</ThemedText>
            <CloseImageButton size={24} bordered={false} onPress={close} style={styles.headerClose} />
          </View>

          <View style={[styles.table, { backgroundColor: LUCKY_SPIN.historyTable }]}>
            <Row
              header
              cells={[t("day"), t("reward"), t("amount"), t("wallet"), t("status")]}
            />
            <ScrollView style={styles.body}>
              {isFetching && !data ? (
                <ActivityIndicator style={styles.state} color={LUCKY_SPIN.text} />
              ) : rows.length === 0 ? (
                <ThemedText style={[styles.cell, styles.state]}>{t("doNotHaveHistory")}</ThemedText>
              ) : (
                rows.map((item, index) => <HistoryRow key={`${item.createdAt}-${index}`} item={item} language={i18n.language} />)
              )}
            </ScrollView>
          </View>

          {data && data.totalElements > 0 && totalPages > 1 ? (
            <View style={styles.pagination}>
              <PageButton icon="back" label={t("previousPage")} disabled={page <= 1} onPress={() => setPage(page - 1)} />
              <ThemedText style={styles.pageText}>
                {page} / {totalPages}
              </ThemedText>
              <PageButton icon="forward" label={t("nextPage")} disabled={page >= totalPages} onPress={() => setPage(page + 1)} />
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function HistoryRow({ item, language }: { item: LuckySpinHistoryItem; language: string }) {
  const { t } = useTranslation();
  const walletKey = WALLET_LABELS[item.rewardWallet];
  const status = STATUS[item.status];
  return (
    <Row
      cells={[
        dayMonth(item.createdAt),
        getMultilingualValue(item, "luckySpinName", language) || item.luckySpinName,
        `${item.rewardValue} HTG`,
        walletKey ? t(walletKey) : item.rewardWallet,
        status ? t(status.label) : item.status,
      ]}
      cellStyles={[undefined, styles.bold, styles.amount, undefined, status?.color ? { color: status.color } : undefined]}
    />
  );
}

function Row({
  cells,
  header = false,
  cellStyles = [],
}: {
  cells: string[];
  header?: boolean;
  cellStyles?: (object | undefined)[];
}) {
  return (
    <View style={[styles.row, header && styles.headerRow]}>
      {cells.map((cell, index) => (
        <ThemedText
          key={index}
          style={[styles.cell, { flex: COLUMNS[index] }, header && styles.headerCell, cellStyles[index]]}
        >
          {cell}
        </ThemedText>
      ))}
    </View>
  );
}

function PageButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: "back" | "forward";
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={[styles.pageButton, disabled && styles.pageDisabled]}
    >
      <View style={icon === "back" ? styles.flip : undefined}>
        <Icon name="chevronRight" size={18} color={LUCKY_SPIN.text} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  frame: {
    width: "95%",
    maxWidth: 520,
    maxHeight: "80%",
    borderRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 10,
    paddingBottom: 12,
    gap: 12,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  headerIcon: { width: 28, height: 28 },
  headerText: { color: LUCKY_SPIN.text, fontSize: 18, fontWeight: "700", textTransform: "uppercase" },
  headerClose: { position: "absolute", right: 4 },
  table: { borderRadius: 12, maxHeight: 360, overflow: "hidden" },
  body: { maxHeight: 300 },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 8, gap: 4 },
  headerRow: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: LUCKY_SPIN.sectorEdge },
  cell: { color: LUCKY_SPIN.text, fontSize: 12, textAlign: "center" },
  headerCell: { fontWeight: "700", textTransform: "uppercase" },
  bold: { fontWeight: "700" },
  amount: { color: LUCKY_SPIN.amount, fontWeight: "700" },
  state: { paddingVertical: 24, textAlign: "center" },
  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 },
  pageButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  pageDisabled: { opacity: 0.35 },
  pageText: { color: LUCKY_SPIN.text, fontSize: 13, fontWeight: "600" },
  flip: { transform: [{ scaleX: -1 }] },
});
