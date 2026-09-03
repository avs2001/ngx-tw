import { expect, test } from '../../fixtures/base';
import { SplitPage } from '../../pages/split.page';
import { EXPECTED_FAILURE_TIMEOUT_MS } from '../../support/fixme-registry';

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
  // Matches the `storageKey` the persisted-sizes demo passes to `tw-split`.
  const STORAGE_KEY = 'demo-split-example';

  /**
   * The persisted-layout example writes to `localStorage` under
   * `demo-split-example`. The default `freshTheme` fixture only clears
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

  test('@interaction max constraint clamps drag', async ({ page, browserName }) => {
    // Firefox's pointer-capture semantics under playwright don't reliably
    // commit the mouse-move stream for `page.mouse.down() → move() → up()`
    // against a setPointerCapture'd target — the gutter often stays put
    // even when chromium / webkit both see the full drag. Chromium covers
    // the contract; skip firefox until we wire a direct dispatchEvent
    // fallback for it.
    test.skip(browserName === 'firefox', 'firefox pointer-capture flake — see split.ts');
    const split = new SplitPage(page);
    await split.goto();

    // The Min/Max constraints section has `[minSize]="20" [maxSize]="50"`
    // on the first pane. Drag way past the right edge — without clamping
    // the first pane would consume the whole row.
    const gutter = split.gutter(split.minMaxSection, 0);
    await gutter.scrollIntoViewIfNeeded();
    const gBox = (await gutter.boundingBox())!;
    await page.mouse.move(gBox.x + gBox.width / 2, gBox.y + gBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(gBox.x + 2000, gBox.y + gBox.height / 2, { steps: 12 });
    await page.mouse.up();

    const splitBox = (await split.splitIn(split.minMaxSection).boundingBox())!;
    const pane0 = (await split.paneRect(split.minMaxSection, 0))!;
    // 50% maxSize with some tolerance for sub-pixel rendering and the
    // 6px gutter sitting inside the row's flex math.
    const ratio = pane0.width / splitBox.width;
    expect(ratio).toBeLessThanOrEqual(0.52);
    expect(ratio).toBeGreaterThan(0.45);
  });

  test('@interaction min constraint clamps drag', async ({ page }) => {
    const split = new SplitPage(page);
    await split.goto();

    // Drag toward the left far past the min — first pane should clamp at 20%.
    const gutter = split.gutter(split.minMaxSection, 0);
    await gutter.scrollIntoViewIfNeeded();
    const gBox = (await gutter.boundingBox())!;
    await page.mouse.move(gBox.x + gBox.width / 2, gBox.y + gBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(gBox.x - 2000, gBox.y + gBox.height / 2, { steps: 12 });
    await page.mouse.up();

    const splitBox = (await split.splitIn(split.minMaxSection).boundingBox())!;
    const pane0 = (await split.paneRect(split.minMaxSection, 0))!;
    const ratio = pane0.width / splitBox.width;
    expect(ratio).toBeGreaterThanOrEqual(0.18);
    expect(ratio).toBeLessThan(0.25);
  });

  test('@a11y gutter exposes role=separator with aria-value attrs', async ({ page }) => {
    const split = new SplitPage(page);
    await split.goto();

    const gutter = split.gutter(split.minMaxSection, 0);
    await gutter.scrollIntoViewIfNeeded();
    await expect(gutter).toHaveAttribute('role', 'separator');
    await expect(gutter).toHaveAttribute('aria-orientation', 'horizontal');
    await expect(gutter).toHaveAttribute('tabindex', '0');

    // `aria-valuemin` / `aria-valuemax` are fixed at 0 / 100 by the component
    // (`split.ts:88-89`); per-pane min/max are runtime constraints, not part
    // of the ARIA range. Only `aria-valuenow` reflects the current size.
    const valueNowBefore = Number(await gutter.getAttribute('aria-valuenow'));
    expect(Number(await gutter.getAttribute('aria-valuemin'))).toBe(0);
    expect(Number(await gutter.getAttribute('aria-valuemax'))).toBe(100);
    expect(valueNowBefore).toBeGreaterThanOrEqual(20);
    expect(valueNowBefore).toBeLessThanOrEqual(50);

    await gutter.focus();
    await expect(gutter).toBeFocused();
    // Read the pre-press value AFTER focus has settled — under parallel
    // dev-server load the gutter's `(focus)` template binding races the
    // first `getAttribute('aria-valuenow')` read, and the keydown handler
    // bails because `_focusedGutter()` is still null.
    const settledBefore = Number(await gutter.getAttribute('aria-valuenow'));
    await gutter.press('ArrowRight');
    // `Locator.press()` focuses + dispatches the key in one atomic
    // operation, and the assertion auto-retries until the signal-driven
    // CD pass has updated `aria-valuenow`.
    await expect(gutter).not.toHaveAttribute('aria-valuenow', String(settledBefore));
    const valueNowAfter = Number(await gutter.getAttribute('aria-valuenow'));
    expect(valueNowAfter).toBeGreaterThan(settledBefore);
  });

  test('@keyboard ArrowRight on horizontal gutter grows first pane by step', async ({ page }) => {
    const split = new SplitPage(page);
    await split.goto();

    const gutter = split.gutter(split.horizontalSection, 0);
    await gutter.focus();
    await expect(gutter).toBeFocused();

    const before = Number(await gutter.getAttribute('aria-valuenow'));
    await gutter.press('ArrowRight');
    await expect(gutter).not.toHaveAttribute('aria-valuenow', String(before));
    const after = Number(await gutter.getAttribute('aria-valuenow'));
    // Default keyboardStep is 10 (percent).
    expect(after - before).toBeCloseTo(10, 0);

    await gutter.press('ArrowLeft');
    await expect(gutter).toHaveAttribute('aria-valuenow', String(before));
    const back = Number(await gutter.getAttribute('aria-valuenow'));
    expect(back).toBeCloseTo(before, 0);
  });

  test('@keyboard ArrowDown on vertical gutter grows top pane', async ({ page }) => {
    const split = new SplitPage(page);
    await split.goto();

    const gutter = split.gutter(split.verticalSection, 0);
    await gutter.scrollIntoViewIfNeeded();
    // The split component mirrors its `direction()` into `aria-orientation`
    // (`split.ts:87`) — a vertical split exposes a vertical gutter.
    await expect(gutter).toHaveAttribute('aria-orientation', 'vertical');

    await gutter.focus();
    await expect(gutter).toBeFocused();
    const before = Number(await gutter.getAttribute('aria-valuenow'));
    await gutter.press('ArrowDown');
    await expect(gutter).not.toHaveAttribute('aria-valuenow', String(before));
    const after = Number(await gutter.getAttribute('aria-valuenow'));
    expect(after).toBeGreaterThan(before);
    // Sideways arrows are ignored on a vertical split — value stays put.
    await gutter.press('ArrowRight');
    expect(Number(await gutter.getAttribute('aria-valuenow'))).toBeCloseTo(after, 0);
  });

  test('@keyboard PageUp / PageDown apply the large step', async ({ page }) => {
    const split = new SplitPage(page);
    await split.goto();

    // Use the three-pane section so we have headroom for both directions
    // without bumping into 15% min / 40% max on the same press.
    const gutter = split.gutter(split.threePaneSection, 0);
    await gutter.focus();
    await expect(gutter).toBeFocused();

    const before = Number(await gutter.getAttribute('aria-valuenow'));
    await gutter.press('PageDown');
    await expect(gutter).not.toHaveAttribute('aria-valuenow', String(before));
    const after = Number(await gutter.getAttribute('aria-valuenow'));
    // Default keyboardStepLarge is 50, but the pane caps at 40% maxSize,
    // so the visible jump is at least one keyboardStep (10) and at most
    // the distance to the cap.
    expect(after - before).toBeGreaterThan(10);
  });

  test('@keyboard Home and End move gutter to the min / max extremes', async ({ page }) => {
    const split = new SplitPage(page);
    await split.goto();

    // Use Min/Max constraints (min=20, max=50) so both extremes are bounded.
    const gutter = split.gutter(split.minMaxSection, 0);
    await gutter.scrollIntoViewIfNeeded();
    await gutter.focus();
    // Sanity-check focus actually landed — `.focus()` is JS-API only;
    // some browsers under load skip the `focus` DOM event on first call,
    // which leaves the host's `_focusedGutter` signal null and silently
    // drops the subsequent keydowns.
    await expect(gutter).toBeFocused();

    await page.keyboard.press('End');
    await expect(gutter).toHaveAttribute('aria-valuenow', '50');

    await page.keyboard.press('Home');
    await expect(gutter).toHaveAttribute('aria-valuenow', '20');
  });

  // `test.fail()`, not `test.fixme`: this body fails on a real assertion, so
  // Playwright runs it and turns the suite RED the day it starts passing —
  // the self-expiry a `test.fixme` can never have. See `support/fixme-registry.ts`.
  test.fail('@interaction Escape cancels an in-flight drag and restores sizes', async ({ page }) => {
    test.setTimeout(EXPECTED_FAILURE_TIMEOUT_MS);
    // Investigate: Escape-mid-drag is not rolling sizes back. Either the
    // host keydown handler runs while the drag is captured but `_cancel`
    // never fires before `pointerup` commits, or the rAF apply pass
    // commits before the Escape lands. Verify against split.ts and
    // re-enable. As of S* the unit spec covers the rollback math; this
    // E2E was the only check that the keydown wired through under a real
    // pointer-capture flow.
    const split = new SplitPage(page);
    await split.goto();

    await split.gutter(split.horizontalSection, 0).scrollIntoViewIfNeeded();
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

  test('@interaction programmatic collapse / expand round-trip', async ({ page }) => {
    const split = new SplitPage(page);
    await split.goto();

    const collapseBtn = split.collapseButton('Collapse');
    await collapseBtn.scrollIntoViewIfNeeded();
    const before = (await split.paneRect(split.collapsibleSection, 0))!;

    await collapseBtn.click();
    await expect(split.collapseStatus).toHaveText(/collapsed/);
    const collapsed = (await split.paneRect(split.collapsibleSection, 0))!;
    // demo collapsedSize=6 (percent) → narrower than the 30% default.
    expect(collapsed.width).toBeLessThan(before.width);

    await split.collapseButton('Expand').click();
    await expect(split.collapseStatus).toHaveText(/expanded/);
    const expanded = (await split.paneRect(split.collapsibleSection, 0))!;
    expect(expanded.width).toBeGreaterThan(collapsed.width);
  });

  test('@interaction programmatic setSizes / reset round-trip', async ({ page }) => {
    const split = new SplitPage(page);
    await split.goto();

    const splitBox = (await split.splitIn(split.programmaticSection).boundingBox())!;
    const before = (await split.paneRect(split.programmaticSection, 0))!;

    await split.programmaticButton('20 / 80').scrollIntoViewIfNeeded();
    await split.programmaticButton('20 / 80').click();
    await expect.poll(async () => {
      const r = (await split.paneRect(split.programmaticSection, 0))!;
      return r.width / splitBox.width;
    }).toBeLessThan(0.3);

    await split.programmaticButton('Reset').click();
    await expect.poll(async () => {
      const r = (await split.paneRect(split.programmaticSection, 0))!;
      return Math.abs(r.width - before.width);
    }).toBeLessThan(5);
  });

  test('@keyboard Enter on the gutter toggles a collapsible pane', async ({ page }) => {
    const split = new SplitPage(page);
    await split.goto();

    const gutter = split.gutter(split.collapsibleSection, 0);
    await gutter.scrollIntoViewIfNeeded();
    await gutter.focus();
    await page.keyboard.press('Enter');
    await expect(split.collapseStatus).toHaveText(/collapsed/);

    await page.keyboard.press(' ');
    await expect(split.collapseStatus).toHaveText(/expanded/);
  });

  // `test.fail()`, not `test.fixme`: this body fails on a real assertion, so
  // Playwright runs it and turns the suite RED the day it starts passing —
  // the self-expiry a `test.fixme` can never have. See `support/fixme-registry.ts`.
  test.fail('@interaction drag below snapSize collapses the pane', async ({ page }) => {
    test.setTimeout(EXPECTED_FAILURE_TIMEOUT_MS);
    // Investigate: with the new demo config (`minSize=20 collapsedSize=6
    // snapSize=6`), the pointer-drag below snapSize is not flipping
    // `_collapsed = true`. Probably the rAF apply pass races the test's
    // attribute poll, or the demo's `minSize=20` interferes with the snap
    // threshold. Unit spec covers the snap math; re-enable once the live
    // pointer path is verified.
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
    // The demo pane has `minSize=20 collapsedSize=6 snapSize=6`. The snap
    // path sets `_collapsed = true` once the gutter crosses snapSize, which
    // mirrors to `data-split-pane-collapsed="true"` on the pane host. The
    // pane host attribute is the most stable signal — visible width gets
    // clamped against minSize / collapsedSize asynchronously.
    await expect(pane).toHaveAttribute('data-split-pane-collapsed', 'true');
    await page.mouse.up();

    await expect(split.collapseStatus).toHaveText(/collapsed/);
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
      // Format documented in `split.ts`: versioned envelope with the unit
      // and per-pane size arrays. The persisted demo split has two panes,
      // so seed exactly two sizes.
      window.localStorage.setItem(
        key,
        JSON.stringify({ version: 1, unit: 'percent', sizes: [50, 50] }),
      );
    }, STORAGE_KEY);

    const split = new SplitPage(page);
    await split.goto();

    const gutter = split.gutter(split.persistedSection, 0);
    await gutter.scrollIntoViewIfNeeded();
    await expect(gutter).toHaveAttribute('aria-valuenow', '50');
  });

  // `test.fail()`, not `test.fixme`: this body fails on a real assertion, so
  // Playwright runs it and turns the suite RED the day it starts passing —
  // the self-expiry a `test.fixme` can never have. See `support/fixme-registry.ts`.
  test.fail('@interaction pixel-mode drag updates sizes', async ({ page }) => {
    test.setTimeout(EXPECTED_FAILURE_TIMEOUT_MS);
    // Investigate: drag of +60 pixels produces +49 instead of the expected
    // +60. Pixel-mode is documented as 1:1 with cursor delta; investigate
    // whether the demo's container width is narrowing the visible delta or
    // whether the apply pass is rounding. Unit spec covers the pixel
    // redistribute math.
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

  // Nested-split demo was removed in the S* refactor. Library still supports
  // nesting (covered by the unit spec); without a dedicated example route
  // there's no stable DOM to drive an end-to-end keyboard scenario. Restore
  // once the demo grows a "Nested splits" section again.
  test.fixme(
    '[fixme:split/nested] @interaction nested split — inner gutter resizes inner panes only',
    async () => {},
  );

  test('@interaction body class tw-split-no-select toggles across a drag', async ({ page }) => {
    const split = new SplitPage(page);
    await split.goto();

    const hasClass = async () =>
      page.evaluate(() => document.body.classList.contains('tw-split-no-select'));

    await expect.poll(hasClass).toBe(false);

    const gBox = (await split.gutterRect(split.horizontalSection, 0))!;
    await page.mouse.move(gBox.x + gBox.width / 2, gBox.y + gBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(gBox.x + 30, gBox.y + gBox.height / 2, { steps: 4 });
    await expect.poll(hasClass).toBe(true);

    await page.mouse.up();
    await expect.poll(hasClass).toBe(false);
  });

  // Live-region announcement is a planned a11y enhancement — the current
  // SplitComponent does not render an `aria-live` region or call
  // LiveAnnouncer on collapse/expand. The demo's "Last event:" span tracks
  // the (collapseChange) event but is presentational, not a live region.
  // Restore once `split.ts` emits an announcement (likely via CDK's
  // `LiveAnnouncer`) on collapseChange.
  test.fixme('[fixme:split/live-region] @a11y live region announces collapse / expand', async () => {});

  // NOTE: an "axe sweep is covered centrally" comment used to sit here, left
  // behind by a deleted test. Sitting immediately above the RTL suppression it
  // read as that test's rationale — the misattribution class the audit register
  // records as having cost a pass real time. The RTL reason is in the body.

  // `test.fail()`, not `test.fixme`: this body fails on a real assertion, so
  // Playwright runs it and turns the suite RED the day it starts passing —
  // the self-expiry a `test.fixme` can never have. See `support/fixme-registry.ts`.
  test.fail('@keyboard @rtl horizontal arrow keys invert under dir=rtl', async ({ page }) => {
    test.setTimeout(EXPECTED_FAILURE_TIMEOUT_MS);
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
