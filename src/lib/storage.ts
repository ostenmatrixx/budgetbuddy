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
import type {
  ActivityFilters,
  ActivityPage,
  RecurringItem,
  RecurringItemDraft,
  RecurringOccurrenceAction,
  RecurringFrequency,
  SavingsGoal,
  SavingsGoalDraft
} from "../types/decisionSupport";

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

export interface RecurringItemRow {
  id: string;
  user_id: string;
  type: TransactionType;
  subcategory_id: string | null;
  amount: number | string;
  description: string;
  notes: string;
  frequency: RecurringFrequency;
  start_date: string;
  occurrence_number: number;
  next_due_date: string;
  end_date: string | null;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface RecurringOccurrenceActionRow {
  id: string;
  user_id: string;
  recurring_item_id: string;
  due_date: string;
  action: "recorded" | "skipped";
  transaction_id: string | null;
  created_at: string;
}

export interface SavingsGoalRow {
  id: string;
  user_id: string;
  name: string;
  subcategory_id: string;
  target_amount: number | string;
  tracking_start_date: string;
  target_date: string | null;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

const transactionsTableName = "transactions";
const budgetPreferencesTableName = "budget_preferences";
const transactionSubcategoriesTableName = "transaction_subcategories";
const userSettingsTableName = "user_settings";
const recurringItemsTableName = "recurring_items";
const recurringOccurrenceActionsTableName = "recurring_occurrence_actions";
const savingsGoalsTableName = "savings_goals";

export { DEFAULT_BUDGET_PREFERENCES };

export class TransactionConflictError extends Error {
  readonly code = "TRANSACTION_CONFLICT";

  constructor() {
    super("This transaction changed on another device. Refresh and try again.");
    this.name = "TransactionConflictError";
  }
}

export class DecisionSupportConflictError extends Error {
  readonly code = "DECISION_SUPPORT_CONFLICT";

