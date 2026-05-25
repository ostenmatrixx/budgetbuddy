import { beforeEach, describe, expect, it } from "vitest";
import {
  addTransaction,
  deleteTransaction,
  loadTransactions,
  updateTransaction
} from "./storage";
import type { TransactionDraft } from "../types/transaction";

const draft: TransactionDraft = {
  type: "income",
  amount: 1000,
  date: "2026-05-01",
  description: "Allowance",
  notes: ""
};

describe("transaction storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("creates transactions with ids and timestamps", () => {
    const created = addTransaction(draft);

    expect(created.id).toEqual(expect.any(String));
    expect(created.createdAt).toEqual(expect.any(String));
    expect(created.updatedAt).toEqual(created.createdAt);
    expect(loadTransactions()).toEqual([created]);
  });

  it("updates an existing transaction without changing its createdAt timestamp", () => {
    const created = addTransaction(draft);
    const updated = updateTransaction(created.id, {
      ...draft,
      amount: 1500,
      description: "Updated allowance"
    });

    expect(updated?.amount).toBe(1500);
    expect(updated?.description).toBe("Updated allowance");
    expect(updated?.createdAt).toBe(created.createdAt);
    expect(updated?.updatedAt).not.toBe(created.updatedAt);
    expect(loadTransactions()[0]).toEqual(updated);
  });

  it("deletes a transaction by id", () => {
    const created = addTransaction(draft);

    expect(deleteTransaction(created.id)).toBe(true);
    expect(loadTransactions()).toEqual([]);
  });

  it("returns an empty list when stored data is malformed", () => {
    window.localStorage.setItem("budget-tracker-transactions", "not-json");

    expect(loadTransactions()).toEqual([]);
  });
});
