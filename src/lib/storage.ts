import {
  transactionTypes,
  type Transaction,
  type TransactionDraft,
  type TransactionType
} from "../types/transaction";

export const STORAGE_KEY = "budget-tracker-transactions";

export function loadTransactions(): Transaction[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isTransaction);
  } catch {
    return [];
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

export function addTransaction(draft: TransactionDraft): Transaction {
  const timestamp = new Date().toISOString();
  const transaction: Transaction = {
    id: createId(),
    ...draft,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  saveTransactions([...loadTransactions(), transaction]);
  return transaction;
}

export function updateTransaction(
  id: string,
  draft: TransactionDraft
): Transaction | undefined {
  const transactions = loadTransactions();
  const current = transactions.find((transaction) => transaction.id === id);

  if (!current) {
    return undefined;
  }

  const updated: Transaction = {
    ...current,
    ...draft,
    updatedAt: nextTimestamp(current.updatedAt)
  };

  saveTransactions(
    transactions.map((transaction) => (transaction.id === id ? updated : transaction))
  );

  return updated;
}

export function deleteTransaction(id: string): boolean {
  const transactions = loadTransactions();
  const nextTransactions = transactions.filter((transaction) => transaction.id !== id);

  if (nextTransactions.length === transactions.length) {
    return false;
  }

  saveTransactions(nextTransactions);
  return true;
}

function isTransaction(value: unknown): value is Transaction {
  if (!value || typeof value !== "object") {
    return false;
  }

  const transaction = value as Transaction;
  return (
    typeof transaction.id === "string" &&
    isTransactionType(transaction.type) &&
    typeof transaction.amount === "number" &&
    Number.isFinite(transaction.amount) &&
    typeof transaction.date === "string" &&
    typeof transaction.description === "string" &&
    typeof transaction.notes === "string" &&
    (transaction.subcategory === undefined || typeof transaction.subcategory === "string") &&
    typeof transaction.createdAt === "string" &&
    typeof transaction.updatedAt === "string"
  );
}

function isTransactionType(value: unknown): value is TransactionType {
  return typeof value === "string" && transactionTypes.includes(value as TransactionType);
}

function createId(): string {
  if ("crypto" in window && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nextTimestamp(previousTimestamp: string): string {
  const timestamp = new Date().toISOString();

  if (timestamp !== previousTimestamp) {
    return timestamp;
  }

  return new Date(new Date(timestamp).getTime() + 1).toISOString();
}
