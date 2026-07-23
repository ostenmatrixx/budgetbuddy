import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(repositoryRoot, "portfolio-screenshots");
const baseUrl = process.env.PORTFOLIO_BASE_URL ?? "http://127.0.0.1:4173";
const browserExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

const mockUser = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "maria.santos@example.com"
};

const transactionDefinitions = [
  ["income", "Salary", 82000, "2026-01-02", "January salary"],
  ["bills", "Housing", 25000, "2026-01-03", "Apartment rent"],
  ["bills", "Groceries", 8100, "2026-01-12", "Home groceries"],
  ["non_essentials", "Dining", 4200, "2026-01-20", "Dinner with friends"],
  ["savings", "Emergency Fund", 18000, "2026-01-25", "Emergency fund transfer"],
  ["income", "Salary", 82000, "2026-02-02", "February salary"],
  ["income", "Freelance", 12500, "2026-02-16", "Brand identity project"],
  ["bills", "Housing", 25000, "2026-02-03", "Apartment rent"],
  ["bills", "Utilities", 3850, "2026-02-11", "Electricity and internet"],
  ["non_essentials", "Travel", 7400, "2026-02-22", "Weekend in Tagaytay"],
  ["savings", "Investments", 20000, "2026-02-25", "Index fund contribution"],
  ["income", "Salary", 85000, "2026-03-02", "March salary"],
  ["bills", "Housing", 25000, "2026-03-03", "Apartment rent"],
  ["bills", "Groceries", 8750, "2026-03-15", "Home groceries"],
  ["non_essentials", "Shopping", 5600, "2026-03-18", "Work wardrobe refresh"],
  ["savings", "Emergency Fund", 15000, "2026-03-26", "Emergency fund transfer"],
  ["income", "Salary", 85000, "2026-04-02", "April salary"],
  ["income", "Freelance", 18000, "2026-04-12", "Product photography project"],
  ["bills", "Housing", 25000, "2026-04-03", "Apartment rent"],
  ["bills", "Insurance", 4600, "2026-04-09", "Health insurance"],
  ["non_essentials", "Dining", 3800, "2026-04-20", "Family celebration"],
  ["savings", "Investments", 22000, "2026-04-27", "Index fund contribution"],
  ["income", "Salary", 85000, "2026-05-02", "May salary"],
  ["bills", "Housing", 25000, "2026-05-03", "Apartment rent"],
  ["bills", "Groceries", 9200, "2026-05-14", "Home groceries"],
  ["non_essentials", "Travel", 9800, "2026-05-23", "Beach weekend"],
  ["savings", "Emergency Fund", 17000, "2026-05-27", "Emergency fund transfer"],
  ["income", "Salary", 85000, "2026-06-02", "June salary"],
  ["income", "Freelance", 15500, "2026-06-18", "Website consultation"],
  ["bills", "Housing", 25000, "2026-06-03", "Apartment rent"],
  ["bills", "Utilities", 4100, "2026-06-10", "Electricity and internet"],
  ["non_essentials", "Dining", 4650, "2026-06-21", "Dinner and coffee"],
  ["savings", "Investments", 21000, "2026-06-26", "Index fund contribution"],
  ["income", "Salary", 85000, "2026-07-01", "July salary"],
  ["income", "Freelance", 18500, "2026-07-14", "Design system project"],
  ["bills", "Housing", 25000, "2026-07-03", "Apartment rent"],
  ["bills", "Groceries", 8450, "2026-07-08", "Home groceries"],
  ["bills", "Utilities", 3750, "2026-07-10", "Electricity and internet"],
  ["bills", "Insurance", 2300, "2026-07-12", "Health insurance"],
  ["non_essentials", "Dining", 3250, "2026-07-16", "Dinner with friends"],
  ["non_essentials", "Travel", 5800, "2026-07-19", "Weekend day trip"],
  ["non_essentials", "Shopping", 2750, "2026-07-20", "Home office accessories"],
  ["savings", "Emergency Fund", 12000, "2026-07-21", "Emergency fund transfer"],
  ["savings", "Investments", 10000, "2026-07-22", "Index fund contribution"]
];

const transactions = transactionDefinitions.map(
  ([type, subcategory, amount, date, description], index) => ({
    id: toUuid(index + 1),
    client_request_id: toUuid(index + 1001),
    user_id: mockUser.id,
    type,
    subcategory,
    amount,
    date,
    description,
    notes: "",
    created_at: `${date}T01:00:00.000Z`,
    updated_at: `${date}T01:00:00.000Z`
  })
);

const subcategoryDefinitions = {
  income: ["Salary", "Freelance"],
  bills: ["Housing", "Groceries", "Utilities", "Insurance"],
  non_essentials: ["Dining", "Travel", "Shopping"],
  savings: ["Emergency Fund", "Investments"]
};

const subcategories = Object.entries(subcategoryDefinitions).flatMap(([type, names], groupIndex) =>
  names.map((name, nameIndex) => ({
    id: toUuid(2001 + groupIndex * 10 + nameIndex),
    user_id: mockUser.id,
    type,
    name,
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z"
  }))
);

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({
  ...(browserExecutable ? { executablePath: browserExecutable } : {}),
  headless: true
});

