import { Host, Switch as NativeSwitch } from "@expo/ui";
import { Image } from "expo-image";
import { usePathname } from "expo-router";
import { useState, type ReactNode } from "react";
import { Linking, Platform, Pressable, StyleSheet, Switch, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AnchoredPopover, useAnchoredPopover } from "@/components/anchored-popover";
import { ConfirmModal } from "@/components/confirm-modal";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/features/auth";
import { useBalance } from "@/features/wallet";
import { setLanguage, SUPPORTED_LANGUAGES, type Language } from "@/i18n";
import { useOpenWebPath } from "@/lib/navigation/use-web-navigation";
import { WEB_PATHS } from "@/lib/navigation/web-routes";
import { useTheme, WALLET } from "@/theme";

import { formatMoney, initials } from "./format";
import { Icon, type IconName } from "./icon";

// Drawer body (web Sidebar `fromModal` + NavLinkItem, spec Phần B §3.6). [WEB-PARITY] Same rows,
// order and visibility rules as the web; icons are platform symbols instead of the web's SVGs.

const logoWideDark = require("@/assets/images/logo-wide-dark.png");
const logoWideLight = require("@/assets/images/logo-wide-light.png");
const whatsappIcon = require("@/assets/icons/whatsapp.svg");
const facebookIcon = require("@/assets/icons/facebook.svg");

/** Web ContactLink (spec Phần B §6.8): WhatsApp, then Facebook. */
const CONTACT_LINKS = [
  { key: "whatsapp", icon: whatsappIcon, url: "https://wa.me/50933399045?text=I%20have%20a%20question%20about%20Jwetlakay" },
  { key: "facebook", icon: facebookIcon, url: "https://www.facebook.com/jwetlakay.haiti" },
] as const;

/** Language names are shown in their own language. Web offers en/ht/fr; the app ships en/vi. */
const LANGUAGE_NAMES: Record<Language, string> = { en: "English", vi: "Tiếng Việt" };

export function DrawerContent({ onClose }: { onClose: () => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("close")}
        hitSlop={8}
        onPress={onClose}
        style={styles.closeButton}
      >
        <Icon name="close" size={28} color={colors.muted} />
      </Pressable>
      {isAuthenticated ? <MemberSection onClose={onClose} /> : <GuestSection onClose={onClose} />}
    </View>
  );
}

// ---- Guest ----------------------------------------------------------------------------------

function GuestSection({ onClose }: { onClose: () => void }) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const pathname = usePathname();
  const openWebPath = useOpenWebPath();

  return (
    <>
      <Image
        source={isDark ? logoWideDark : logoWideLight}
        style={styles.guestLogo}
        contentFit="contain"
        accessibilityLabel="Jwetlakay"
      />
      <View style={[styles.section, { borderTopColor: colors.border }]}>
        <DrawerRow
          icon="promo"
          label={t("promotion")}
          active={pathname === WEB_PATHS.promotions}
          onPress={() => {
            onClose();
            openWebPath(WEB_PATHS.promotions);
          }}
          trailing="chevron"
        />
        <DrawerExtras />
      </View>
    </>
  );
}

// ---- Signed in ------------------------------------------------------------------------------

