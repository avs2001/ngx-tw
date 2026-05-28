import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 *
 * Worker tuning (chapter 09 / Phase 6):
 *  - Local: undefined → playwright picks `cpus() / 2`. On the dev box this is
 *    typically 4 workers, which balances dev-server CPU against test
 *    parallelism.
 *  - CI: 2 workers per shard. GitHub Actions `ubuntu-latest` provides 4
 *    vCPUs; sharing two between Angular's dev server and Playwright
 *    workers keeps full chromium-light shards under ~4 minutes
 *    (target: full chromium < 10 min unsharded, < 4 min × 4 shards).
 *  - Sharding is driven from CI via `--shard=N/M`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  /* Retry on CI only; the flake-hunt fixes mean retries should be 0-1 in
     practice — keep retries available so a transient infra blip (DNS,
     OOM) doesn't fail the gate. */
  retries: process.env['CI'] ? 1 : 0,
  workers: process.env['CI'] ? 2 : undefined,
  /* Reporter: HTML locally for the audit, JSON + GitHub on CI so the
     job summary surfaces failures inline. */
  reporter: process.env['CI']
    ? [['github'], ['html', { open: 'never' }], ['list']]
    : 'html',

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
    // mobile-chrome is intentionally scoped to mobile-tagged + smoke
    // tests only. The desktop `@interaction` and `@a11y` sweeps are
    // viewport-/mouse-/keyboard-centric and not authored against the
    // Pixel 7 viewport / touch event model — running them under
    // mobile-chrome conflates real mobile regressions with desktop-only
    // flake (overlays clipped by the narrow viewport, axe sweeping
    // mobile-broken layouts, etc.). The `mobile.spec.ts` file pins the
    // specifically-mobile scenarios to this project.
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      grep: /@mobile|@smoke/,
    },
  ],
});
