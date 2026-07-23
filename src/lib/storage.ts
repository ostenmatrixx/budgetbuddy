import { getSupabaseClient } from "./supabaseClient";
import { DEFAULT_BUDGET_PREFERENCES, type BudgetPreference } from "./budget";
import { TRANSACTION_SUBCATEGORY_MAX_LENGTH } from "../types/transaction";
import type {
  Transaction,
  TransactionDraft,
  TransactionSubcategory,
  TransactionSubcategoryOption,
  TransactionType
} from "../types/transaction";
import { DEFAULT_USER_SETTINGS, type UserSettings } from "../types/settings";
import type { DeleteAccountRequest } from "../types/export";

export interface TransactionRow {
  id: string;
  client_request_id: string;
  user_id: string;
  type: TransactionType;
  subcategory: TransactionSubcategory | null;
  amount: number | string;
  date: string;
  description: string;
  notes: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface TransactionInsertPayload {
  client_request_id: string;
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

export interface BudgetPreferenceRow {
  user_id: string;
  essentials_percent: number;
  savings_percent: number;
  non_essentials_percent: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetPreferencePayload {
  user_id: string;
  essentials_percent: number;
  savings_percent: number;
  non_essentials_percent: number;
  updated_at: string;
}

export interface TransactionSubcategoryRow {
  id: string;
  user_id: string;
  type: TransactionType;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransactionSubcategoryInsertPayload {
  user_id: string;
  type: TransactionType;
  name: string;
}

export interface TransactionSubcategoryArchivePayload {
  is_active: false;
  updated_at: string;
}

export interface UserSettingsRow {
  user_id: string;
  currency_code: string;
  locale: string;
  time_zone: string;
  created_at: string;
  updated_at: string;
}

export interface UserSettingsPayload {
  user_id: string;
  currency_code: string;
  locale: string;
  time_zone: string;
  updated_at: string;
}

const transactionsTableName = "transactions";
const budgetPreferencesTableName = "budget_preferences";
const transactionSubcategoriesTableName = "transaction_subcategories";
const userSettingsTableName = "user_settings";

export { DEFAULT_BUDGET_PREFERENCES };

export class TransactionConflictError extends Error {
  readonly code = "TRANSACTION_CONFLICT";

  constructor() {
    super("This transaction changed on another device. Refresh and try again.");
    this.name = "TransactionConflictError";
  }
}

function assertValidVersion(version: number): void {
  if (!Number.isSafeInteger(version) || version < 1) {
    throw new Error("Transaction version must be a positive integer.");
  }
}

function yearDateBounds(year: number): { start: string; end: string } {
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    throw new Error("Year must be an integer from 1 through 9999.");
  }

  const yearText = String(year).padStart(4, "0");
  return { start: `${yearText}-01-01`, end: `${yearText}-12-31` };
}

export function rowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    clientRequestId: row.client_request_id,
    version: Number(row.version),
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
  draft: TransactionDraft,
  clientRequestId: string
): TransactionInsertPayload {
  return {
    client_request_id: clientRequestId,
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

export function budgetPreferenceRowToPreference(row: BudgetPreferenceRow | null): BudgetPreference {
  if (!row) {
    return DEFAULT_BUDGET_PREFERENCES;
  }

  return {
    essentialsPercent: Number(row.essentials_percent),
    savingsPercent: Number(row.savings_percent),
    nonEssentialsPercent: Number(row.non_essentials_percent)
  };
}

export function budgetPreferenceToPayload(
  userId: string,
  preference: BudgetPreference
): BudgetPreferencePayload {
  return {
    user_id: userId,
    essentials_percent: preference.essentialsPercent,
    savings_percent: preference.savingsPercent,
    non_essentials_percent: preference.nonEssentialsPercent,
    updated_at: new Date().toISOString()
  };
}

export function normalizeSubcategoryName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function subcategoryRowToOption(
  row: TransactionSubcategoryRow
): TransactionSubcategoryOption {
  return {
    id: row.id,
    type: row.type,
    name: normalizeSubcategoryName(row.name),
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function subcategoryToInsertPayload(
  userId: string,
  type: TransactionType,
  name: string
): TransactionSubcategoryInsertPayload {
  return {
    user_id: userId,
    type,
    name: normalizeSubcategoryName(name)
  };
}

export function subcategoryArchivePayload(): TransactionSubcategoryArchivePayload {
  return {
    is_active: false,
    updated_at: new Date().toISOString()
  };
}

export function userSettingsRowToSettings(row: UserSettingsRow | null): UserSettings {
  if (!row) {
    return DEFAULT_USER_SETTINGS;
  }

  return {
    currencyCode: row.currency_code,
    locale: row.locale,
    timeZone: row.time_zone
  };
}

export function userSettingsToPayload(userId: string, settings: UserSettings): UserSettingsPayload {
  return {
    user_id: userId,
    currency_code: settings.currencyCode,
    locale: settings.locale,
    time_zone: settings.timeZone,
    updated_at: new Date().toISOString()
  };
}

export async function collectPaginatedRows<T>(
  fetchPage: (from: number, to: number) => Promise<T[]>,
  pageSize = 500
): Promise<T[]> {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new Error("Page size must be a positive integer.");
  }

  const rows: T[] = [];

  for (let from = 0; ; from += pageSize) {
    const page = await fetchPage(from, from + pageSize - 1);
    rows.push(...page);

    if (page.length < pageSize) {
      return rows;
    }
  }
}

export async function loadTransactions(userId: string, year: number): Promise<Transaction[]> {
  const { start, end } = yearDateBounds(year);
  const { data, error } = await getSupabaseClient()
    .from(transactionsTableName)
    .select("*")
    .eq("user_id", userId)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as TransactionRow[]).map(rowToTransaction);
}

export async function addTransaction(
  userId: string,
  draft: TransactionDraft,
  clientRequestId: string
): Promise<Transaction> {
  const { data, error } = await getSupabaseClient()
    .from(transactionsTableName)
    .insert(draftToInsertPayload(userId, draft, clientRequestId))
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: existingData, error: existingError } = await getSupabaseClient()
        .from(transactionsTableName)
        .select("*")
        .eq("user_id", userId)
        .eq("client_request_id", clientRequestId)
        .maybeSingle();

      if (existingError) {
        throw new Error(existingError.message);
      }

      if (existingData) {
        return rowToTransaction(existingData as TransactionRow);
      }
    }

    throw new Error(error.message);
  }

  return rowToTransaction(data as TransactionRow);
}

export async function updateTransaction(
  userId: string,
  id: string,
  draft: TransactionDraft,
  expectedVersion: number
): Promise<Transaction> {
  assertValidVersion(expectedVersion);
  const { data, error } = await getSupabaseClient()
    .from(transactionsTableName)
    .update(draftToUpdatePayload(draft))
    .eq("id", id)
    .eq("user_id", userId)
    .eq("version", expectedVersion)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new TransactionConflictError();
  }

