import { type FormEvent, useState } from "react";
import { usePwaStatus } from "../hooks/usePwaStatus";
import { validateNewPassword, type PasswordInputErrors } from "../lib/auth";
import { getSupabaseClient } from "../lib/supabaseClient";
import BrandIcon from "./BrandIcon";
import ThemeToggle, { type ThemeMode } from "./ThemeToggle";

export interface PasswordRecoveryScreenProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onRecovered: () => void | Promise<void>;
}

export default function PasswordRecoveryScreen({
  onRecovered,
  onToggleTheme,
  theme
}: PasswordRecoveryScreenProps) {
  const { isOffline } = usePwaStatus();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<PasswordInputErrors>({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (isOffline) {
      setError("Reconnect to update your password.");
      return;
    }

    const result = validateNewPassword(password, confirmation);

    if (!result.isValid || !result.value) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const { error: updateError } = await getSupabaseClient().auth.updateUser({
        password: result.value
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setPassword("");
        setConfirmation("");
        setIsComplete(true);
      }
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "Unable to update your password."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function finishRecovery() {
    await getSupabaseClient().auth.signOut({ scope: "local" });
    await onRecovered();
  }

  return (
    <main className="flex min-h-screen flex-col bg-background text-on-background">
      <header className="flex h-14 items-center justify-between border-b border-surface-variant bg-surface px-margin-mobile md:px-margin-desktop">
        <div className="flex items-center gap-2">
          <BrandIcon className="h-7 w-7 shrink-0" />
          <strong className="text-headline-md text-primary">BudgetBuddy</strong>
        </div>
        <ThemeToggle compact theme={theme} onToggle={onToggleTheme} />
      </header>
      <section className="flex flex-1 items-center justify-center px-gutter py-xl">
        <div className="app-surface w-full max-w-[480px] p-xl">
          <h1 className="text-headline-lg font-headline-lg text-on-surface">
            Choose a new password
          </h1>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Use at least 10 characters. Spaces are preserved exactly.
          </p>

          {isComplete ? (
            <div className="mt-xl grid gap-lg">
              <p role="status" className="rounded-lg bg-surface-container-low p-md text-on-surface">
                Your password has been updated successfully.
              </p>
              <button
                className="h-12 rounded-lg bg-primary font-bold text-on-primary"
                type="button"
                onClick={() => void finishRecovery()}
              >
                Return to sign in
              </button>
            </div>
          ) : (
            <form className="mt-xl grid gap-lg" onSubmit={handleSubmit} noValidate>
              <PasswordField
                id="recovery-password"
                label="New password"
                value={password}
                error={errors.password}
                onChange={(value) => {
                  setPassword(value);
                  setErrors((current) => ({ ...current, password: undefined }));
                }}
              />
              <PasswordField
                id="recovery-confirmation"
                label="Confirm new password"
                value={confirmation}
                error={errors.confirmation}
                onChange={(value) => {
                  setConfirmation(value);
                  setErrors((current) => ({ ...current, confirmation: undefined }));
                }}
              />
              {error && (
                <p role="alert" className="rounded-lg bg-error-container p-md text-error">
                  {error}
                </p>
              )}
              <button
                className="h-12 rounded-lg bg-primary font-bold text-on-primary disabled:opacity-60"
                type="submit"
                disabled={isSubmitting || isOffline}
                title={isOffline ? "Reconnect to update your password" : undefined}
              >
                {isSubmitting ? "Updating password..." : "Update password"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

function PasswordField({
  error,
  id,
  label,
  onChange,
  value
}: {
  error?: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="mb-xs block text-label-sm uppercase text-on-surface-variant">
        {label}
      </label>
      <input
        id={id}
        className="field-control input-well w-full rounded-lg px-md py-3"
        type="password"
        autoComplete="new-password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} className="mt-1 text-xs font-semibold text-error">
          {error}
        </p>
      )}
    </div>
  );
}
