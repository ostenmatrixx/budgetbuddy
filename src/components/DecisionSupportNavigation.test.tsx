import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AlertsButton from "./AlertsButton";
import MobileBottomNavigation from "./MobileBottomNavigation";

describe("decision-support navigation", () => {
  it("exposes all mobile destinations and the central add action", () => {
    const onAdd = vi.fn();
    const onNavigate = vi.fn();
    const onSettings = vi.fn();

    render(
      <MobileBottomNavigation
        active="home"
        onAdd={onAdd}
        onNavigate={onNavigate}
        onSettings={onSettings}
      />
    );

    expect(screen.getByRole("button", { name: "Home" })).toHaveAttribute("aria-current", "page");
    fireEvent.click(screen.getByRole("button", { name: "Activity" }));
    fireEvent.click(screen.getByRole("button", { name: "Add transaction" }));
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));

    expect(onNavigate).toHaveBeenCalledWith("activity");
    expect(onAdd).toHaveBeenCalledOnce();
    expect(onSettings).toHaveBeenCalledOnce();
  });

  it("opens a grouped alert inbox without a dismiss action", () => {
    render(
      <AlertsButton
        alerts={[
          {
            id: "overdue",
            group: "critical",
            icon: "warning",
            title: "Rent is overdue",
            message: "Record or skip this occurrence."
          }
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Alerts, 1 active" }));

    expect(screen.getByRole("dialog", { name: "Alerts" })).toBeVisible();
    expect(screen.getByText("Rent is overdue")).toBeVisible();
    expect(screen.queryByRole("button", { name: /dismiss/i })).not.toBeInTheDocument();
  });
});
