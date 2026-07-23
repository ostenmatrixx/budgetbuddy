import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Download, type Page, type Route } from "@playwright/test";

interface MockDatabase {
  capturedPassword: string;
  settingsWrites: number;
  transactionUpdates: number;
  transactionWrites: number;
  transactions: Array<Record<string, unknown>>;
  userSettings: Record<string, unknown>;
}

const mockUser = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "owner@example.com"
};

test.use({ serviceWorkers: "block" });

test.beforeEach(async ({ page }) => {
  test.skip(Boolean(process.env.E2E_USE_STAGING), "Mocked tests are for pull-request CI.");
  await installMockSupabase(page, createMockDatabase());
});

test("preserves sign-in password whitespace and exposes an accessible authenticated dashboard", async ({
  browserName,
  page
}) => {
  test.skip(browserName !== "chromium", "One browser is sufficient for the axe release gate.");

  const database = createMockDatabase();
  await page.unroute("https://mock.supabase.co/**");
  await installMockSupabase(page, database);
  await signIn(page);

  expect(database.capturedPassword).toBe("password-with-spaces  ");

  const results = await new AxeBuilder({ page })
    .disableRules(["color-contrast"])
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  const seriousViolations = results.violations.filter(
    ({ impact }) => impact === "serious" || impact === "critical"
  );

  expect(seriousViolations).toEqual([]);
});

test("guards duplicate transaction submission and uses an accessible delete confirmation", async ({
  page
}) => {
  const database = createMockDatabase();
  await page.unroute("https://mock.supabase.co/**");
  await installMockSupabase(page, database);
  await signIn(page);

  await page.getByRole("button", { name: /New Transaction/i }).click();
  await page.getByLabel("Type").selectOption("bills");
  await page.getByLabel("Transaction amount").fill("125.50");
  await page.getByLabel("Description").fill("Mock grocery run");
  await page.getByRole("button", { name: "Save entry" }).dblclick();

  await expect(page.getByText("Mock grocery run")).toBeVisible();
  expect(database.transactionWrites).toBe(1);
  expect(database.transactions).toHaveLength(1);

  let transaction = page.locator("article").filter({ hasText: "Mock grocery run" }).first();
  await transaction.getByRole("button", { name: "Edit transaction" }).click();
  await page.getByLabel("Description").fill("Updated grocery run");
  await page.getByRole("button", { name: "Save entry" }).click();
  await expect(page.getByText("Updated grocery run")).toBeVisible();
  await expect(page.getByText("Mock grocery run")).toHaveCount(0);
  expect(database.transactionUpdates).toBe(1);
  expect(database.transactions[0]).toMatchObject({
    description: "Updated grocery run",
    version: 2
  });

  transaction = page.locator("article").filter({ hasText: "Updated grocery run" }).first();
  await transaction.getByRole("button", { name: "Delete transaction" }).click();
  const confirmation = page.getByRole("dialog", { name: "Delete transaction?" });
  await expect(confirmation).toHaveAccessibleDescription(/Updated grocery run/);
  await confirmation.getByRole("button", { name: "Delete transaction" }).click();
  await expect(page.getByText("Updated grocery run")).toHaveCount(0);
});

test("transaction dialog supports Escape and restores focus to its trigger", async ({
  browserName,
  page
}) => {
  await signIn(page);

  const trigger = page.getByRole("button", { name: /New Transaction/i });
  await trigger.focus();
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Transaction details" });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("button", { name: "Close transaction form" })).toBeFocused();

  await page.keyboard.press("Escape");

  await expect(dialog).toHaveCount(0);
  if (browserName !== "webkit") {
    await expect(trigger).toBeFocused();
  }
});

test("saves regional settings, downloads a fresh export, and disables writes offline", async ({
  context,
  page
}) => {
  const database = createMockDatabase();
  await page.unroute("https://mock.supabase.co/**");
  await installMockSupabase(page, database);
  await signIn(page);

  await page.getByRole("button", { name: "Account settings" }).first().click();
  const settingsDialog = page.getByRole("dialog", { name: "Account Settings" });
  await expect(settingsDialog).toBeVisible();

  await page.getByLabel("Currency").selectOption("USD");
  await page.getByLabel("Locale").selectOption("en-US");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByRole("status", { name: "" }).filter({ hasText: "saved" })).toBeVisible();
  expect(database.settingsWrites).toBe(1);
  expect(database.userSettings).toMatchObject({ currency_code: "USD", locale: "en-US" });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download JSON" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^budgetbuddy-export-\d{4}-\d{2}-\d{2}\.json$/);
  const exportData = JSON.parse(await readDownload(download)) as Record<string, unknown>;
  expect(exportData).toMatchObject({
    schemaVersion: 1,
    account: { id: mockUser.id, email: mockUser.email },
    settings: { currencyCode: "USD", locale: "en-US", timeZone: "Asia/Manila" }
  });

  await context.setOffline(true);
  await expect(page.getByText("You’re offline", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Save preferences" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Download JSON" })).toBeDisabled();
  await context.setOffline(false);
});

