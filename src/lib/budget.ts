import {
  transactionTypes,
  type Transaction,
  type TransactionDraft,
  type TransactionErrors,
  type TransactionFormValues,
  type TransactionType
} from "../types/transaction";

export interface ValidationResult {
  isValid: boolean;
  errors: TransactionErrors;
  value?: TransactionDraft;
}

export interface BudgetSummary {
  totalIncome: number;
  billsSpent: number;
  nonEssentialsSpent: number;
  savingsSaved: number;
  totalSpent: number;
  remainingIncome: number;
  essentialsTarget: number;
  savingsTarget: number;
  nonEssentialsTarget: number;
  essentialsRemaining: number;
  savingsProgress: number;
  nonEssentialsRemaining: number;
}

export const DEFAULT_CURRENCY = import.meta.env.VITE_BUDGET_CURRENCY || "PHP";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export function isTransactionType(value: string): value is TransactionType {
  return transactionTypes.includes(value as TransactionType);
}

export function filterTransactionsByMonth(
  transactions: Transaction[],
  year: number,
  month: number
): Transaction[] {
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  return transactions.filter((transaction) => transaction.date.startsWith(monthKey));
}

export function calculateBudgetSummary(
  transactions: Transaction[],
  year: number,
  month: number
): BudgetSummary {
  const monthlyTransactions = filterTransactionsByMonth(transactions, year, month);
  const totalIncome = sumByType(monthlyTransactions, "income");
  const billsSpent = sumByType(monthlyTransactions, "bills");
  const nonEssentialsSpent = sumByType(monthlyTransactions, "non_essentials");
  const savingsSaved = sumByType(monthlyTransactions, "savings");
  const totalSpent = toMoney(billsSpent + nonEssentialsSpent);
  const remainingIncome = toMoney(totalIncome - billsSpent - nonEssentialsSpent - savingsSaved);
  const essentialsTarget = toMoney(totalIncome * 0.5);
  const savingsTarget = toMoney(totalIncome * 0.3);
  const nonEssentialsTarget = toMoney(totalIncome * 0.2);

  return {
    totalIncome,
    billsSpent,
    nonEssentialsSpent,
    savingsSaved,
    totalSpent,
    remainingIncome,
    essentialsTarget,
    savingsTarget,
    nonEssentialsTarget,
    essentialsRemaining: toMoney(essentialsTarget - billsSpent),
    savingsProgress: savingsSaved,
    nonEssentialsRemaining: toMoney(nonEssentialsTarget - nonEssentialsSpent)
  };
}

export function validateTransactionInput(values: TransactionFormValues): ValidationResult {
  const errors: TransactionErrors = {};
  const amount = Number(values.amount);
  const type = values.type.trim();
  const date = values.date.trim();
  const description = values.description.trim();
  const notes = values.notes.trim();

  if (!isTransactionType(type)) {
    errors.type = "Choose a transaction type.";
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = "Enter an amount greater than 0.";
  }

  if (!date || !datePattern.test(date)) {
    errors.date = "Choose a date.";
  }

  if (!description) {
    errors.description = "Add a short description.";
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: {},
    value: {
      type: type as TransactionType,
      amount: toMoney(amount),
      date,
      description,
      notes
    }
  };
}

export function formatCurrency(value: number, currency = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function progressPercent(actual: number, target: number): number {
  if (target <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((actual / target) * 100));
}

export function getMonthName(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, 1));
}

function sumByType(transactions: Transaction[], type: TransactionType): number {
  return toMoney(
    transactions
      .filter((transaction) => transaction.type === type)
      .reduce((total, transaction) => total + transaction.amount, 0)
  );
}

function toMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
