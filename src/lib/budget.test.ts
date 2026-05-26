import { describe, expect, it } from "vitest";
import {
  calculateAnnualReport,
  calculateBudgetSummary,
  calculateCategoryPieSegments,
  filterTransactionsByMonth,
  formatCurrency,
  normalizeTransactionSubcategory,
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

const annualTransactions: Transaction[] = [
  ...transactions,
  {
    id: "6",
    type: "income",
    amount: 45000,
    date: "2026-01-15",
    description: "January salary",
    notes: "",
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-01-15T00:00:00.000Z"
  },
  {
    id: "7",
    type: "bills",
    amount: 18000,
    date: "2026-01-16",
    description: "January bills",
    notes: "",
    createdAt: "2026-01-16T00:00:00.000Z",
    updatedAt: "2026-01-16T00:00:00.000Z"
  },
  {
    id: "8",
    type: "non_essentials",
    amount: 3500,
    date: "2026-01-20",
    description: "January eating out",
    notes: "",
    createdAt: "2026-01-20T00:00:00.000Z",
    updatedAt: "2026-01-20T00:00:00.000Z"
  },
  {
    id: "9",
    type: "savings",
    amount: 9000,
    date: "2026-01-25",
    description: "January savings",
    notes: "",
    createdAt: "2026-01-25T00:00:00.000Z",
    updatedAt: "2026-01-25T00:00:00.000Z"
  },
  {
    id: "10",
    type: "income",
    amount: 99999,
    date: "2025-01-15",
    description: "Prior year salary",
    notes: "",
    createdAt: "2025-01-15T00:00:00.000Z",
    updatedAt: "2025-01-15T00:00:00.000Z"
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

describe("calculateAnnualReport", () => {
  it("aggregates category totals for all 12 months in the selected year", () => {
    const result = calculateAnnualReport(annualTransactions, 2026);

    expect(result.months).toHaveLength(12);
    expect(result.months[0]).toMatchObject({
      month: 1,
      monthLabel: "Jan",
      totalIncome: 45000,
      billsSpent: 18000,
      nonEssentialsSpent: 3500,
      savingsSaved: 9000,
      totalSpent: 21500,
      outflow: 30500,
      remainingIncome: 14500
    });
    expect(result.months[4]).toMatchObject({
      month: 5,
      monthLabel: "May",
      totalIncome: 50000,
      billsSpent: 12000,
      nonEssentialsSpent: 4000,
      savingsSaved: 15000,
      totalSpent: 16000,
      outflow: 31000,
      remainingIncome: 19000
    });
  });

  it("calculates yearly totals and excludes transactions from other years", () => {
    const result = calculateAnnualReport(annualTransactions, 2026);

    expect(result.yearly).toEqual({
      totalIncome: 105000,
      billsSpent: 30000,
      nonEssentialsSpent: 7500,
      savingsSaved: 24000,
      totalSpent: 37500,
      outflow: 61500,
      remainingIncome: 43500
    });
  });

  it("returns the largest annual chart value for proportional bars", () => {
    const result = calculateAnnualReport(annualTransactions, 2026);

    expect(result.maxChartValue).toBe(50000);
    expect(result.hasTransactions).toBe(true);
  });

  it("returns zeroed report data for an empty year", () => {
    const result = calculateAnnualReport(annualTransactions, 2030);

    expect(result.hasTransactions).toBe(false);
    expect(result.maxChartValue).toBe(0);
    expect(result.yearly).toEqual({
      totalIncome: 0,
      billsSpent: 0,
      nonEssentialsSpent: 0,
      savingsSaved: 0,
      totalSpent: 0,
      outflow: 0,
      remainingIncome: 0
    });
    expect(result.months.every((month) => month.totalIncome === 0)).toBe(true);
  });
});

describe("subcategory helpers", () => {
  it("uses legacy fallback subcategories for existing essentials and savings entries", () => {
    expect(normalizeTransactionSubcategory({ type: "bills" })).toBe("Bills");
    expect(normalizeTransactionSubcategory({ type: "savings" })).toBe("Cash Savings");
    expect(normalizeTransactionSubcategory({ type: "income" })).toBe("Income");
    expect(normalizeTransactionSubcategory({ type: "non_essentials" })).toBe(
      "Non-Essentials"
    );
  });

  it("aggregates monthly pie segments by transaction description for essentials", () => {
    const result = calculateCategoryPieSegments(
      [
        ...transactions,
        {
          id: "6",
          type: "bills",
          subcategory: "House",
          amount: 8000,
          date: "2026-05-12",
          description: "Repairs",
          notes: "",
          createdAt: "2026-05-12T00:00:00.000Z",
          updatedAt: "2026-05-12T00:00:00.000Z"
        },
        {
          id: "7",
          type: "bills",
          subcategory: "Credit Card",
          amount: 5000,
          date: "2026-05-18",
          description: "Rent",
          notes: "",
          createdAt: "2026-05-18T00:00:00.000Z",
          updatedAt: "2026-05-18T00:00:00.000Z"
        }
      ],
      2026,
      5,
      "bills"
    );

    expect(result).toEqual([
      { label: "Rent", value: 17000, percentage: 68 },
      { label: "Repairs", value: 8000, percentage: 32 }
    ]);
  });

  it("aggregates monthly pie segments by transaction description for savings", () => {
    const result = calculateCategoryPieSegments(
      [
        ...transactions,
        {
          id: "6",
          type: "savings",
          subcategory: "Emergency Funds",
          amount: 5000,
          date: "2026-05-12",
          description: "Emergency transfer",
          notes: "",
          createdAt: "2026-05-12T00:00:00.000Z",
          updatedAt: "2026-05-12T00:00:00.000Z"
        }
      ],
      2026,
      5,
      "savings"
    );

    expect(result).toEqual([
      { label: "Emergency fund", value: 15000, percentage: 75 },
      { label: "Emergency transfer", value: 5000, percentage: 25 }
    ]);
  });

  it("uses transaction descriptions for income and non-essentials pie labels", () => {
    expect(calculateCategoryPieSegments(transactions, 2026, 5, "income")).toEqual([
      { label: "Salary", value: 50000, percentage: 100 }
    ]);
    expect(calculateCategoryPieSegments(transactions, 2026, 5, "non_essentials")).toEqual([
      { label: "Dinner", value: 4000, percentage: 100 }
    ]);
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
      subcategory: "Bills",
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

  it("requires valid subcategories for essentials and savings", () => {
    const missingSubcategory = validateTransactionInput({
      type: "bills",
      amount: "2500",
      date: "2026-05-15",
      description: "Utilities",
      subcategory: "",
      notes: ""
    });
    const invalidSubcategory = validateTransactionInput({
      type: "savings",
      amount: "3000",
      date: "2026-05-16",
      description: "Transfer",
      subcategory: "House",
      notes: ""
    });
    const validSubcategory = validateTransactionInput({
      type: "savings",
      amount: "3000",
      date: "2026-05-16",
      description: "Transfer",
      subcategory: "Emergency Funds",
      notes: ""
    });

    expect(missingSubcategory.errors.subcategory).toBe("Choose a subcategory.");
    expect(invalidSubcategory.errors.subcategory).toBe("Choose a valid subcategory.");
    expect(validSubcategory.value).toMatchObject({
      type: "savings",
      subcategory: "Emergency Funds"
    });
  });
});

describe("formatCurrency", () => {
  it("formats values as Philippine pesos by default", () => {
    expect(formatCurrency(1234.5)).toBe("₱1,234.50");
  });
});
