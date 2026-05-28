import { type FormEvent, useState } from "react";
import { validateAuthInput, type AuthInputErrors, type AuthMode } from "../lib/auth";
import { getSupabaseClient } from "../lib/supabaseClient";

interface LoginScreenProps {
  configurationError?: string;
}

export default function LoginScreen({ configurationError }: LoginScreenProps) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<AuthInputErrors>({});
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <main className="min-h-screen bg-white px-4 py-8 text-black-bean">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center">
        <form
          className="w-full rounded-lg border border-ecru bg-white p-6 shadow-[0_20px_60px_rgba(166,66,66,0.12)]"
          onSubmit={handleSubmit}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-maroon">
            Personal Budget
          </p>
          <h1 className="mt-3 text-3xl font-bold">Budget Tracker</h1>
          <p className="mt-2 text-sm leading-6 text-black-bean/70">
            Sign in to review your monthly income, spending, and savings.
          </p>

          <div className="mt-8 grid grid-cols-2 rounded-lg border border-light-red/35 bg-rose-white p-1">
            <button
              className={`rounded-md px-3 py-2 text-sm font-bold transition ${
                mode === "signin" ? "bg-white text-maroon shadow-sm" : "text-black-bean/65"
              }`}
              type="button"
              onClick={() => updateMode("signin")}
            >
              Sign in
            </button>
            <button
              className={`rounded-md px-3 py-2 text-sm font-bold transition ${
                mode === "signup" ? "bg-white text-maroon shadow-sm" : "text-black-bean/65"
              }`}
              type="button"
              onClick={() => updateMode("signup")}
            >
              Sign up
            </button>
          </div>

          <label className="mt-6 block text-sm font-semibold" htmlFor="auth-email">
            Email
          </label>
          <input
            id="auth-email"
            className="mt-2 w-full rounded-lg border border-light-red/40 bg-white/80 px-4 py-3 text-base outline-none transition focus:border-maroon focus:ring-2 focus:ring-maroon/20"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors((current) => ({ ...current, email: undefined }));
            }}
            autoComplete="email"
          />
          {errors.email ? <p className="mt-1 text-xs font-semibold text-maroon">{errors.email}</p> : null}

          <label className="mt-4 block text-sm font-semibold" htmlFor="auth-password">
            Password
          </label>
          <input
            id="auth-password"
            className="mt-2 w-full rounded-lg border border-ecru bg-white/70 px-4 py-3 text-base outline-none transition focus:border-maroon focus:ring-2 focus:ring-maroon/20"
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((current) => ({ ...current, password: undefined }));
            }}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
          />
          {errors.password ? (
            <p className="mt-1 text-xs font-semibold text-maroon">{errors.password}</p>
          ) : null}

          {configurationError ? (
            <p className="mt-3 rounded-lg bg-light-red/25 px-3 py-2 text-sm font-medium text-maroon">
              {configurationError}
            </p>
          ) : null}

          {error ? (
            <p className="mt-3 rounded-lg bg-light-red/25 px-3 py-2 text-sm font-medium text-maroon">
              {error}
            </p>
          ) : null}

          {statusMessage ? (
            <p className="mt-3 rounded-lg border border-light-red/35 bg-rose-white px-3 py-2 text-sm font-medium text-black-bean/75">
              {statusMessage}
            </p>
          ) : null}

          <button
            className="mt-6 w-full rounded-lg bg-maroon px-4 py-3 text-sm font-bold text-white transition hover:bg-black-bean focus:outline-none focus:ring-2 focus:ring-maroon/30 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={isSubmitting || Boolean(configurationError)}
          >
            {isSubmitting ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}
