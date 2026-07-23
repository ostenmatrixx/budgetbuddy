import { describe, expect, it } from "vitest";
import { applyServiceWorkerUpdate, getServerServiceWorkerSnapshot } from "./registerServiceWorker";

describe("service-worker state", () => {
  it("provides an SSR-safe unsupported snapshot", () => {
    expect(getServerServiceWorkerSnapshot()).toEqual({
      isInstalled: false,
      isOffline: false,
      lifecycle: "unsupported",
      updateAvailable: false
    });
  });

  it("does not force activation without a waiting worker", () => {
    expect(applyServiceWorkerUpdate()).toBe(false);
  });
});
