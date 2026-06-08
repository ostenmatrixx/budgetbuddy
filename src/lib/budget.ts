import {
  transactionTypes,
  type Transaction,
  type TransactionSubcategoriesByType,
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

export interface BudgetPreference {
  essentialsPercent: number;
  savingsPercent: number;
  nonEssentialsPercent: number;
}

export type BudgetPreferenceKey = keyof BudgetPreference;

export interface BudgetPreferenceErrors {
  essentialsPercent?: string;
  savingsPercent?: string;
  nonEssentialsPercent?: string;
  total?: string;
}

export interface BudgetPreferenceValidationResult {
  isValid: boolean;
  errors: BudgetPreferenceErrors;
  value?: BudgetPreference;
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

export type TransactionSortOrder = "newest" | "oldest";

export interface TransactionPage {
  items: Transaction[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export const DEFAULT_BUDGET_PREFERENCES: BudgetPreference = {
  essentialsPercent: 50,
  savingsPercent: 30,
  nonEssentialsPercent: 20
};

export const UNCATEGORIZED_SUBCATEGORY_LABEL = "Uncategorized";
export const TRANSACTION_PAGE_SIZE = 5;
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
  month: number,
  budgetPreference: BudgetPreference = DEFAULT_BUDGET_PREFERENCES
): BudgetSummary {
  const monthlyTransactions = filterTransactionsByMonth(transactions, year, month);
  const totalIncome = sumByType(monthlyTransactions, "income");
  const billsSpent = sumByType(monthlyTransactions, "bills");
  const nonEssentialsSpent = sumByType(monthlyTransactions, "non_essentials");
  const savingsSaved = sumByType(monthlyTransactions, "savings");
  const totalSpent = toMoney(billsSpent + nonEssentialsSpent);
  const remainingIncome = toMoney(totalIncome - billsSpent - nonEssentialsSpent - savingsSaved);
  const essentialsTarget = toMoney(totalIncome * (budgetPreference.essentialsPercent / 100));
  const savingsTarget = toMoney(totalIncome * (budgetPreference.savingsPercent / 100));
  const nonEssentialsTarget = toMoney(
    totalIncome * (budgetPreference.nonEssentialsPercent / 100)
  );

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

export function validateBudgetPreferenceInput(
  preference: BudgetPreference
): BudgetPreferenceValidationResult {
  const errors: BudgetPreferenceErrors = {};
  const normalized: BudgetPreference = {
    essentialsPercent: Number(preference.essentialsPercent),
    savingsPercent: Number(preference.savingsPercent),
    nonEssentialsPercent: Number(preference.nonEssentialsPercent)
  };

  (Object.keys(normalized) as BudgetPreferenceKey[]).forEach((key) => {
    const value = normalized[key];

    if (!Number.isInteger(value)) {
      errors[key] = "Use a whole number.";
    } else if (value < 0 || value > 100) {
      errors[key] = "Use 0% to 100%.";
    }
  });

  const total = getBudgetPreferenceTotal(normalized);

  if (Object.keys(errors).length === 0 && total !== 100) {
    errors.total = "Targets must total exactly 100%.";
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  return { isValid: true, errors: {}, value: normalized };
}

export function balanceBudgetPreference(
  preference: BudgetPreference,
  changedKey: BudgetPreferenceKey,
  nextValue: number
): BudgetPreference {
  const fixedValue = clampPercent(Math.round(nextValue));
  const otherKeys = (Object.keys(preference) as BudgetPreferenceKey[]).filter(
    (key) => key !== changedKey
  );
  const remaining = 100 - fixedValue;
  const otherTotal = otherKeys.reduce((total, key) => total + preference[key], 0);
  const balanced: BudgetPreference = {
    ...preference,
    [changedKey]: fixedValue
  };

  if (otherTotal <= 0) {
    balanced[otherKeys[0]] = Math.round(remaining / 2);
    balanced[otherKeys[1]] = remaining - balanced[otherKeys[0]];
    return balanced;
  }

  const firstOther = otherKeys[0];
  const secondOther = otherKeys[1];
  balanced[firstOther] = Math.round(remaining * (preference[firstOther] / otherTotal));
  balanced[secondOther] = remaining - balanced[firstOther];

  return balanced;
}

export function getBudgetPreferenceTotal(preference: BudgetPreference): number {
  return (
    preference.essentialsPercent +
    preference.savingsPercent +
    preference.nonEssentialsPercent
  );
}

export function sortTransactionsForDisplay(
  transactions: Transaction[],
  sortOrder: TransactionSortOrder = "newest"
): Transaction[] {
  const direction = sortOrder === "newest" ? -1 : 1;

  return [...transactions].sort((first, second) => {
    const dateComparison = first.date.localeCompare(second.date);

    if (dateComparison !== 0) {
      return dateComparison * direction;
    }

    const createdComparison = first.createdAt.localeCompare(second.createdAt);

    if (createdComparison !== 0) {
      return createdComparison * direction;
    }

    return first.description.localeCompare(second.description) * direction;
  });
}

export function clampTransactionPage(
  page: number,
  totalItems: number,
  pageSize = TRANSACTION_PAGE_SIZE
): number {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (!Number.isFinite(page)) {
    return 1;
  }

  return Math.min(totalPages, Math.max(1, Math.trunc(page)));
}

export function paginateTransactions(
  transactions: Transaction[],
  page: number,
  pageSize = TRANSACTION_PAGE_SIZE
): TransactionPage {
  const currentPage = clampTransactionPage(page, transactions.length, pageSize);
  const totalPages = Math.max(1, Math.ceil(transactions.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const items = transactions.slice(startIndex, startIndex + pageSize);

  return {
    items,
    currentPage,
    totalPages,
    totalItems: transactions.length,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages
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
  return normalizeSubcategoryLabel(transaction.subcategory) || UNCATEGORIZED_SUBCATEGORY_LABEL;
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
  const totalsByCategory = categoryTransactions.reduce<Map<string, number>>(
    (segments, transaction) => {
      const label = normalizeTransactionSubcategory(transaction);
      const current = segments.get(label) ?? 0;
      segments.set(label, toMoney(current + transaction.amount));

      return segments;
    },
    new Map()
  );

  return Array.from(totalsByCategory.entries()).map(([label, value]) => ({
      label,
      value,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0
  }));
}

export function calculateSubcategoryGroups(
  transactions: Transaction[],
  year: number,
  month: number,
  type: TransactionType,
  subcategoriesByType: TransactionSubcategoriesByType = {}
): SubcategoryGroup[] {
  const categoryTransactions = filterTransactionsByMonth(transactions, year, month).filter(
    (transaction) => transaction.type === type
  );
  const groupLabels = getActiveSubcategoryNames(subcategoriesByType, type);
  const labelKeys = new Set(groupLabels.map(createSubcategoryKey));
  let hasUncategorizedTransactions = false;

  categoryTransactions.forEach((transaction) => {
    const label = normalizeTransactionSubcategory(transaction);
    const key = createSubcategoryKey(label);

    if (key === createSubcategoryKey(UNCATEGORIZED_SUBCATEGORY_LABEL)) {
      hasUncategorizedTransactions = true;
      return;
    }

    if (!labelKeys.has(key)) {
      labelKeys.add(key);
      groupLabels.push(label);
    }
  });

  if (hasUncategorizedTransactions) {
    groupLabels.unshift(UNCATEGORIZED_SUBCATEGORY_LABEL);
  }

  if (groupLabels.length === 0) {
    groupLabels.push(UNCATEGORIZED_SUBCATEGORY_LABEL);
  }

  return groupLabels.map((label) => {
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

export function resolveSelectedSubcategoryLabel(
  groups: SubcategoryGroup[],
  selectedLabel?: string
): string {
  if (groups.length === 0) {
    return "";
  }

  if (selectedLabel && groups.some((group) => group.label === selectedLabel)) {
    return selectedLabel;
  }

  return groups[0].label;
}

export function validateTransactionInput(
  values: TransactionFormValues,
  subcategoriesByType?: TransactionSubcategoriesByType
): ValidationResult {
  const errors: TransactionErrors = {};
  const amount = Number(values.amount);
  const type = values.type.trim();
  const subcategory = normalizeSubcategoryLabel(values.subcategory);
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
    if (
      subcategory &&
      subcategoriesByType &&
      !isActiveSubcategoryForType(subcategoriesByType, type, subcategory)
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

  if (subcategory) {
    value.subcategory = getCanonicalSubcategoryName(
      subcategoriesByType,
      value.type,
      subcategory
    );
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

export function getActiveSubcategoryNames(
  subcategoriesByType: TransactionSubcategoriesByType,
  type: TransactionType
): string[] {
  const names: string[] = [];
  const keys = new Set<string>();

  (subcategoriesByType[type] ?? [])
    .filter((subcategory) => subcategory.isActive)
    .forEach((subcategory) => {
      const name = normalizeSubcategoryLabel(subcategory.name);
      const key = createSubcategoryKey(name);

      if (name && !keys.has(key)) {
        keys.add(key);
        names.push(name);
      }
    });

  return names;
}

export function normalizeSubcategoryLabel(value?: string | null): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function isActiveSubcategoryForType(
  subcategoriesByType: TransactionSubcategoriesByType,
  type: TransactionType,
  subcategory: string
): boolean {
  const subcategoryKey = createSubcategoryKey(subcategory);

  return (subcategoriesByType[type] ?? []).some(
    (option) =>
      option.isActive &&
      createSubcategoryKey(option.name) === subcategoryKey
  );
}

function getCanonicalSubcategoryName(
  subcategoriesByType: TransactionSubcategoriesByType | undefined,
  type: TransactionType,
  subcategory: string
): string {
  const subcategoryKey = createSubcategoryKey(subcategory);
  const matchedOption = (subcategoriesByType?.[type] ?? []).find(
    (option) =>
      option.isActive &&
      createSubcategoryKey(option.name) === subcategoryKey
  );

  return matchedOption ? normalizeSubcategoryLabel(matchedOption.name) : subcategory;
}

function createSubcategoryKey(value: string): string {
  return normalizeSubcategoryLabel(value).toLocaleLowerCase();
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
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
