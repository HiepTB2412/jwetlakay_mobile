import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

import { radius, sizes } from "./src/theme/metrics";
import { dark, light, WALLET, type ThemeTokens } from "./src/theme/tokens";
import { FONT_FAMILY } from "./src/theme/font-family";

// src/theme/tokens.ts stays the single source of truth: every color token
// becomes a CSS variable (light on :root, dark under prefers-color-scheme),
// so `bg-surface` follows the scheme ThemeProvider sets via Appearance.

type ColorToken = { [K in keyof ThemeTokens]: ThemeTokens[K] extends string ? K : never }[keyof ThemeTokens];

const colorTokens = (Object.keys(light) as (keyof ThemeTokens)[]).filter(
  (key): key is ColorToken => typeof light[key] === "string",
);

/** "#F26A0F" -> "242 106 15"; rgba() tokens are kept as-is (no opacity modifier). */
function channels(value: string) {
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
  if (!hex) return null;
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)).join(" ");
}

function cssVariables(tokens: ThemeTokens) {
  return Object.fromEntries(
    colorTokens.map((key) => [`--jw-${key}`, channels(tokens[key]) ?? tokens[key]]),
  );
}

const colors = Object.fromEntries(
  colorTokens.map((key) => [
    key,
    channels(light[key]) ? `rgb(var(--jw-${key}) / <alpha-value>)` : `var(--jw-${key})`,
  ]),
);

export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: { ...colors, wallet: WALLET },
      fontFamily: { sans: [FONT_FAMILY] },
      borderRadius: { md: `${radius.md}px` },
      height: { input: `${sizes.input}px`, "input-compact": `${sizes.inputCompact}px`, button: `${sizes.button}px` },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ":root": cssVariables(light),
        "@media (prefers-color-scheme: dark)": { ":root": cssVariables(dark) },
      });
    }),
  ],
} satisfies Config;
