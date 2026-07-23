export const supportedCurrencyCodes = [
  "PHP",
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "AUD",
  "CAD",
  "SGD"
] as const;

export const supportedLocales = ["en-PH", "fil-PH", "en-US", "en-GB"] as const;

export const supportedTimeZones = [
  "Asia/Manila",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Europe/London",
  "Europe/Paris",
  "America/Los_Angeles",
  "America/New_York",
  "UTC"
] as const;

export interface UserSettings {
  currencyCode: string;
  locale: string;
  timeZone: string;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  currencyCode: "PHP",
  locale: "en-PH",
  timeZone: "Asia/Manila"
};
