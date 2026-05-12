import { expect, test } from '../../fixtures/base';

test.describe.configure({ mode: 'parallel' });

/**
 * Theme override leakage — chapter 08 §8.6.
 *
 * `provideTheme()` is registered once at the root injector, and
 * `ThemeService` is `@Injectable()` with no `providedIn`. Re-initialisation
 * per route is not possible with the current provider topology, so the
 * "leakage" framing is gone. What we keep is a cheap round-trip
 * regression guard for the two independent persistence paths:
 *
 *  - `ngx-tw-theme`  — the resolved theme (`light` / `dark` /
 *    `high-contrast` / `system`).
 *  - `ngx-tw-preset` — the shell's color preset.
 *
 * The contract is **both keys survive navigation** between routes and
 * map to `<html>` attributes after the next mount.
 */
test.describe('Theme leakage / preset persistence', () => {
  test('@theme dark theme survives route navigation', async ({ page, context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('ngx-tw-theme', 'dark');
    });

    await page.goto('/components/button/examples');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.goto('/components/alert/examples');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.goto('/components/dialog/examples');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // localStorage value also survives — the round-trip is the
    // persistence contract.
    const stored = await page.evaluate(() => window.localStorage.getItem('ngx-tw-theme'));
    expect(stored).toBe('dark');
  });

  test('@theme candy preset survives route navigation', async ({ page, context }) => {
    // chapter 08 §8.6: the shell persists a separate `'ngx-tw-preset'`
    // key. A preset chosen on one page must persist across navigation —
    // independent of the theme key.
    await context.addInitScript(() => {
      window.localStorage.setItem('ngx-tw-preset', 'candy');
    });

    await page.goto('/components/button/examples');
    await expect(page.locator('html')).toHaveAttribute('data-preset', 'candy');

    await page.goto('/components/alert/examples');
    await expect(page.locator('html')).toHaveAttribute('data-preset', 'candy');

    await page.goto('/components/dialog/examples');
    await expect(page.locator('html')).toHaveAttribute('data-preset', 'candy');

    const stored = await page.evaluate(() => window.localStorage.getItem('ngx-tw-preset'));
    expect(stored).toBe('candy');
  });

  test('@theme theme + preset survive the same navigation independently', async ({
    page,
    context,
  }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('ngx-tw-theme', 'dark');
      window.localStorage.setItem('ngx-tw-preset', 'ocean');
    });

    await page.goto('/components/button/examples');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-preset', 'ocean');

    await page.goto('/components/badge/examples');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-preset', 'ocean');
  });
});