function createMockDatabase(): MockDatabase {
  const now = new Date().toISOString();
  return {
    capturedPassword: "",
    settingsWrites: 0,
    transactionUpdates: 0,
    transactionWrites: 0,
    transactions: [],
    userSettings: {
      user_id: mockUser.id,
      currency_code: "PHP",
      locale: "en-PH",
      time_zone: "Asia/Manila",
      created_at: now,
      updated_at: now
    }
  };
}

async function signIn(page: Page) {
  await page.goto("/");
  await page.getByLabel("Email Address").fill(mockUser.email);
  await page.getByLabel("Password", { exact: true }).fill("password-with-spaces  ");
  await page.getByRole("button", { name: "Sign In", exact: true }).last().click();
  await expect(page.getByRole("heading", { name: "Monthly Dashboard" })).toBeVisible();
}

async function installMockSupabase(page: Page, database: MockDatabase) {
  await page.route("https://mock.supabase.co/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders() });
      return;
    }

    if (url.pathname === "/auth/v1/token") {
      database.capturedPassword = readRequestField(request.postData(), "password");
      await fulfillJson(route, {
        access_token: createMockToken(),
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: "mock-refresh-token",
        token_type: "bearer",
        user: {
          id: mockUser.id,
          aud: "authenticated",
          role: "authenticated",
          email: mockUser.email,
          email_confirmed_at: new Date().toISOString(),
          app_metadata: { provider: "email", providers: ["email"] },
          user_metadata: {},
          created_at: new Date().toISOString()
        }
      });
      return;
    }

    if (url.pathname === "/rest/v1/transactions") {
      if (request.method() === "POST") {
        const draft = request.postDataJSON() as Record<string, unknown>;
        const existing = database.transactions.find(
          ({ client_request_id }) => client_request_id === draft.client_request_id
        );

        if (existing) {
          await fulfillJson(route, existing);
          return;
        }

        database.transactionWrites += 1;
        const now = new Date().toISOString();
        const transaction = {
          id: `aaaaaaaa-aaaa-4aaa-8aaa-${String(database.transactionWrites).padStart(12, "0")}`,
          ...draft,
          version: 1,
          created_at: now,
          updated_at: now
        };
        database.transactions = [transaction, ...database.transactions];
        await fulfillJson(route, transaction);
        return;
      }

      if (request.method() === "DELETE") {
        const deleted = database.transactions[0];
        database.transactions = [];
        await fulfillJson(route, deleted ? { id: deleted.id } : null);
        return;
      }

      if (request.method() === "PATCH") {
        const existing = database.transactions[0];
        if (!existing) {
          await fulfillJson(route, null);
          return;
        }

        const payload = request.postDataJSON() as Record<string, unknown>;
        database.transactionUpdates += 1;
        const transaction = {
          ...existing,
          ...payload,
          version: Number(existing.version) + 1,
          updated_at: new Date().toISOString()
        };
        database.transactions = [transaction, ...database.transactions.slice(1)];
        await fulfillJson(route, transaction);
        return;
      }

      await fulfillJson(route, database.transactions);
      return;
    }

    if (url.pathname === "/rest/v1/rpc/get_account_balance") {
      const balance = database.transactions.reduce((total, transaction) => {
        const amount = Number(transaction.amount ?? 0);
        return transaction.type === "income" ? total + amount : total - amount;
      }, 0);
      await fulfillJson(route, balance);
      return;
    }

    if (url.pathname === "/rest/v1/budget_preferences") {
      await fulfillJson(route, {
        user_id: mockUser.id,
        essentials_percent: 50,
        savings_percent: 30,
        non_essentials_percent: 20,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      return;
    }

    if (url.pathname === "/rest/v1/transaction_subcategories") {
      await fulfillJson(route, []);
      return;
    }

    if (url.pathname === "/rest/v1/user_settings") {
      if (request.method() === "POST") {
        const payload = request.postDataJSON() as Record<string, unknown>;
        database.settingsWrites += 1;
        database.userSettings = {
          ...database.userSettings,
          ...payload,
          updated_at: new Date().toISOString()
        };
      }

      await fulfillJson(route, database.userSettings);
      return;
    }

    await fulfillJson(route, {});
  });
}

async function readDownload(download: Download): Promise<string> {
  const stream = await download.createReadStream();
  if (!stream) {
    throw new Error("The browser did not expose the downloaded export.");
  }

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

function readRequestField(body: string | null, field: string): string {
  if (!body) {
    return "";
  }

  try {
    const payload = JSON.parse(body) as Record<string, unknown>;
    return typeof payload[field] === "string" ? payload[field] : "";
  } catch {
    return new URLSearchParams(body).get(field) ?? "";
  }
}

async function fulfillJson(route: Route, body: unknown) {
  await route.fulfill({
    status: 200,
    headers: { ...corsHeaders(), "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "http://127.0.0.1:4173",
    "access-control-allow-headers":
      "authorization, apikey, content-type, x-client-info, x-supabase-api-version, prefer, range, accept-profile, content-profile",
    "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "access-control-expose-headers": "content-range, x-supabase-api-version"
  };
}

function createMockToken() {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode({
    sub: mockUser.id,
    email: mockUser.email,
    role: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 3600
  })}.mock-signature`;
}
