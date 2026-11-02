import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Keychain (iOS) / Keystore-encrypted prefs (Android) for tokens and remembered credentials.
// SecureStore has no web implementation, so the web build falls back to AsyncStorage
// (localStorage) — the same place the web client keeps these values today.

const useFallback = Platform.OS === "web";

export const secureStorage = {
  getItem(key: string): Promise<string | null> {
    return useFallback ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key);
  },
  setItem(key: string, value: string): Promise<void> {
    return useFallback ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(key, value);
  },
  removeItem(key: string): Promise<void> {
    return useFallback ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key);
  },
};
