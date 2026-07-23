import { describe, expect, it } from "vitest";
import { DEFAULT_TIME_ZONE, isSupportedTimeZone, toDateInputValue } from "./date";

describe("toDateInputValue", () => {
  it("uses the configured timezone at a date boundary", () => {
    const date = new Date("2026-07-21T16:30:00.000Z");

    expect(toDateInputValue(date, "Asia/Manila")).toBe("2026-07-22");
    expect(toDateInputValue(date, "America/Los_Angeles")).toBe("2026-07-21");
  });

  it("falls back to the production default for an invalid timezone", () => {
    const date = new Date("2026-07-21T16:30:00.000Z");

    expect(toDateInputValue(date, "Not/A_Zone")).toBe(toDateInputValue(date, DEFAULT_TIME_ZONE));
  });
});

describe("isSupportedTimeZone", () => {
  it("accepts IANA timezones and rejects invalid values", () => {
    expect(isSupportedTimeZone("Asia/Manila")).toBe(true);
    expect(isSupportedTimeZone("Not/A_Zone")).toBe(false);
  });
});