function MemberSection({ onClose }: { onClose: () => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { data: balance } = useBalance();
  const pathname = usePathname();
  const openWebPath = useOpenWebPath();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const go = (path: string) => {
    onClose();
    openWebPath(path);
  };

  const displayName = user?.fullName || user?.username || "";

  const wallets: { label: string; value: number | null | undefined; color: string; tintAmount?: boolean }[] = [
    { label: t("mainWallet"), value: balance?.gold, color: WALLET.main },
    { label: t("promotionWallet"), value: balance?.point, color: WALLET.promo, tintAmount: true },
  ];
  // [WEB-PARITY] The drawer shows Free Bet whenever the field is present (even 0); the header menu only when non-zero.
  if (balance?.freeBet !== undefined) wallets.push({ label: t("freeBetWallet"), value: balance.freeBet, color: WALLET.freeBet });
  if (user?.accountType === "AGENT") wallets.push({ label: t("commissionWallet"), value: balance?.commission, color: WALLET.commission });

  const pages: { icon: IconName; label: string; path: string }[] = [
    { icon: "chart", label: t("transactionHistory"), path: WEB_PATHS.transactionsHistory },
    { icon: "ticket", label: t("betHistory"), path: WEB_PATHS.betsHistory },
    { icon: "bell", label: t("notification"), path: WEB_PATHS.notifications },
    { icon: "people", label: t("inviteFriends"), path: WEB_PATHS.invite },
    { icon: "user", label: t("profile"), path: WEB_PATHS.information },
  ];

  const onWithdraw = pathname === WEB_PATHS.withdraw;

  return (
    <>
      <View style={styles.who}>
        <View style={[styles.avatar, { backgroundColor: colors.brand }]}>
          <ThemedText style={[styles.avatarText, { color: colors.onBrand }]}>{initials(displayName)}</ThemedText>
        </View>
        <View style={styles.whoText}>
          <ThemedText numberOfLines={1} style={styles.whoName}>
            {displayName}
          </ThemedText>
          <ThemedText style={[styles.whoType, { color: colors.muted }]}>
            {user?.accountType === "EU" ? t("endUser") : t("agent")}
          </ThemedText>
        </View>
      </View>

      <View style={styles.wallets}>
        {wallets.map((wallet) => (
          <View
            key={wallet.label}
            style={[styles.wallet, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
          >
            <View style={[styles.walletIcon, { backgroundColor: colors.brandSoft }]}>
              <Icon name="wallet" size={18} color={wallet.color} />
            </View>
            <ThemedText style={[styles.walletLabel, { color: wallet.color }]}>{wallet.label}</ThemedText>
            <ThemedText style={[styles.walletAmount, wallet.tintAmount && { color: wallet.color }]}>
              {formatMoney(wallet.value)} HTG
            </ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.accountButtons}>
        <AccountButton label={t("withdraw")} on={onWithdraw} onPress={() => go(WEB_PATHS.withdraw)} />
        <AccountButton label={t("deposit")} on={!onWithdraw} onPress={() => go(WEB_PATHS.deposit)} />
      </View>

      <View style={[styles.section, { borderTopColor: colors.border }]}>
        {pages.map((page) => (
          <DrawerRow
            key={page.path}
            icon={page.icon}
            label={page.label}
            active={pathname === page.path}
            onPress={() => go(page.path)}
          />
        ))}
        <DrawerRow icon="logout" label={t("logOut")} tone="danger" onPress={() => setConfirmLogout(true)} />
      </View>

      <View style={[styles.section, { borderTopColor: colors.border }]}>
        <DrawerExtras />
      </View>

      <ConfirmModal
        visible={confirmLogout}
        title={t("logOut")}
        description={t("logoutDescription")}
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false);
          onClose();
          void logout();
        }}
      />
    </>
  );
}

function AccountButton({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.accountButton,
        on
          ? { backgroundColor: colors.brand, borderColor: colors.brand }
          : { backgroundColor: "transparent", borderColor: colors.borderStrong },
      ]}
    >
      <ThemedText style={[styles.accountButtonText, { color: on ? colors.onBrand : colors.text }]}>{label}</ThemedText>
    </Pressable>
  );
}

// ---- Rows -----------------------------------------------------------------------------------

/** Contact, theme and language rows shown at the bottom for everyone (web `drawerExtras`). */
function DrawerExtras() {
  const { t, i18n } = useTranslation();
  const { colors, isDark, mode, toggleTheme } = useTheme();
  const language = (SUPPORTED_LANGUAGES as readonly string[]).includes(i18n.language)
    ? (i18n.language as Language)
    : "en";

  return (
    <>
      {/* [WEB-PARITY] The row itself does nothing; only the icons open links. */}
      <DrawerRow
        icon="phone"
        label={t("contact")}
        trailing={
          <View style={styles.contactLinks}>
            {CONTACT_LINKS.map((link) => (
              <Pressable
                key={link.key}
                accessibilityRole="link"
                accessibilityLabel={link.key}
                hitSlop={6}
                onPress={() => Linking.openURL(link.url).catch(() => {})}
              >
                <Image source={link.icon} style={styles.contactIcon} contentFit="contain" />
              </Pressable>
            ))}
          </View>
        }
      />
      {/* Toggling keeps the drawer open (spec Phần G §8.4).
          iOS: SwiftUI switch tinted with the brand color (RN's UISwitch is mis-sized on iOS 26).
          Android: RN Switch, because the Compose switch derives a Material palette from the seed
          color (brownish off state) and takes no track/thumb colors. */}
      <DrawerRow
        icon="theme"
        label={t("theme")}
        trailing={
          Platform.OS === "ios" ? (
            <Host matchContents colorScheme={mode} seedColor={colors.brand}>
              <NativeSwitch value={isDark} onValueChange={toggleTheme} />
            </Host>
          ) : (
            <Switch
              accessibilityLabel={t("theme")}
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.borderStrong, true: colors.brand }}
              thumbColor={colors.onBrand}
            />
          )
        }
      />
      {/* [WEB-PARITY] The drawer changes the app language only; it does not call PUT account/info. */}
      <DrawerRow icon="language" label={t("language")} trailing={<LanguageSelect value={language} />} />
    </>
  );
}

