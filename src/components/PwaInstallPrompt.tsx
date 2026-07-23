import { useState } from "react";
import { usePwaInstall } from "../hooks/usePwaInstall";

interface PwaInstallPromptProps {
  eligible?: boolean;
  showWhenDismissed?: boolean;
  variant?: "banner" | "settings";
}

export default function PwaInstallPrompt({
  eligible = true,
  showWhenDismissed = false,
  variant = "banner"
}: PwaInstallPromptProps) {
  const { canInstall, dismiss, install, isDismissed, isIos, isStandalone } = usePwaInstall();
  const [isPrompting, setIsPrompting] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  if (!eligible || isStandalone || (!canInstall && !isIos) || (isDismissed && !showWhenDismissed)) {
    return null;
  }

  async function handleInstall() {
    if (isIos) {
      setShowIosInstructions(true);
      return;
    }

    setIsPrompting(true);
    try {
      await install();
    } finally {
      setIsPrompting(false);
    }
  }

  return (
    <aside
      className={variant === "banner" ? "pwa-install-prompt" : "pwa-install-prompt is-settings"}
      aria-labelledby="pwa-install-title"
    >
      <div>
        <strong id="pwa-install-title">Install BudgetBuddy</strong>
        <p>Open your budget faster from your home screen.</p>
        {showIosInstructions ? (
          <p className="pwa-install-instructions" role="status">
            In Safari, tap Share, then choose “Add to Home Screen.”
          </p>
        ) : null}
      </div>
      <div className="pwa-install-actions">
        <button disabled={isPrompting} type="button" onClick={() => void handleInstall()}>
          {isPrompting ? "Opening…" : isIos ? "Show me how" : "Install"}
        </button>
        <button className="is-secondary" type="button" onClick={dismiss}>
          Not now
        </button>
      </div>
    </aside>
  );
}
