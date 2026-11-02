import type { TextStyle } from "react-native";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import type { FontFamilyDefinition } from "expo-font";

import { FONT_FAMILY } from "./font-family";

export { FONT_FAMILY };

export const fontFamilies: FontFamilyDefinition[] = [
  {
    fontFamily: FONT_FAMILY,
    fontDefinitions: [
      { path: Inter_400Regular, weight: 400, style: "normal" },
      { path: Inter_500Medium, weight: 500, style: "normal" },
      { path: Inter_600SemiBold, weight: 600, style: "normal" },
      { path: Inter_700Bold, weight: 700, style: "normal" },
    ],
  },
];

/** Text styles without color; color comes from the active theme. */
export const type = {
  /** Form title (spec §6: 20px, 700). */
  title: { fontFamily: FONT_FAMILY, fontSize: 20, fontWeight: "700" },
  /** Submit button label (16px). */
  button: { fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: "600" },
  /** Input text (15px). */
  input: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: "400" },
  /** Body text: 14px on mobile (web ≤ 899px). */
  body: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: "400" },
  /** Links such as "Forgot password" (brand color, 600). */
  link: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: "600" },
  caption: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: "400" },
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;
