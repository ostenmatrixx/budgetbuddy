import { describe, expect, it } from "vitest";
import {
  advanceRecurringDate,
  buildInAppAlerts,
  calculateMonthlyInsights,
  calculateSavingsGoalProgress,
  getInsightCategoryLabel,
  getMonthlyTransactionsForInsights,
  getPreviousPeriod,
  getRecentTransactionPrefills,
  getUpcomingRecurringItems,
  transactionToPrefill,
  validateRecurringItemDraft,
  validateSavingsGoalDraft
} from "./decisionSupport";
import { DEFAULT_BUDGET_PREFERENCES } from "./budget";
import type { SavingsGoal } from "../types/decisionSupport";
import type { RecurringItem } from "../types/decisionSupport";
import type { Transaction } from "../types/transaction";

function transaction(
  id: string,
  type: Transaction["type"],
  amount: number,
  date: string,
  description = id
): Transaction {
  return {
    id,
    version: 1,
    type,
    amount,
    date,
    description,
    notes: "",
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`
  };
}

describe("monthly decision support", () => {
  it("calculates inclusive safe-to-spend days and savings rate", () => {
    const insights = calculateMonthlyInsights(
      [
        transaction("income", "income", 10_000, "2026-07-01"),
        transaction("bill", "bills", 2_000, "2026-07-02"),
        transaction("saving", "savings", 1_000, "2026-07-03")
      ],
      2026,
      7,
      DEFAULT_BUDGET_PREFERENCES,
      "2026-07-25"
    );

    expect(insights.period).toBe("current");
    expect(insights.safeToSpendPerDay).toBe(1000);
    expect(insights.savingsRate).toBe(10);
  });

  it("does not invent a savings rate when income is zero", () => {
    const insights = calculateMonthlyInsights(
      [transaction("bill", "bills", 200, "2026-07-02")],
      2026,
      7,
      DEFAULT_BUDGET_PREFERENCES,
      "2026-07-10"
    );

    expect(insights.savingsRate).toBeUndefined();
  });

  it("suppresses daily pacing for historical and future months", () => {
    expect(
      calculateMonthlyInsights([], 2026, 6, DEFAULT_BUDGET_PREFERENCES, "2026-07-10")
        .safeToSpendPerDay
    ).toBeUndefined();
    expect(
      calculateMonthlyInsights([], 2026, 8, DEFAULT_BUDGET_PREFERENCES, "2026-07-10").budgetPace
    ).toBeUndefined();
  });

  it("rolls January comparisons into the prior year", () => {
    expect(getPreviousPeriod(2026, 1)).toEqual({ year: 2025, month: 12 });
  });

  it("compares spending with the previous month", () => {
    const insights = calculateMonthlyInsights(
      [
        transaction("previous", "bills", 100, "2026-06-02"),
        transaction("current", "bills", 300, "2026-07-02")
      ],
      2026,
      7,
      DEFAULT_BUDGET_PREFERENCES,
      "2026-07-10"
    );

    expect(insights.largestSpendingChange).toEqual({
      type: "bills",
      amount: 200,
      direction: "up"
    });
    expect(getInsightCategoryLabel("bills")).toBe("Essentials");
    expect(
      getMonthlyTransactionsForInsights(
        [
          transaction("previous", "bills", 100, "2026-06-02"),
          transaction("current", "bills", 300, "2026-07-02"),
          transaction("old", "bills", 300, "2026-05-02")
        ],
        2026,
        7
      )
    ).toHaveLength(2);
  });
});

describe("recurring schedules", () => {
  it("preserves month-end anchors", () => {
    expect(advanceRecurringDate("2026-01-31", "monthly", 1)).toBe("2026-02-28");
    expect(advanceRecurringDate("2026-01-31", "monthly", 2)).toBe("2026-03-31");
  });

  it("handles leap-day yearly schedules", () => {
    expect(advanceRecurringDate("2024-02-29", "yearly", 1)).toBe("2025-02-28");
    expect(advanceRecurringDate("2024-02-29", "yearly", 4)).toBe("2028-02-29");
  });

  it("advances weekly, biweekly, and quarterly schedules", () => {
    expect(advanceRecurringDate("2026-07-01", "weekly", 2)).toBe("2026-07-15");
    expect(advanceRecurringDate("2026-07-01", "biweekly", 2)).toBe("2026-07-29");
    expect(advanceRecurringDate("2026-01-31", "quarterly", 1)).toBe("2026-04-30");
  });

  it("rejects invalid occurrence numbers and dates", () => {
    expect(() => advanceRecurringDate("not-a-date", "monthly", 1)).toThrow("valid date");
    expect(() => advanceRecurringDate("2026-07-01", "monthly", -1)).toThrow("must not be negative");
  });
});

describe("quick entry and goals", () => {
  it("deduplicates recent transaction prefills and uses today's date", () => {
    const latest = transaction("latest", "bills", 500, "2026-07-20", "Groceries");
    const older = transaction("older", "bills", 500, "2026-07-10", "Groceries");
    const prefills = getRecentTransactionPrefills([older, latest], "2026-07-25");

    expect(prefills).toHaveLength(1);
    expect(prefills[0].draft.date).toBe("2026-07-25");
  });

  it("copies an existing transaction into an editable draft", () => {
    const source = {
      ...transaction("source", "savings", 250, "2026-07-20", "Reserve"),
      subcategory: "Emergency Fund",
      notes: "Payday"
    };
    expect(transactionToPrefill(source, "2026-07-25")).toEqual({
      type: "savings",
      subcategory: "Emergency Fund",
      amount: 250,
      date: "2026-07-25",
      description: "Reserve",
      notes: "Payday"
    });
  });

  it("counts inclusive calendar months for deadline guidance", () => {
    const goal: SavingsGoal = {
      id: "goal",
      name: "Emergency fund",
      subcategoryId: "subcategory",
      targetAmount: 3000,
      trackingStartDate: "2026-07-01",
      targetDate: "2026-09-30",
      isActive: true,
      version: 1,
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T00:00:00.000Z"
    };

    expect(calculateSavingsGoalProgress(goal, 0, "2026-07-25")).toMatchObject({
      remainingAmount: 3000,
      recommendedPerMonth: 1000,
      status: "active"
    });
    expect(calculateSavingsGoalProgress(goal, 3000, "2026-10-01").status).toBe("completed");
    expect(calculateSavingsGoalProgress(goal, 1000, "2026-10-01").status).toBe("overdue");
  });
});

describe("decision-support validation and alerts", () => {
  const recurringItem: RecurringItem = {
    id: "recurring",
    type: "bills",
    amount: 500,
    description: "Rent",
    notes: "",
    frequency: "monthly",
    startDate: "2026-07-01",
    occurrenceNumber: 0,
    nextDueDate: "2026-07-20",
    isActive: true,
    version: 1,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z"
  };
  const goal: SavingsGoal = {
    id: "goal",
    name: "Emergency reserve",
    subcategoryId: "subcategory",
    targetAmount: 3000,
    trackingStartDate: "2026-07-01",
    targetDate: "2026-07-24",
    isActive: true,
    version: 1,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z"
  };

  it("sorts overdue and upcoming recurring items", () => {
    const upcoming = getUpcomingRecurringItems(
      [
        { ...recurringItem, id: "later", nextDueDate: "2026-08-20" },
        recurringItem,
        { ...recurringItem, id: "paused", isActive: false }
      ],
      "2026-07-25"
    );

    expect(upcoming.map(({ id }) => id)).toEqual(["recurring", "later"]);
  });

  it("builds critical, upcoming, and progress alerts from live conditions", () => {
    const alerts = buildInAppAlerts({
      summary: {
        totalIncome: 100,
        billsSpent: 80,
        nonEssentialsSpent: 40,
        savingsSaved: 20,
        savingsWithdrawn: 0,
        savingsBalance: 20,
        availableFunds: 100,
        totalSpent: 120,
        remainingIncome: -40,
        essentialsTarget: 50,
        savingsTarget: 30,
        nonEssentialsTarget: 20,
        essentialsRemaining: -30,
        savingsProgress: 20,
        nonEssentialsRemaining: -20
      },
      recurringItems: [recurringItem, { ...recurringItem, id: "soon", nextDueDate: "2026-07-27" }],
      goals: [
        {
          goal,
          progress: calculateSavingsGoalProgress(goal, 0, "2026-07-25")
        },
        {
          goal: { ...goal, id: "future", targetDate: "2026-10-01" },
          progress: {
            goalId: "future",
            savedAmount: 1,
            remainingAmount: 2999,
            percent: 0,
            status: "active",
            recommendedPerMonth: 1000
          }
        }
      ],
      todayKey: "2026-07-25"
    });

    expect(alerts.some(({ id }) => id === "negative-remaining-income")).toBe(true);
    expect(alerts.some(({ id }) => id === "recurring-overdue-recurring")).toBe(true);
    expect(alerts.some(({ id }) => id === "recurring-upcoming-soon")).toBe(true);
    expect(alerts.some(({ id }) => id === "goal-overdue-goal")).toBe(true);
    expect(alerts.some(({ id }) => id === "goal-progress-future")).toBe(true);
  });

  it("validates recurring date and amount boundaries", () => {
    expect(
      validateRecurringItemDraft({
        amount: 0,
        description: "Rent",
        startDate: "2026-07-01"
      })
    ).toMatch(/greater than zero/);
    expect(
      validateRecurringItemDraft({
        amount: 1,
        description: " ",
        startDate: "2026-07-01"
      })
    ).toMatch(/description/);
    expect(
      validateRecurringItemDraft({
        amount: 1,
        description: "Rent",
        startDate: "2026-07-02",
        endDate: "2026-07-01"
      })
    ).toMatch(/End date/);
    expect(
      validateRecurringItemDraft({
        amount: 1,
        description: "Rent",
        startDate: "2026-07-01",
        endDate: "2026-08-01"
      })
    ).toBeUndefined();
  });

  it("validates goal identity, amount, subcategory, and dates", () => {
    const valid = {
      name: "Reserve",
      subcategoryId: "subcategory",
      targetAmount: 1000,
      trackingStartDate: "2026-07-01",
      targetDate: "2026-08-01"
    };
    expect(validateSavingsGoalDraft(valid)).toBeUndefined();
    expect(validateSavingsGoalDraft({ ...valid, name: " " })).toMatch(/name/);
    expect(validateSavingsGoalDraft({ ...valid, subcategoryId: "" })).toMatch(/subcategory/);
    expect(validateSavingsGoalDraft({ ...valid, targetAmount: -1 })).toMatch(/greater than zero/);
    expect(validateSavingsGoalDraft({ ...valid, targetDate: "2026-06-30" })).toMatch(/Target date/);
  });
});
