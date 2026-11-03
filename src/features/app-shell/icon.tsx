import { SymbolView } from "expo-symbols";
import type { ColorValue } from "react-native";

// App-shell icons: SF Symbols on iOS, Material symbols on Android/web, like the auth screens.
// The web draws its own SVGs (demoIcons, Sidebar icons); these are the closest platform glyphs.
const ICONS = {
  menu: { ios: "line.3.horizontal", android: "menu", web: "menu" },
  close: { ios: "xmark", android: "close", web: "close" },
  chevronDown: { ios: "chevron.down", android: "expand_more", web: "expand_more" },
  chevronRight: { ios: "chevron.right", android: "chevron_right", web: "chevron_right" },
  play: { ios: "play.fill", android: "play_arrow", web: "play_arrow" },
  check: { ios: "checkmark", android: "check", web: "check" },
  wallet: { ios: "wallet.pass", android: "account_balance_wallet", web: "account_balance_wallet" },
  chart: { ios: "chart.bar", android: "bar_chart", web: "bar_chart" },
  ticket: { ios: "ticket", android: "confirmation_number", web: "confirmation_number" },
  bell: { ios: "bell", android: "notifications", web: "notifications" },
  people: { ios: "person.2", android: "group", web: "group" },
  user: { ios: "person", android: "person", web: "person" },
  logout: { ios: "rectangle.portrait.and.arrow.right", android: "logout", web: "logout" },
  promo: { ios: "gift", android: "redeem", web: "redeem" },
  phone: { ios: "phone", android: "call", web: "call" },
  theme: { ios: "circle.lefthalf.filled", android: "contrast", web: "contrast" },
  language: { ios: "globe", android: "language", web: "language" },
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color: ColorValue }) {
  // SymbolView's name typing is a union of known symbols; the table above uses valid names.
  return <SymbolView name={ICONS[name] as never} size={size} tintColor={color as string} />;
}
