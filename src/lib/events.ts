import { DeviceEventEmitter } from "react-native";

// App-wide events that the web sends as window events.

const DEPOSIT_SUCCESS = "depositSuccess";

/** Web `window.dispatchEvent(new Event("depositSuccess"))` after a confirmed deposit. */
export function emitDepositSuccess(): void {
  DeviceEventEmitter.emit(DEPOSIT_SUCCESS);
}

export function onDepositSuccess(listener: () => void): () => void {
  const subscription = DeviceEventEmitter.addListener(DEPOSIT_SUCCESS, listener);
  return () => subscription.remove();
}