try {
  const context = await browser.newContext({
    colorScheme: "light",
    deviceScaleFactor: 1,
    locale: "en-PH",
    timezoneId: "Asia/Manila",
    viewport: { width: 1440, height: 1050 }
  });
  const page = await context.newPage();

  await installMockSupabase(page);
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByLabel("Email Address").fill(mockUser.email);
  await page.getByLabel("Password", { exact: true }).fill("portfolio-password");
  await page.getByRole("button", { name: "Sign In", exact: true }).last().click();
  await page.getByRole("heading", { name: "Monthly Dashboard" }).waitFor();
  await page.getByText("July salary", { exact: true }).waitFor();
  await preparePageForCapture(page);

  await capture(page, "01-monthly-dashboard-desktop.png", false);
  await capture(page, "02-monthly-dashboard-full-page.png", true);

  await page.locator("button").filter({ hasText: "Annual Report" }).first().click();
  await page.getByRole("heading", { name: "Annual Report" }).last().waitFor();
  await page.getByRole("button", { name: "Switch to dark mode" }).first().click();
  await page.locator('html[data-theme="dark"]').waitFor();
  await preparePageForCapture(page);
  await capture(page, "03-annual-report-desktop-dark.png", false);
  await capture(page, "04-annual-report-full-page-dark.png", true);

  await page.locator("button").filter({ hasText: "Monthly Dashboard" }).first().click();
  await page.getByRole("button", { name: "Switch to light mode" }).first().click();
  await page.locator('html[data-theme="light"]').waitFor();
  await page.locator("button").filter({ hasText: "Account Settings" }).first().click();
  const accountDialog = page.getByRole("dialog", { name: "Account Settings" });
  await accountDialog.waitFor();
  await preparePageForCapture(page);
  await capture(page, "05-account-settings-desktop.png", false);

  await accountDialog.evaluate((dialog) => {
    dialog.scrollTop = dialog.scrollHeight;
  });
  await capture(page, "06-data-export-and-account-controls.png", false);

  await page.getByRole("button", { name: "Close account settings" }).click();
  await page.setViewportSize({ width: 430, height: 932 });
  await page.getByRole("heading", { name: "Monthly Dashboard" }).waitFor();
  await preparePageForCapture(page);
  await capture(page, "07-monthly-dashboard-mobile.png", false);
  await capture(page, "08-monthly-dashboard-mobile-full-page.png", true);

  await page.locator('button[title="New transaction"]').click();
  await page.getByRole("dialog", { name: "Transaction details" }).waitFor();
  await page.getByLabel("Type").selectOption("bills");
  await page.getByLabel("Subcategory").selectOption({ label: "Groceries" });
  await page.getByLabel("Transaction amount").fill("2450");
  await page.getByLabel("Description").fill("Weekend groceries");
  await preparePageForCapture(page);
  await capture(page, "09-new-transaction-mobile.png", false);

  await context.close();
} finally {
  await browser.close();
}

console.log(`Portfolio screenshots saved to ${outputDirectory}`);

async function preparePageForCapture(page) {
  await page.addStyleTag({
    content: `
      :root { scroll-behavior: auto !important; }
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        caret-color: transparent !important;
        transition: none !important;
      }
    `
  });
  await page.evaluate(() => globalThis.document.fonts.ready);
  await page.waitForTimeout(150);
}

async function capture(page, filename, fullPage) {
  const outputPath = path.join(outputDirectory, filename);
  await page.screenshot({
    animations: "disabled",
    fullPage,
    path: outputPath
  });
  console.log(outputPath);
}

async function installMockSupabase(page) {
  await page.route("https://mock.supabase.co/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders() });
      return;
    }

    if (url.pathname === "/auth/v1/token") {
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
          email_confirmed_at: "2026-01-01T00:00:00.000Z",
          app_metadata: { provider: "email", providers: ["email"] },
          user_metadata: { display_name: "Maria Santos" },
          created_at: "2026-01-01T00:00:00.000Z"
        }
      });
      return;
    }

    if (url.pathname === "/rest/v1/transactions") {
      await fulfillJson(route, transactions);
      return;
    }

    if (url.pathname === "/rest/v1/budget_preferences") {
      await fulfillJson(route, {
        user_id: mockUser.id,
        essentials_percent: 50,
        savings_percent: 30,
        non_essentials_percent: 20,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z"
      });
      return;
    }

    if (url.pathname === "/rest/v1/transaction_subcategories") {
      await fulfillJson(route, subcategories);
      return;
    }

    if (url.pathname === "/rest/v1/user_settings") {
      await fulfillJson(route, {
        user_id: mockUser.id,
        currency_code: "PHP",
        locale: "en-PH",
        time_zone: "Asia/Manila",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z"
      });
      return;
    }

    await fulfillJson(route, {});
  });
}

async function fulfillJson(route, body) {
  await route.fulfill({
    status: 200,
    headers: { ...corsHeaders(), "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

function corsHeaders() {
  return {
    "access-control-allow-origin": new URL(baseUrl).origin,
    "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
    "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS"
  };
}

function createMockToken() {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode({
    sub: mockUser.id,
    email: mockUser.email,
    role: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 3600
  })}.mock-signature`;
}

function toUuid(value) {
  return `${value.toString(16).padStart(8, "0")}-0000-4000-8000-${value
    .toString(16)
    .padStart(12, "0")}`;
}
