import AsyncStorage from "@react-native-async-storage/async-storage";

// Web cookie `lucky_spin_visited` (src/utils/cookieUtils.ts, spec Phần B §6.5): the timestamp of
// the last signed-in visit, valid 20 days. While valid, guests do not see the Lucky Spin button.
// Logout does not clear it (web behavior).

const KEY = "lucky_spin_visited";
const VALID_MS = 20 * 24 * 60 * 60 * 1000;

export async function markLuckySpinVisited(): Promise<void> {
  await AsyncStorage.setItem(KEY, String(Date.now())).catch(() => {});
}

export async function hasVisitedWithinPeriod(now: number = Date.now()): Promise<boolean> {
  try {
    const value = Number(await AsyncStorage.getItem(KEY));
    return Number.isFinite(value) && value > 0 && now - value < VALID_MS;
  } catch {
    return false;
  }
}

/** Extends the 20 days from now, only if still valid. */
export async function refreshLuckySpinVisited(): Promise<void> {
  if (await hasVisitedWithinPeriod()) await markLuckySpinVisited();
}