  constructor(message = "This item changed on another device. Refresh and try again.") {
    super(message);
    this.name = "DecisionSupportConflictError";
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

export function recurringItemRowToItem(row: RecurringItemRow): RecurringItem {
  return {
    id: row.id,
    type: row.type,
    subcategoryId: row.subcategory_id ?? undefined,
    amount: Number(row.amount),
    description: row.description,
    notes: row.notes,
    frequency: row.frequency,
    startDate: row.start_date,
    occurrenceNumber: Number(row.occurrence_number),
    nextDueDate: row.next_due_date,
    endDate: row.end_date ?? undefined,
    isActive: row.is_active,
    version: Number(row.version),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function recurringOccurrenceActionRowToAction(
  row: RecurringOccurrenceActionRow
): RecurringOccurrenceAction {
  return {
    id: row.id,
    recurringItemId: row.recurring_item_id,
    dueDate: row.due_date,
    action: row.action,
    transactionId: row.transaction_id ?? undefined,
    createdAt: row.created_at
  };
}

export function savingsGoalRowToGoal(row: SavingsGoalRow): SavingsGoal {
  return {
    id: row.id,
    name: row.name,
    subcategoryId: row.subcategory_id,
    targetAmount: Number(row.target_amount),
    trackingStartDate: row.tracking_start_date,
    targetDate: row.target_date ?? undefined,
    isActive: row.is_active,
    version: Number(row.version),
    createdAt: row.created_at,
    updatedAt: row.updated_at
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

export async function loadActivityPage(
  filters: ActivityFilters,
  page: number,
  pageSize = 25
): Promise<ActivityPage> {
  const normalizedPage = Number.isInteger(page) && page > 0 ? page : 1;
  const normalizedPageSize = Math.min(100, Math.max(1, Math.trunc(pageSize)));
  const minimumAmount = normalizeOptionalAmount(filters.minimumAmount, "Minimum amount");
  const maximumAmount = normalizeOptionalAmount(filters.maximumAmount, "Maximum amount");

  if (minimumAmount !== undefined && maximumAmount !== undefined && minimumAmount > maximumAmount) {
    throw new Error("Minimum amount cannot be greater than maximum amount.");
  }

  const { data, error } = await getSupabaseClient().rpc("search_transactions", {
    search_text: filters.search.trim(),
    filter_types: filters.types.length > 0 ? filters.types : null,
    date_from: filters.dateFrom || null,
    date_to: filters.dateTo || null,
    minimum_amount: minimumAmount ?? null,
    maximum_amount: maximumAmount ?? null,
    sort_direction: filters.sort,
    page_offset: (normalizedPage - 1) * normalizedPageSize,
    page_limit: normalizedPageSize
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Array<TransactionRow & { total_count: number | string }>;
  const totalItems = rows.length > 0 ? Number(rows[0].total_count) : 0;

  return {
    items: rows.map(rowToTransaction),
    page: normalizedPage,
    pageSize: normalizedPageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / normalizedPageSize))
  };
}

export async function loadRecurringItems(userId: string): Promise<RecurringItem[]> {
  const { data, error } = await getSupabaseClient()
    .from(recurringItemsTableName)
    .select("*")
    .eq("user_id", userId)
    .order("is_active", { ascending: false })
    .order("next_due_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as RecurringItemRow[]).map(recurringItemRowToItem);
}

export async function addRecurringItem(
  userId: string,
  draft: RecurringItemDraft
): Promise<RecurringItem> {
  const { data, error } = await getSupabaseClient()
    .from(recurringItemsTableName)
    .insert({
      user_id: userId,
      type: draft.type,
      subcategory_id: draft.subcategoryId ?? null,
      amount: draft.amount,
      description: draft.description.trim(),
      notes: draft.notes,
      frequency: draft.frequency,
      start_date: draft.startDate,
      next_due_date: draft.startDate,
      end_date: draft.endDate ?? null
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return recurringItemRowToItem(data as RecurringItemRow);
}

export async function updateRecurringItem(
  userId: string,
  item: RecurringItem,
  draft: RecurringItemDraft
): Promise<RecurringItem> {
  assertValidVersion(item.version);
  const scheduleChanged = item.startDate !== draft.startDate || item.frequency !== draft.frequency;
  const payload = {
    type: draft.type,
    subcategory_id: draft.subcategoryId ?? null,
    amount: draft.amount,
    description: draft.description.trim(),
    notes: draft.notes,
    frequency: draft.frequency,
    start_date: draft.startDate,
    end_date: draft.endDate ?? null,
    ...(scheduleChanged
      ? {
          occurrence_number: 0,
          next_due_date: draft.startDate
        }
      : {}),
    version: item.version + 1,
    updated_at: new Date().toISOString()
  };
  const { data, error } = await getSupabaseClient()
    .from(recurringItemsTableName)
    .update(payload)
    .eq("id", item.id)
    .eq("user_id", userId)
    .eq("version", item.version)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new DecisionSupportConflictError();
  }

  return recurringItemRowToItem(data as RecurringItemRow);
}

export async function setRecurringItemActive(
  userId: string,
  item: RecurringItem,
  isActive: boolean
): Promise<RecurringItem> {
  const { data, error } = await getSupabaseClient()
    .from(recurringItemsTableName)
    .update({
      is_active: isActive,
      version: item.version + 1,
      updated_at: new Date().toISOString()
    })
    .eq("id", item.id)
    .eq("user_id", userId)
    .eq("version", item.version)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new DecisionSupportConflictError();
  }

  return recurringItemRowToItem(data as RecurringItemRow);
}

export async function recordRecurringOccurrence(
  item: RecurringItem,
  draft: TransactionDraft,
  clientRequestId: string
): Promise<Transaction> {
  const { data, error } = await getSupabaseClient().rpc("record_recurring_occurrence", {
    recurring_id: item.id,
    expected_due_date: item.nextDueDate,
    request_id: clientRequestId,
    transaction_type: draft.type,
    transaction_subcategory: draft.subcategory ?? "",
    transaction_amount: draft.amount,
    transaction_date: draft.date,
    transaction_description: draft.description,
    transaction_notes: draft.notes
  });

  if (error) {
    throw new DecisionSupportConflictError(error.message);
  }

  const row = data?.[0];
  if (!row) {
    throw new Error("The recurring transaction was not created.");
  }

  return rowToTransaction(row as TransactionRow);
}

export async function skipRecurringOccurrence(item: RecurringItem): Promise<RecurringItem> {
  const { data, error } = await getSupabaseClient().rpc("skip_recurring_occurrence", {
    recurring_id: item.id,
    expected_due_date: item.nextDueDate
  });

  if (error) {
    throw new DecisionSupportConflictError(error.message);
  }

  const row = data?.[0];
  if (!row) {
    throw new Error("The recurring occurrence was not skipped.");
  }

  return recurringItemRowToItem(row as RecurringItemRow);
}

export async function loadAllRecurringOccurrenceActions(
  userId: string
): Promise<RecurringOccurrenceAction[]> {
  return collectPaginatedRows(async (from, to) => {
    const { data, error } = await getSupabaseClient()
      .from(recurringOccurrenceActionsTableName)
      .select("*")
      .eq("user_id", userId)
      .order("due_date", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as RecurringOccurrenceActionRow[]).map(
      recurringOccurrenceActionRowToAction
    );
  });
}

export async function loadSavingsGoals(userId: string): Promise<SavingsGoal[]> {
  const { data, error } = await getSupabaseClient()
    .from(savingsGoalsTableName)
    .select("*")
    .eq("user_id", userId)
    .order("is_active", { ascending: false })
    .order("target_date", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as SavingsGoalRow[]).map(savingsGoalRowToGoal);
}

export async function addSavingsGoal(
  userId: string,
  draft: SavingsGoalDraft
): Promise<SavingsGoal> {
  const { data, error } = await getSupabaseClient()
    .from(savingsGoalsTableName)
    .insert({
      user_id: userId,
      name: draft.name.trim(),
      subcategory_id: draft.subcategoryId,
      target_amount: draft.targetAmount,
      tracking_start_date: draft.trackingStartDate,
      target_date: draft.targetDate ?? null
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("That savings subcategory already has an active goal.");
    }
    throw new Error(error.message);
  }

  return savingsGoalRowToGoal(data as SavingsGoalRow);
}

export async function updateSavingsGoal(
  userId: string,
  goal: SavingsGoal,
  draft: SavingsGoalDraft
): Promise<SavingsGoal> {
  const { data, error } = await getSupabaseClient()
    .from(savingsGoalsTableName)
    .update({
      name: draft.name.trim(),
      subcategory_id: draft.subcategoryId,
      target_amount: draft.targetAmount,
      tracking_start_date: draft.trackingStartDate,
      target_date: draft.targetDate ?? null,
      version: goal.version + 1,
      updated_at: new Date().toISOString()
    })
    .eq("id", goal.id)
    .eq("user_id", userId)
    .eq("version", goal.version)
    .select("*")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      throw new Error("That savings subcategory already has an active goal.");
    }
    throw new Error(error.message);
  }
  if (!data) {
    throw new DecisionSupportConflictError();
  }

  return savingsGoalRowToGoal(data as SavingsGoalRow);
}

export async function setSavingsGoalActive(
  userId: string,
  goal: SavingsGoal,
  isActive: boolean
): Promise<SavingsGoal> {
  const { data, error } = await getSupabaseClient()
    .from(savingsGoalsTableName)
    .update({
      is_active: isActive,
      version: goal.version + 1,
      updated_at: new Date().toISOString()
    })
    .eq("id", goal.id)
    .eq("user_id", userId)
    .eq("version", goal.version)
    .select("*")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      throw new Error("That savings subcategory already has an active goal.");
    }
    throw new Error(error.message);
  }
  if (!data) {
    throw new DecisionSupportConflictError();
  }

  return savingsGoalRowToGoal(data as SavingsGoalRow);
}

export async function loadSavingsGoalProgress(): Promise<Map<string, number>> {
  const { data, error } = await getSupabaseClient().rpc("get_savings_goal_progress");

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data ?? []).map((row) => [row.goal_id, Number(row.saved_amount)]));
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

function normalizeOptionalAmount(value: string, label: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`${label} must be zero or greater.`);
  }

  return amount;
}
