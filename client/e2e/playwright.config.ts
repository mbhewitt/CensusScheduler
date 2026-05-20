import path from "path";
import { defineConfig, devices } from "@playwright/test";

const clientDir = path.resolve(__dirname, "..");

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npx next dev",
    cwd: clientDir,
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Defaults let the Okta sign-in regression tests run without external
    // setup. Real deployments override these via .env.production. Tests
    // never hit a real Okta tenant — they only assert that /api/auth/okta
    // builds the correct 302 against whatever issuer is configured.
    env: {
      NEXT_PUBLIC_OKTA_ENABLED:
        process.env.NEXT_PUBLIC_OKTA_ENABLED ?? "true",
      NEXT_PUBLIC_PIN_ENABLED:
        process.env.NEXT_PUBLIC_PIN_ENABLED ?? "true",
      OKTA_CLIENT_ID: process.env.OKTA_CLIENT_ID ?? "test-client-id",
      OKTA_ISSUER:
        process.env.OKTA_ISSUER ??
        "https://test-okta.example.com/oauth2/default",
      OKTA_REDIRECT_URI:
        process.env.OKTA_REDIRECT_URI ??
        "http://localhost:3000/api/auth/okta/callback",
    },
  },
});
