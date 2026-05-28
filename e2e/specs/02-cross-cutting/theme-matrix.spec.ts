import AxeBuilder from '@axe-core/playwright';
import type { BrowserContext } from '@playwright/test';

import { expect, test } from '../../fixtures/base';

test.describe.configure({ mode: 'parallel' });

type Theme = 'light' | 'dark' | 'high-contrast';
type Preset = 'default' | 'candy' | 'ocean' | 'forest' | 'sunset';

/**
 * Seed both persistence keys before Angular boots. Chapter 05 §5.4 calls
 * this out explicitly: Playwright's `colorScheme` only applies if the
 * persisted theme is `'system'`, so we drive the resolved theme directly.
 */
async function seedTheme(context: BrowserContext, theme: Theme, preset: Preset = 'default') {
  await context.addInitScript(
    ([t, p]) => {
      window.localStorage.setItem('ngx-tw-theme', t);
      if (p && p !== 'default') {
        window.localStorage.setItem('ngx-tw-preset', p);
      } else {
        window.localStorage.removeItem('ngx-tw-preset');
      }
    },
    [theme, preset] as const,
  );
}

const SAMPLED_PAGES = [
  '/components/button/examples',
  '/components/alert/examples',
  '/components/input/examples',
  '/components/dialog/examples',
] as const;

/**
 * Theme matrix — chapter 05 §5.4.
 *
 * Sweeps the three resolved themes (`light`, `dark`, `high-contrast`)
 * across a sampled set of pages. Each cell asserts:
 *   - No console errors during navigation.
 *   - `<html data-theme="...">` matches the seeded value.
 *   - axe's `color-contrast` rule passes (the surface most theme drift
 *     hits first).
 *
 * The preset cell asserts that a non-default preset (`candy`) writes
 * `data-preset` on `<html>` and produces a different computed
 * `background-color` on a `tw-button` primary-solid than the default.
 */
test.describe('Theme matrix', () => {
  for (const theme of ['light', 'dark', 'high-contrast'] as const) {
    test(`@theme ${theme}: <html data-theme> matches and console stays quiet`, async ({
      page,
      context,
    }) => {
      await seedTheme(context, theme);

      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      for (const url of SAMPLED_PAGES) {
        await page.goto(url);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      }

      expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
    });

    // The cross-page color-contrast sweep is gated on the per-component
    // a11y backlog. Failing pages today (chromium-light scan):
    //   - `/components/input/examples` (light + dark + high-contrast):
    //     form-field hint text colour. Tracked under `form-field` in
    //     `examples.spec.ts` backlog.
    //   - `/components/button/examples` (dark): solid `${color}` swatches.
    //     Tracked under `button` in `examples.spec.ts` backlog.
    //   - `/components/dialog/examples` (dark): same dark-mode shift.
    // Re-enable once those backlog items land.
    test.fixme(`@theme @a11y ${theme}: axe color-contrast passes on sampled pages`, async ({
      page,
      context,
    }) => {
      await seedTheme(context, theme);

      for (const url of SAMPLED_PAGES) {
        await page.goto(url);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

        const builder = new AxeBuilder({ page })
          .exclude('[data-compodoc]')
          .withRules(['color-contrast']);
        const results = await builder.analyze();
        expect(
          results.violations,
          `color-contrast violations on ${url} under theme=${theme}`,
        ).toEqual([]);
      }
    });
  }

  test('@theme preset: candy writes data-preset and changes primary background', async ({
    page,
    context,
  }) => {
    // Capture default baseline first.
    await seedTheme(context, 'light', 'default');
    await page.goto('/components/button/examples');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-preset', 'candy');

    const variantsSection = page.locator('main section').filter({
      has: page.locator('h2').filter({ hasText: /^Variants$/ }),
    });
    const solidPrimary = variantsSection.locator('button[twButton]').first();
    const defaultBg = await solidPrimary.evaluate((el) => getComputedStyle(el).backgroundColor);

    // Reseed with candy and reload — the preset must apply on next boot.
    await context.addInitScript(() => {
      window.localStorage.setItem('ngx-tw-preset', 'candy');
    });
    await page.goto('/components/button/examples');
    await expect(page.locator('html')).toHaveAttribute('data-preset', 'candy');

    const candyBg = await solidPrimary.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(
      candyBg,
      'candy preset should shift the solid-primary background away from the default',
    ).not.toBe(defaultBg);
  });
});
