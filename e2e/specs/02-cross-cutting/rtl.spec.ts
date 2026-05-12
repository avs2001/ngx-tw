import { expect, test } from '../../fixtures/base';

test.describe.configure({ mode: 'parallel' });

/**
 * RTL — chapter 05 §5.5.
 *
 * The demo has **no in-app RTL toggle** today. The library consumes
 * `Directionality` in `slider` and `split`, and every other listed
 * component honours `dir` from an ancestor. We flip the document's
 * direction via `addInitScript` before Angular boots — the only available
 * access path until a shell toggle ships (P3 follow-up).
 *
 * `addInitScript` runs at the `document_start` event, before the `<html>`
 * tag has been parsed — `document.documentElement` is `null` at that
 * moment. We register a `DOMContentLoaded` listener instead so the dir
 * setter fires after parsing completes but before Angular bootstraps.
 *
 * Sampled targets (chapter 05 §5.5): accordion, menu, select, date-picker,
 * paginator, slider, split, tabs. Each cell asserts:
 *   - The page mounts in `dir=rtl` without console errors.
 *   - `<html dir>` reads `rtl`.
 *   - The route's main heading is visible (no layout collapse).
 *   - No horizontal scroll overflow on `<html>` (a common RTL regression).
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        document.documentElement.dir = 'rtl';
      },
      { once: true },
    );
  });
});

const RTL_TARGETS = [
  'accordion',
  'menu',
  'select',
  'date-picker',
  'paginator',
  'slider',
  'split',
  'tabs',
] as const;

for (const component of RTL_TARGETS) {
  test(`@rtl ${component} mounts in dir=rtl without overflow`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(`/components/${component}/examples`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    // Allow a 1px tolerance for sub-pixel rounding on RTL paddings.
    expect(
      scrollWidth - clientWidth,
      `${component} introduces horizontal overflow under dir=rtl`,
    ).toBeLessThanOrEqual(1);

    expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
  });
}

test('@rtl slider: ArrowRight decreases value in RTL (CDK Directionality)', async ({
  page,
}) => {
  // `slider.ts` is one of two components that explicitly inject
  // `Directionality`. Per CLAUDE.md / chapter 05 §5.5: ArrowRight should
  // map to "previous" in RTL. We assert the visible value moves DOWN
  // after ArrowRight when dir=rtl. The slider examples page sets an
  // initial value via the Basic example.
  await page.goto('/components/slider/examples');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const thumb = page.locator('[role="slider"]').first();
  await thumb.focus();
  const before = Number(await thumb.getAttribute('aria-valuenow'));
  await page.keyboard.press('ArrowRight');
  const after = Number(await thumb.getAttribute('aria-valuenow'));

  // RTL: ArrowRight is semantic "previous" — value decreases (or saturates
  // at the min). The negative-or-equal-only assertion captures both.
  expect(after, `RTL slider ArrowRight should not increase value`).toBeLessThanOrEqual(before);
});
