import { describe, expect, it } from "vitest";
import { formatCurrencyForSettings, formatDateOnly, getCurrencySymbol } from "./formatting";

const philippines = {
  currencyCode: "PHP",
  locale: "en-PH",
  timeZone: "Asia/Manila"
};

describe("settings-aware formatting", () => {
  it("formats currency and exposes the localized symbol", () => {
    expect(formatCurrencyForSettings(1234.5, philippines)).toContain("1,234.50");
    expect(getCurrencySymbol(philippines)).toBe("₱");
  });

  it("formats date-only values without timezone drift", () => {
    expect(formatDateOnly("2026-07-22", philippines)).toContain("2026");
  });

  it("falls back safely for invalid locale or currency settings", () => {
    expect(
      formatCurrencyForSettings(10, {
        currencyCode: "not-currency",
        locale: "not-a-locale",
        timeZone: "UTC"
      })
    ).toContain("10.00");
    expect(
      getCurrencySymbol({
        currencyCode: "not-currency",
        locale: "not-a-locale",
        timeZone: "UTC"
      })
    ).toBe("₱");
  });
});
