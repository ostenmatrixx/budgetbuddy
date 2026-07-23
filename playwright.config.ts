import { defineConfig, devices } from "@playwright/test";

const webServerCommand = process.env.E2E_USE_STAGING
  ? "npm run build && npm run preview -- --host 127.0.0.1"
  : "VITE_SUPABASE_URL=https://mock.supabase.co VITE_SUPABASE_ANON_KEY=mock-public-key VITE_TURNSTILE_SITE_KEY= npm run build && npm run preview -- --host 127.0.0.1";
const chromiumExecutablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  timeout: 45_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never", outputFolder: "playwright-report" }]]
    : "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure"
  },
  expect: { timeout: 10_000 },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(chromiumExecutablePath
          ? { launchOptions: { executablePath: chromiumExecutablePath } }
          : {})
      }
    },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "mobile-webkit", use: { ...devices["iPhone 14"] } }
  ],
  webServer: {
    command: webServerCommand,
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI
  }
});
