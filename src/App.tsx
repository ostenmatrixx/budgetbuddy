import { useState } from "react";
import Dashboard from "./components/Dashboard";
import LoginScreen from "./components/LoginScreen";

const SESSION_KEY = "budget-tracker-admin-session";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => window.sessionStorage.getItem(SESSION_KEY) === "active"
  );

  function handleLogin(password: string): string | undefined {
    const adminPassword = import.meta.env.ADMIN_PASSWORD?.trim();

    if (!adminPassword) {
      return "ADMIN_PASSWORD is not configured for this app.";
    }

    if (password !== adminPassword) {
      return "That password does not match.";
    }

    window.sessionStorage.setItem(SESSION_KEY, "active");
    setIsAuthenticated(true);
    return undefined;
  }

  function handleLogout() {
    window.sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  }

  return isAuthenticated ? (
    <Dashboard onLogout={handleLogout} />
  ) : (
    <LoginScreen onLogin={handleLogin} />
  );
}
