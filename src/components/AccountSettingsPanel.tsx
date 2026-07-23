import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { validateNewPassword, type PasswordInputErrors } from "../lib/auth";
import { downloadBudgetBuddyExport } from "../lib/export";
import { getSupabaseClient } from "../lib/supabaseClient";
import { deleteOwnAccount } from "../lib/storage";
import { useUserSettings } from "../contexts/UserSettingsContext";
import {
  supportedCurrencyCodes,
  supportedLocales,
  supportedTimeZones,
  type UserSettings
} from "../types/settings";
import type { ExportFormat } from "../types/export";
import Turnstile from "./Turnstile";

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim();

export interface AccountSettingsPanelProps {
  userId: string;
  userEmail: string;
  isOffline?: boolean;
  pwaActions?: ReactNode;
  onAccountDeleted: () => void | Promise<void>;
  onBusyChange?: (isBusy: boolean) => void;
}

export default function AccountSettingsPanel({
  isOffline = false,
  onAccountDeleted,
  onBusyChange,
  pwaActions,
  userEmail,
  userId
}: AccountSettingsPanelProps) {
  const { settings, isLoading, isSaving, error: settingsError, updateSettings } = useUserSettings();
  const [draft, setDraft] = useState<UserSettings>(settings);
  const [isSettingsDirty, setIsSettingsDirty] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [reauthenticationNonce, setReauthenticationNonce] = useState("");
  const [isAwaitingReauthentication, setIsAwaitingReauthentication] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<PasswordInputErrors>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [deletionEmail, setDeletionEmail] = useState("");
  const [deletionPassword, setDeletionPassword] = useState("");
  const [deletionCaptchaToken, setDeletionCaptchaToken] = useState<string | null>(null);
  const [deletionCaptchaAttempt, setDeletionCaptchaAttempt] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const isBusy = isSaving || isChangingPassword || isDeleting || exporting !== null;

  useEffect(() => {
    onBusyChange?.(isBusy);
    return () => onBusyChange?.(false);
  }, [isBusy, onBusyChange]);

  useEffect(() => {
    if (!isSettingsDirty) {
      setDraft(settings);
    }
  }, [isSettingsDirty, settings]);

  async function handleSettingsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    try {
      const saved = await updateSettings(draft);
      setDraft(saved);
      setIsSettingsDirty(false);
      setStatus("Account settings saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save settings.");
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();
    const result = validateNewPassword(newPassword, passwordConfirmation);

    if (!result.isValid || !result.value) {
      setPasswordErrors(result.errors);
      return;
    }

    setPasswordErrors({});
    setIsChangingPassword(true);

    try {
      const supabase = getSupabaseClient();

      if (!isAwaitingReauthentication) {
        const { error: reauthenticationError } = await supabase.auth.reauthenticate();

        if (reauthenticationError) {
          throw reauthenticationError;
        }

        setIsAwaitingReauthentication(true);
        setStatus(
          "Enter the verification code sent to your email to finish changing your password."
        );
        return;
      }

      const nonce = reauthenticationNonce.trim();

      if (!nonce) {
        throw new Error("Enter the verification code sent to your email.");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: result.value,
        nonce
      });

      if (updateError) {
        throw updateError;
      }

      setNewPassword("");
      setPasswordConfirmation("");
      setReauthenticationNonce("");
      setIsAwaitingReauthentication(false);
      setStatus("Password updated.");
    } catch (passwordError) {
      setError(
        passwordError instanceof Error ? passwordError.message : "Unable to update password."
      );
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleExport(format: ExportFormat) {
    clearMessages();
    setExporting(format);

    try {
      await downloadBudgetBuddyExport(userId, userEmail, format);
      setStatus(`${format.toUpperCase()} export downloaded.`);
    } catch (exportError) {
      setError(
        exportError instanceof Error ? exportError.message : "Unable to export account data."
      );
    } finally {
      setExporting(null);
    }
  }

  async function handleDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    if (deletionEmail !== userEmail) {
      setError("Type your account email exactly to confirm deletion.");
      return;
    }

    if (!deletionPassword) {
      setError("Enter your current password to delete the account.");
      return;
    }

    if (turnstileSiteKey && !deletionCaptchaToken) {
      setError("Complete the security check before deleting your account.");
      return;
    }

    setIsDeleting(true);

    try {
      await deleteOwnAccount(
        {
          emailConfirmation: deletionEmail,
          currentPassword: deletionPassword
        },
        deletionCaptchaToken ?? undefined
      );
      await getSupabaseClient().auth.signOut({ scope: "local" });
      await onAccountDeleted();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete account.");
    } finally {
      setIsDeleting(false);
      setDeletionCaptchaToken(null);
      setDeletionCaptchaAttempt((attempt) => attempt + 1);
    }
  }

  function clearMessages() {
    setError("");
    setStatus("");
  }

  const writesDisabled = isOffline || isSaving || isChangingPassword || isDeleting;

  return (
    <div className="grid gap-xl text-on-surface">
      <header>
        <h2 className="text-headline-lg font-bold" id="account-settings-title">
          Account Settings
        </h2>
        <p className="mt-1 text-body-md text-on-surface-variant" id="account-settings-description">
          {userEmail}
        </p>
      </header>

      {isOffline && (
        <p role="status" className="rounded-lg bg-surface-container-low p-md">
          You’re offline. Account changes and fresh exports are unavailable.
        </p>
      )}
      {(error || settingsError) && (
        <p role="alert" className="rounded-lg bg-error-container p-md text-error">
          {error || settingsError}
        </p>
      )}
      {status && (
        <p role="status" className="rounded-lg bg-surface-container-low p-md">
          {status}
        </p>
      )}

      <form className="grid gap-md" onSubmit={handleSettingsSubmit}>
        <h3 className="font-bold">Regional preferences</h3>
        <SettingsSelect
          label="Currency"
          value={draft.currencyCode}
          options={supportedCurrencyCodes}
          onChange={(currencyCode) => {
            setDraft((value) => ({ ...value, currencyCode }));
            setIsSettingsDirty(true);
          }}
        />
        <SettingsSelect
          label="Locale"
          value={draft.locale}
          options={supportedLocales}
          onChange={(locale) => {
            setDraft((value) => ({ ...value, locale }));
            setIsSettingsDirty(true);
          }}
        />
        <SettingsSelect
          label="Timezone"
          value={draft.timeZone}
          options={supportedTimeZones}
          onChange={(timeZone) => {
            setDraft((value) => ({ ...value, timeZone }));
            setIsSettingsDirty(true);
          }}
        />
        <button
          className="h-11 rounded-lg bg-primary px-md font-bold text-on-primary disabled:opacity-60"
          type="submit"
          disabled={writesDisabled || isLoading}
        >
          {isSaving ? "Saving..." : "Save preferences"}
        </button>
      </form>

      <form
        className="grid gap-md border-t border-surface-variant pt-lg"
        onSubmit={handlePasswordSubmit}
      >
        <h3 className="font-bold">Change password</h3>
        <AccountPasswordInput
          id="account-new-password"
          label="New password"
          value={newPassword}
          error={passwordErrors.password}
          autoComplete="new-password"
          onChange={setNewPassword}
        />
        <AccountPasswordInput
          id="account-new-password-confirmation"
          label="Confirm new password"
          value={passwordConfirmation}
          error={passwordErrors.confirmation}
          autoComplete="new-password"
          onChange={setPasswordConfirmation}
        />
        {isAwaitingReauthentication && (
          <label className="grid gap-xs text-sm font-bold" htmlFor="password-verification-code">
            Email verification code
            <input
              id="password-verification-code"
              className="field-control input-well rounded-lg px-md py-3"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={reauthenticationNonce}
              onChange={(event) => setReauthenticationNonce(event.target.value)}
            />
          </label>
        )}
        <button
          className="h-11 rounded-lg border border-primary px-md font-bold text-primary disabled:opacity-60"
          type="submit"
          disabled={writesDisabled}
        >
          {isChangingPassword
            ? "Please wait..."
            : isAwaitingReauthentication
              ? "Update password"
              : "Send verification code"}
        </button>
      </form>

      <section className="grid gap-md border-t border-surface-variant pt-lg">
        <h3 className="font-bold">Export your data</h3>
        <p className="text-sm text-on-surface-variant">
          Exports are generated from fresh, owner-scoped database reads.
        </p>
        <div className="grid grid-cols-2 gap-sm">
          {(["json", "csv"] as const).map((format) => (
            <button
              key={format}
              className="h-11 rounded-lg border border-surface-variant font-bold disabled:opacity-60"
              type="button"
              disabled={isOffline || exporting !== null}
              onClick={() => void handleExport(format)}
            >
              {exporting === format ? "Preparing..." : `Download ${format.toUpperCase()}`}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-sm border-t border-surface-variant pt-lg">
        <h3 className="font-bold">Privacy and support</h3>
        <p className="text-sm text-on-surface-variant">
          Review how account data is handled or report a security concern.
        </p>
        <div className="flex flex-wrap gap-md text-sm font-bold text-primary">
          <a className="hover:underline" href="/privacy.html">
            Privacy Notice
          </a>
          <a className="hover:underline" href="/terms.html">
            Terms
          </a>
          <a
            className="hover:underline"
            href="https://github.com/ostenmatrixx/budget-tracker/security"
            rel="noreferrer"
          >
            Security contact
          </a>
        </div>
      </section>

      {pwaActions}

      <form className="grid gap-md border-t border-error/30 pt-lg" onSubmit={handleDelete}>
        <h3 className="font-bold text-error">Delete account</h3>
        <p className="text-sm text-on-surface-variant">
          This permanently deletes your account and all owned budget data. It cannot be undone.
        </p>
        <label className="grid gap-xs text-sm font-bold">
          Type {userEmail} exactly
          <input
            className="field-control input-well rounded-lg px-md py-3"
            type="email"
            autoComplete="off"
            value={deletionEmail}
            onChange={(event) => setDeletionEmail(event.target.value)}
          />
        </label>
        <AccountPasswordInput
          id="delete-account-password"
          label="Current password"
          value={deletionPassword}
          autoComplete="current-password"
          onChange={setDeletionPassword}
        />
        <Turnstile
          key={`delete-account-${deletionCaptchaAttempt}`}
          action="delete_account"
          onTokenChange={setDeletionCaptchaToken}
          siteKey={turnstileSiteKey}
        />
        <button
          className="h-11 rounded-lg bg-error px-md font-bold text-white disabled:opacity-60"
          type="submit"
          disabled={
            writesDisabled ||
            deletionEmail !== userEmail ||
            !deletionPassword ||
            Boolean(turnstileSiteKey && !deletionCaptchaToken)
          }
        >
          {isDeleting ? "Deleting account..." : "Permanently delete account"}
        </button>
      </form>
    </div>
  );
}

function SettingsSelect({
  label,
  onChange,
  options,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  options: readonly string[];
  value: string;
}) {
  const id = `account-${label.toLowerCase().replace(/\s/g, "-")}`;
  return (
    <label htmlFor={id} className="grid gap-xs text-sm font-bold">
      {label}
      <select
        id={id}
        className="field-control input-well rounded-lg px-md py-3"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function AccountPasswordInput({
  autoComplete,
  error,
  id,
  label,
  onChange,
  value
}: {
  autoComplete: "current-password" | "new-password";
  error?: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label htmlFor={id} className="grid gap-xs text-sm font-bold">
      {label}
      <input
        id={id}
        className="field-control input-well rounded-lg px-md py-3"
        type="password"
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <span id={`${id}-error`} className="text-xs text-error">
          {error}
        </span>
      )}
    </label>
  );
}
