import { describe, expect, it } from "vitest";
import {
  DEFAULT_BUDGET_PREFERENCES,
  budgetPreferenceRowToPreference,
  budgetPreferenceToPayload,
  draftToInsertPayload,
  draftToUpdatePayload,
  normalizeSubcategoryName,
  rowToTransaction,
  subcategoryArchivePayload,
  subcategoryRowToOption,
  subcategoryToInsertPayload,
  type BudgetPreferenceRow,
  type TransactionSubcategoryRow,
  type TransactionRow
} from "./storage";
import type { TransactionDraft } from "../types/transaction";

const row: TransactionRow = {
  id: "7c6aa386-4699-4a89-8e35-bc93976734a4",
  user_id: "f6eb4d75-cf59-4e31-8939-d086d9d8ef9d",
  type: "bills",
  subcategory: "House",
  amount: "3500.50",
  date: "2026-05-18",
  description: "Rent",
  notes: null,
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

describe("Supabase transaction mapping", () => {
  it("maps database rows to app transactions", () => {
    expect(rowToTransaction(row)).toEqual({
      id: row.id,
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
    expect(draftToInsertPayload("f6eb4d75-cf59-4e31-8939-d086d9d8ef9d", draft)).toEqual({
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
});
