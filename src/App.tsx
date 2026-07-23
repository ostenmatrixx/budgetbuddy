import { lazy, Suspense, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import BrandIcon from "./components/BrandIcon";
import LoginScreen from "./components/LoginScreen";
import LandingPage from "./components/LandingPage";
import PasswordRecoveryScreen from "./components/PasswordRecoveryScreen";
import ThemeToggle, { type ThemeMode } from "./components/ThemeToggle";
import { UserSettingsProvider } from "./contexts/UserSettingsContext";
import { usePwaInstall } from "./hooks/usePwaInstall";
import { getSupabaseClient } from "./lib/supabaseClient";

const themeStorageKey = "budgetbuddy-theme";
const Dashboard = lazy(() => import("./components/Dashboard"));

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
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [isBrowserRecovery] = useState(isPasswordRecoveryRequest);
  const { isStandalone } = usePwaInstall();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  }

  if (!isStandalone && !isBrowserRecovery) {
    return <LandingPage theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <InstalledApp browserRecoveryOnly={!isStandalone} theme={theme} onToggleTheme={toggleTheme} />
  );
}

interface InstalledAppProps {
  browserRecoveryOnly: boolean;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

function InstalledApp({ browserRecoveryOnly, onToggleTheme, theme }: InstalledAppProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [configurationError, setConfigurationError] = useState("");
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    try {
      const supabase = getSupabaseClient();

      const {
        data: { subscription }
      } = supabase.auth.onAuthStateChange((event, nextSession) => {
        if (event === "PASSWORD_RECOVERY") {
          setIsPasswordRecovery(true);
        }
        setSession(nextSession);
      });

      supabase.auth
        .getSession()
        .then(({ data, error }) => {
          if (error) {
            setConfigurationError(error.message);
            return;
          }

          setSession(data.session);
          if (browserRecoveryOnly && data.session) {
            setIsPasswordRecovery(true);
          }
        })
        .catch((error: unknown) => {
          setConfigurationError(error instanceof Error ? error.message : "Unable to load session.");
        })
        .finally(() => setIsLoadingSession(false));

      return () => subscription.unsubscribe();
    } catch (error) {
      setConfigurationError(
        error instanceof Error ? error.message : "Supabase is not configured correctly."
      );
      setIsLoadingSession(false);
    }
  }, [browserRecoveryOnly]);

  async function handleLogout() {
    await getSupabaseClient().auth.signOut();
  }

  if (isLoadingSession) {
    return <AppLoadingState />;
  }

  if (isPasswordRecovery) {
    return (
      <PasswordRecoveryScreen
        theme={theme}
        onRecovered={() => {
          if (browserRecoveryOnly) {
            window.history.replaceState({}, "", "/");
            window.location.reload();
            return;
          }

          setIsPasswordRecovery(false);
        }}
        onToggleTheme={onToggleTheme}
      />
    );
  }

  if (browserRecoveryOnly) {
    return (
      <RecoveryLinkError
        configurationError={configurationError}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
    );
  }

  return session ? (
    <UserSettingsProvider userId={session.user.id}>
      <Suspense fallback={<AppLoadingState />}>
        <Dashboard
          theme={theme}
          userId={session.user.id}
          userEmail={session.user.email}
          onLogout={handleLogout}
          onToggleTheme={onToggleTheme}
        />
      </Suspense>
    </UserSettingsProvider>
  ) : (
    <LoginScreen
      configurationError={configurationError}
      theme={theme}
      onToggleTheme={onToggleTheme}
    />
  );
}

function isPasswordRecoveryRequest() {
  if (typeof window === "undefined") {
    return false;
  }

  const queryType = new URLSearchParams(window.location.search).get("type");
  const hashType = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("type");
  return queryType === "recovery" || hashType === "recovery";
}

function RecoveryLinkError({
  configurationError,
  onToggleTheme,
  theme
}: {
  configurationError: string;
  onToggleTheme: () => void;
  theme: ThemeMode;
}) {
  return (
    <main className="flex min-h-screen flex-col bg-background text-on-background">
      <header className="flex h-14 items-center justify-between border-b border-surface-variant bg-surface px-margin-mobile md:px-margin-desktop">
        <div className="flex items-center gap-2 font-bold text-primary">
          <BrandIcon className="h-7 w-7 shrink-0" />
          <span className="text-headline-md">BudgetBuddy</span>
        </div>
        <ThemeToggle compact theme={theme} onToggle={onToggleTheme} />
      </header>
      <section className="flex flex-1 items-center justify-center px-gutter py-xl">
        <div className="app-surface w-full max-w-[480px] p-xl text-center">
          <span className="material-symbols-outlined text-[36px] text-primary" aria-hidden="true">
            warning
          </span>
          <h1 className="mt-md text-headline-lg font-headline-lg">
            This recovery link can’t be used
          </h1>
          <p className="mt-sm text-body-md text-on-surface-variant">
            {configurationError ||
              "It may have expired or already been completed. Request a new link from the installed BudgetBuddy app."}
          </p>
          <a
            className="mt-xl inline-flex h-12 items-center rounded-lg bg-primary px-lg font-bold text-on-primary"
            href="/"
          >
            Return to BudgetBuddy
          </a>
        </div>
      </section>
    </main>
  );
}

function AppLoadingState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-on-background">
      <div
        aria-live="polite"
        className="animate-card-in rounded-xl border border-light-red/30 bg-surface-container-lowest px-6 py-5 text-center text-sm font-semibold ambient-shadow"
        role="status"
      >
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary-fixed text-primary">
          <span
            className="material-symbols-outlined animate-spin-soft text-[26px]"
            aria-hidden="true"
          >
            sync
          </span>
        </div>
        <p className="mt-3">Loading BudgetBuddy...</p>
        <div className="mt-4 grid gap-2" aria-hidden="true">
          <span className="animate-shimmer h-2 w-48 rounded-full bg-surface-container" />
          <span className="animate-shimmer mx-auto h-2 w-32 rounded-full bg-surface-container-low" />
        </div>
      </div>
    </main>
  );
}
