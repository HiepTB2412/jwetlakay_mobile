import "i18next";

import type { en } from "./locales/en";

// Typed `t()` keys: a missing or misspelled key is a TypeScript error.
declare module "i18next" {
  interface CustomTypeOptions {
    resources: { translation: typeof en };
  }
}
