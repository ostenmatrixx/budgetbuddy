export const transactionTypes = ["income", "bills", "non_essentials", "savings"] as const;

export const TRANSACTION_DESCRIPTION_MAX_LENGTH = 200;
export const TRANSACTION_NOTES_MAX_LENGTH = 2000;
export const TRANSACTION_SUBCATEGORY_MAX_LENGTH = 60;

export type TransactionType = (typeof transactionTypes)[number];

export type TransactionSubcategory = string;

export interface TransactionSubcategoryOption {
  id: string;
  type: TransactionType;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TransactionSubcategoriesByType = Partial<
  Record<TransactionType, TransactionSubcategoryOption[]>
>;

export interface Transaction {
  id: string;
  clientRequestId?: string;
  version: number;
  type: TransactionType;
  subcategory?: TransactionSubcategory;
  amount: number;
  date: string;
  description: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionDraft {
  type: TransactionType;
  subcategory?: TransactionSubcategory;
  amount: number;
  date: string;
  description: string;
  notes: string;
}

export interface TransactionFormValues {
  type: string;
  subcategory?: string;
  amount: string;
  date: string;
  description: string;
  notes: string;
}

export type TransactionErrors = Partial<Record<keyof TransactionFormValues, string>>;

export const transactionTypeLabels: Record<TransactionType, string> = {
  income: "Income",
  bills: "Essentials",
  non_essentials: "Non-Essentials",
  savings: "Savings"
};

export const transactionTypeShortLabels: Record<TransactionType, string> = {
  income: "Income",
  bills: "Essentials",
  non_essentials: "Non-Essentials",
  savings: "Savings"
};
