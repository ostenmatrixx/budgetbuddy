import {
  loadAllTransactions,
  loadAllTransactionSubcategories,
  loadAllRecurringOccurrenceActions,
  loadBudgetPreference,
  loadRecurringItems,
  loadSavingsGoals,
  loadUserSettings
} from "./storage";
import type { BudgetBuddyExport, BudgetBuddyExportV2, ExportFormat } from "../types/export";
import type { Transaction } from "../types/transaction";

export async function buildBudgetBuddyExport(
  userId: string,
  email: string,
  now: Date = new Date()
): Promise<BudgetBuddyExportV2> {
  const [
    settings,
    budgetPreference,
    transactionSubcategories,
    transactions,
    recurringItems,
    recurringOccurrenceActions,
    savingsGoals
  ] = await Promise.all([
    loadUserSettings(userId),
    loadBudgetPreference(userId),
    loadAllTransactionSubcategories(userId),
    loadAllTransactions(userId),
    loadRecurringItems(userId),
    loadAllRecurringOccurrenceActions(userId),
    loadSavingsGoals(userId)
  ]);

  return {
    schemaVersion: 2,
    exportedAt: now.toISOString(),
    account: { id: userId, email },
    settings,
    budgetPreference,
    transactionSubcategories,
    transactions,
    recurringItems,
    recurringOccurrenceActions,
    savingsGoals
  };
}

export function serializeBudgetBuddyExport(data: BudgetBuddyExport): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

export function transactionsToCsv(transactions: Transaction[]): string {
  const headers = [
    "id",
    "type",
    "subcategory",
    "amount",
    "date",
    "description",
    "notes",
    "created_at",
    "updated_at"
  ];
  const rows = transactions.map((transaction) => [
    transaction.id,
    transaction.type,
    sanitizeSpreadsheetText(transaction.subcategory ?? ""),
    transaction.amount.toFixed(2),
    transaction.date,
    sanitizeSpreadsheetText(transaction.description),
    sanitizeSpreadsheetText(transaction.notes),
    transaction.createdAt,
    transaction.updatedAt
  ]);

  return (
    [headers, ...rows]
      .map((row) => row.map((value) => escapeCsvField(String(value))).join(","))
      .join("\r\n") + "\r\n"
  );
}

export async function downloadBudgetBuddyExport(
  userId: string,
  email: string,
  format: ExportFormat
): Promise<void> {
  const data = await buildBudgetBuddyExport(userId, email);
  const date = data.exportedAt.slice(0, 10);
  const contents =
    format === "json" ? serializeBudgetBuddyExport(data) : transactionsToCsv(data.transactions);
  const mimeType = format === "json" ? "application/json" : "text/csv;charset=utf-8";
  const blobUrl = URL.createObjectURL(new Blob([contents], { type: mimeType }));
  const anchor = document.createElement("a");

  try {
    anchor.href = blobUrl;
    anchor.download = `budgetbuddy-export-${date}.${format}`;
    anchor.rel = "noopener";
    anchor.click();
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

export function escapeCsvField(value: string): string {
  if (!/[",\r\n]/.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '""')}"`;
}

export function sanitizeSpreadsheetText(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}
