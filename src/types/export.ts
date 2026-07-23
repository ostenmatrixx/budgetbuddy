import type { BudgetPreference } from "../lib/budget";
import type { UserSettings } from "./settings";
import type { Transaction, TransactionSubcategoryOption } from "./transaction";

export interface BudgetBuddyExportV1 {
  schemaVersion: 1;
  exportedAt: string;
  account: {
    id: string;
    email: string;
  };
  settings: UserSettings;
  budgetPreference: BudgetPreference;
  transactionSubcategories: TransactionSubcategoryOption[];
  transactions: Transaction[];
}

export interface DeleteAccountRequest {
  emailConfirmation: string;
  currentPassword: string;
}

export type ExportFormat = "json" | "csv";
