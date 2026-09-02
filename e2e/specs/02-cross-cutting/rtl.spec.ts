import type { Locator } from '@playwright/test';

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

/**
 * Paginator roving focus under RTL.
 *
 * `paginator.ts` used to build its `FocusKeyManager` with a hard-coded
 * `.withHorizontalOrientation('ltr')` and imported no bidi at all. CDK's
 * `ListKeyManager` maps ArrowLeft to `setPreviousItemActive()` under `'ltr'`
 * and to `setNextItemActive()` under `'rtl'`, so the hard-coded value inverted
 * both arrows in RTL locales: the focus ring stepped backwards in DOM order
 * while moving *forwards* on screen. The fix feeds
 * `Directionality.valueSignal()` into that call.
 *
 * The unit specs for this run under a mocked `Directionality`. This is the
 * only place the whole chain — real `dir` attribute → CDK `Directionality` →
 * key manager orientation → painted position — is exercised.
 *
 * Three assertions, because position alone is vacuous. If `dir=rtl` never
 * reached the document, the layout would be LTR and ArrowLeft would move focus
 * to page "1", which is ALSO leftwards — a position-only check would pass for
 * the wrong reason. So we pin:
 *   1. the layout precondition (page "1" sits to the RIGHT of page "2"),
 *   2. the identity of the newly focused control ("3", the DOM-next item),
 *   3. its painted x, which must decrease.
 * Under the old hard-coded `'ltr'`, (2) reads "1" and (3) increases.
 */
test('@rtl paginator: ArrowLeft/ArrowRight follow visual order under dir=rtl', async ({
  page,
}) => {
  await page.goto('/components/paginator/examples');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

  // The "Colors" section's first paginator: default (full) type, 80 items over
  // the default page size, so pages 1–8 all render as numbered controls.
  const colorsSection = page.locator('main section').filter({
    has: page.locator('h2').filter({ hasText: /^Colors$/ }),
  });
  const paginator = colorsSection.locator('tw-paginator').first();
  const pageButtons = paginator.locator('[data-tw-paginator-nav="page"]');

  const boxOf = async (locator: Locator) => {
    const box = await locator.boundingBox();
    expect(box, 'expected the page control to be laid out').not.toBeNull();
    return box!;
  };

  // Named `btn*` rather than `page*`: eslint-plugin-playwright's
  // `prefer-locator` rule matches any identifier starting with "page" and
  // would flag `.focus()` below as a Page method.
  const btn1 = pageButtons.nth(0);
  const btn2 = pageButtons.nth(1);
  const btn3 = pageButtons.nth(2);
  await expect(btn3).toBeVisible();

  // (1) Layout precondition. Without this the rest of the test cannot
  // distinguish "RTL works" from "dir never applied".
  const box1 = await boxOf(btn1);
  const box2 = await boxOf(btn2);
  expect(
    box1.x,
    'dir=rtl did not reverse the paginator layout — the rest of this test would be meaningless',
  ).toBeGreaterThan(box2.x);

  await btn2.focus();
  await expect(btn2).toBeFocused();

  // ArrowLeft = "move visually left" = the NEXT item in DOM order under RTL.
  await page.keyboard.press('ArrowLeft');
  await expect(
    btn3,
    'RTL ArrowLeft must advance to the next page control, not the previous one',
  ).toBeFocused();

  const afterLeft = await boxOf(btn3);
  expect(
    afterLeft.x,
    'RTL ArrowLeft must move focus leftwards on screen',
  ).toBeLessThan(box2.x);

  // ArrowRight is the mirror image: back to "2", rightwards on screen.
  await page.keyboard.press('ArrowRight');
  await expect(
    btn2,
    'RTL ArrowRight must step back to the previous page control',
  ).toBeFocused();
  expect(
    (await boxOf(btn2)).x,
    'RTL ArrowRight must move focus rightwards on screen',
  ).toBeGreaterThan(afterLeft.x);
});
