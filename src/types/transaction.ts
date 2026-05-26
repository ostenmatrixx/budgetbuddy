export const transactionTypes = ["income", "bills", "non_essentials", "savings"] as const;

export type TransactionType = (typeof transactionTypes)[number];

export const essentialsSubcategories = ["Bills", "House", "Lot", "Credit Card"] as const;
export const savingsSubcategories = ["Cash Savings", "Emergency Funds"] as const;

export type EssentialsSubcategory = (typeof essentialsSubcategories)[number];
export type SavingsSubcategory = (typeof savingsSubcategories)[number];
export type TransactionSubcategory = EssentialsSubcategory | SavingsSubcategory;

export interface Transaction {
  id: string;
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

export const transactionSubcategoriesByType: Partial<
  Record<TransactionType, readonly TransactionSubcategory[]>
> = {
  bills: essentialsSubcategories,
  savings: savingsSubcategories
};

export const defaultSubcategoryByType: Partial<Record<TransactionType, TransactionSubcategory>> = {
  bills: "Bills",
  savings: "Cash Savings"
};
