import { describe, expect, it } from "vitest";
import {
  DEFAULT_BUDGET_PREFERENCES,
  balanceBudgetPreference,
  calculateAnnualReport,
  calculateBudgetSummary,
  calculateCategoryPieSegments,
  calculateSubcategoryGroups,
  clampTransactionPage,
  filterTransactionsByMonth,
  formatCurrency,
  UNCATEGORIZED_SUBCATEGORY_LABEL,
  normalizeTransactionSubcategory,
  paginateTransactions,
  resolveSelectedSubcategoryLabel,
  sortTransactionsForDisplay,
  validateBudgetPreferenceInput,
  validateTransactionInput
} from "./budget";
import type {
  Transaction,
  TransactionSubcategoriesByType,
  TransactionSubcategoryOption
} from "../types/transaction";

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

  it("calculates budget targets from custom allocation preferences", () => {
    const result = calculateBudgetSummary(transactions, 2026, 5, {
      essentialsPercent: 60,
      savingsPercent: 20,
      nonEssentialsPercent: 20
    });

    expect(result.essentialsTarget).toBe(30000);
    expect(result.savingsTarget).toBe(10000);
    expect(result.nonEssentialsTarget).toBe(10000);
    expect(result.essentialsRemaining).toBe(18000);
    expect(result.nonEssentialsRemaining).toBe(6000);
  });
});

