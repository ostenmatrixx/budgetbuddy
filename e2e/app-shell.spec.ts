import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("loads the public account shell without serious accessibility violations", async ({
  page
}) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Welcome Back" })).toBeVisible();

  const results = await new AxeBuilder({ page })
    .disableRules(["color-contrast"])
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();

  expect(results.violations).toEqual([]);
});