  return rowToTransaction(data as TransactionRow);
}

export async function deleteTransaction(
  userId: string,
  id: string,
  expectedVersion: number
): Promise<boolean> {
  assertValidVersion(expectedVersion);
  const { data, error } = await getSupabaseClient()
    .from(transactionsTableName)
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .eq("version", expectedVersion)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new TransactionConflictError();
  }

  return true;
}

export async function getAccountBalance(): Promise<number> {
  const { data, error } = await getSupabaseClient().rpc("get_account_balance");

  if (error) {
    throw new Error(error.message);
  }

  const balance = Number(data ?? 0);

  if (!Number.isFinite(balance)) {
    throw new Error("The account balance returned by the database is invalid.");
  }

  return balance;
}

export async function loadBudgetPreference(userId: string): Promise<BudgetPreference> {
  const { data, error } = await getSupabaseClient()
    .from(budgetPreferencesTableName)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return budgetPreferenceRowToPreference(data as BudgetPreferenceRow | null);
}

export async function saveBudgetPreference(
  userId: string,
  preference: BudgetPreference
): Promise<BudgetPreference> {
  const { data, error } = await getSupabaseClient()
    .from(budgetPreferencesTableName)
    .upsert(budgetPreferenceToPayload(userId, preference), { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return budgetPreferenceRowToPreference(data as BudgetPreferenceRow);
}

export async function loadTransactionSubcategories(
  userId: string
): Promise<TransactionSubcategoryOption[]> {
  const { data, error } = await getSupabaseClient()
    .from(transactionSubcategoriesTableName)
    .select("*")
    .eq("user_id", userId)
    .order("type", { ascending: true })
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as TransactionSubcategoryRow[]).map(subcategoryRowToOption);
}

export async function addTransactionSubcategory(
  userId: string,
  type: TransactionType,
  name: string
): Promise<TransactionSubcategoryOption> {
  const payload = subcategoryToInsertPayload(userId, type, name);

  if (!payload.name) {
    throw new Error("Add a subcategory name.");
  }

  if (payload.name.length > TRANSACTION_SUBCATEGORY_MAX_LENGTH) {
    throw new Error(
      `Use ${TRANSACTION_SUBCATEGORY_MAX_LENGTH} characters or fewer for subcategory names.`
    );
  }

  const { data, error } = await getSupabaseClient()
    .from(transactionSubcategoriesTableName)
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("That subcategory already exists for this category.");
    }

    throw new Error(error.message);
  }

  return subcategoryRowToOption(data as TransactionSubcategoryRow);
}

