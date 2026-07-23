import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import PwaInstallPrompt from "./PwaInstallPrompt";

afterEach(() => {
  act(() => window.dispatchEvent(new Event("appinstalled")));
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("PwaInstallPrompt", () => {
  it("uses the deferred browser install prompt", async () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({ matches: false }))
    });
    const prompt = vi.fn().mockResolvedValue(undefined);
    const installEvent = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(installEvent, {
      prompt,
      userChoice: Promise.resolve({ outcome: "accepted", platform: "web" })
    });
    window.dispatchEvent(installEvent);

    const user = userEvent.setup();
    render(<PwaInstallPrompt />);
    await user.click(screen.getByRole("button", { name: "Install" }));

    expect(prompt).toHaveBeenCalledTimes(1);
  });
});
