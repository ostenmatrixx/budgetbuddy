import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import PwaStatusBanners from "./components/PwaStatusBanners";
import { initializeMonitoring } from "./lib/monitoring";
import { registerServiceWorker } from "./registerServiceWorker";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/inter/latin-800.css";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found.");
}

void initializeMonitoring();

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <PwaStatusBanners />
    </ErrorBoundary>
  </StrictMode>
);

registerServiceWorker();
