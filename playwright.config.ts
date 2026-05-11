import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env['CI'],
  /* Retry on CI only */
  retries: process.env['CI'] ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env['CI'] ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',

  /* Auto-start the demo dev server so `npm run e2e` is self-contained. */
  webServer: {
    command: 'npm start',
    // Probe `localhost` rather than a single-family literal so the readiness
    // check works regardless of which address family `ng serve` binds. On
    // macOS today the dev server listens on `::1` only; on some CI runners
    // it has historically bound IPv4 only. Node's `localhost` resolution
    // tries both families, so this URL works in both directions.
    url: 'http://localhost:4600',
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },

  /* Snapshots: per-project baselines handle subpixel rendering differences. */
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{projectName}/{arg}{ext}',

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env['PLAYWRIGHT_TEST_BASE_URL'] ?? 'http://localhost:4600',
    locale: 'en-US',
    timezoneId: 'UTC',
    // Shared default for firefox / webkit / mobile-chrome. The chromium-light
    // and chromium-dark projects override this explicitly below.
    colorScheme: 'light',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Critical for stability: zeros animation durations via the theme's
    // `prefers-reduced-motion: reduce` media query, so overlay open/close
    // tests don't race CSS keyframes.
    contextOptions: { reducedMotion: 'reduce' },
  },

  /* Configure projects for major browsers */
  projects: [
    // chromium-light inherits colorScheme: 'light' from the shared `use`
    // above; the explicit override is kept here for readability.
    { name: 'chromium-light', use: { ...devices['Desktop Chrome'], colorScheme: 'light' } },
    { name: 'chromium-dark', use: { ...devices['Desktop Chrome'], colorScheme: 'dark' } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  ],
});