/**
 * Language dropdown (web react-select in NavLinkItem). Not the @expo/ui Picker: on Android it
 * renders a full-size Material text-field dropdown that overflows the drawer row.
 */
function LanguageSelect({ value }: { value: Language }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { triggerRef, anchor, open, toggle, close } = useAnchoredPopover();

  return (
    <>
      <Pressable
        ref={triggerRef}
        accessibilityRole="button"
        accessibilityLabel={`${t("language")}: ${LANGUAGE_NAMES[value]}`}
        accessibilityState={{ expanded: open }}
        hitSlop={6}
        onPress={toggle}
        style={styles.select}
      >
        <ThemedText style={[styles.selectText, { color: colors.brand }]}>{LANGUAGE_NAMES[value]}</ThemedText>
        <Icon name="chevronDown" size={14} color={colors.brand} />
      </Pressable>
      <AnchoredPopover anchor={anchor} onClose={close} width={180} style={styles.options}>
        {SUPPORTED_LANGUAGES.map((code) => {
          const selected = code === value;
          return (
            <Pressable
              key={code}
              accessibilityRole="menuitem"
              accessibilityState={{ selected }}
              onPress={() => {
                close();
                if (!selected) void setLanguage(code);
              }}
              style={[styles.option, selected && { backgroundColor: colors.brandSoft }]}
            >
              <ThemedText style={[styles.optionText, { color: selected ? colors.brand : colors.text }]}>
                {LANGUAGE_NAMES[code]}
              </ThemedText>
              {selected ? <Icon name="check" size={16} color={colors.brand} /> : null}
            </Pressable>
          );
        })}
      </AnchoredPopover>
    </>
  );
}

type DrawerRowProps = {
  icon: IconName;
  label: string;
  onPress?: () => void;
  active?: boolean;
  tone?: "danger";
  /** "chevron" = navigation row; a node = control on the right. */
  trailing?: "chevron" | ReactNode;
};

function DrawerRow({ icon, label, onPress, active = false, tone, trailing }: DrawerRowProps) {
  const { colors } = useTheme();
  const tint = tone === "danger" ? colors.live : active ? colors.brand : colors.muted;

  const body = (
    <>
      {active ? <View style={[styles.activeBar, { backgroundColor: colors.brand }]} /> : null}
      <View style={styles.rowStart}>
        <Icon name={icon} size={20} color={tint} />
        <ThemedText style={[styles.rowLabel, { color: tint }]}>{label}</ThemedText>
      </View>
      {trailing === "chevron" ? <Icon name="chevronRight" size={18} color={colors.muted} /> : trailing}
    </>
  );

  // Rows that only host a control (contact links, theme switch, language picker) stay plain views,
  // so the control receives touches and is its own accessibility element.
  if (!onPress) return <View style={styles.row}>{body}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.row, active && { backgroundColor: colors.brandSoft }]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 14, gap: 12 },
  closeButton: { position: "absolute", top: 10, right: 10, zIndex: 1 },
  guestLogo: { width: 200, height: 20, marginTop: 4 },
  who: { flexDirection: "row", alignItems: "center", gap: 12, paddingRight: 36 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 13, fontWeight: "700" },
  whoText: { flex: 1, minWidth: 0 },
  whoName: { fontSize: 18, fontWeight: "700" },
  whoType: { fontSize: 13 },
  wallets: { gap: 6 },
  wallet: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  walletIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  walletLabel: { fontSize: 14 },
  walletAmount: { marginLeft: "auto", fontSize: 14, fontWeight: "700", fontVariant: ["tabular-nums"] },
  accountButtons: { flexDirection: "row", gap: 8 },
  accountButton: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  accountButtonText: { fontSize: 14, fontWeight: "700" },
  /** Web Sidebar `PNav` / `Extras`: a divider line above each group of rows. */
  section: { gap: 2, borderTopWidth: 1, paddingTop: 10 },
  row: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  activeBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3, borderTopLeftRadius: 10, borderBottomLeftRadius: 10 },
  rowStart: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 },
  rowLabel: { fontSize: 14, fontWeight: "600" },
  contactLinks: { flexDirection: "row", alignItems: "center", gap: 8 },
  contactIcon: { width: 24, height: 24 },
  select: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6 },
  selectText: { fontSize: 15, fontWeight: "500" },
  options: { padding: 6, gap: 2 },
  option: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionText: { fontSize: 15, fontWeight: "500" },
});
