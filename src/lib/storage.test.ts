import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_BUDGET_PREFERENCES,
  TransactionConflictError,
  addTransaction,
  addTransactionSubcategory,
  budgetPreferenceRowToPreference,
  budgetPreferenceToPayload,
  collectPaginatedRows,
  deleteTransaction,
  draftToInsertPayload,
  draftToUpdatePayload,
  getAccountBalance,
  loadTransactions,
  normalizeSubcategoryName,
  rowToTransaction,
  subcategoryArchivePayload,
  subcategoryRowToOption,
  subcategoryToInsertPayload,
  updateTransaction,
  userSettingsRowToSettings,
  userSettingsToPayload,
  type BudgetPreferenceRow,
  type TransactionSubcategoryRow,
  type TransactionRow,
  type UserSettingsRow
} from "./storage";
import { getSupabaseClient } from "./supabaseClient";
import type { TransactionDraft } from "../types/transaction";

vi.mock("./supabaseClient", () => ({ getSupabaseClient: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
});

const row: TransactionRow = {
  id: "7c6aa386-4699-4a89-8e35-bc93976734a4",
  client_request_id: "47a534e5-2b9b-46cb-a1a3-503d8d4993be",
  user_id: "f6eb4d75-cf59-4e31-8939-d086d9d8ef9d",
  type: "bills",
  subcategory: "House",
  amount: "3500.50",
  date: "2026-05-18",
  description: "Rent",
  notes: null,
  version: 1,
  created_at: "2026-05-18T00:00:00.000Z",
  updated_at: "2026-05-19T00:00:00.000Z"
};

const draft: TransactionDraft = {
  type: "savings",
  subcategory: "Emergency Funds",
  amount: 2500,
  date: "2026-05-20",
  description: "Emergency transfer",
  notes: "Payday"
};

const preferenceRow: BudgetPreferenceRow = {
  user_id: "f6eb4d75-cf59-4e31-8939-d086d9d8ef9d",
  essentials_percent: 60,
  savings_percent: 20,
  non_essentials_percent: 20,
  created_at: "2026-05-18T00:00:00.000Z",
  updated_at: "2026-05-19T00:00:00.000Z"
};

const subcategoryRow: TransactionSubcategoryRow = {
  id: "2f2ed316-603d-4477-a5cb-d6e2b402a61c",
  user_id: "f6eb4d75-cf59-4e31-8939-d086d9d8ef9d",
  type: "non_essentials",
  name: "  Weekend Food  ",
  is_active: true,
  created_at: "2026-05-18T00:00:00.000Z",
  updated_at: "2026-05-19T00:00:00.000Z"
};

const settingsRow: UserSettingsRow = {
  user_id: "f6eb4d75-cf59-4e31-8939-d086d9d8ef9d",
  currency_code: "PHP",
  locale: "en-PH",
  time_zone: "Asia/Manila",
  created_at: "2026-05-18T00:00:00.000Z",
  updated_at: "2026-05-19T00:00:00.000Z"
};

describe("Supabase transaction mapping", () => {
  it("maps database rows to app transactions", () => {
    expect(rowToTransaction(row)).toEqual({
      id: row.id,
      clientRequestId: row.client_request_id,
      version: 1,
      type: "bills",
      subcategory: "House",
      amount: 3500.5,
      date: "2026-05-18",
      description: "Rent",
      notes: "",
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  });

  it("maps drafts to insert payloads with the current user id", () => {
    expect(
      draftToInsertPayload(
        "f6eb4d75-cf59-4e31-8939-d086d9d8ef9d",
        draft,
        "47a534e5-2b9b-46cb-a1a3-503d8d4993be"
      )
    ).toEqual({
      client_request_id: "47a534e5-2b9b-46cb-a1a3-503d8d4993be",
      user_id: "f6eb4d75-cf59-4e31-8939-d086d9d8ef9d",
      type: "savings",
      subcategory: "Emergency Funds",
      amount: 2500,
      date: "2026-05-20",
      description: "Emergency transfer",
      notes: "Payday"
    });
  });

  it("maps drafts to update payloads and clears missing subcategories to null", () => {
    expect(
      draftToUpdatePayload({
        ...draft,
        type: "income",
        subcategory: undefined,
        notes: ""
      })
    ).toMatchObject({
      type: "income",
      subcategory: null,
      amount: 2500,
      date: "2026-05-20",
      description: "Emergency transfer",
      notes: ""
    });
  });

  it("returns the existing row when an idempotent create is retried", async () => {
    const insertQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: "23505", message: "duplicate key" }
      })
    };
    const existingQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null })
    };
    const from = vi.fn().mockReturnValueOnce(insertQuery).mockReturnValueOnce(existingQuery);
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);

    await expect(addTransaction(row.user_id, draft, row.client_request_id)).resolves.toMatchObject({
      id: row.id,
      clientRequestId: row.client_request_id
    });
    expect(insertQuery.insert).toHaveBeenCalledTimes(1);
    expect(existingQuery.maybeSingle).toHaveBeenCalledTimes(1);
  });
});

