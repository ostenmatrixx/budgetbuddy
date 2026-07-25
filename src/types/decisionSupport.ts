import type {
  Transaction,
  TransactionDraft,
  TransactionSubcategoryOption,
  TransactionType
} from "./transaction";

export const recurringFrequencies = [
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "yearly"
] as const;

export type RecurringFrequency = (typeof recurringFrequencies)[number];

export const recurringFrequencyLabels: Record<RecurringFrequency, string> = {
  weekly: "Weekly",
  biweekly: "Every two weeks",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly"
};

export interface ActivityFilters {
  search: string;
  types: TransactionType[];
  dateFrom: string;
  dateTo: string;
  minimumAmount: string;
  maximumAmount: string;
  sort: "newest" | "oldest";
}

export interface ActivityPage {
  items: Transaction[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface RecurringItem {
  id: string;
  type: TransactionType;
  subcategoryId?: string;
  subcategory?: TransactionSubcategoryOption;
  amount: number;
  description: string;
  notes: string;
  frequency: RecurringFrequency;
  startDate: string;
  occurrenceNumber: number;
  nextDueDate: string;
  endDate?: string;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringItemDraft {
  type: TransactionType;
  subcategoryId?: string;
  amount: number;
  description: string;
  notes: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
}

export interface RecurringOccurrenceAction {
  id: string;
  recurringItemId: string;
  dueDate: string;
  action: "recorded" | "skipped";
  transactionId?: string;
  createdAt: string;
}

export interface RecurringTransactionContext {
  itemId: string;
  dueDate: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  subcategoryId: string;
  subcategory?: TransactionSubcategoryOption;
  targetAmount: number;
  trackingStartDate: string;
  targetDate?: string;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoalDraft {
  name: string;
  subcategoryId: string;
  targetAmount: number;
  trackingStartDate: string;
  targetDate?: string;
}

export interface SavingsGoalProgress {
  goalId: string;
  savedAmount: number;
  remainingAmount: number;
  percent: number;
  status: "active" | "completed" | "overdue";
  recommendedPerMonth?: number;
}

export interface MonthlyInsights {
  period: "current" | "historical" | "future";
  safeToSpendPerDay?: number;
  savingsRate?: number;
  savingsTargetRate: number;
  budgetPace?: {
    projectedOutflow: number;
    targetOutflow: number;
    status: "on-track" | "watch" | "over";
  };
  largestSpendingChange?: {
    type: "bills" | "non_essentials";
    amount: number;
    direction: "up" | "down" | "unchanged";
  };
}

export interface InAppAlert {
  id: string;
  group: "critical" | "upcoming" | "progress";
  title: string;
  message: string;
  icon: string;
}

export interface TransactionPrefill {
  draft: TransactionDraft;
  label: string;
}