describe("budget preferences", () => {
  it("uses a 50/30/20 default allocation", () => {
    expect(DEFAULT_BUDGET_PREFERENCES).toEqual({
      essentialsPercent: 50,
      savingsPercent: 30,
      nonEssentialsPercent: 20
    });
  });

  it("validates whole-number percentages that total 100", () => {
    expect(
      validateBudgetPreferenceInput({
        essentialsPercent: 60,
        savingsPercent: 20,
        nonEssentialsPercent: 20
      })
    ).toEqual({
      isValid: true,
      errors: {},
      value: {
        essentialsPercent: 60,
        savingsPercent: 20,
        nonEssentialsPercent: 20
      }
    });

    expect(
      validateBudgetPreferenceInput({
        essentialsPercent: 60,
        savingsPercent: 25,
        nonEssentialsPercent: 20
      })
    ).toMatchObject({
      isValid: false,
      errors: {
        total: "Targets must total exactly 100%."
      }
    });
  });

  it("balances the two other categories proportionally and keeps the total at 100", () => {
    expect(
      balanceBudgetPreference(
        {
          essentialsPercent: 50,
          savingsPercent: 30,
          nonEssentialsPercent: 20
        },
        "essentialsPercent",
        60
      )
    ).toEqual({
      essentialsPercent: 60,
      savingsPercent: 24,
      nonEssentialsPercent: 16
    });
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
  const subcategoryOptions: TransactionSubcategoryOption[] = [
    createSubcategory("income-paycheck", "income", "Paycheck"),
    createSubcategory("income-side-work", "income", "Side work"),
    createSubcategory("bills-utilities", "bills", "Utilities"),
    createSubcategory("bills-rent", "bills", "Rent"),
    createSubcategory("savings-emergency", "savings", "Emergency fund"),
    createSubcategory("non-essentials-food", "non_essentials", "Food")
  ];
  const subcategoriesByType: TransactionSubcategoriesByType = {
    income: subcategoryOptions.filter((option) => option.type === "income"),
    bills: subcategoryOptions.filter((option) => option.type === "bills"),
    savings: subcategoryOptions.filter((option) => option.type === "savings"),
    non_essentials: subcategoryOptions.filter((option) => option.type === "non_essentials")
  };

  it("uses an uncategorized fallback for transactions without a subcategory", () => {
    expect(normalizeTransactionSubcategory({ type: "bills" })).toBe(
      UNCATEGORIZED_SUBCATEGORY_LABEL
    );
    expect(normalizeTransactionSubcategory({ type: "savings", subcategory: "" })).toBe(
      UNCATEGORIZED_SUBCATEGORY_LABEL
    );
    expect(normalizeTransactionSubcategory({ type: "income", subcategory: " Paycheck " })).toBe(
      "Paycheck"
    );
  });

  it("aggregates monthly pie segments by subcategory for essentials", () => {
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
      { label: "Uncategorized", value: 12000, percentage: 48 },
      { label: "House", value: 8000, percentage: 32 },
      { label: "Credit Card", value: 5000, percentage: 20 }
    ]);
  });

  it("aggregates monthly pie segments by subcategory for savings", () => {
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
      { label: "Uncategorized", value: 15000, percentage: 75 },
      { label: "Emergency Funds", value: 5000, percentage: 25 }
    ]);
  });

  it("uses uncategorized category labels for entries without subcategories", () => {
    expect(calculateCategoryPieSegments(transactions, 2026, 5, "income")).toEqual([
      { label: "Uncategorized", value: 50000, percentage: 100 }
    ]);
    expect(calculateCategoryPieSegments(transactions, 2026, 5, "non_essentials")).toEqual([
      { label: "Uncategorized", value: 4000, percentage: 100 }
    ]);
  });

  it("groups transactions into active, archived, legacy, and uncategorized cards", () => {
    const result = calculateSubcategoryGroups(
      [
        ...transactions,
        {
          id: "6",
          type: "bills",
          subcategory: "Utilities",
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
          subcategory: "Archived card",
          amount: 5000,
          date: "2026-05-18",
          description: "Prior card",
          notes: "",
          createdAt: "2026-05-18T00:00:00.000Z",
          updatedAt: "2026-05-18T00:00:00.000Z"
        }
      ],
      2026,
      5,
      "bills",
      subcategoriesByType
    );

    expect(result.map((group) => ({
      label: group.label,
      total: group.total,
      transactionIds: group.transactions.map((transaction) => transaction.id)
    }))).toEqual([
      { label: "Uncategorized", total: 12000, transactionIds: ["2"] },
      { label: "Utilities", total: 8000, transactionIds: ["6"] },
      { label: "Rent", total: 0, transactionIds: [] },
      { label: "Archived card", total: 5000, transactionIds: ["7"] }
    ]);
  });

  it("groups all main category types, including income and non-essentials", () => {
    const result = calculateSubcategoryGroups(
      [
        ...transactions,
        {
          id: "6",
          type: "income",
          subcategory: "Side work",
          amount: 5000,
          date: "2026-05-12",
          description: "Client invoice",
          notes: "",
          createdAt: "2026-05-12T00:00:00.000Z",
          updatedAt: "2026-05-12T00:00:00.000Z"
        }
      ],
      2026,
      5,
      "income",
      subcategoriesByType
    );

    expect(result.map((group) => ({
      label: group.label,
      total: group.total,
      transactionIds: group.transactions.map((transaction) => transaction.id)
    }))).toEqual([
      { label: "Uncategorized", total: 50000, transactionIds: ["1"] },
      { label: "Paycheck", total: 0, transactionIds: [] },
      { label: "Side work", total: 5000, transactionIds: ["6"] }
    ]);
  });

  it("excludes archived subcategories from empty cards unless transactions use them", () => {
    const result = calculateSubcategoryGroups(
      transactions,
      2026,
      5,
      "savings",
      {
        savings: [
          createSubcategory("active", "savings", "Emergency fund"),
          createSubcategory("archived", "savings", "Old vault", false)
        ]
      }
    );

    expect(result.map((group) => group.label)).toEqual([
      "Uncategorized",
      "Emergency fund"
    ]);
  });

  it("omits the uncategorized group when there are no uncategorized entries", () => {
    const result = calculateSubcategoryGroups(
      [
        {
          id: "custom-1",
          type: "bills",
          subcategory: "Utilities",
          amount: 2500,
          date: "2026-05-08",
          description: "Power bill",
          notes: "",
          createdAt: "2026-05-08T00:00:00.000Z",
          updatedAt: "2026-05-08T00:00:00.000Z"
        }
      ],
      2026,
      5,
      "bills",
      subcategoriesByType
    );

    expect(result.map((group) => group.label)).toEqual(["Utilities", "Rent"]);
  });

  it("keeps one empty uncategorized group as the fallback empty state", () => {
    const result = calculateSubcategoryGroups([], 2026, 5, "income", {});

    expect(result).toEqual([
      {
        label: "Uncategorized",
        total: 0,
        transactions: []
      }
    ]);
  });

  it("keeps a valid selected subcategory and falls back when it is unavailable", () => {
    const groups = calculateSubcategoryGroups(
      transactions,
      2026,
      5,
      "income",
      subcategoriesByType
    );

    expect(resolveSelectedSubcategoryLabel(groups, "Paycheck")).toBe("Paycheck");
    expect(resolveSelectedSubcategoryLabel(groups, "Missing")).toBe("Uncategorized");
    expect(resolveSelectedSubcategoryLabel([], "Paycheck")).toBe("");
  });
});

