import {
  calculateBudgetSummary,
  filterTransactionsByMonth,
  type BudgetPreference,
  type BudgetSummary
} from "./budget";
import type {
  InAppAlert,
  MonthlyInsights,
  RecurringFrequency,
  RecurringItem,
  SavingsGoal,
  SavingsGoalProgress,
  TransactionPrefill
} from "../types/decisionSupport";
import {
  transactionTypeShortLabels,
  type Transaction,
  type TransactionDraft
} from "../types/transaction";

const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

export function calculateMonthlyInsights(
  transactions: Transaction[],
  year: number,
  month: number,
  preference: BudgetPreference,
  todayKey: string
): MonthlyInsights {
  const today = parseDateKey(todayKey);
  const selectedKey = year * 12 + month;
  const currentKey = today.year * 12 + today.month;
  const period =
    selectedKey < currentKey ? "historical" : selectedKey > currentKey ? "future" : "current";
  const currentSummary = calculateBudgetSummary(transactions, year, month, preference);
  const previousPeriod = getPreviousPeriod(year, month);
  const previousSummary = calculateBudgetSummary(
    transactions,
    previousPeriod.year,
    previousPeriod.month,
    preference
  );
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const elapsedDays =
    period === "historical"
      ? daysInMonth
      : period === "future"
        ? 0
        : Math.min(today.day, daysInMonth);
  const remainingDays = period === "current" ? daysInMonth - elapsedDays + 1 : 0;
  const targetOutflow = Math.max(0, currentSummary.totalIncome - currentSummary.savingsTarget);
  const currentOutflow = currentSummary.billsSpent + currentSummary.nonEssentialsSpent;
  const projectedOutflow =
    elapsedDays > 0 ? roundMoney((currentOutflow / elapsedDays) * daysInMonth) : 0;
  const paceRatio = targetOutflow > 0 ? projectedOutflow / targetOutflow : 0;

  return {
    period,
    safeToSpendPerDay:
      period === "current" && remainingDays > 0
        ? roundMoney(Math.max(currentSummary.remainingIncome, 0) / remainingDays)
        : undefined,
    savingsRate:
      currentSummary.totalIncome > 0
        ? roundPercent((currentSummary.savingsSaved / currentSummary.totalIncome) * 100)
        : undefined,
    savingsTargetRate: preference.savingsPercent,
    budgetPace:
      period === "future" || elapsedDays === 0
        ? undefined
        : {
            projectedOutflow,
            targetOutflow,
            status: paceRatio > 1 ? "over" : paceRatio >= 0.9 ? "watch" : "on-track"
          },
    largestSpendingChange: getLargestSpendingChange(currentSummary, previousSummary)
  };
}

