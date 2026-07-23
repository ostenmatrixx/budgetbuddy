import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const uploadSourceMaps = Boolean(
    mode === "production" && env.SENTRY_AUTH_TOKEN && env.SENTRY_ORG && env.SENTRY_PROJECT
  );

  return {
    plugins: [
      react(),
      ...(uploadSourceMaps
        ? [
            sentryVitePlugin({
              authToken: env.SENTRY_AUTH_TOKEN,
              org: env.SENTRY_ORG,
              project: env.SENTRY_PROJECT,
              sourcemaps: { filesToDeleteAfterUpload: ["./dist/**/*.map"] },
              telemetry: false
            })
          ]
        : [])
    ],
    build: { sourcemap: uploadSourceMaps ? "hidden" : false },
    envPrefix: ["VITE_"],
    test: {
      environment: "jsdom",
      globals: true,
      include: ["src/**/*.test.{ts,tsx}"],
      setupFiles: "./src/test/setup.ts",
      coverage: {
        provider: "v8",
        reporter: ["text", "json-summary"],
        include: [
          "src/lib/**/*.{ts,tsx}",
          "src/registerServiceWorker.ts",
          "src/components/{AccessibleDialog,ErrorBoundary,PwaInstallPrompt,TransactionFormModal,Turnstile}.tsx"
        ],
        thresholds: {
          statements: 70,
          branches: 70,
          functions: 70,
          lines: 70
        }
      }
    }
  };
});
