import type { Href } from "expo-router";

/**
 * Where to go after login (web `returnUrl`, spec Phần B §1.1 "Sau thành công").
 * Only in-app paths are accepted; auth screens and anything else fall back to Home.
 */
export function resolveReturnTo(value: string | string[] | undefined): Href {
  const path = Array.isArray(value) ? value[0] : value;
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/auth")) return "/";
  return path as Href;
}
