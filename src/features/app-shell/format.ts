// Display helpers copied from the web header, drawer and ticker. [WEB-PARITY] Numbers are always
// formatted en-US, whatever the app language, as on the web.

const amountFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const wholeFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** Wallet card amount: 0–2 decimals (web WalletMenu/Sidebar `money`). */
export function formatMoney(value: number | null | undefined): string {
  return amountFormat.format(Number(value ?? 0));
}

/** Header wallet button: decimals cut off, not rounded (web `wholeMoney`). */
export function formatWholeMoney(value: number | null | undefined): string {
  return wholeFormat.format(Math.trunc(Number(value ?? 0)));
}

/** 20000 → "20K", 1500 → "1.5K", 999 → "999" (web utils `formatAmountK`). */
export function formatAmountK(amount: number | string | null | undefined): string {
  if (amount === undefined || amount === null) return "0";
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(value)) return "0";
  if (value >= 1000) {
    const k = value / 1000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return value.toString();
}

/** "50933312" → "509***12"; shorter than 6 characters is shown as is (web `maskMsisdn`). */
export function maskMsisdn(msisdn: string): string {
  if (!msisdn || msisdn.length < 6) return msisdn;
  return `${msisdn.slice(0, 3)}***${msisdn.slice(-2)}`;
}

/** Avatar letters (web utils/initials): two words → first letters, one word → first three. */
export function initials(name: string): string {
  const parts = name.replace(/[^\p{L}\p{N}' ]/gu, "").split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// ---- King of Odds countdown (web noti.winning CountdownTimer) -------------------------------

const HAITI_TIME_ZONE = "America/Port-au-Prince";

/** Haiti wall-clock time as a local Date, the way the web compares it. */
export function haitiWallClock(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: HAITI_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
  // "24" can appear for midnight with hour12:false in some engines.
  return new Date(part("year"), part("month") - 1, part("day"), part("hour") % 24, part("minute"), part("second"));
}

/** End of `endDate` ("YYYY-MM-DD") at 23:59:59, or null when the date is invalid. */
export function countdownEnd(endDate: string | null | undefined): Date | null {
  if (!endDate) return null;
  const end = new Date(`${endDate}T23:59:59`);
  return Number.isNaN(end.getTime()) ? null : end;
}

export type CountdownLabel =
  | { unit: "days" | "hours" | "minutes" | "seconds"; count: number };

/** Largest non-zero unit left, as the web chip shows it ("3 days left", …, "0 sec left"). */
export function countdownLabel(end: Date, haitiNow: Date): CountdownLabel {
  const diff = end.getTime() - haitiNow.getTime();
  if (diff <= 0) return { unit: "seconds", count: 0 };
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  if (days > 0) return { unit: "days", count: days };
  if (hours > 0) return { unit: "hours", count: hours };
  if (minutes > 0) return { unit: "minutes", count: minutes };
  return { unit: "seconds", count: seconds };
}
