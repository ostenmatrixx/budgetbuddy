import { describe, expect, it } from "vitest";
import {
  draftToInsertPayload,
  draftToUpdatePayload,
  rowToTransaction,
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
