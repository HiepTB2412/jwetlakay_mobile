import { secureStorage } from "@/lib/secure-storage";

// "Remember me" (spec Phần B §1.1, Phần H §3). The web keeps the password in plain-text
// localStorage; here both values live in the Keychain/Keystore. Key names match the web.

const PHONE_KEY = "phone";
const PASSWORD_KEY = "password_phone";
const TYPE_KEY = "type_login";

export const rememberedLogin = {
  async get(): Promise<{ phone: string; password: string } | null> {
    try {
      const [phone, password] = await Promise.all([
        secureStorage.getItem(PHONE_KEY),
        secureStorage.getItem(PASSWORD_KEY),
      ]);
      return phone ? { phone, password: password ?? "" } : null;
    } catch {
      return null;
    }
  },

  async save(phone: string, password: string): Promise<void> {
    await Promise.all([
      secureStorage.setItem(PHONE_KEY, phone),
      secureStorage.setItem(PASSWORD_KEY, password),
      secureStorage.setItem(TYPE_KEY, "MSISDN"),
    ]).catch(() => {});
  },

  async clear(): Promise<void> {
    await Promise.all([PHONE_KEY, PASSWORD_KEY, TYPE_KEY].map((key) => secureStorage.removeItem(key))).catch(
      () => {},
    );
  },

  /** After a password reset the saved password is stale (the web forgets to clear it). */
  async clearPassword(): Promise<void> {
    await secureStorage.removeItem(PASSWORD_KEY).catch(() => {});
  },
};
