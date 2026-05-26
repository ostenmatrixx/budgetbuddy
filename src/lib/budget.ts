import {
  defaultSubcategoryByType,
  transactionSubcategoriesByType,
  transactionTypeShortLabels,
  transactionTypes,
  type Transaction,
  type TransactionDraft,
  type TransactionErrors,
  type TransactionFormValues,
  type TransactionSubcategory,
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

export interface AnnualTotals {
  totalIncome: number;
  billsSpent: number;
  nonEssentialsSpent: number;
  savingsSaved: number;
  totalSpent: number;
  outflow: number;
  remainingIncome: number;
}

export interface AnnualMonthReport extends AnnualTotals {
  month: number;
  monthLabel: string;
}

export interface AnnualReport {
  year: number;
  months: AnnualMonthReport[];
  yearly: AnnualTotals;
  maxChartValue: number;
  hasTransactions: boolean;
}

export interface CategoryPieSegment {
  label: string;
  value: number;
  percentage: number;
}

export interface SubcategoryGroup {
  label: string;
  total: number;
  transactions: Transaction[];
}

export const DEFAULT_CURRENCY = import.meta.env.VITE_BUDGET_CURRENCY || "PHP";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const shortMonthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });

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

export function calculateAnnualReport(transactions: Transaction[], year: number): AnnualReport {
  const annualTransactions = transactions.filter((transaction) =>
    transaction.date.startsWith(`${year}-`)
  );
  const months: AnnualMonthReport[] = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const monthlyTransactions = filterTransactionsByMonth(annualTransactions, year, month);

    return createAnnualMonthReport(month, monthlyTransactions);
  });
  const yearly = months.reduce<AnnualTotals>(
    (totals, month) => ({
      totalIncome: toMoney(totals.totalIncome + month.totalIncome),
      billsSpent: toMoney(totals.billsSpent + month.billsSpent),
      nonEssentialsSpent: toMoney(totals.nonEssentialsSpent + month.nonEssentialsSpent),
      savingsSaved: toMoney(totals.savingsSaved + month.savingsSaved),
      totalSpent: toMoney(totals.totalSpent + month.totalSpent),
      outflow: toMoney(totals.outflow + month.outflow),
      remainingIncome: toMoney(totals.remainingIncome + month.remainingIncome)
    }),
    createEmptyAnnualTotals()
  );
  const maxChartValue = Math.max(
    0,
    ...months.flatMap((month) => [
      month.totalIncome,
      month.billsSpent,
      month.nonEssentialsSpent,
      month.savingsSaved,
      month.outflow
    ])
  );

  return {
    year,
    months,
    yearly,
    maxChartValue,
    hasTransactions: annualTransactions.length > 0
  };
}

export function normalizeTransactionSubcategory(
  transaction: Pick<Transaction, "type"> & { subcategory?: string | null }
): string {
  const allowedSubcategories = transactionSubcategoriesByType[transaction.type] ?? [];

  if (allowedSubcategories.length === 0) {
    return transactionTypeShortLabels[transaction.type];
  }

  if (isValidSubcategoryForType(transaction.type, transaction.subcategory ?? "")) {
    return transaction.subcategory as TransactionSubcategory;
  }

  return defaultSubcategoryByType[transaction.type] ?? transactionTypeShortLabels[transaction.type];
}

export function calculateCategoryPieSegments(
  transactions: Transaction[],
  year: number,
  month: number,
  type: TransactionType
): CategoryPieSegment[] {
  const categoryTransactions = filterTransactionsByMonth(transactions, year, month).filter(
    (transaction) => transaction.type === type
  );
  const total = toMoney(
    categoryTransactions.reduce((sum, transaction) => sum + transaction.amount, 0)
  );
  const totalsByDescription = categoryTransactions.reduce<Map<string, number>>(
    (segments, transaction) => {
      const label = transaction.description.trim() || transactionTypeShortLabels[type];
      const current = segments.get(label) ?? 0;
      segments.set(label, toMoney(current + transaction.amount));

      return segments;
    },
    new Map()
  );

  return Array.from(totalsByDescription.entries()).map(([label, value]) => ({
      label,
      value,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0
  }));
}

export function calculateSubcategoryGroups(
  transactions: Transaction[],
  year: number,
  month: number,
  type: TransactionType
): SubcategoryGroup[] {
  const subcategories = transactionSubcategoriesByType[type] ?? [];

  if (subcategories.length === 0) {
    return [];
  }

  const categoryTransactions = filterTransactionsByMonth(transactions, year, month).filter(
    (transaction) => transaction.type === type
  );

  return subcategories.map((label) => {
    const groupTransactions = categoryTransactions.filter(
      (transaction) => normalizeTransactionSubcategory(transaction) === label
    );

    return {
      label,
      total: toMoney(
        groupTransactions.reduce((sum, transaction) => sum + transaction.amount, 0)
      ),
      transactions: groupTransactions
    };
  });
}

export function validateTransactionInput(values: TransactionFormValues): ValidationResult {
  const errors: TransactionErrors = {};
  const amount = Number(values.amount);
  const type = values.type.trim();
  const subcategory = values.subcategory?.trim() ?? "";
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

  if (isTransactionType(type)) {
    const allowedSubcategories = transactionSubcategoriesByType[type] ?? [];

    if (allowedSubcategories.length > 0 && !subcategory) {
      errors.subcategory = "Choose a subcategory.";
    } else if (
      allowedSubcategories.length > 0 &&
      !isValidSubcategoryForType(type, subcategory)
    ) {
      errors.subcategory = "Choose a valid subcategory.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  const value: TransactionDraft = {
    type: type as TransactionType,
    amount: toMoney(amount),
    date,
    description,
    notes
  };

  if (isValidSubcategoryForType(value.type, subcategory)) {
    value.subcategory = subcategory as TransactionSubcategory;
  }

  return {
    isValid: true,
    errors: {},
    value
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

function isValidSubcategoryForType(type: TransactionType, subcategory: string): boolean {
  return (transactionSubcategoriesByType[type] ?? []).includes(
    subcategory as TransactionSubcategory
  );
}

function createAnnualMonthReport(
  month: number,
  transactions: Transaction[]
): AnnualMonthReport {
  const totalIncome = sumByType(transactions, "income");
  const billsSpent = sumByType(transactions, "bills");
  const nonEssentialsSpent = sumByType(transactions, "non_essentials");
  const savingsSaved = sumByType(transactions, "savings");
  const totalSpent = toMoney(billsSpent + nonEssentialsSpent);
  const outflow = toMoney(totalSpent + savingsSaved);

  return {
    month,
    monthLabel: shortMonthFormatter.format(new Date(2000, month - 1, 1)),
    totalIncome,
    billsSpent,
    nonEssentialsSpent,
    savingsSaved,
    totalSpent,
    outflow,
    remainingIncome: toMoney(totalIncome - outflow)
  };
}

function createEmptyAnnualTotals(): AnnualTotals {
  return {
    totalIncome: 0,
    billsSpent: 0,
    nonEssentialsSpent: 0,
    savingsSaved: 0,
    totalSpent: 0,
    outflow: 0,
    remainingIncome: 0
  };
}

function toMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
