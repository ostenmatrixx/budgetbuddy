import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Turnstile from "./Turnstile";

afterEach(() => {
  delete window.turnstile;
  vi.restoreAllMocks();
});

describe("Turnstile", () => {
  it("is optional when no public site key is configured", async () => {
    const onTokenChange = vi.fn();
    const { container } = render(<Turnstile action="signin" onTokenChange={onTokenChange} />);

    await waitFor(() => expect(onTokenChange).toHaveBeenCalledWith(null));
    expect(container).toBeEmptyDOMElement();
  });

  it("forwards tokens and removes the widget on unmount", async () => {
    const onTokenChange = vi.fn();
    const remove = vi.fn();
    const renderWidget = vi.fn((_container, options) => {
      options.callback("verified-token");
      return "widget-id";
    });
    window.turnstile = { render: renderWidget, remove };

    const { unmount } = render(
      <Turnstile action="signup" onTokenChange={onTokenChange} siteKey="public-site-key" />
    );

    await waitFor(() => expect(onTokenChange).toHaveBeenCalledWith("verified-token"));
    unmount();
    expect(remove).toHaveBeenCalledWith("widget-id");
    expect(onTokenChange).toHaveBeenLastCalledWith(null);
  });
});
