export const transactionTypes = ["income", "bills", "non_essentials", "savings"] as const;

export type TransactionType = (typeof transactionTypes)[number];

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionDraft {
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  notes: string;
}

export interface TransactionFormValues {
  type: string;
  amount: string;
  date: string;
  description: string;
  notes: string;
}

export type TransactionErrors = Partial<Record<keyof TransactionFormValues, string>>;

export const transactionTypeLabels: Record<TransactionType, string> = {
  income: "Total Income",
  bills: "Bills Spent",
  non_essentials: "Non-Essentials Spent",
  savings: "Savings Saved"
};

export const transactionTypeShortLabels: Record<TransactionType, string> = {
  income: "Income",
  bills: "Bills",
  non_essentials: "Non-Essentials",
  savings: "Savings"
};
