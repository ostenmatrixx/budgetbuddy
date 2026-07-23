export type ServiceWorkerLifecycle =
  "unsupported" | "idle" | "installing" | "waiting" | "ready" | "error";

export interface ServiceWorkerSnapshot {
  isInstalled: boolean;
  isOffline: boolean;
  lifecycle: ServiceWorkerLifecycle;
  updateAvailable: boolean;
}

type Listener = () => void;

const listeners = new Set<Listener>();
const isServiceWorkerSupported = typeof navigator !== "undefined" && "serviceWorker" in navigator;
let activeRegistration: ServiceWorkerRegistration | null = null;
let isApplyingUpdate = false;
let isStatusListenerRegistered = false;
let snapshot: ServiceWorkerSnapshot = {
  isInstalled:
    isServiceWorkerSupported &&
    (Boolean(navigator.serviceWorker.controller) || isStandaloneDisplayMode()),
  isOffline: typeof navigator !== "undefined" ? !navigator.onLine : false,
  lifecycle: isServiceWorkerSupported ? "idle" : "unsupported",
  updateAvailable: false
};

function isStandaloneDisplayMode() {
  if (typeof window === "undefined") {
    return false;
  }

  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches || iosNavigator.standalone === true
  );
}

function publish(next: Partial<ServiceWorkerSnapshot>) {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((listener) => listener());
}

function watchInstallingWorker(worker: ServiceWorker, registration: ServiceWorkerRegistration) {
  publish({ lifecycle: "installing" });

  worker.addEventListener("statechange", () => {
    if (worker.state !== "installed") {
      return;
    }

    if (navigator.serviceWorker.controller && registration.waiting) {
      publish({ lifecycle: "waiting", updateAvailable: true });
      return;
    }

    publish({ isInstalled: true, lifecycle: "ready" });
  });
}

function observeRegistration(registration: ServiceWorkerRegistration) {
  activeRegistration = registration;

  if (registration.waiting) {
    publish({ lifecycle: "waiting", updateAvailable: true });
  } else if (registration.installing) {
    watchInstallingWorker(registration.installing, registration);
  } else if (registration.active) {
    publish({ isInstalled: true, lifecycle: "ready" });
  }

  registration.addEventListener("updatefound", () => {
    if (registration.installing) {
      watchInstallingWorker(registration.installing, registration);
    }
  });
}

export function getServiceWorkerSnapshot() {
  return snapshot;
}

export function getServerServiceWorkerSnapshot(): ServiceWorkerSnapshot {
  return {
    isInstalled: false,
    isOffline: false,
    lifecycle: "unsupported",
    updateAvailable: false
  };
}

export function subscribeToServiceWorker(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function applyServiceWorkerUpdate() {
  const waitingWorker = activeRegistration?.waiting;

  if (!waitingWorker || isApplyingUpdate) {
    return false;
  }

  isApplyingUpdate = true;
  waitingWorker.postMessage({ type: "SKIP_WAITING" });
  return true;
}

export function registerServiceWorker() {
  if (!isStatusListenerRegistered && typeof window !== "undefined") {
    const handleOnlineStatus = () => publish({ isOffline: !navigator.onLine });
    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);
    isStatusListenerRegistered = true;
  }

  if (!import.meta.env.PROD || !isServiceWorkerSupported) {
    return;
  }

  let hasReloadedForUpdate = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!isApplyingUpdate || hasReloadedForUpdate) {
      publish({ isInstalled: true, lifecycle: "ready", updateAvailable: false });
      return;
    }

    hasReloadedForUpdate = true;
    window.location.reload();
  });

  window.addEventListener(
    "load",
    () => {
      navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then(observeRegistration)
        .catch((error: unknown) => {
          publish({ lifecycle: "error" });
          console.error("Unable to register BudgetBuddy service worker.", error);
        });
    },
    { once: true }
  );
}
