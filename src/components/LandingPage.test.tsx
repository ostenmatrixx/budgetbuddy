import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import LandingPage from "./LandingPage";

const chromeUserAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/145.0.0.0 Safari/537.36";
const iphoneSafariUserAgent =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Version/26.0 Mobile/15E148 Safari/604.1";
const macSafariUserAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15";
const originalNavigator = {
  maxTouchPoints: window.navigator.maxTouchPoints,
  platform: window.navigator.platform,
  userAgent: window.navigator.userAgent
};
const originalMatchMedia = window.matchMedia;

afterEach(() => {
  act(() => window.dispatchEvent(new Event("appinstalled")));
  Object.defineProperties(window.navigator, {
    maxTouchPoints: { configurable: true, value: originalNavigator.maxTouchPoints },
    platform: { configurable: true, value: originalNavigator.platform },
    userAgent: { configurable: true, value: originalNavigator.userAgent }
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: originalMatchMedia
  });
  vi.restoreAllMocks();
});

describe("LandingPage installation guidance", () => {
  it("opens Chromium's deferred native install prompt", async () => {
    mockBrowser(chromeUserAgent, "MacIntel");
    const prompt = vi.fn().mockResolvedValue(undefined);
    const installEvent = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(installEvent, {
      prompt,
      userChoice: Promise.resolve({ outcome: "accepted", platform: "web" })
    });
    window.dispatchEvent(installEvent);

    const user = userEvent.setup();
    render(<LandingPage theme="light" onToggleTheme={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Install BudgetBuddy" }));

    expect(prompt).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText(
        "BudgetBuddy is installing. Open it from your home screen or app launcher."
      )
    ).toBeVisible();
  });

  it("shows Safari's iPhone and iPad Home Screen steps", async () => {
    mockBrowser(iphoneSafariUserAgent, "iPhone");

    const user = userEvent.setup();
    render(<LandingPage theme="light" onToggleTheme={vi.fn()} />);
    await user.click(screen.getAllByRole("button", { name: "Show install steps" })[0]);

    expect(
      screen.getByText(
        "Tap Safari’s Share button, choose “Add to Home Screen,” turn on “Open as Web App,” then tap Add."
      )
    ).toBeVisible();
  });

  it("shows Safari's Add to Dock steps on Mac", async () => {
    mockBrowser(macSafariUserAgent, "MacIntel");

    const user = userEvent.setup();
    render(<LandingPage theme="light" onToggleTheme={vi.fn()} />);
    await user.click(screen.getAllByRole("button", { name: "Show install steps" })[0]);

    expect(
      screen.getByText(
        "In Safari, choose File → Add to Dock, or Share → Add to Dock, then click Add. This requires macOS Sonoma 14 or later."
      )
    ).toBeVisible();
  });
});

function mockBrowser(userAgent: string, platform: string) {
  Object.defineProperties(window.navigator, {
    maxTouchPoints: { configurable: true, value: platform === "iPhone" ? 5 : 0 },
    platform: { configurable: true, value: platform },
    userAgent: { configurable: true, value: userAgent }
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({
      addEventListener: vi.fn(),
      matches: false,
      removeEventListener: vi.fn()
    }))
  });
}
