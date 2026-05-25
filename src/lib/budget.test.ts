import { describe, expect, it } from "vitest";
import {
  calculateBudgetSummary,
  filterTransactionsByMonth,
  formatCurrency,
  validateTransactionInput
} from "./budget";
import type { Transaction } from "../types/transaction";

const transactions: Transaction[] = [
  {
    id: "1",
    type: "income",
    amount: 50000,
    date: "2026-05-05",
    description: "Salary",
    notes: "",
    createdAt: "2026-05-05T00:00:00.000Z",
    updatedAt: "2026-05-05T00:00:00.000Z"
  },
  {
    id: "2",
    type: "bills",
    amount: 12000,
    date: "2026-05-08",
    description: "Rent",
    notes: "",
    createdAt: "2026-05-08T00:00:00.000Z",
    updatedAt: "2026-05-08T00:00:00.000Z"
  },
  {
    id: "3",
    type: "non_essentials",
    amount: 4000,
    date: "2026-05-09",
    description: "Dinner",
    notes: "",
    createdAt: "2026-05-09T00:00:00.000Z",
    updatedAt: "2026-05-09T00:00:00.000Z"
  },
  {
    id: "4",
    type: "savings",
    amount: 15000,
    date: "2026-05-10",
    description: "Emergency fund",
    notes: "",
    createdAt: "2026-05-10T00:00:00.000Z",
    updatedAt: "2026-05-10T00:00:00.000Z"
  },
  {
    id: "5",
    type: "income",
    amount: 10000,
    date: "2026-04-30",
    description: "Old bonus",
    notes: "",
    createdAt: "2026-04-30T00:00:00.000Z",
    updatedAt: "2026-04-30T00:00:00.000Z"
  }
];

describe("filterTransactionsByMonth", () => {
  it("returns only transactions for the selected year and month", () => {
    const result = filterTransactionsByMonth(transactions, 2026, 5);

    expect(result.map((transaction) => transaction.id)).toEqual(["1", "2", "3", "4"]);
  });
});

describe("calculateBudgetSummary", () => {
  it("calculates totals, targets, and remaining values for the month", () => {
    const result = calculateBudgetSummary(transactions, 2026, 5);

    expect(result.totalIncome).toBe(50000);
    expect(result.billsSpent).toBe(12000);
    expect(result.nonEssentialsSpent).toBe(4000);
    expect(result.savingsSaved).toBe(15000);
    expect(result.totalSpent).toBe(16000);
    expect(result.remainingIncome).toBe(19000);
    expect(result.essentialsTarget).toBe(25000);
    expect(result.savingsTarget).toBe(15000);
    expect(result.nonEssentialsTarget).toBe(10000);
    expect(result.essentialsRemaining).toBe(13000);
    expect(result.savingsProgress).toBe(15000);
    expect(result.nonEssentialsRemaining).toBe(6000);
  });
});

describe("validateTransactionInput", () => {
  it("returns friendly errors for missing and invalid fields", () => {
    const result = validateTransactionInput({
      type: "",
      amount: "0",
      date: "",
      description: " ",
      notes: ""
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual({
      type: "Choose a transaction type.",
      amount: "Enter an amount greater than 0.",
      date: "Choose a date.",
      description: "Add a short description."
    });
  });

  it("normalizes a valid transaction input", () => {
    const result = validateTransactionInput({
      type: "income",
      amount: "1250.50",
      date: "2026-05-15",
      description: " Freelance ",
      notes: " Optional note "
    });

    expect(result.isValid).toBe(true);
    expect(result.value).toEqual({
      type: "income",
      amount: 1250.5,
      date: "2026-05-15",
      description: "Freelance",
      notes: "Optional note"
    });
  });
});

describe("formatCurrency", () => {
  it("formats values as Philippine pesos by default", () => {
    expect(formatCurrency(1234.5)).toBe("₱1,234.50");
  });
});
