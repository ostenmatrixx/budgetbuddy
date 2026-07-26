import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePwaInstall } from "./usePwaInstall";

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: originalMatchMedia
  });
  vi.restoreAllMocks();
});

describe("usePwaInstall", () => {
  it("preserves an installed launch when fullscreen replaces standalone display mode", () => {
    const displayMode = mockDisplayMode("standalone");
    const { result } = renderHook(() => usePwaInstall());

    expect(result.current.isStandalone).toBe(true);

    act(() => displayMode.setMode("fullscreen"));

    expect(result.current.isStandalone).toBe(true);
  });

  it("does not treat fullscreen in a browser launch as installed", () => {
    const displayMode = mockDisplayMode("browser");
    const { result } = renderHook(() => usePwaInstall());

    act(() => displayMode.setMode("fullscreen"));

    expect(result.current.isStandalone).toBe(false);
  });

  it.each(["minimal-ui", "window-controls-overlay"] as const)(
    "recognizes an installed %s launch",
    (mode) => {
      mockDisplayMode(mode);

      const { result } = renderHook(() => usePwaInstall());

      expect(result.current.isStandalone).toBe(true);
    }
  );
});

function mockDisplayMode(initialMode: string) {
  let mode = initialMode;
  const mediaQueries = new Map<string, { listeners: Set<EventListener>; value: MediaQueryList }>();

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn((query: string) => {
      const existing = mediaQueries.get(query);
      if (existing) {
        return existing.value;
      }

      const listeners = new Set<EventListener>();
      const value = {
        get matches() {
          return query === `(display-mode: ${mode})`;
        },
        media: query,
        addEventListener: (_type: string, listener: EventListener) => listeners.add(listener),
        removeEventListener: (_type: string, listener: EventListener) => listeners.delete(listener)
      } as unknown as MediaQueryList;
      mediaQueries.set(query, { listeners, value });
      return value;
    })
  });

  return {
    setMode(nextMode: string) {
      const previousMode = mode;
      mode = nextMode;
      mediaQueries.forEach(({ listeners, value }, query) => {
        const previousMatches = query === `(display-mode: ${previousMode})`;
        if (previousMatches === value.matches) {
          return;
        }

        const event = { matches: value.matches, media: value.media } as MediaQueryListEvent;
        listeners.forEach((listener) => listener(event));
      });
    }
  };
}
