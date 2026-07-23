import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { formatCurrencyForSettings, formatDateOnly, getCurrencySymbol } from "../lib/formatting";
import { normalizeUserSettings, validateUserSettings } from "../lib/settings";
import { loadUserSettings, saveUserSettings } from "../lib/storage";
import { DEFAULT_USER_SETTINGS, type UserSettings } from "../types/settings";

export interface UserSettingsContextValue {
  settings: UserSettings;
  isLoading: boolean;
  isSaving: boolean;
  error: string;
  currencySymbol: string;
  formatCurrency: (value: number) => string;
  formatDate: (date: string) => string;
  refreshSettings: () => Promise<void>;
  updateSettings: (settings: UserSettings) => Promise<UserSettings>;
}

const UserSettingsContext = createContext<UserSettingsContextValue | undefined>(undefined);

export function UserSettingsProvider({
  children,
  userId
}: {
  children: ReactNode;
  userId: string;
}) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const refreshSettings = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      setSettings(await loadUserSettings(userId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load account settings.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  const updateSettings = useCallback(
    async (nextSettings: UserSettings) => {
      const normalized = normalizeUserSettings(nextSettings);
      const validationErrors = validateUserSettings(normalized);

      if (Object.keys(validationErrors).length > 0) {
        throw new Error(Object.values(validationErrors)[0]);
      }

      setIsSaving(true);
      setError("");

      try {
        const saved = await saveUserSettings(userId, normalized);
        setSettings(saved);
        return saved;
      } catch (saveError) {
        const message =
          saveError instanceof Error ? saveError.message : "Unable to save account settings.";
        setError(message);
        throw new Error(message);
      } finally {
        setIsSaving(false);
      }
    },
    [userId]
  );

  const value = useMemo<UserSettingsContextValue>(
    () => ({
      settings,
      isLoading,
      isSaving,
      error,
      currencySymbol: getCurrencySymbol(settings),
      formatCurrency: (value) => formatCurrencyForSettings(value, settings),
      formatDate: (date) => formatDateOnly(date, settings),
      refreshSettings,
      updateSettings
    }),
    [error, isLoading, isSaving, refreshSettings, settings, updateSettings]
  );

  return <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>;
}

export function useUserSettings(): UserSettingsContextValue {
  const context = useContext(UserSettingsContext);

  if (!context) {
    throw new Error("useUserSettings must be used inside UserSettingsProvider.");
  }

  return context;
}
