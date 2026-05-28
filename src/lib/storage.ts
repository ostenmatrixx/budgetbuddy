import { getSupabaseClient } from "./supabaseClient";
import type {
  Transaction,
  TransactionDraft,
  TransactionSubcategory,
  TransactionType
} from "../types/transaction";

export interface TransactionRow {
  id: string;
  user_id: string;
  type: TransactionType;
  subcategory: TransactionSubcategory | null;
  amount: number | string;
  date: string;
  description: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionInsertPayload {
  user_id: string;
  type: TransactionType;
  subcategory: TransactionSubcategory | null;
  amount: number;
  date: string;
  description: string;
  notes: string;
}

export interface TransactionUpdatePayload {
  type: TransactionType;
  subcategory: TransactionSubcategory | null;
  amount: number;
  date: string;
  description: string;
  notes: string;
  updated_at: string;
}

const tableName = "transactions";

export function rowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    subcategory: row.subcategory ?? undefined,
    amount: Number(row.amount),
    date: row.date,
    description: row.description,
    notes: row.notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function draftToInsertPayload(
  userId: string,
  draft: TransactionDraft
): TransactionInsertPayload {
  return {
    user_id: userId,
    type: draft.type,
    subcategory: draft.subcategory ?? null,
    amount: draft.amount,
    date: draft.date,
    description: draft.description,
    notes: draft.notes
  };
}

export function draftToUpdatePayload(draft: TransactionDraft): TransactionUpdatePayload {
  return {
    type: draft.type,
    subcategory: draft.subcategory ?? null,
    amount: draft.amount,
    date: draft.date,
    description: draft.description,
    notes: draft.notes,
    updated_at: new Date().toISOString()
  };
}

export async function loadTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await getSupabaseClient()
    .from(tableName)
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as TransactionRow[]).map(rowToTransaction);
}

export async function addTransaction(
  userId: string,
  draft: TransactionDraft
): Promise<Transaction> {
  const { data, error } = await getSupabaseClient()
    .from(tableName)
    .insert(draftToInsertPayload(userId, draft))
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToTransaction(data as TransactionRow);
}

export async function updateTransaction(
  userId: string,
  id: string,
  draft: TransactionDraft
): Promise<Transaction | undefined> {
  const { data, error } = await getSupabaseClient()
    .from(tableName)
    .update(draftToUpdatePayload(draft))
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? rowToTransaction(data as TransactionRow) : undefined;
}

export async function deleteTransaction(id: string): Promise<boolean> {
  const { error } = await getSupabaseClient().from(tableName).delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}
