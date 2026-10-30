import { defineConfig, devices } from "@playwright/test";

/**
 * Browser integration tests run against a production build by default
 * (`next build && next start`). Set PLAYWRIGHT_BASE_URL to test an
 * already-running server instead.
 */
const PORT = 3210;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;
const CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: CI ? 2 : 4,
  // In CI a retry only collects a trace: a test that needs it still fails
  // the run (failOnFlakyTests), and a committed `test.only` is rejected.
  retries: CI ? 1 : 0,
  failOnFlakyTests: CI,
  forbidOnly: CI,
  reporter: CI
    ? [["github"], ["list"], ["html", { open: "never" }]]
    : [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /(mobile|languages|programs)\.spec/,
    },
    // The sandbox relies on browser-specific worker/CSP behaviour, so the
    // runtime suite also runs in Firefox.
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      testMatch: /runtime\.spec/,
    },
    // Phones and tablets are the main audience: touch screens, small and
    // medium viewports (both in Chromium, which CI installs).
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      testMatch: /mobile\.spec/,
    },
    {
      name: "tablet",
      use: { ...devices["iPad (gen 7)"], browserName: "chromium" },
      testMatch: /mobile\.spec/,
    },
    // Every language's runtime and the beginner programs, in Chromium and
    // Firefox. These compile C++ and boot interpreters, so they start once
    // the other suites are done: run alongside them, they would slow
    // timing-sensitive tests.
    {
      name: "languages-chromium",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /(languages|programs)\.spec/,
      dependencies: ["chromium", "firefox", "mobile", "tablet"],
    },
    {
      name: "languages-firefox",
      use: { ...devices["Desktop Firefox"] },
      testMatch: /(languages|programs)\.spec/,
      dependencies: ["chromium", "firefox", "mobile", "tablet"],
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npm run build && npx next start -p ${PORT}`,
        url: `${baseURL}/sandbox`,
        timeout: 600_000,
        reuseExistingServer: !process.env.CI,
      },
});
