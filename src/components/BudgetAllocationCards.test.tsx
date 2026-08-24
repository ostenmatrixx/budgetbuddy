import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { BudgetSummary } from "../lib/budget";
import BudgetAllocationCards from "./BudgetAllocationCards";

vi.mock("../contexts/UserSettingsContext", () => ({
  useUserSettings: () => ({
    formatCurrency: (value: number) => `₱${value.toFixed(2)}`
  })
}));

describe("BudgetAllocationCards", () => {
  it("keeps remaining and beyond-target amounts visible with clear labels", () => {
    const summary: BudgetSummary = {
      totalIncome: 10000,
      billsSpent: 6000,
      nonEssentialsSpent: 1500,
      savingsSaved: 4500,
      totalSpent: 7500,
      remainingIncome: -2000,
      essentialsTarget: 5000,
      savingsTarget: 3000,
      nonEssentialsTarget: 2000,
      essentialsRemaining: -1000,
      savingsProgress: 4500,
      nonEssentialsRemaining: 500
    };

    render(
      <BudgetAllocationCards
        preference={{ essentialsPercent: 50, savingsPercent: 30, nonEssentialsPercent: 20 }}
        summary={summary}
        onEditTargets={vi.fn()}
      />
    );

    const targets = screen.getByRole("region", { name: "Budget targets" });
    expect(within(targets).getByText("Essentials over target").parentElement).toHaveTextContent(
      "₱1000.00"
    );
    expect(within(targets).getByText("Saved beyond target").parentElement).toHaveTextContent(
      "₱1500.00"
    );
    expect(within(targets).getByText("Non-essentials remaining").parentElement).toHaveTextContent(
      "₱500.00"
    );
    expect(within(targets).getByText("150%")).toBeInTheDocument();
  });
});
