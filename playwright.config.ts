import { defineConfig, devices } from "@playwright/test";
import type { PlaywrightTestConfig } from "@playwright/test";

/**
 * Playwright Test Configuration with TypeScript Support
 * @see https://playwright.dev/docs/test-configuration
 */

// CI 환경 감지
const isCI =
  typeof globalThis !== "undefined" &&
  (globalThis as unknown as { process?: { env?: { CI?: string } } }).process
    ?.env?.CI === "true";

const config: PlaywrightTestConfig = defineConfig({
  testDir: "./e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!isCI,
  /* Retry on CI only */
  retries: isCI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: isCI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://127.0.0.1:5174",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Screenshots and videos on failure */
    screenshot: "only-on-failure",
    video: "retain-on-failure",

    /* Increase timeouts for stability */
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "yarn dev",
    url: "http://127.0.0.1:5174",
    reuseExistingServer: !isCI,
    timeout: 120 * 1000,
    stdout: "pipe", // 개발 서버 로그 표시
    stderr: "pipe",
  },
});

export default config;
