import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Transaction } from "../types/transaction";
import TransactionSection from "./TransactionSection";

vi.mock("../contexts/UserSettingsContext", () => ({
  useUserSettings: () => ({
    formatCurrency: (value: number) => `₱${value.toFixed(2)}`,
    formatDate: (value: string) => value
  })
}));

const transactions: Transaction[] = Array.from({ length: 6 }, (_, index) => {
  const day = index + 1;
  const date = `2026-08-${String(day).padStart(2, "0")}`;

  return {
    id: String(day),
    version: 1,
    type: "income",
    amount: day * 100,
    date,
    description: `Income ${day}`,
    notes: "",
    createdAt: `${date}T09:00:00.000Z`,
    updatedAt: `${date}T09:00:00.000Z`
  };
});

describe("TransactionSection", () => {
  it("paginates every category list instead of limiting mobile users to a preview", async () => {
    const user = userEvent.setup();

    render(
      <TransactionSection
        type="income"
        transactions={transactions}
        pieSegments={[{ label: "Uncategorized", percentage: 100, value: 2100 }]}
        subcategoriesByType={{}}
        year={2026}
        month={8}
        onAdd={vi.fn()}
        onAddSubcategory={vi.fn().mockResolvedValue(undefined)}
        onArchiveSubcategory={vi.fn().mockResolvedValue(undefined)}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    expect(screen.getByText("Income 6")).toBeInTheDocument();
    expect(screen.queryByText("Income 1")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    expect(screen.getByText("Income 1")).toBeInTheDocument();
  });
});
