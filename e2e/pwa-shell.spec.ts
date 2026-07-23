import { expect, test } from "@playwright/test";

test("production PWA installs a static-only app-shell cache", async ({ browserName, page }) => {
  test.skip(browserName !== "chromium", "Service-worker cache validation runs in Chromium.");

  await page.goto("/");

  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(manifestHref).toBeTruthy();

  const manifest = await page.evaluate(async (href) => {
    const response = await fetch(href!);
    return response.json() as Promise<{ name?: string; display?: string }>;
  }, manifestHref);
  expect(manifest.name).toContain("BudgetBuddy");
  expect(manifest.display).toBe("standalone");

  await expect
    .poll(
      () => page.evaluate(async () => Boolean(await navigator.serviceWorker.getRegistration("/"))),
      { timeout: 15_000 }
    )
    .toBe(true);

  const cachedUrls = await page.evaluate(async () => {
    const keys = await caches.keys();
    const requests = await Promise.all(keys.map(async (key) => (await caches.open(key)).keys()));
    return requests.flat().map((request) => request.url);
  });

  expect(cachedUrls.length).toBeGreaterThan(0);
  expect(cachedUrls.every((url) => new URL(url).origin === windowOrigin(page.url()))).toBe(true);
  expect(cachedUrls.some((url) => /supabase|auth\/v1|rest\/v1|functions\/v1/i.test(url))).toBe(
    false
  );
});

function windowOrigin(url: string) {
  return new URL(url).origin;
}
