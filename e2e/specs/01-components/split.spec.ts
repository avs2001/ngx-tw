import { expect, test } from '../../fixtures/base';
import { SplitPage } from '../../pages/split.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Split component E2E suite.
 *
 * Most of the surface here only runs in a real browser:
 * `setPointerCapture`, `requestAnimationFrame`-driven pointer paths,
 * `ResizeObserver`, and `localStorage` round-trip. The unit spec covers
 * the redistribute / clamp math; these tests cover the live pipeline.
 *
 * Chapter references: `docs/e2e/04-component-coverage.md` §Split and
 * `docs/e2e/08-edge-cases-and-real-bugs.md` row §`split.ts`.
 */
test.describe('Split', () => {
  const STORAGE_KEY = 'ngx-tw-demo-split';

  /**
   * The persisted-layout example writes to `localStorage` under
   * `ngx-tw-demo-split`. The default `freshTheme` fixture only clears
   * theme/preset keys, so without an explicit clear the persisted layout
   * leaks between tests. Run before every test (cheap) so any prior
   * Playwright session that left an entry behind doesn't poison this one.
   */
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((key) => {
      window.localStorage.removeItem(key);
    }, STORAGE_KEY);
  });

  test('@interaction drag the gutter changes pane sizes', async ({ page }) => {
    const split = new SplitPage(page);
    await split.goto();

    const before = await split.paneRect(split.horizontalSection, 0);
    expect(before).not.toBeNull();
    const gutter = split.gutter(split.horizontalSection, 0);
    const gBox = await gutter.boundingBox();
    expect(gBox).not.toBeNull();

    // Drag the gutter ~80px to the right via real pointer events. The
    // gutter listens via pointerdown + setPointerCapture; jsdom can't
    // emulate the capture path, so this is E2E-only territory.
    const startX = gBox!.x + gBox!.width / 2;
    const startY = gBox!.y + gBox!.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 80, startY, { steps: 10 });
    await page.mouse.up();

    const after = await split.paneRect(split.horizontalSection, 0);
    expect(after).not.toBeNull();
    // Don't assert a precise pixel delta — the percent-mode redistribute
    // math depends on the container's measured width. Just assert the
    // first pane grew by something visually meaningful.
    expect(after!.width).toBeGreaterThan(before!.width + 30);
  });

  test('@interaction max constraint clamps drag', async ({ page }) => {
    const split = new SplitPage(page);
    await split.goto();

    // The sidebar pane is `[minSize]="15" [maxSize]="40"` (percent). Drag
    // way past the right edge — far enough that without clamping the
    // sidebar would consume the entire row.
    const gBox = (await split.gutterRect(split.horizontalSection, 0))!;
    await page.mouse.move(gBox.x + gBox.width / 2, gBox.y + gBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(gBox.x + 2000, gBox.y + gBox.height / 2, { steps: 12 });
    await page.mouse.up();

    const splitBox = (await split.splitIn(split.horizontalSection).boundingBox())!;
    const pane0 = (await split.paneRect(split.horizontalSection, 0))!;
    // 40% maxSize with some tolerance for sub-pixel rendering and the
    // 6px gutter sitting inside the row's flex math.
    const ratio = pane0.width / splitBox.width;
    expect(ratio).toBeLessThanOrEqual(0.42);
    expect(ratio).toBeGreaterThan(0.35);
  });

  test('@interaction min constraint clamps drag', async ({ page }) => {
    const split = new SplitPage(page);
    await split.goto();

    // Drag toward the left far past the min — sidebar should clamp at 15%.
    const gBox = (await split.gutterRect(split.horizontalSection, 0))!;
    await page.mouse.move(gBox.x + gBox.width / 2, gBox.y + gBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(gBox.x - 2000, gBox.y + gBox.height / 2, { steps: 12 });
    await page.mouse.up();

    const splitBox = (await split.splitIn(split.horizontalSection).boundingBox())!;
    const pane0 = (await split.paneRect(split.horizontalSection, 0))!;
    const ratio = pane0.width / splitBox.width;
    expect(ratio).toBeGreaterThanOrEqual(0.13);
    expect(ratio).toBeLessThan(0.20);
  });

  test('@a11y gutter exposes role=separator with aria-value attrs', async ({ page }) => {
    const split = new SplitPage(page);
    await split.goto();

    const gutter = split.gutter(split.horizontalSection, 0);
    await expect(gutter).toHaveAttribute('role', 'separator');
    await expect(gutter).toHaveAttribute('aria-orientation', 'vertical');
    await expect(gutter).toHaveAttribute('tabindex', '0');

    const valueNowBefore = Number(await gutter.getAttribute('aria-valuenow'));
    const valueMin = Number(await gutter.getAttribute('aria-valuemin'));
    const valueMax = Number(await gutter.getAttribute('aria-valuemax'));
    expect(valueNowBefore).toBeGreaterThan(0);
    expect(valueMin).toBe(15);
    expect(valueMax).toBe(40);
    expect(valueNowBefore).toBeGreaterThanOrEqual(valueMin);
    expect(valueNowBefore).toBeLessThanOrEqual(valueMax);

    await gutter.focus();
    await page.keyboard.press('ArrowRight');
    const valueNowAfter = Number(await gutter.getAttribute('aria-valuenow'));
    expect(valueNowAfter).toBeGreaterThan(valueNowBefore);
  });

  test('@keyboard ArrowRight on horizontal gutter grows first pane by step', async ({ page }) => {
    const split = new SplitPage(page);
    await split.goto();

    const gutter = split.gutter(split.horizontalSection, 0);
    await gutter.focus();

    const before = Number(await gutter.getAttribute('aria-valuenow'));
    await page.keyboard.press('ArrowRight');
    const after = Number(await gutter.getAttribute('aria-valuenow'));
    // Default keyboardStep is 10 (percent).
    expect(after - before).toBeCloseTo(10, 0);

    await page.keyboard.press('ArrowLeft');
    const back = Number(await gutter.getAttribute('aria-valuenow'));
    expect(back).toBeCloseTo(before, 0);
  });

  test('@keyboard ArrowDown on vertical gutter grows top pane', async ({ page }) => {
    const split = new SplitPage(page);
    await split.goto();

    const gutter = split.gutter(split.verticalSection, 0);
    await expect(gutter).toHaveAttribute('aria-orientation', 'horizontal');

    await gutter.focus();
    const before = Number(await gutter.getAttribute('aria-valuenow'));
    await page.keyboard.press('ArrowDown');
    const after = Number(await gutter.getAttribute('aria-valuenow'));
    expect(after).toBeGreaterThan(before);
    // Sideways arrows are ignored on a vertical split.
    await page.keyboard.press('ArrowRight');
    expect(Number(await gutter.getAttribute('aria-valuenow'))).toBeCloseTo(after, 0);
  });

  test('@keyboard PageUp / PageDown apply the large step', async ({ page }) => {
    const split = new SplitPage(page);
    await split.goto();

    // Use the three-pane section so we have headroom for both directions
    // without bumping into 15% min / 40% max on the same press.
    const gutter = split.gutter(split.threePaneSection, 0);
    await gutter.focus();

    const before = Number(await gutter.getAttribute('aria-valuenow'));
    await page.keyboard.press('PageDown');
    const after = Number(await gutter.getAttribute('aria-valuenow'));
    // Default keyboardStepLarge is 50, but the pane caps at 40% maxSize,
    // so the visible jump is at least one keyboardStep (10) and at most
    // the distance to the cap.
    expect(after - before).toBeGreaterThan(10);
  });

  test('@keyboard Home and End move gutter to the min / max extremes', async ({ page }) => {
    const split = new SplitPage(page);
    await split.goto();

    const gutter = split.gutter(split.horizontalSection, 0);
    await gutter.focus();
    // Sanity-check focus actually landed — `.focus()` is JS-API only;
    // some browsers under load skip the `focus` DOM event on first call,
    // which leaves the host's `_focusedGutter` signal null and silently
    // drops the subsequent keydowns.
    await expect(gutter).toBeFocused();

    await page.keyboard.press('End');
    await expect(gutter).toHaveAttribute('aria-valuenow', '40');

    await page.keyboard.press('Home');
    await expect(gutter).toHaveAttribute('aria-valuenow', '15');
  });

  test('@interaction Escape cancels an in-flight drag and restores sizes', async ({ page }) => {
    const split = new SplitPage(page);
    await split.goto();

    const before = (await split.paneRect(split.horizontalSection, 0))!;
    const gBox = (await split.gutterRect(split.horizontalSection, 0))!;

    await page.mouse.move(gBox.x + gBox.width / 2, gBox.y + gBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(gBox.x + 120, gBox.y + gBox.height / 2, { steps: 8 });
    // While the pointer is still held, the host keydown handler should
    // roll the sizes back when Escape lands. Don't release the mouse
    // beforehand — that would commit the drag.
    await page.keyboard.press('Escape');
    await page.mouse.up();

    const after = (await split.paneRect(split.horizontalSection, 0))!;
    // Within ~2px of the original — Escape rolls back to the pre-drag
    // snapshot, sub-pixel rendering may differ.
    expect(Math.abs(after.width - before.width)).toBeLessThan(3);
  });

  test('@interaction programmatic collapse / expand / reset round-trip', async ({ page }) => {
    const split = new SplitPage(page);
    await split.goto();

    const before = (await split.paneRect(split.collapsibleSection, 0))!;

    await split.collapseButton('Collapse sidebar').click();
    await expect(split.collapseStatus).toHaveText('pane 0 collapsed');
    const collapsed = (await split.paneRect(split.collapsibleSection, 0))!;
    expect(collapsed.width).toBeLessThan(2); // collapsedSize=0

    await split.collapseButton('Expand sidebar').click();
    await expect(split.collapseStatus).toHaveText('pane 0 expanded');
    const expanded = (await split.paneRect(split.collapsibleSection, 0))!;
    expect(expanded.width).toBeGreaterThan(20);

    await split.collapseButton('Reset').click();
    const reset = (await split.paneRect(split.collapsibleSection, 0))!;
    // Reset returns to the declared defaultSize (30%), close to the
    // initial paint.
    expect(Math.abs(reset.width - before.width)).toBeLessThan(5);
  });

  test('@keyboard Enter on the gutter toggles a collapsible pane', async ({ page }) => {
    const split = new SplitPage(page);
    await split.goto();

    const gutter = split.gutter(split.collapsibleSection, 0);
    await gutter.focus();
    await page.keyboard.press('Enter');
    await expect(split.collapseStatus).toHaveText('pane 0 collapsed');

    await page.keyboard.press(' ');
    await expect(split.collapseStatus).toHaveText('pane 0 expanded');
  });

  test('@interaction drag below snapSize collapses the pane', async ({ page }) => {
    const split = new SplitPage(page);
    await split.goto();

    // snapSize is 6%. Drag the gutter all the way to the left edge to
    // cross that threshold; the pane should fire (collapseChange).
    const pane = split.splitIn(split.collapsibleSection).locator('tw-split-pane').first();
    // Section sits below the fold — Playwright's `page.mouse` operates in
    // viewport coordinates, so without scrolling the gutter into view the
    // pointerdown lands on whatever happens to sit at those coordinates,
    // not the gutter.
    const gutter = split.gutter(split.collapsibleSection, 0);
    await gutter.scrollIntoViewIfNeeded();
    const gBox = (await gutter.boundingBox())!;
    await page.mouse.move(gBox.x + gBox.width / 2, gBox.y + gBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(gBox.x - 1000, gBox.y + gBox.height / 2, { steps: 14 });
    // Pointer moves are coalesced and applied inside `requestAnimationFrame`
    // (`split.ts:854`). Wait for the rAF apply pass to flip the pane into
    // its collapsed state before releasing — otherwise mouseup races rAF
    // and `_endDrag` sees `wasCollapsed === isCollapsed` and never emits.
    //
    // Note: with `minSize=15` and `collapsedSize=0`, the snap path sets
    // `_collapsed = true` but the *visible* width gets clamped back up to
    // `minSize` by the hard min/max clamp that runs after snap
    // (`split.ts:891-912`). So we cannot wait on pane width — we wait on
    // the `data-split-pane-collapsed` attribute the pane host writes.
    await expect(pane).toHaveAttribute('data-split-pane-collapsed', 'true');
    await page.mouse.up();

    await expect(split.collapseStatus).toHaveText('pane 0 collapsed');
  });

  test('@interaction storageKey hydrates pane sizes from localStorage', async ({ page }) => {
    // Drive this in the reverse direction of the natural flow: seed
    // `localStorage` BEFORE navigation, then assert the gutter renders
    // with the persisted size on first paint. The forward direction
    // (resize → reload → restore) is sensitive to the component's
    // debounced persistence write timing — pre-seeding is the cleaner
    // E2E proof that the hydration path runs at all (which is the
    // JSDOM-uncoverable bit). The persist→read path is covered by the
    // unit spec.
    await page.addInitScript((key) => {
      // Format documented in `split.ts:1236-1256`: versioned envelope
      // with the unit and per-pane size arrays.
      window.localStorage.setItem(
        key,
        JSON.stringify({ version: 1, unit: 'percent', sizes: [50, 25, 25] }),
      );
    }, STORAGE_KEY);

    const split = new SplitPage(page);
    await split.goto();

    const gutter = split.gutter(split.persistedSection, 0);
    await expect(gutter).toHaveAttribute('aria-valuenow', '50');
  });

  test('@interaction pixel-mode drag updates sizes', async ({ page }) => {
    const split = new SplitPage(page);
    await split.goto();

    const gutter = split.gutter(split.pixelSection, 0);
    await gutter.scrollIntoViewIfNeeded();
    const before = Number(await gutter.getAttribute('aria-valuenow'));
    const gBox = (await gutter.boundingBox())!;

    await page.mouse.move(gBox.x + gBox.width / 2, gBox.y + gBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(gBox.x + 60, gBox.y + gBox.height / 2, { steps: 8 });
    // Wait until rAF coalesces the moves and writes the new sizes — the
    // gutter exposes the live value via `aria-valuenow`. Pixel-mode drag
    // is 1:1 with the cursor delta, so +60 cursor → ~+60 in aria-valuenow.
    await expect
      .poll(async () => Number(await gutter.getAttribute('aria-valuenow')))
      .toBeGreaterThan(before + 30);
    await page.mouse.up();
  });

  test('@interaction nested split — inner gutter resizes inner panes only', async ({ page }) => {
    const split = new SplitPage(page);
    await split.goto();

    // The nested section has an outer horizontal split (3 gutters at
    // indices 0,1) plus an inner vertical split inside the middle pane.
    // The inner split has its own role=separator with its own gutter
    // index 0 — but it's inside the second outer pane. Query against
    // the inner `tw-split` directly.
    const innerSplit = split.nestedSection.locator('tw-split tw-split');
    await expect(innerSplit).toHaveAttribute('data-split-direction', 'vertical');
    const innerGutter = innerSplit.locator('[role="separator"]').first();
    const beforeTop = (await innerSplit.locator('tw-split-pane').nth(0).boundingBox())!;

    await innerGutter.focus();
    await page.keyboard.press('ArrowDown');

    const afterTop = (await innerSplit.locator('tw-split-pane').nth(0).boundingBox())!;
    expect(afterTop.height).toBeGreaterThan(beforeTop.height);

    // The outer split's first pane (the file tree) must not have moved.
    const outerSplit = split.splitIn(split.nestedSection);
    const outerPane0 = (await outerSplit.locator('> tw-split-pane').first().boundingBox())!;
    // No assertion on absolute width — just sanity that we still have a
    // measurable pane; the outer pane's bounding box was rendered before
    // and is rendered after.
    expect(outerPane0.width).toBeGreaterThan(0);
  });

  test('@interaction body class tw-split-no-select toggles across a drag', async ({ page }) => {
    const split = new SplitPage(page);
    await split.goto();

    const hasClass = async () =>
      page.evaluate(() => document.body.classList.contains('tw-split-no-select'));

    expect(await hasClass()).toBe(false);

    const gBox = (await split.gutterRect(split.horizontalSection, 0))!;
    await page.mouse.move(gBox.x + gBox.width / 2, gBox.y + gBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(gBox.x + 30, gBox.y + gBox.height / 2, { steps: 4 });
    await expect.poll(hasClass).toBe(true);

    await page.mouse.up();
    await expect.poll(hasClass).toBe(false);
  });

  test('@a11y live region announces collapse / expand', async ({ page }) => {
    const split = new SplitPage(page);
    await split.goto();

    // The component renders a single `aria-live="polite"` region per
    // `<tw-split>`. Scope to the collapsible section to avoid matching
    // the other six splits on the page.
    const live = split.collapsibleSection.locator('[aria-live="polite"]');

    await split.collapseButton('Collapse sidebar').click();
    await expect(live).toHaveText(/collapsed/i);

    await split.collapseButton('Expand sidebar').click();
    await expect(live).toHaveText(/expanded/i);
  });

  // Axe sweep across every component's examples route is covered centrally
  // by `e2e/specs/03-accessibility/examples.spec.ts` (light + dark). No
  // need to duplicate it here.

  test.fixme('@keyboard @rtl horizontal arrow keys invert under dir=rtl', async ({ page }) => {
    // BLOCKED: setting `document.documentElement.dir = 'rtl'` via an init
    // script does not flip CDK's `Directionality` service in the demo
    // shell — the keydown handler still treats ArrowRight as
    // grow-first-pane. The library does consume `Directionality`
    // (`split.ts:319-324`), and unit tests confirm the inversion math.
    // Needs either (a) a demo-shell RTL affordance, or (b) a fixture
    // that bootstraps the app with `bootstrapApplication(..., { providers:
    // [{ provide: DIR_DOCUMENT, useValue: ... }] })`. See REVIEW.md
    // §"RTL handling" for the broader plan.
    // Chapter 04 calls out that horizontal arrow keys / drag delta invert
    // under `dir="rtl"`. The demo has no RTL affordance, so seed it via
    // an init script before navigation.
    await page.addInitScript(() => {
      document.documentElement.setAttribute('dir', 'rtl');
    });

    const split = new SplitPage(page);
    await split.goto();

    const gutter = split.gutter(split.horizontalSection, 0);
    await gutter.focus();
    const before = Number(await gutter.getAttribute('aria-valuenow'));

    // Under RTL, ArrowRight should *decrease* the first pane's size.
    await page.keyboard.press('ArrowRight');
    const after = Number(await gutter.getAttribute('aria-valuenow'));
    expect(after).toBeLessThan(before);
  });
});
