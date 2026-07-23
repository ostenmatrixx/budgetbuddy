import { useCallback, useEffect, useState } from "react";

const INSTALL_DISMISSED_AT_KEY = "budgetbuddy.install-dismissed-at";
const DISMISSAL_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
const installPromptListeners = new Set<() => void>();

function emitInstallPromptChange() {
  installPromptListeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event as BeforeInstallPromptEvent;
    emitInstallPromptChange();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    emitInstallPromptChange();
  });
}

function isStandalone() {
  if (typeof window === "undefined") {
    return false;
  }

  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches || iosNavigator.standalone === true
  );
}

function isIosDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isDismissed() {
  try {
    const dismissedAt = Number(window.localStorage.getItem(INSTALL_DISMISSED_AT_KEY));
    return Number.isFinite(dismissedAt) && Date.now() - dismissedAt < DISMISSAL_DURATION_MS;
  } catch {
    return false;
  }
}

export interface PwaInstallState {
  canInstall: boolean;
  dismiss: () => void;
  install: () => Promise<boolean>;
  isDismissed: boolean;
  isIos: boolean;
  isStandalone: boolean;
}

export function usePwaInstall(): PwaInstallState {
  const [, setRevision] = useState(0);
  const [dismissed, setDismissed] = useState(() =>
    typeof window === "undefined" ? false : isDismissed()
  );

  useEffect(() => {
    const handleChange = () => setRevision((current) => current + 1);
    installPromptListeners.add(handleChange);
    return () => {
      installPromptListeners.delete(handleChange);
    };
  }, []);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(INSTALL_DISMISSED_AT_KEY, String(Date.now()));
    } catch {
      // The prompt can still be dismissed for this render when storage is unavailable.
    }
    setDismissed(true);
  }, []);

  const install = useCallback(async () => {
    if (!deferredInstallPrompt) {
      return false;
    }

    const promptEvent = deferredInstallPrompt;
    deferredInstallPrompt = null;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    setRevision((current) => current + 1);
    return outcome === "accepted";
  }, []);

  const standalone = isStandalone();

  return {
    canInstall: !standalone && deferredInstallPrompt !== null,
    dismiss,
    install,
    isDismissed: dismissed,
    isIos: !standalone && isIosDevice(),
    isStandalone: standalone
  };
}
