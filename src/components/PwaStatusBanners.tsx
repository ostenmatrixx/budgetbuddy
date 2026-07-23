import { useState } from "react";
import { usePwaStatus } from "../hooks/usePwaStatus";

export default function PwaStatusBanners() {
  const { applyUpdate, isOffline, updateAvailable } = usePwaStatus();
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState("");

  function handleApplyUpdate() {
    setIsApplyingUpdate(true);
    if (!applyUpdate()) {
      setIsApplyingUpdate(false);
    }
  }

  async function handleRetryConnection() {
    setIsCheckingConnection(true);
    setConnectionMessage("");

    try {
      const response = await fetch(window.location.href, {
        cache: "no-store",
        method: "HEAD"
      });

      if (!response.ok) {
        throw new Error("Connection check failed.");
      }

      window.location.reload();
    } catch {
      setConnectionMessage("Still offline. Your loaded data remains on screen.");
      setIsCheckingConnection(false);
    }
  }

  if (!isOffline && !updateAvailable) {
    return null;
  }

  return (
    <div className="pwa-banner-stack" aria-live="polite">
      {isOffline ? (
        <aside className="pwa-banner" role="status">
          <span aria-hidden="true" className="material-symbols-outlined">
            cloud_off
          </span>
          <div>
            <strong>You’re offline</strong>
            <p>Loaded data stays visible, but saving is disabled until you reconnect.</p>
            {connectionMessage ? <p>{connectionMessage}</p> : null}
          </div>
          <button
            disabled={isCheckingConnection}
            type="button"
            onClick={() => void handleRetryConnection()}
          >
            {isCheckingConnection ? "Checking…" : "Retry"}
          </button>
        </aside>
      ) : null}

      {updateAvailable ? (
        <aside className="pwa-banner" role="status">
          <span aria-hidden="true" className="material-symbols-outlined">
            system_update
          </span>
          <div>
            <strong>Update available</strong>
            <p>Reload BudgetBuddy to use the latest version.</p>
          </div>
          <button disabled={isApplyingUpdate} type="button" onClick={handleApplyUpdate}>
            {isApplyingUpdate ? "Updating…" : "Update"}
          </button>
        </aside>
      ) : null}
    </div>
  );
}
