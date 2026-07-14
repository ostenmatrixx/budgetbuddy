import { type CSSProperties, type FormEvent, useState } from "react";
import { validateAuthInput, type AuthInputErrors, type AuthMode } from "../lib/auth";
import { getSupabaseClient } from "../lib/supabaseClient";
import ThemeToggle, { type ThemeMode } from "./ThemeToggle";

interface LoginScreenProps {
  configurationError?: string;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export default function LoginScreen({
  configurationError,
  onToggleTheme,
  theme
}: LoginScreenProps) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<AuthInputErrors>({});
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatusMessage("");

    const result = validateAuthInput(mode, email, password);

    if (!result.isValid || !result.value) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const supabase = getSupabaseClient();

      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword(result.value);

        if (signInError) {
          setError(signInError.message);
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp(result.value);

        if (signUpError) {
          setError(signUpError.message);
        } else if (!data.session) {
          setStatusMessage("Account created. Check your email to confirm before signing in.");
        } else {
          setStatusMessage("Account created. Loading your dashboard...");
        }
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to reach Supabase right now."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateMode(nextMode: AuthMode) {
    setMode(nextMode);
    setErrors({});
    setError("");
    setStatusMessage("");
  }

  return (
    <main className="animate-screen-in flex min-h-screen flex-col overflow-hidden bg-background text-on-background">
      <header className="animate-slide-up flex h-14 w-full items-center justify-between border-b border-surface-variant bg-surface px-margin-mobile md:px-margin-desktop">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined animate-pop text-primary text-headline-md"
            aria-hidden="true"
          >
            account_balance_wallet
          </span>
          <span className="font-headline-md text-headline-md font-bold tracking-normal text-primary">
            BudgetBuddy
          </span>
        </div>
        <nav className="flex items-center gap-md" aria-label="Account actions">
          <ThemeToggle compact theme={theme} onToggle={onToggleTheme} />
          <span className="text-label-md font-label-md text-on-surface-variant">
            Help
          </span>
          <button
            className="text-label-md font-label-md text-on-surface-variant transition hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            type="button"
            onClick={() => updateMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Sign Up" : "Sign In"}
          </button>
        </nav>
      </header>

      <section className="relative flex flex-1 items-center justify-center px-gutter py-xl">
        <div className="absolute left-1/2 top-1/2 -z-10 h-[680px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />

        <aside className="animate-card-in stagger-2 absolute left-margin-desktop hidden max-w-[280px] -translate-y-1/2 lg:top-1/2 lg:block">
          <div
            className="animate-float-soft rounded-xl border border-surface-variant bg-surface-container-low/60 p-lg shadow-sm backdrop-blur"
            style={{ "--float-rotate": "-2deg" } as CSSProperties}
          >
            <span className="material-symbols-outlined mb-sm text-display text-secondary" aria-hidden="true">
              trending_up
            </span>
            <h2 className="mb-xs text-headline-md font-headline-md text-on-surface">Track Growth</h2>
            <p className="text-label-md font-label-md text-on-surface-variant">
              Monitor spending, savings, and goals with clear monthly snapshots.
            </p>
          </div>
          <div
            className="animate-float-soft ml-12 mt-md rounded-xl border border-surface-variant bg-surface-container-lowest p-lg shadow-lg"
            style={{ "--float-rotate": "3deg", animationDelay: "850ms" } as CSSProperties}
          >
            <div className="mb-sm flex items-center gap-sm">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-primary-fixed">
                <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
                  verified_user
                </span>
              </div>
              <span className="text-label-md font-bold text-on-surface">Secure Access</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-variant">
              <div className="animate-bar-fill h-full w-3/4 rounded-full bg-primary" />
            </div>
          </div>
        </aside>

        <form className="app-surface animate-card-in stagger-1 z-10 w-full max-w-[480px] p-xl" onSubmit={handleSubmit}>
          <div className="animate-slide-up mb-xl text-center">
            <h1 className="text-headline-lg font-headline-lg text-on-surface">
              {mode === "signin" ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="mt-2 text-body-md font-body-md text-on-surface-variant">
              {mode === "signin"
                ? "Access your dashboard and stay on track."
                : "Start tracking your budget with BudgetBuddy."}
            </p>
          </div>

          <div className="animate-slide-up stagger-1 mb-lg grid grid-cols-2 rounded-lg border border-surface-variant bg-surface-container-low p-1">
            <button
              className={`motion-button rounded-md px-3 py-2 text-label-md font-label-md transition ${
                mode === "signin"
                  ? "animate-pop bg-surface-container-lowest text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-primary"
              }`}
              type="button"
              onClick={() => updateMode("signin")}
            >
              Sign In
            </button>
            <button
              className={`motion-button rounded-md px-3 py-2 text-label-md font-label-md transition ${
                mode === "signup"
                  ? "animate-pop bg-surface-container-lowest text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-primary"
              }`}
              type="button"
              onClick={() => updateMode("signup")}
            >
              Sign Up
            </button>
          </div>

          <div className="flex flex-col gap-lg">
            <div className="animate-slide-up stagger-2">
              <label
                className="mb-xs block text-label-sm font-label-sm uppercase text-on-surface-variant"
                htmlFor="auth-email"
              >
                Email Address
              </label>
              <div className="input-well flex items-center gap-sm rounded-lg px-md py-3">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant" aria-hidden="true">
                  mail
                </span>
                <input
                  id="auth-email"
                  className="field-control w-full border-none bg-transparent p-0 text-body-md font-body-md focus:border-none focus:bg-transparent focus:ring-0"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setErrors((current) => ({ ...current, email: undefined }));
                  }}
                  autoComplete="email"
                />
              </div>
              {errors.email ? <p className="mt-1 text-xs font-semibold text-error">{errors.email}</p> : null}
            </div>

            <div className="animate-slide-up stagger-3">
              <div className="mb-xs flex items-end justify-between gap-md">
                <label
                  className="block text-label-sm font-label-sm uppercase text-on-surface-variant"
                  htmlFor="auth-password"
                >
                  Password
                </label>
                {mode === "signin" ? (
                  <span className="text-label-sm font-label-sm text-primary">
                    Forgot password?
                  </span>
                ) : null}
              </div>
              <div className="input-well flex items-center gap-sm rounded-lg px-md py-3">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant" aria-hidden="true">
                  lock
                </span>
                <input
                  id="auth-password"
                  className="field-control w-full border-none bg-transparent p-0 text-body-md font-body-md focus:border-none focus:bg-transparent focus:ring-0"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setErrors((current) => ({ ...current, password: undefined }));
                  }}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                />
                <button
                  className="text-on-surface-variant transition hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {errors.password ? <p className="mt-1 text-xs font-semibold text-error">{errors.password}</p> : null}
            </div>

            {configurationError ? (
              <p className="rounded-lg bg-error-container px-3 py-2 text-sm font-medium text-error">
                {configurationError}
              </p>
            ) : null}

            {error ? (
              <p className="rounded-lg bg-error-container px-3 py-2 text-sm font-medium text-error">{error}</p>
            ) : null}

            {statusMessage ? (
              <p className="rounded-lg border border-surface-variant bg-surface-container-low px-3 py-2 text-sm font-medium text-on-surface-variant">
                {statusMessage}
              </p>
            ) : null}

            <button
              className="motion-button group flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-label-md font-label-md text-on-primary shadow-sm transition hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-primary/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isSubmitting || Boolean(configurationError)}
            >
              {isSubmitting ? (
                <>
                  <span
                    className="material-symbols-outlined animate-spin-soft text-[18px]"
                    aria-hidden="true"
                  >
                    progress_activity
                  </span>
                  Please wait...
                </>
              ) : mode === "signin" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
              <span
                className={`material-symbols-outlined text-[18px] transition group-hover:translate-x-1 ${
                  isSubmitting ? "hidden" : ""
                }`}
                aria-hidden="true"
              >
                arrow_forward
              </span>
            </button>
          </div>

          <div className="animate-fade-in stagger-4 mt-xl text-center">
            <p className="text-body-md font-body-md text-on-surface-variant">
              {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                className="font-bold text-primary transition hover:underline focus:outline-none focus:ring-2 focus:ring-primary/10"
                type="button"
                onClick={() => updateMode(mode === "signin" ? "signup" : "signin")}
              >
                {mode === "signin" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </div>
        </form>

        <aside className="animate-card-in stagger-3 absolute right-margin-desktop hidden max-w-[320px] -translate-y-1/2 lg:top-1/2 lg:block">
          <div className="relative aspect-square overflow-hidden rounded-xl border border-surface-variant bg-black-bean shadow-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(255,255,255,0.24),transparent_42%)]" />
            <div className="absolute inset-x-9 top-24 rounded-lg border border-surface-variant/20 bg-black-bean/80 p-md shadow-2xl">
              <div className="mb-sm flex items-center gap-xs">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="h-2 w-2 rounded-full bg-secondary-container" />
                <span className="h-2 w-2 rounded-full bg-surface-container-highest" />
              </div>
              <div className="flex h-28 items-end gap-xs">
                {[38, 56, 44, 72, 52, 88, 68, 96, 74, 102, 84, 110].map((height, index) => (
                  <span
                    className="animate-bar-fill w-full rounded-t bg-primary/70"
                    style={{ height: `${height}%`, animationDelay: `${index * 35}ms` }}
                    key={height}
                  />
                ))}
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-lg">
              <p className="text-label-md font-label-md italic text-white">
                "Financial discipline is the bridge between goals and accomplishment."
              </p>
            </div>
          </div>
        </aside>
      </section>

      <footer className="animate-fade-in stagger-5 px-margin-mobile pb-lg text-center md:px-margin-desktop">
        <p className="text-label-sm font-label-sm text-outline">
          (c) 2026 BudgetBuddy Inc. All rights reserved. Securely encrypted.
        </p>
        <div className="mt-sm flex justify-center gap-lg">
          <span className="text-label-sm font-label-sm text-outline">
            Privacy Policy
          </span>
          <span className="text-label-sm font-label-sm text-outline">
            Terms of Service
          </span>
          <span className="text-label-sm font-label-sm text-outline">
            Contact Support
          </span>
        </div>
      </footer>
    </main>
  );
}