export async function archiveTransactionSubcategory(
  userId: string,
  id: string
): Promise<TransactionSubcategoryOption | undefined> {
  const { data, error } = await getSupabaseClient()
    .from(transactionSubcategoriesTableName)
    .update(subcategoryArchivePayload())
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? subcategoryRowToOption(data as TransactionSubcategoryRow) : undefined;
}

export async function loadUserSettings(userId: string): Promise<UserSettings> {
  const { data, error } = await getSupabaseClient()
    .from(userSettingsTableName)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return userSettingsRowToSettings(data as UserSettingsRow | null);
}

export async function saveUserSettings(
  userId: string,
  settings: UserSettings
): Promise<UserSettings> {
  const { data, error } = await getSupabaseClient()
    .from(userSettingsTableName)
    .upsert(userSettingsToPayload(userId, settings), { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return userSettingsRowToSettings(data as UserSettingsRow);
}

export async function loadAllTransactions(userId: string): Promise<Transaction[]> {
  return collectPaginatedRows(async (from, to) => {
    const { data, error } = await getSupabaseClient()
      .from(transactionsTableName)
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as TransactionRow[]).map(rowToTransaction);
  });
}

export async function loadAllTransactionSubcategories(
  userId: string
): Promise<TransactionSubcategoryOption[]> {
  return collectPaginatedRows(async (from, to) => {
    const { data, error } = await getSupabaseClient()
      .from(transactionSubcategoriesTableName)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as TransactionSubcategoryRow[]).map(subcategoryRowToOption);
  });
}

export async function deleteOwnAccount(
  request: DeleteAccountRequest,
  captchaToken?: string
): Promise<void> {
  const { error } = await getSupabaseClient().functions.invoke("delete-account", {
    body: { ...request, ...(captchaToken ? { captchaToken } : {}) }
  });

  if (error) {
    let message = error.message || "Unable to delete your account.";
    const context = "context" in error ? error.context : undefined;

    if (context instanceof Response) {
      try {
        const payload = (await context.clone().json()) as { error?: unknown };

        if (typeof payload.error === "string" && payload.error) {
          message = payload.error;
        }
      } catch {
        // Keep the provider error when the response is not JSON.
      }
    }

    throw new Error(message);
  }
}
