// Localized value of an API field (web src/utils/multilingualUtils.ts `getMultilingualValue`).
// Tries `nameVi`, `name_vi`, `name.vi`, then a JSON string `{"vi":…}`, then the plain field.

const LANG_SUFFIX: Record<string, string> = { vi: "Vi", en: "En", fr: "Fr", ht: "Ht", bu: "Bu" };

export function getMultilingualValue(data: unknown, field: string, language: string): string {
  if (!data || typeof data !== "object") return "";
  const record = data as Record<string, unknown>;

  const camel = record[`${field}${LANG_SUFFIX[language] ?? "En"}`];
  if (camel) return String(camel);

  const snake = record[`${field}_${language}`];
  if (snake) return String(snake);

  const value = record[field];
  if (value && typeof value === "object") {
    const nested = (value as Record<string, unknown>)[language];
    if (nested) return String(nested);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as Record<string, unknown> | null;
      if (parsed && typeof parsed === "object" && parsed[language]) return String(parsed[language]);
    } catch {
      // Not JSON: fall through to the plain value.
    }
  }
  return typeof value === "string" ? value : "";
}