describe("bounded transaction loading", () => {
  it("loads only the requested calendar year", async () => {
    const query: Record<string, ReturnType<typeof vi.fn>> = {};
    query.select = vi.fn().mockReturnValue(query);
    query.eq = vi.fn().mockReturnValue(query);
    query.gte = vi.fn().mockReturnValue(query);
    query.lte = vi.fn().mockReturnValue(query);
    query.order = vi
      .fn()
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce({ data: [row], error: null });
    const from = vi.fn().mockReturnValue(query);
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);

    await expect(loadTransactions(row.user_id, 2026)).resolves.toEqual([rowToTransaction(row)]);
    expect(query.gte).toHaveBeenCalledWith("date", "2026-01-01");
    expect(query.lte).toHaveBeenCalledWith("date", "2026-12-31");
  });

  it("rejects invalid years before querying", async () => {
    await expect(loadTransactions(row.user_id, 2026.5)).rejects.toThrow("Year must be an integer");
    expect(getSupabaseClient).not.toHaveBeenCalled();
  });
});

describe("transaction optimistic concurrency", () => {
  it("updates a row only when its loaded version still matches", async () => {
    const updatedRow = { ...row, description: draft.description, version: 2 };
    const query = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: updatedRow, error: null })
    };
    const from = vi.fn().mockReturnValue(query);
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);

    await expect(updateTransaction(row.user_id, row.id, draft, 1)).resolves.toMatchObject({
      id: row.id,
      version: 2
    });
    expect(query.eq).toHaveBeenNthCalledWith(3, "version", 1);
  });

  it("reports a conflict instead of overwriting a stale update", async () => {
    const query = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
    };
    const from = vi.fn().mockReturnValue(query);
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);

    await expect(updateTransaction(row.user_id, row.id, draft, 1)).rejects.toBeInstanceOf(
      TransactionConflictError
    );
  });

  it("deletes a row only when its loaded version still matches", async () => {
    const query = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: row.id }, error: null })
    };
    const from = vi.fn().mockReturnValue(query);
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);

    await expect(deleteTransaction(row.user_id, row.id, 1)).resolves.toBe(true);
    expect(query.eq).toHaveBeenNthCalledWith(3, "version", 1);
  });

  it("reports a conflict instead of deleting a stale row", async () => {
    const query = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
    };
    const from = vi.fn().mockReturnValue(query);
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never);

    await expect(deleteTransaction(row.user_id, row.id, 1)).rejects.toBeInstanceOf(
      TransactionConflictError
    );
  });
});

describe("account balance RPC", () => {
  it("returns the authenticated owner's numeric balance", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "7123.45", error: null });
    vi.mocked(getSupabaseClient).mockReturnValue({ rpc } as never);

    await expect(getAccountBalance()).resolves.toBe(7123.45);
    expect(rpc).toHaveBeenCalledWith("get_account_balance");
  });

  it("rejects invalid database results", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "not-a-number", error: null });
    vi.mocked(getSupabaseClient).mockReturnValue({ rpc } as never);

    await expect(getAccountBalance()).rejects.toThrow("account balance returned");
  });
});

