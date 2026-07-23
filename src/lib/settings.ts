import { isSupportedTimeZone } from "./date";
import type { UserSettings } from "../types/settings";

export interface UserSettingsErrors {
  currencyCode?: string;
  locale?: string;
  timeZone?: string;
}

export function validateUserSettings(settings: UserSettings): UserSettingsErrors {
  const errors: UserSettingsErrors = {};
  const currencyCode = settings.currencyCode.trim().toUpperCase();
  const locale = settings.locale.trim();
  const timeZone = settings.timeZone.trim();

  try {
    new Intl.NumberFormat(locale, { style: "currency", currency: currencyCode }).format(0);
  } catch {
    errors.currencyCode = "Choose a valid ISO currency code.";
  }

  try {
    new Intl.DateTimeFormat(locale).format();
  } catch {
    errors.locale = "Choose a valid locale.";
  }

  if (!isSupportedTimeZone(timeZone)) {
    errors.timeZone = "Choose a valid IANA timezone.";
  }

  return errors;
}

export function normalizeUserSettings(settings: UserSettings): UserSettings {
  return {
    currencyCode: settings.currencyCode.trim().toUpperCase(),
    locale: settings.locale.trim(),
    timeZone: settings.timeZone.trim()
  };
}
