import { useCallback, useSyncExternalStore } from "react";
import {
  applyServiceWorkerUpdate,
  getServerServiceWorkerSnapshot,
  getServiceWorkerSnapshot,
  subscribeToServiceWorker,
  type ServiceWorkerLifecycle
} from "../registerServiceWorker";

export interface ServiceWorkerStatus {
  isInstalled: boolean;
  isOffline: boolean;
  lifecycle: ServiceWorkerLifecycle;
  updateAvailable: boolean;
  applyUpdate: () => boolean;
}

export function usePwaStatus(): ServiceWorkerStatus {
  const snapshot = useSyncExternalStore(
    subscribeToServiceWorker,
    getServiceWorkerSnapshot,
    getServerServiceWorkerSnapshot
  );
  const applyUpdate = useCallback(() => applyServiceWorkerUpdate(), []);

  return { ...snapshot, applyUpdate };
}
