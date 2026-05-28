import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import Dashboard from "./components/Dashboard";
import LoginScreen from "./components/LoginScreen";
import { getSupabaseClient } from "./lib/supabaseClient";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [configurationError, setConfigurationError] = useState("");

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

  if (isLoadingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4 text-black-bean">
        <div className="rounded-lg border border-light-red/30 bg-white px-5 py-4 text-sm font-semibold shadow-[0_20px_60px_rgba(166,66,66,0.12)]">
          Loading your budget...
        </div>
      </main>
    );
  }

  return session ? (
    <Dashboard userId={session.user.id} userEmail={session.user.email} onLogout={handleLogout} />
  ) : (
    <LoginScreen configurationError={configurationError} />
  );
}
