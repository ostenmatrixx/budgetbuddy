import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ErrorBoundary from "./ErrorBoundary";

afterEach(() => vi.restoreAllMocks());

describe("ErrorBoundary", () => {
  it("shows a generic recovery screen when rendering fails", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    function BrokenComponent(): never {
      throw new Error("sensitive runtime detail");
    }

    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );

    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeVisible();
    expect(screen.queryByText("sensitive runtime detail")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload app" })).toBeVisible();
  });
});
