import AxeBuilder from '@axe-core/playwright';
import type { BrowserContext, Locator } from '@playwright/test';

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

/**
 * Resolve an element's computed `background-color` to concrete sRGB bytes.
 *
 * `getComputedStyle().backgroundColor` serialises Tailwind v4's palette as
 * `oklch(…)`, so string comparison alone cannot answer "is this light?".
 * Painting the computed value onto a 1×1 canvas over an opaque black base
 * makes the browser do the conversion (and flattens any alpha), which is what
 * lets the assertions below use luminance thresholds instead of hard-coding
 * `rgb(255, 255, 255)` — a future near-white surface token must not break the
 * guard, but a *dark* one must.
 */
async function backgroundRgb(locator: Locator): Promise<[number, number, number]> {
  return locator.evaluate((el) => {
    const color = getComputedStyle(el).backgroundColor;
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b] as [number, number, number];
  });
}

/** WCAG relative luminance (0 = black, 1 = white) for an sRGB byte triple. */
function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
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
    // Re-enabled 2026-09-02: the settle wait below removed the phantom
    // failures, leaving one real surface, which is excluded by selector.
    test(`@theme @a11y ${theme}: axe color-contrast passes on sampled pages`, async ({
      page,
      context,
    }) => {
      await seedTheme(context, theme);

      for (const url of SAMPLED_PAGES) {
        await page.goto(url);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        // axe samples computed colour at the instant it runs, and the demo
        // shell fades its chrome in. Without this the scan reads
        // mid-transition colours: the sibling sweep reported contrast
        // failures on 49 of 52 components before it settled, and 6 after.
        await page.waitForTimeout(1200);

        const builder = new AxeBuilder({ page })
          .exclude('[data-compodoc]')
          // The form-field HINT text is the one surface still failing, and it
          // fails in all three themes at 12px: #a4aab2 on #ffffff is 2.34:1
          // against a 4.5:1 requirement. Excluded by selector rather than
          // leaving this whole sweep `fixme`'d, so the other ~57 nodes per
          // page across light / dark / high-contrast are actually enforced.
          // Tracked as the `form-field` / `input` / `textarea` / `time-picker`
          // color-contrast cluster in examples.spec.ts's A11Y_BACKLOG; delete
          // this exclusion when that lands.
          .exclude('[id^="tw-form-field-hint"]')
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

  /**
   * `[twTheme]` subtree scoping — regression guard for the HIGH defect fixed
   * by `projects/ngx-tw/theme/_light.css`.
   *
   * Before that file existed, `light` was defined *only* in `_semantic.css`'s
   * `@theme` block, which Tailwind v4 emits as
   * `@layer theme { :root, :host { … } }`. A `<div data-theme="light">` deep in
   * the tree matches neither selector, so a light pane nested inside a dark
   * (or high-contrast) document silently inherited the ancestor's tokens and
   * `[twTheme]="'light'"` was a no-op. `dark` and `high-contrast` always
   * shipped element-agnostic `[data-theme=…]` blocks, which is why only the
   * light direction broke.
   *
   * The demo's own "Scoped Subtrees" section is the reproduction: three
   * side-by-side `[twTheme]` panes that all looked dark once the page was.
   *
   * Three independent assertions, because each alone can pass vacuously:
   *
   *  1. **Mechanism.** The light pane's *computed custom properties* must
   *     differ from the document root's. Under the bug they were byte-identical
   *     — that inheritance IS the defect, stated directly.
   *  2. **Relative.** The `bg-primary-600` chip inside each pane must compute
   *     three distinct backgrounds (blue-600 / blue-400 / blue-700). Under the
   *     bug the light chip collapsed onto the dark chip's blue-400.
   *  3. **Absolute.** The light pane's own background must be a *light* colour
   *     and the dark pane's a dark one, by luminance. A regression that
   *     re-darkens the light pane fails here even if it somehow kept the panes
   *     mutually distinct.
   *
   * NOTE on the sampled element: the panes themselves carry `bg-surface`, and
   * `--color-surface` is `--color-white` in BOTH `_light.css` and
   * `_high-contrast.css` by design — so a three-way-distinct check on the pane
   * background is unsatisfiable. The chip (`bg-primary-600`) is the nearest
   * element whose token genuinely differs across all three schemes.
   *
   * Everything asserted here is computed style. An attribute/class assertion
   * would have passed with the bug present — the directive always wrote
   * `data-theme` correctly; it was the CSS that had nothing to match.
   */
  test('@theme scoped [twTheme] panes re-resolve tokens inside a dark document', async ({
    page,
    context,
  }) => {
    // `ngx-tw-theme` is `DEFAULT_TW_THEME_CONFIG.storageKey`
    // (projects/ngx-tw/theme/theme.types.ts).
    await seedTheme(context, 'dark');

    await page.goto('/services/theme/examples');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Scope to the demo section before selecting by `data-theme`: unscoped,
    // `[data-theme="dark"]` would also match `<html>`.
    const scoped = page.locator('main section').filter({
      has: page.locator('h2').filter({ hasText: /^Scoped Subtrees$/ }),
    });
    const pane = (theme: Theme) => scoped.locator(`[data-theme="${theme}"]`).first();

    const lightPane = pane('light');
    const darkPane = pane('dark');
    const contrastPane = pane('high-contrast');
    await expect(lightPane).toBeVisible();
    await expect(darkPane).toBeVisible();
    await expect(contrastPane).toBeVisible();

    // ── 1. Mechanism: the light subtree must not inherit the root's tokens ──
    const TOKENS = ['--color-surface', '--color-fg', '--color-primary-600'] as const;
    const readTokens = (locator: Locator) =>
      locator.evaluate((el, tokens: readonly string[]) => {
        const style = getComputedStyle(el);
        return tokens.map((t) => style.getPropertyValue(t).trim());
      }, TOKENS);

    const rootTokens = await page
      .locator('html')
      .evaluate((el, tokens: readonly string[]) => {
        const style = getComputedStyle(el);
        return tokens.map((t) => style.getPropertyValue(t).trim());
      }, TOKENS);
    const lightTokens = await readTokens(lightPane);

    expect(
      lightTokens,
      '[twTheme]="light" must re-resolve the semantic tokens inside a dark document; ' +
        'identical values mean the subtree inherited the root (the _light.css defect)',
    ).not.toEqual(rootTokens);

    // ── 2. Relative: three distinct chip backgrounds ──
    const chip = (paneLocator: Locator) => paneLocator.getByText('Primary', { exact: true });
    const chipBackgrounds = await Promise.all(
      [lightPane, darkPane, contrastPane].map(async (p) =>
        (await backgroundRgb(chip(p))).join(','),
      ),
    );
    expect(
      new Set(chipBackgrounds).size,
      `the three [twTheme] panes must resolve three different primary backgrounds, got ${chipBackgrounds.join(' | ')}`,
    ).toBe(3);

    // ── 3. Absolute: light stays light, dark stays dark ──
    const lightLuminance = relativeLuminance(await backgroundRgb(lightPane));
    const darkLuminance = relativeLuminance(await backgroundRgb(darkPane));

    expect(
      lightLuminance,
      'the [twTheme]="light" pane background must be a light colour even on a dark page',
    ).toBeGreaterThan(0.8);
    expect(
      darkLuminance,
      'the [twTheme]="dark" pane background must stay dark',
    ).toBeLessThan(0.2);
  });
});
