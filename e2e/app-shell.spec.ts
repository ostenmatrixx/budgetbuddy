import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("loads the public install landing page without serious accessibility violations", async ({
  page
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /See the month clearly. Spend with intention./i })
  ).toBeVisible();
  await expect(page.getByText("The full app opens only from your installed copy.")).toBeVisible();

  const results = await new AxeBuilder({ page })
    .disableRules(["color-contrast"])
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();

  expect(results.violations).toEqual([]);
});

test("keeps browser access gated while handling password-recovery links", async ({ page }) => {
  await page.goto("/?type=recovery");

  await expect(
    page.getByRole("heading", { name: "This recovery link can’t be used" })
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Welcome Back" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Monthly Dashboard" })).toHaveCount(0);
});
