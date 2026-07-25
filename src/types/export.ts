import type { BudgetPreference } from "../lib/budget";
import type { UserSettings } from "./settings";
import type { Transaction, TransactionSubcategoryOption } from "./transaction";
import type { RecurringItem, RecurringOccurrenceAction, SavingsGoal } from "./decisionSupport";

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

export interface BudgetBuddyExportV2 extends Omit<BudgetBuddyExportV1, "schemaVersion"> {
  schemaVersion: 2;
  recurringItems: RecurringItem[];
  recurringOccurrenceActions: RecurringOccurrenceAction[];
  savingsGoals: SavingsGoal[];
}

export type BudgetBuddyExport = BudgetBuddyExportV1 | BudgetBuddyExportV2;

export interface DeleteAccountRequest {
  emailConfirmation: string;
  currentPassword: string;
}

export type ExportFormat = "json" | "csv";
