import AxeBuilder from '@axe-core/playwright';
import { test as base, type Locator } from '@playwright/test';

interface Fixtures {
  /**
   * Auto-applied. Seeds `ngx-tw-theme = 'light'` once at the start of each
   * test's first page load so the resolved theme is deterministic regardless
   * of the runner's `prefers-color-scheme` (Theme service defaults to
   * `'system'`).
   *
   * The seed is conditional: if the test itself sets the theme (e.g. clicks
   * "Dark mode"), subsequent reloads see the persisted value already in
   * localStorage and don't overwrite it. Without this guard the init script
   * would erase mid-test mutations and every persistence assertion would
   * fail.
   *
   * `ngx-tw-preset` is not seeded — its absence is the "Default" state, and
   * each Playwright context starts with empty localStorage.
   */
  freshTheme: void;

  /**
   * Pre-configured AxeBuilder. Excludes overlay-portal content that is part
   * of the documentation chrome rather than the surface under test, and skips
   * the noisy `region` and `landmark-unique` best-practice rules until the
   * demo shell affordances in Phase 0b ship.
   */
  axe: AxeBuilder;

  /** CDK overlay container — used by every overlay-based test. */
  overlayContainer: Locator;

  /**
   * Freeze the page clock at a fixed instant. Default is the 2025-06-15
   * mid-day fixture used by the date-picker / calendar specs. Must be called
   * before `goto`. `pauseAt` (not just `install`) is required to truly stop
   * `Date.now()` from advancing.
   */
  frozenClock: (time?: string | Date) => Promise<void>;
}

export const test = base.extend<Fixtures>({
  freshTheme: [
    async ({ page }, use) => {
      await page.addInitScript(() => {
        if (!window.localStorage.getItem('ngx-tw-theme')) {
          window.localStorage.setItem('ngx-tw-theme', 'light');
        }
      });
      await use();
    },
    { auto: true },
  ],

  axe: async ({ page }, use) => {
    const builder = new AxeBuilder({ page })
      // Compodoc-generated content rendered off-screen for SEO sometimes
      // trips axe with stale duplicates; excluding it keeps the signal clean.
      .exclude('[data-compodoc]');
    await use(builder);
  },

  overlayContainer: async ({ page }, use) => {
    await use(page.locator('.cdk-overlay-container'));
  },

  frozenClock: async ({ page }, use) => {
    const installClock = async (time: string | Date = '2025-06-15T12:00:00Z') => {
      const fixed = typeof time === 'string' ? new Date(time) : time;
      await page.clock.install({ time: fixed });
      await page.clock.pauseAt(fixed);
    };
    await use(installClock);
  },
});

export { expect } from '@playwright/test';