describe("transaction list pagination", () => {
  const paginatedTransactions: Transaction[] = [
    {
      id: "1",
      type: "income",
      amount: 1000,
      date: "2026-05-01",
      description: "One",
      notes: "",
      createdAt: "2026-05-01T09:00:00.000Z",
      updatedAt: "2026-05-01T09:00:00.000Z"
    },
    {
      id: "2",
      type: "income",
      amount: 1000,
      date: "2026-05-02",
      description: "Two",
      notes: "",
      createdAt: "2026-05-02T09:00:00.000Z",
      updatedAt: "2026-05-02T09:00:00.000Z"
    },
    {
      id: "3",
      type: "income",
      amount: 1000,
      date: "2026-05-02",
      description: "Three",
      notes: "",
      createdAt: "2026-05-02T10:00:00.000Z",
      updatedAt: "2026-05-02T10:00:00.000Z"
    },
    {
      id: "4",
      type: "income",
      amount: 1000,
      date: "2026-05-03",
      description: "Four",
      notes: "",
      createdAt: "2026-05-03T09:00:00.000Z",
      updatedAt: "2026-05-03T09:00:00.000Z"
    },
    {
      id: "5",
      type: "income",
      amount: 1000,
      date: "2026-05-04",
      description: "Five",
      notes: "",
      createdAt: "2026-05-04T09:00:00.000Z",
      updatedAt: "2026-05-04T09:00:00.000Z"
    },
    {
      id: "6",
      type: "income",
      amount: 1000,
      date: "2026-05-05",
      description: "Six",
      notes: "",
      createdAt: "2026-05-05T09:00:00.000Z",
      updatedAt: "2026-05-05T09:00:00.000Z"
    }
  ];

  it("sorts newest transactions by date descending and created date descending", () => {
    expect(sortTransactionsForDisplay(paginatedTransactions, "newest").map(({ id }) => id)).toEqual([
      "6",
      "5",
      "4",
      "3",
      "2",
      "1"
    ]);
  });

  it("sorts oldest transactions by date ascending and created date ascending", () => {
    expect(sortTransactionsForDisplay(paginatedTransactions, "oldest").map(({ id }) => id)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6"
    ]);
  });

  it("paginates transactions to five items per page", () => {
    const result = paginateTransactions(paginatedTransactions, 1);

    expect(result.items).toHaveLength(5);
    expect(result.items.map(({ id }) => id)).toEqual(["1", "2", "3", "4", "5"]);
    expect(result.totalPages).toBe(2);
    expect(result.hasNextPage).toBe(true);
  });

  it("clamps pages after the item count changes", () => {
    expect(clampTransactionPage(3, 6)).toBe(2);
    expect(clampTransactionPage(2, 4)).toBe(1);
    expect(clampTransactionPage(0, 6)).toBe(1);
  });

  it("keeps summary totals based on all transactions, not just visible rows", () => {
    const result = calculateBudgetSummary(paginatedTransactions, 2026, 5);
    const page = paginateTransactions(paginatedTransactions, 1);

    expect(page.items).toHaveLength(5);
    expect(result.totalIncome).toBe(6000);
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
      subcategory: "",
      notes: " Optional note "
    });

    expect(result.isValid).toBe(true);
    expect(result.value).toEqual({
      type: "income",
      amount: 1250.5,
      date: "2026-05-15",
      description: "Freelance",
      subcategory: undefined,
      notes: "Optional note"
    });
  });

  it("allows missing subcategories for every transaction type", () => {
    const result = validateTransactionInput({
      type: "bills",
      amount: "2500",
      date: "2026-05-15",
      description: "Utilities",
      subcategory: "",
      notes: ""
    });

    expect(result.isValid).toBe(true);
    expect(result.value?.type).toBe("bills");
    expect(result.value?.subcategory).toBeUndefined();
  });

  it("requires a selected subcategory to be active for its type", () => {
    const options: TransactionSubcategoriesByType = {
      income: [createSubcategory("income-paycheck", "income", "Paycheck")],
      bills: [createSubcategory("bills-utilities", "bills", "Utilities")],
      savings: [createSubcategory("savings-emergency", "savings", "Emergency fund")]
    };

    const invalidSubcategory = validateTransactionInput({
      type: "savings",
      amount: "3000",
      date: "2026-05-16",
      description: "Transfer",
      subcategory: "Utilities",
      notes: ""
    }, options);
    const validSubcategory = validateTransactionInput({
      type: "income",
      amount: "3000",
      date: "2026-05-16",
      description: "Salary",
      subcategory: "Paycheck",
      notes: ""
    }, options);

    expect(invalidSubcategory.errors.subcategory).toBe("Choose a valid subcategory.");
    expect(validSubcategory.value).toMatchObject({
      type: "income",
      subcategory: "Paycheck"
    });
  });
});

describe("formatCurrency", () => {
  it("formats values as Philippine pesos by default", () => {
    expect(formatCurrency(1234.5)).toBe("₱1,234.50");
  });
});

function createSubcategory(
  id: string,
  type: TransactionSubcategoryOption["type"],
  name: string,
  isActive = true
): TransactionSubcategoryOption {
  return {
    id,
    type,
    name,
    isActive,
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z"
  };
}