export function getPreviousPeriod(year: number, month: number): { year: number; month: number } {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

export function getRecentTransactionPrefills(
  transactions: Transaction[],
  timeZoneToday: string,
  limit = 5
): TransactionPrefill[] {
  const seen = new Set<string>();
  const sorted = [...transactions].sort((first, second) => {
    const byDate = second.date.localeCompare(first.date);
    return byDate || second.createdAt.localeCompare(first.createdAt);
  });
  const prefills: TransactionPrefill[] = [];

  for (const transaction of sorted) {
    const key = [
      transaction.type,
      transaction.subcategory?.trim().toLocaleLowerCase() ?? "",
      transaction.description.trim().toLocaleLowerCase(),
      transaction.amount.toFixed(2)
    ].join("|");

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    prefills.push({
      label: transaction.description,
      draft: transactionToPrefill(transaction, timeZoneToday)
    });

    if (prefills.length >= limit) {
      break;
    }
  }

  return prefills;
}

export function transactionToPrefill(transaction: Transaction, date: string): TransactionDraft {
  return {
    type: transaction.type,
    subcategory: transaction.subcategory,
    amount: transaction.amount,
    date,
    description: transaction.description,
    notes: transaction.notes
  };
}

export function advanceRecurringDate(
  startDate: string,
  frequency: RecurringFrequency,
  occurrenceNumber: number
): string {
  const start = parseDateKey(startDate);

  if (!Number.isInteger(occurrenceNumber) || occurrenceNumber < 0) {
    throw new Error("Occurrence number must not be negative.");
  }

  if (frequency === "weekly" || frequency === "biweekly") {
    const interval = frequency === "weekly" ? 7 : 14;
    const date = new Date(Date.UTC(start.year, start.month - 1, start.day));
    date.setUTCDate(date.getUTCDate() + occurrenceNumber * interval);
    return formatUtcDate(date);
  }

  const monthInterval = frequency === "monthly" ? 1 : frequency === "quarterly" ? 3 : 12;
  const monthIndex = start.month - 1 + occurrenceNumber * monthInterval;
  const targetYear = start.year + Math.floor(monthIndex / 12);
  const targetMonthIndex = ((monthIndex % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonthIndex + 1, 0)).getUTCDate();
  return formatUtcDate(
    new Date(Date.UTC(targetYear, targetMonthIndex, Math.min(start.day, lastDay)))
  );
}

export function calculateSavingsGoalProgress(
  goal: SavingsGoal,
  savedAmount: number,
  todayKey: string
): SavingsGoalProgress {
  const normalizedSavedAmount = roundMoney(Math.max(0, savedAmount));
  const remainingAmount = roundMoney(Math.max(goal.targetAmount - normalizedSavedAmount, 0));
  const completed = normalizedSavedAmount >= goal.targetAmount;
  const overdue = !completed && Boolean(goal.targetDate && goal.targetDate < todayKey);
  const recommendedPerMonth =
    goal.targetDate && !completed
      ? roundMoney(remainingAmount / countInclusiveCalendarMonths(todayKey, goal.targetDate))
      : undefined;

  return {
    goalId: goal.id,
    savedAmount: normalizedSavedAmount,
    remainingAmount,
    percent:
      goal.targetAmount > 0
        ? Math.min(100, Math.round((normalizedSavedAmount / goal.targetAmount) * 100))
        : 0,
    status: completed ? "completed" : overdue ? "overdue" : "active",
    recommendedPerMonth
  };
}

export function buildInAppAlerts({
  summary,
  recurringItems,
  goals,
  todayKey
}: {
  summary: BudgetSummary;
  recurringItems: RecurringItem[];
  goals: Array<{ goal: SavingsGoal; progress: SavingsGoalProgress }>;
  todayKey: string;
}): InAppAlert[] {
  const alerts: InAppAlert[] = [];

  if (summary.remainingIncome < 0) {
    alerts.push({
      id: "negative-remaining-income",
      group: "critical",
      icon: "warning",
      title: "Income is fully allocated",
      message: "This month’s outflow is higher than recorded income."
    });
  }

  if (summary.essentialsRemaining < 0) {
    alerts.push({
      id: "essentials-over-target",
      group: "critical",
      icon: "home",
      title: "Essentials exceeded their target",
      message: "Review essential spending before adding another commitment."
    });
  }

  if (summary.nonEssentialsRemaining < 0) {
    alerts.push({
      id: "spending-over-target",
      group: "critical",
      icon: "shopping_bag",
      title: "Non-essentials exceeded their target",
      message: "Discretionary spending is above the saved allocation."
    });
  }

  for (const item of recurringItems.filter((entry) => entry.isActive)) {
    const daysUntilDue = differenceInUtcDays(todayKey, item.nextDueDate);

    if (daysUntilDue < 0) {
      alerts.push({
        id: `recurring-overdue-${item.id}`,
        group: "critical",
        icon: "event_busy",
        title: `${item.description} is overdue`,
        message: `It was due ${item.nextDueDate}. Record or skip this occurrence.`
      });
    } else if (daysUntilDue <= 3) {
      alerts.push({
        id: `recurring-upcoming-${item.id}`,
        group: "upcoming",
        icon: "event",
        title: `${item.description} is due soon`,
        message: `Due ${item.nextDueDate}.`
      });
    }
  }

  for (const { goal, progress } of goals) {
    if (progress.status === "overdue") {
      alerts.push({
        id: `goal-overdue-${goal.id}`,
        group: "critical",
        icon: "flag",
        title: `${goal.name} is past its target date`,
        message: "Review the deadline or continue contributing toward the goal."
      });
    } else if (
      progress.status === "active" &&
      progress.recommendedPerMonth &&
      progress.savedAmount < progress.recommendedPerMonth
    ) {
      alerts.push({
        id: `goal-progress-${goal.id}`,
        group: "progress",
        icon: "savings",
        title: `${goal.name} may need attention`,
        message: "The current progress is below the recommended monthly contribution."
      });
    }
  }

  return alerts;
}

export function getUpcomingRecurringItems(
  items: RecurringItem[],
  todayKey: string,
  windowDays = 30
): RecurringItem[] {
  return items
    .filter(
      (item) => item.isActive && differenceInUtcDays(todayKey, item.nextDueDate) <= windowDays
    )
    .sort((first, second) => first.nextDueDate.localeCompare(second.nextDueDate));
}

export function validateRecurringItemDraft(draft: {
  amount: number;
  description: string;
  startDate: string;
  endDate?: string;
}): string | undefined {
  if (!Number.isFinite(draft.amount) || draft.amount <= 0) {
    return "Enter an amount greater than zero.";
  }
  if (!draft.description.trim()) {
    return "Add a description.";
  }
  parseDateKey(draft.startDate);
  if (draft.endDate) {
    parseDateKey(draft.endDate);
    if (draft.endDate < draft.startDate) {
      return "End date must be on or after the start date.";
    }
  }
  return undefined;
}

export function validateSavingsGoalDraft(draft: {
  name: string;
  targetAmount: number;
  trackingStartDate: string;
  targetDate?: string;
  subcategoryId: string;
}): string | undefined {
  if (!draft.name.trim()) {
    return "Add a goal name.";
  }
  if (!draft.subcategoryId) {
    return "Choose a savings subcategory.";
  }
  if (!Number.isFinite(draft.targetAmount) || draft.targetAmount <= 0) {
    return "Enter a target amount greater than zero.";
  }
  parseDateKey(draft.trackingStartDate);
  if (draft.targetDate) {
    parseDateKey(draft.targetDate);
    if (draft.targetDate < draft.trackingStartDate) {
      return "Target date must be on or after the tracking start date.";
    }
  }
  return undefined;
}

function getLargestSpendingChange(
  current: BudgetSummary,
  previous: BudgetSummary
): MonthlyInsights["largestSpendingChange"] {
  const changes = [
    { type: "bills" as const, amount: roundMoney(current.billsSpent - previous.billsSpent) },
    {
      type: "non_essentials" as const,
      amount: roundMoney(current.nonEssentialsSpent - previous.nonEssentialsSpent)
    }
  ];
  const largest = changes.sort(
    (first, second) => Math.abs(second.amount) - Math.abs(first.amount)
  )[0];

  if (!largest || (current.totalSpent === 0 && previous.totalSpent === 0)) {
    return undefined;
  }

  return {
    ...largest,
    direction: largest.amount > 0 ? "up" : largest.amount < 0 ? "down" : "unchanged"
  };
}

function countInclusiveCalendarMonths(from: string, to: string): number {
  const start = parseDateKey(from);
  const end = parseDateKey(to);
  const difference = (end.year - start.year) * 12 + end.month - start.month;
  return Math.max(1, difference + 1);
}

function differenceInUtcDays(from: string, to: string): number {
  const start = parseDateKey(from);
  const end = parseDateKey(to);
  const startValue = Date.UTC(start.year, start.month - 1, start.day);
  const endValue = Date.UTC(end.year, end.month - 1, end.day);
  return Math.round((endValue - startValue) / 86_400_000);
}

function parseDateKey(value: string): { year: number; month: number; day: number } {
  const match = datePattern.exec(value);
  if (!match) {
    throw new Error("Use a valid date.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("Use a valid date.");
  }

  return { year, month, day };
}

function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

export function getInsightCategoryLabel(type: "bills" | "non_essentials"): string {
  return transactionTypeShortLabels[type];
}

export function getMonthlyTransactionsForInsights(
  transactions: Transaction[],
  year: number,
  month: number
): Transaction[] {
  const previous = getPreviousPeriod(year, month);
  return [
    ...filterTransactionsByMonth(transactions, year, month),
    ...filterTransactionsByMonth(transactions, previous.year, previous.month)
  ];
}
