import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import { en } from "./locales/en";
import { vi } from "./locales/vi";

export type { TranslationKey } from "./locales/en";

// English + Vietnamese only (project rule). The web also ships ht/fr with "ht" as default
// (spec Phần B §0.8); add them to `resources` + SUPPORTED_LANGUAGES when approved.
export const SUPPORTED_LANGUAGES = ["en", "vi"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

/** Same key as the web client (`localStorage["language"]`). */
const STORAGE_KEY = "language";

export function isSupportedLanguage(value: unknown): value is Language {
  return SUPPORTED_LANGUAGES.includes(value as Language);
}

const deviceLanguage = getLocales()[0]?.languageCode;

const i18n = createInstance();

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, vi: { translation: vi } },
  lng: isSupportedLanguage(deviceLanguage) ? deviceLanguage : "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

/** Applies the language saved by the user, if any. Resolve before hiding the splash. */
export const languageReady: Promise<void> = AsyncStorage.getItem(STORAGE_KEY)
  .then(async (saved) => {
    if (isSupportedLanguage(saved) && saved !== i18n.language) await i18n.changeLanguage(saved);
  })
  .catch(() => {
    // Unreadable storage keeps the device language.
  });

export async function setLanguage(language: Language): Promise<void> {
  await i18n.changeLanguage(language);
  AsyncStorage.setItem(STORAGE_KEY, language).catch(() => {});
}

/** After account/info: follow the profile language when the app supports it (spec Phần B §0.8). */
export function applyUserLanguage(language: string | null | undefined): void {
  if (isSupportedLanguage(language) && language !== i18n.language) void setLanguage(language);
}

export default i18n;
