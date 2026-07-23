import { type FormEvent, useCallback, useState } from "react";
import { usePwaStatus } from "../hooks/usePwaStatus";
import { validateAuthInput, type AuthInputErrors, type AuthMode } from "../lib/auth";
import { getSupabaseClient } from "../lib/supabaseClient";
import ThemeToggle, { type ThemeMode } from "./ThemeToggle";
import Turnstile from "./Turnstile";

type AuthScreenMode = AuthMode | "forgot" | "confirmation";

interface LoginScreenProps {
  configurationError?: string;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim();

export default function LoginScreen({
  configurationError,
  onToggleTheme,
  theme
}: LoginScreenProps) {
  const { isOffline } = usePwaStatus();
  const [mode, setMode] = useState<AuthScreenMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<AuthInputErrors>({});
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaAttempt, setCaptchaAttempt] = useState(0);

  const updateCaptchaToken = useCallback((token: string | null) => {
    setCaptchaToken(token);
  }, []);

  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const needsPassword = mode === "signin" || mode === "signup";
  const captchaAction =
    mode === "signup"
      ? "signup"
      : mode === "forgot"
        ? "password_reset"
        : mode === "confirmation"
          ? "resend_confirmation"
          : "signin";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatusMessage("");

    if (isOffline) {
      setError("Reconnect before continuing.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrors({ email: "Enter a valid email address." });
      return;
    }

    let credentials: { email: string; password: string } | undefined;

    if (needsPassword) {
      const result = validateAuthInput(mode, email, password);

      if (!result.isValid || !result.value) {
        setErrors(result.errors);
        return;
      }

      credentials = result.value;
    }

    if (turnstileSiteKey && !captchaToken) {
      setError("Complete the security check before continuing.");
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const supabase = getSupabaseClient();
      const captchaOptions = captchaToken ? { captchaToken } : {};

      if (mode === "signin" && credentials) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          ...credentials,
          options: captchaOptions
        });

