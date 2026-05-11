import { expect, test } from '../../fixtures/base';
import { COMPONENTS } from '../../support/routes';
import { formatViolations, runAxe } from '../../support/a11y';

test.describe.configure({ mode: 'parallel' });

/**
 * First-hit lazy-chunk compilation can take well past the default 5s expect
 * timeout under parallel load (some example chunks are 600+ lines). Match
 * the smoke-suite threshold so a slow build isn't conflated with a true
 * outlet-render failure.
 */
const OUTLET_READY_TIMEOUT_MS = 20_000;

/**
 * Axe sweep across every component's `examples` sub-route in both light
 * and dark color schemes. We deliberately skip `overview` and `api` —
 * they are largely static prose and Compodoc-generated tables, and add
 * more noise than signal compared to the interactive surfaces the
 * library actually ships.
 *
 * Dark mode runs alongside light because `color-contrast` regressions
 * have historically only surfaced when a semantic token was overridden
 * for dark mode without updating its on-color (see chapter 06 §"Scope").
 */
for (const component of COMPONENTS) {
  const url = `/components/${component}/examples`;

  test(`@a11y ${url} — light scheme`, async ({ page }) => {
    await page.goto(url);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: OUTLET_READY_TIMEOUT_MS,
    });
    // The base fixture seeds `'light'` on first paint; assert before the
    // scan so a regression in the fixture order doesn't silently mask a
    // dark-mode page being audited as if it were light.
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    const results = await runAxe(page);
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  test(`@a11y ${url} — dark scheme`, async ({ page }) => {
    // Seed dark *before* navigation so the theme service hydrates into the
    // dark token set on first paint. Setting it after `goto` would race
    // the lazy chunk's render and let axe scan a light-then-dark flash.
    await page.addInitScript(() => {
      window.localStorage.setItem('ngx-tw-theme', 'dark');
    });

    await page.goto(url);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: OUTLET_READY_TIMEOUT_MS,
    });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    const results = await runAxe(page);
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
}
