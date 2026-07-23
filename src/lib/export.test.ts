import { describe, expect, it } from "vitest";
import {
  escapeCsvField,
  sanitizeSpreadsheetText,
  serializeBudgetBuddyExport,
  transactionsToCsv
} from "./export";
import type { BudgetBuddyExportV1 } from "../types/export";
import type { Transaction } from "../types/transaction";

const transaction: Transaction = {
  id: "transaction-id",
  version: 1,
  clientRequestId: "request-id",
  type: "bills",
  subcategory: "House",
  amount: 1250.5,
  date: "2026-07-22",
  description: 'Rent, "July"',
  notes: "First line\nSecond line",
  createdAt: "2026-07-22T00:00:00.000Z",
  updatedAt: "2026-07-22T00:00:00.000Z"
};

describe("BudgetBuddy export serialization", () => {
  it("emits a versioned JSON document", () => {
    const data: BudgetBuddyExportV1 = {
      schemaVersion: 1,
      exportedAt: "2026-07-22T00:00:00.000Z",
      account: { id: "user-id", email: "owner@example.com" },
      settings: { currencyCode: "PHP", locale: "en-PH", timeZone: "Asia/Manila" },
      budgetPreference: {
        essentialsPercent: 50,
        savingsPercent: 30,
        nonEssentialsPercent: 20
      },
      transactionSubcategories: [],
      transactions: [transaction]
    };

    expect(JSON.parse(serializeBudgetBuddyExport(data))).toMatchObject({
      schemaVersion: 1,
      account: { email: "owner@example.com" }
    });
  });

  it("uses RFC-4180 quoting and CRLF line endings", () => {
    const csv = transactionsToCsv([transaction]);

    expect(csv).toContain('"Rent, ""July"""');
    expect(csv).toContain('"First line\nSecond line"');
    expect(csv.endsWith("\r\n")).toBe(true);
  });

  it("neutralizes spreadsheet formulas in user-authored cells", () => {
    expect(sanitizeSpreadsheetText('=HYPERLINK("bad")')).toBe('\'=HYPERLINK("bad")');
    expect(escapeCsvField('a,"b"')).toBe('"a,""b"""');
  });
});