        if (signInError) {
          setError(signInError.message);
        }
      } else if (mode === "signup" && credentials) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          ...credentials,
          options: { ...captchaOptions, emailRedirectTo: redirectTo }
        });

        if (signUpError) {
          setError(signUpError.message);
        } else if (!data.session) {
          setEmail(credentials.email);
          setPassword("");
          setMode("confirmation");
          setStatusMessage("Account created. Check your email to confirm your account.");
        } else {
          setStatusMessage("Account created. Loading your dashboard...");
        }
      } else if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          ...captchaOptions,
          redirectTo
        });

        if (resetError) {
          setError(resetError.message);
        } else {
          setStatusMessage(
            "If an account exists for that email, a password recovery link is on its way."
          );
        }
      } else if (mode === "confirmation") {
        const { error: resendError } = await supabase.auth.resend({
          type: "signup",
          email: normalizedEmail,
          options: { ...captchaOptions, emailRedirectTo: redirectTo }
        });

        if (resendError) {
          setError(resendError.message);
        } else {
          setStatusMessage("A new confirmation email has been sent.");
        }
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to reach Supabase right now."
      );
    } finally {
      setIsSubmitting(false);
      setCaptchaToken(null);
      setCaptchaAttempt((attempt) => attempt + 1);
    }
  }

  function updateMode(nextMode: AuthScreenMode) {
    setMode(nextMode);
    setPassword("");
    setErrors({});
    setError("");
    setStatusMessage("");
    setCaptchaToken(null);
    setCaptchaAttempt((attempt) => attempt + 1);
  }

  const heading =
    mode === "signin"
      ? "Welcome Back"
      : mode === "signup"
        ? "Create Account"
        : mode === "forgot"
          ? "Reset Password"
          : "Confirm Your Email";
  const description =
    mode === "forgot"
      ? "We’ll send a secure recovery link to your email."
      : mode === "confirmation"
        ? "Open the confirmation link we sent, or request another one."
        : mode === "signin"
          ? "Access your dashboard and stay on track."
          : "Start tracking your budget with BudgetBuddy.";

  return (
    <main className="flex min-h-screen flex-col bg-background text-on-background">
      <header className="flex h-14 items-center justify-between border-b border-surface-variant bg-surface px-margin-mobile md:px-margin-desktop">
        <div className="flex items-center gap-2 font-bold text-primary">
          <span className="material-symbols-outlined" aria-hidden="true">
            account_balance_wallet
          </span>
          <span className="text-headline-md">BudgetBuddy</span>
        </div>
        <ThemeToggle compact theme={theme} onToggle={onToggleTheme} />
      </header>

      <section className="flex flex-1 items-center justify-center px-gutter py-xl">
        <form className="app-surface w-full max-w-[480px] p-xl" onSubmit={handleSubmit} noValidate>
          <div className="mb-xl text-center">
            <h1 className="text-headline-lg font-headline-lg text-on-surface">{heading}</h1>
            <p className="mt-2 text-body-md text-on-surface-variant">{description}</p>
          </div>

          {(mode === "signin" || mode === "signup") && (
            <div className="mb-lg grid grid-cols-2 rounded-lg border border-surface-variant bg-surface-container-low p-1">
              {(["signin", "signup"] as const).map((option) => (
                <button
                  key={option}
                  className={`rounded-md px-3 py-2 text-label-md transition ${
                    mode === option
                      ? "bg-surface-container-lowest text-primary shadow-sm"
                      : "text-on-surface-variant"
                  }`}
                  type="button"
                  onClick={() => updateMode(option)}
                >
                  {option === "signin" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-lg">
            <div>
              <label
                className="mb-xs block text-label-sm uppercase text-on-surface-variant"
                htmlFor="auth-email"
              >
                Email Address
              </label>
              <input
                id="auth-email"
                className="field-control input-well w-full rounded-lg px-md py-3"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrors((current) => ({ ...current, email: undefined }));
                }}
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "auth-email-error" : undefined}
              />
              {errors.email && (
                <p id="auth-email-error" className="mt-1 text-xs font-semibold text-error">
                  {errors.email}
                </p>
              )}
            </div>

            {needsPassword && (
              <div>
                <div className="mb-xs flex items-center justify-between gap-md">
                  <label
                    className="text-label-sm uppercase text-on-surface-variant"
                    htmlFor="auth-password"
                  >
                    Password
                  </label>
                  {mode === "signin" && (
                    <button
                      className="text-label-sm text-primary hover:underline"
                      type="button"
                      onClick={() => updateMode("forgot")}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="input-well flex items-center rounded-lg px-md py-3">
                  <input
                    id="auth-password"
                    className="field-control w-full border-none bg-transparent p-0"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setErrors((current) => ({ ...current, password: undefined }));
                    }}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "auth-password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                {errors.password && (
                  <p id="auth-password-error" className="mt-1 text-xs font-semibold text-error">
                    {errors.password}
                  </p>
                )}
              </div>
            )}

            <Turnstile
              key={`${captchaAction}-${captchaAttempt}`}
              action={captchaAction}
              onTokenChange={updateCaptchaToken}
              siteKey={turnstileSiteKey}
            />

            {configurationError && (
              <p
                role="alert"
                className="rounded-lg bg-error-container px-3 py-2 text-sm text-error"
              >
                {configurationError}
              </p>
            )}
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-error-container px-3 py-2 text-sm text-error"
              >
                {error}
              </p>
            )}
            {statusMessage && (
              <p
                role="status"
                className="rounded-lg bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant"
              >
                {statusMessage}
              </p>
            )}

            <button
              className="motion-button h-12 rounded-lg bg-primary px-4 font-bold text-on-primary disabled:opacity-60"
              type="submit"
              disabled={
                isOffline ||
                isSubmitting ||
                Boolean(configurationError) ||
                Boolean(turnstileSiteKey && !captchaToken)
              }
              title={isOffline ? "Reconnect to continue" : undefined}
            >
              {isSubmitting
                ? "Please wait..."
                : mode === "signin"
                  ? "Sign In"
                  : mode === "signup"
                    ? "Create Account"
                    : mode === "forgot"
                      ? "Send Recovery Link"
                      : "Resend Confirmation"}
            </button>

            {(mode === "forgot" || mode === "confirmation") && (
              <button
                className="font-bold text-primary hover:underline"
                type="button"
                onClick={() => updateMode("signin")}
              >
                Back to sign in
              </button>
            )}

            {mode === "signup" ? (
              <p className="text-center text-xs leading-5 text-on-surface-variant">
                By creating an account, you agree to the{" "}
                <a className="font-semibold text-primary hover:underline" href="/terms.html">
                  Terms
                </a>{" "}
                and acknowledge the{" "}
                <a className="font-semibold text-primary hover:underline" href="/privacy.html">
                  Privacy Notice
                </a>
                .
              </p>
            ) : null}
          </div>
        </form>
      </section>

      <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-surface-variant px-4 py-4 text-xs text-on-surface-variant">
        <span>BudgetBuddy production beta</span>
        <a className="font-semibold hover:text-primary hover:underline" href="/privacy.html">
          Privacy
        </a>
        <a className="font-semibold hover:text-primary hover:underline" href="/terms.html">
          Terms
        </a>
        <a
          className="font-semibold hover:text-primary hover:underline"
          href="https://github.com/ostenmatrixx/budget-tracker/security"
          rel="noreferrer"
        >
          Security
        </a>
      </footer>
    </main>
  );
}
