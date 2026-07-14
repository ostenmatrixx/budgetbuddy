import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import Dashboard from "./components/Dashboard";
import LoginScreen from "./components/LoginScreen";
import type { ThemeMode } from "./components/ThemeToggle";
import { getSupabaseClient } from "./lib/supabaseClient";

const themeStorageKey = "budgetbuddy-theme";

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const savedTheme = window.localStorage.getItem(themeStorageKey);

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [configurationError, setConfigurationError] = useState("");
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  useEffect(() => {
    try {
      const supabase = getSupabaseClient();

      supabase.auth
        .getSession()
        .then(({ data, error }) => {
          if (error) {
            setConfigurationError(error.message);
            return;
          }

          setSession(data.session);
        })
        .catch((error: unknown) => {
          setConfigurationError(error instanceof Error ? error.message : "Unable to load session.");
        })
        .finally(() => setIsLoadingSession(false));

      const {
        data: { subscription }
      } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      setConfigurationError(
        error instanceof Error ? error.message : "Supabase is not configured correctly."
      );
      setIsLoadingSession(false);
    }
  }, []);

  async function handleLogout() {
    await getSupabaseClient().auth.signOut();
  }

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  }

  if (isLoadingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 text-on-background">
        <div className="animate-card-in rounded-xl border border-light-red/30 bg-surface-container-lowest px-6 py-5 text-center text-sm font-semibold ambient-shadow">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary-fixed text-primary">
            <span
              className="material-symbols-outlined animate-spin-soft text-[26px]"
              aria-hidden="true"
            >
              sync
            </span>
          </div>
          <p className="mt-3">Loading BudgetBuddy...</p>
          <div className="mt-4 grid gap-2">
            <span className="animate-shimmer h-2 w-48 rounded-full bg-surface-container" />
            <span className="animate-shimmer mx-auto h-2 w-32 rounded-full bg-surface-container-low" />
          </div>
        </div>
      </main>
    );
  }

  return session ? (
    <Dashboard
      theme={theme}
      userId={session.user.id}
      userEmail={session.user.email}
      onLogout={handleLogout}
      onToggleTheme={toggleTheme}
    />
  ) : (
    <LoginScreen configurationError={configurationError} theme={theme} onToggleTheme={toggleTheme} />
  );
}
