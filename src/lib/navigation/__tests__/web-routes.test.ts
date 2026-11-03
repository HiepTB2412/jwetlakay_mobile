import { describe, expect, it } from "@jest/globals";

import { resolveWebTarget } from "@/lib/navigation/web-routes";

describe("resolveWebTarget", () => {
  it("maps known web paths to app routes", () => {
    expect(resolveWebTarget("/")).toEqual({ kind: "route", href: "/" });
    expect(resolveWebTarget("/auth/login?x=1")).toEqual({ kind: "route", href: "/auth/login" });
  });

  it("treats URLs on the web's domain as in-app paths", () => {
    expect(resolveWebTarget("https://jwetlakay.com/auth/register")).toEqual({ kind: "route", href: "/auth/register" });
    // Production King of Odds destinationUrl: no news screen yet.
    expect(resolveWebTarget("https://jwetlakay.com/news/detail/41")).toEqual({
      kind: "unavailable",
      path: "/news/detail/41",
    });
  });

  it("opens other sites outside the app", () => {
    expect(resolveWebTarget("https://example.org/a")).toEqual({ kind: "external", url: "https://example.org/a" });
  });

  it("reports screens that are not built yet", () => {
    expect(resolveWebTarget("/profile/deposit/")).toEqual({ kind: "unavailable", path: "/profile/deposit" });
  });
});