describe("Supabase budget preference mapping", () => {
  it("maps preference rows to app preferences", () => {
    expect(budgetPreferenceRowToPreference(preferenceRow)).toEqual({
      essentialsPercent: 60,
      savingsPercent: 20,
      nonEssentialsPercent: 20
    });
  });

  it("maps missing preference rows to the default allocation", () => {
    expect(budgetPreferenceRowToPreference(null)).toEqual(DEFAULT_BUDGET_PREFERENCES);
  });

  it("maps app preferences to an upsert payload", () => {
    expect(
      budgetPreferenceToPayload("f6eb4d75-cf59-4e31-8939-d086d9d8ef9d", {
        essentialsPercent: 60,
        savingsPercent: 20,
        nonEssentialsPercent: 20
      })
    ).toMatchObject({
      user_id: "f6eb4d75-cf59-4e31-8939-d086d9d8ef9d",
      essentials_percent: 60,
      savings_percent: 20,
      non_essentials_percent: 20
    });
  });
});

describe("Supabase subcategory mapping", () => {
  it("maps subcategory rows to app options with trimmed names", () => {
    expect(subcategoryRowToOption(subcategoryRow)).toEqual({
      id: subcategoryRow.id,
      type: "non_essentials",
      name: "Weekend Food",
      isActive: true,
      createdAt: subcategoryRow.created_at,
      updatedAt: subcategoryRow.updated_at
    });
  });

  it("normalizes duplicate-prone names by trimming and collapsing spaces", () => {
    expect(normalizeSubcategoryName("  Credit   Card  ")).toBe("Credit Card");
  });

  it("maps new subcategories to insert payloads", () => {
    expect(
      subcategoryToInsertPayload(
        "f6eb4d75-cf59-4e31-8939-d086d9d8ef9d",
        "bills",
        "  Credit   Card  "
      )
    ).toEqual({
      user_id: "f6eb4d75-cf59-4e31-8939-d086d9d8ef9d",
      type: "bills",
      name: "Credit Card"
    });
  });

  it("archives subcategories instead of deleting them", () => {
    expect(subcategoryArchivePayload()).toMatchObject({
      is_active: false
    });
    expect(subcategoryArchivePayload().updated_at).toEqual(expect.any(String));
  });

  it("rejects overlong subcategory names before querying", async () => {
    await expect(
      addTransactionSubcategory(subcategoryRow.user_id, "bills", "x".repeat(61))
    ).rejects.toThrow("60 characters or fewer");
    expect(getSupabaseClient).not.toHaveBeenCalled();
  });
});

describe("Supabase user settings mapping", () => {
  it("maps rows to application settings", () => {
    expect(userSettingsRowToSettings(settingsRow)).toEqual({
      currencyCode: "PHP",
      locale: "en-PH",
      timeZone: "Asia/Manila"
    });
  });

  it("maps settings to an owner-scoped upsert", () => {
    expect(
      userSettingsToPayload(settingsRow.user_id, {
        currencyCode: "USD",
        locale: "en-US",
        timeZone: "America/New_York"
      })
    ).toMatchObject({
      user_id: settingsRow.user_id,
      currency_code: "USD",
      locale: "en-US",
      time_zone: "America/New_York"
    });
  });
});

describe("pagination", () => {
  it("collects every page without truncation", async () => {
    const source = Array.from({ length: 7 }, (_, index) => index + 1);
    const ranges: Array<[number, number]> = [];
    const result = await collectPaginatedRows(async (from, to) => {
      ranges.push([from, to]);
      return source.slice(from, to + 1);
    }, 3);

    expect(result).toEqual(source);
    expect(ranges).toEqual([
      [0, 2],
      [3, 5],
      [6, 8]
    ]);
  });
});
