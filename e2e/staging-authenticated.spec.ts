import { expect, test, type Download, type Page } from "@playwright/test";

const stagingEmail = process.env.STAGING_USER_EMAIL;
const stagingPassword = process.env.STAGING_USER_PASSWORD;

test("staging authenticated CRUD, idempotency, settings, and export smoke", async ({ page }) => {
  test.skip(!stagingEmail || !stagingPassword, "Staging credentials are required.");

  const description = `Release smoke ${Date.now()}`;
  let transactionCreated = false;

  await page.goto("/");
  await page.getByLabel("Email Address").fill(stagingEmail!);
  await page.getByLabel("Password", { exact: true }).fill(stagingPassword!);
  await expect(page.getByRole("button", { name: "Sign In", exact: true }).last()).toBeEnabled({
    timeout: 20_000
  });
  await page.getByRole("button", { name: "Sign In", exact: true }).last().click();

  await expect(page.getByRole("heading", { name: "Monthly Dashboard" })).toBeVisible({
    timeout: 20_000
  });

  try {
    await page.getByRole("button", { name: "New Transaction" }).click();
    await page.getByLabel("Type").selectOption("bills");
    await page.getByLabel("Transaction amount").fill("1.00");
    await page.getByLabel("Description").fill(description);
    await page.getByRole("button", { name: "Save entry" }).dblclick();
    transactionCreated = true;
    await expect(page.getByText(description)).toHaveCount(1);

    await page.getByRole("button", { name: "Account settings" }).first().click();
    await expect(page.getByRole("dialog", { name: "Account Settings" })).toBeVisible();
    await expect(page.getByLabel("Currency")).toHaveValue(/^[A-Z]{3}$/);
    await expect(page.getByLabel("Locale")).not.toHaveValue("");
    await expect(page.getByLabel("Timezone")).not.toHaveValue("");

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download JSON" }).click();
    const exportDownload = await downloadPromise;
    const exportData = JSON.parse(await readDownload(exportDownload)) as {
      account?: { email?: string };
      schemaVersion?: number;
      transactions?: Array<{ description?: string }>;
    };
    expect(exportData.schemaVersion).toBe(1);
    expect(exportData.account?.email).toBe(stagingEmail);
    expect(
      exportData.transactions?.some((transaction) => transaction.description === description)
    ).toBe(true);

    await page.getByRole("button", { name: "Close account settings" }).click();
  } finally {
    await closeOpenDialog(page);

    if (transactionCreated) {
      const transaction = page.locator("article").filter({ hasText: description }).first();
      if ((await transaction.count()) > 0) {
        await transaction.getByRole("button", { name: "Delete transaction" }).click();
        await page
          .getByRole("dialog", { name: "Delete transaction?" })
          .getByRole("button", { name: "Delete transaction" })
          .click();
        await expect(page.getByText(description)).toHaveCount(0);
      }
    }
  }
});

async function closeOpenDialog(page: Page) {
  const dialog = page.getByRole("dialog").last();
  if ((await dialog.count()) > 0 && (await dialog.isVisible())) {
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  }
}

async function readDownload(download: Download): Promise<string> {
  const stream = await download.createReadStream();
  if (!stream) {
    throw new Error("The staging export did not produce a readable download.");
  }

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}
