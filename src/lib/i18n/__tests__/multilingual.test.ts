import { describe, expect, it } from "@jest/globals";

import { getMultilingualValue } from "@/lib/i18n/multilingual";

describe("getMultilingualValue (web multilingualUtils)", () => {
  it("tries camelCase, snake_case, nested and JSON forms, then the plain field", () => {
    expect(getMultilingualValue({ nameVi: "Xin chào", name: "Hello" }, "name", "vi")).toBe("Xin chào");
    expect(getMultilingualValue({ name_vi: "A", name: "B" }, "name", "vi")).toBe("A");
    expect(getMultilingualValue({ name: { vi: "C", en: "D" } }, "name", "vi")).toBe("C");
    expect(getMultilingualValue({ name: '{"en":"E","vi":"F"}' }, "name", "vi")).toBe("F");
    expect(getMultilingualValue({ name: "Plain" }, "name", "vi")).toBe("Plain");
    expect(getMultilingualValue(null, "name", "vi")).toBe("");
  });
});
