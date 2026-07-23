import { DEFAULT_USER_SETTINGS, type UserSettings } from "../types/settings";

export function formatCurrencyForSettings(
  value: number,
  settings: UserSettings = DEFAULT_USER_SETTINGS
): string {
  try {
    return new Intl.NumberFormat(settings.locale, {
      style: "currency",
      currency: settings.currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch {
    return new Intl.NumberFormat(DEFAULT_USER_SETTINGS.locale, {
      style: "currency",
      currency: DEFAULT_USER_SETTINGS.currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
}

export function getCurrencySymbol(settings: UserSettings = DEFAULT_USER_SETTINGS): string {
  try {
    const parts = new Intl.NumberFormat(settings.locale, {
      style: "currency",
      currency: settings.currencyCode,
      currencyDisplay: "narrowSymbol"
    }).formatToParts(0);

    return parts.find((part) => part.type === "currency")?.value ?? settings.currencyCode;
  } catch {
    return getCurrencySymbol(DEFAULT_USER_SETTINGS);
  }
}

export function formatDateOnly(
  date: string,
  settings: UserSettings = DEFAULT_USER_SETTINGS
): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!match) {
    return date;
  }

  const [, year, month, day] = match;
  const value = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));

  try {
    return new Intl.DateTimeFormat(settings.locale, {
      timeZone: "UTC",
      dateStyle: "medium"
    }).format(value);
  } catch {
    return date;
  }
}
