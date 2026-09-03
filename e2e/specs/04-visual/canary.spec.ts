import { expect, test } from '../../fixtures/base';
import type { BrowserContext, Locator, Page } from '@playwright/test';
import { OUTLET_READY_TIMEOUT_MS } from '../../support/timing';
import {
  FULL_SCENE_SCHEMES,
  SWATCH_ONLY_SCHEMES,
  type TwResolvedTheme,
} from '../../support/themes';

test.describe.configure({ mode: 'parallel' });

/**
 * Visual canary — chapter 07.
 *
 * One snapshot per canonical scene per scheme. Scope kept deliberately
 * small (8 pages × 2 schemes × ≤2 scenes ≈ 32 PNGs) to keep maintenance
 * cost bounded — see chapter 07 for what NOT to snapshot.
 *
 * **Scheme coverage is tiered, and both tiers derive from the library's
 * `TW_RESOLVED_THEMES`** (see `support/themes.ts`):
 *
 *   - `FULL_SCENE_SCHEMES` (`light`, `dark`) get every canonical scene.
 *   - every other resolved scheme gets the Semantic Tokens swatch grid only.
 *
 * Rationale for not sweeping all four everywhere: `high-contrast` shipped long
 * before this and never had a canary baseline, because the canary guards
 * component *shape*, not scheme colour — `theme-matrix.spec.ts` is the
 * scheme-coverage mechanism and now sweeps all four with an axe
 * `color-contrast` assertion per page. Full sweeps would take the canary from
 * 20 baselines to 40 to re-cover ground already covered functionally, while a
 * scheme's actual subject — the token ramp — is exactly what the swatch grid
 * renders. A fifth scheme enrols in the swatch tier automatically and
 * announces itself as a missing-baseline failure.
 *
 * Stability strategy (chapter 07 §"Masking and stability"):
 *   - Reduced motion is on globally (`playwright.config.ts`), and the
 *     theme zeros animation/transition durations under that media query.
 *     We add a belt-and-braces `addStyleTag` per chapter 07 anyway.
 *   - Mask scrollbars (browser-specific rendering).
 *   - Mask the CDK overlay container's generated `id`s (per-run unique).
 *   - Clip to the section under test, never the full viewport — the
 *     sidebar contains `.sh-bloom` which rasterises differently in CI.
 *   - `maxDiffPixelRatio: 0.01` absorbs subpixel rendering noise.
 *
 * **Chromium only.** Per chapter 07 we do not maintain visual baselines
 * for firefox / webkit — text rendering differs and the cost of keeping
 * those baselines in sync outweighs the signal.
 */
test.beforeEach(async ({ context, browserName }, testInfo) => {
  // Chromium only — chapter 07 §"Per-project baselines". Skip on
  // firefox / webkit / mobile-chrome to keep baselines bounded. We
  // also pin to the `chromium-light` project (one project owns the
  // baselines; dark scheme is driven by `localStorage`, not by the
  // project's `colorScheme`) to avoid 2× baseline duplication.
  test.skip(browserName !== 'chromium', 'Visual baselines are chromium-only — see chapter 07.');
  test.skip(
    testInfo.project.name !== 'chromium-light',
    'Visual canary owned by the chromium-light project — chapter 07.',
  );
  await installStabilityHooks(context);
});

/** Standard maxDiffPixelRatio for canary snapshots — absorbs subpixel noise. */
const DIFF = 0.01;


/** Wait for the route's outlet to mount (H1 + theme attribute reflect). */
async function waitForRoute(page: Page, scheme: TwResolvedTheme): Promise<void> {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
    timeout: OUTLET_READY_TIMEOUT_MS,
  });
  await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
}

/**
 * Inject the belt-and-braces zero-duration CSS at page-init time
 * (backstop on top of the theme's `prefers-reduced-motion` rules) and
 * hide scrollbars (chromium-mac vs chromium-linux paint widths differ
 * — chapter 07 §"Masking"). Registered on the context BEFORE goto so
 * the stylesheet is present from first paint.
 */
async function installStabilityHooks(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        const style = document.createElement('style');
        style.textContent = `
          *, *::before, *::after {
            animation-duration: 0ms !important;
            animation-delay: 0ms !important;
            transition-duration: 0ms !important;
            transition-delay: 0ms !important;
          }
          ::-webkit-scrollbar { width: 0 !important; height: 0 !important; }
          * { scrollbar-width: none !important; }
        `;
        document.head.appendChild(style);
      },
      { once: true },
    );
  });
}

/**
 * Rewrite per-open CDK overlay `id`s to a stable placeholder. Run this
 * once the snapshot target is in the DOM (right before the screenshot
 * step) so the diff doesn't pick up the per-run counter. We deliberately
 * do NOT run a `MutationObserver` here — observing every body mutation
 * during page bootstrap measurably slows down lazy-chunk hydration and
 * pushes the route load past the 20s outlet-ready timeout. The snapshot
 * is taken at a stable moment; one synchronous pass is enough.
 */
async function stabiliseOverlayIds(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (const el of Array.from(document.querySelectorAll('[id^="cdk-overlay-"]'))) {
      el.setAttribute('id', 'cdk-overlay-stable');
    }
    for (const el of Array.from(
      document.querySelectorAll('[aria-describedby^="cdk-describedby-message-"]'),
    )) {
      el.setAttribute('aria-describedby', 'cdk-describedby-message-stable');
    }
  });
}

/**
 * Apply a colour scheme by seeding `ngx-tw-theme` localStorage and the
 * page's `Emulation.setEmulatedMedia` colorScheme. The fixture-level
 * `freshTheme` writes `'light'` only when nothing is set — so we set
 * the desired scheme here unconditionally via `addInitScript` BEFORE
 * the freshTheme guard ever sees the key as empty.
 */
async function applyScheme(
  context: BrowserContext,
  scheme: TwResolvedTheme,
): Promise<void> {
  await context.addInitScript((s) => {
    window.localStorage.setItem('ngx-tw-theme', s);
  }, scheme);
}

/** Anchor a `<section>` by its `<h2>` heading text. Matches the POM convention. */
function section(page: Page, heading: string): Locator {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return page.locator('main section').filter({
    has: page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
  });
}

/**
 * Prepare an in-page region for capture. Call this immediately before every
 * `toHaveScreenshot` on a *page element* (not on an overlay pane / the CDK
 * overlay container, which are viewport-anchored and unaffected).
 *
 * It fixes two capture defects that both silently *delete* content from a
 * baseline rather than failing — the worst possible failure mode for a
 * regression guard, because the PNG stays stable and keeps passing while
 * guarding less and less.
 *
 * **1. The off-viewport slice of a tall element is never painted.** Playwright
 * scrolls the target into view and captures its box, but the part of the box
 * that does not intersect the viewport at that moment comes back blank white.
 * Audit pass 5 measured this on `theme-swatches` (a 1284px section against the
 * 720px `Desktop Chrome` viewport): a ~270px band at the top, where the
 * `Semantic Tokens` heading and the SURFACE and FOREGROUND token rows live,
 * plus a ~290px band at the bottom — exactly one viewport-height of real
 * content in the middle, blank on both sides. Pass 5 hypothesised an unsettled
 * enter animation; that is **falsified** — the painted band is viewport-height
 * exact, and growing the viewport (below) restores every row with no extra
 * wait. Four other baselines had silently lost content the same way:
 * `alert-colors`, `button-colors`, `card-variants`, `tabs-variants`.
 *
 * **2. The shell's `sticky top-0 z-30` header (`shell.ts:510`) paints into the
 * frame.** An element screenshot captures the page *region*, so once a section
 * is scrolled under the sticky chrome the header — `backdrop-blur-md` and all —
 * lands inside the box and covers the section's own heading.
 *
 * Hiding the header removes it from normal flow, which shifts the page's scroll
 * geometry but not the captured section's own layout; growing the viewport does
 * not change the 1280px layout width, and `installStabilityHooks` has already
 * zeroed scrollbar width, so neither step can reflow the subject.
 */
async function prepareRegionCapture(page: Page, target: Locator): Promise<void> {
  await page.addStyleTag({ content: 'header.sticky { display: none !important; }' });
  const box = await target.boundingBox();
  const viewport = page.viewportSize();
  if (!box || !viewport) return;
  // +32px of slack so a sub-pixel box height can never leave a 1px unpainted
  // strip at the bottom edge.
  const needed = Math.ceil(box.height) + 32;
  if (needed > viewport.height) {
    await page.setViewportSize({ width: viewport.width, height: needed });
  }
}

/**
 * Declares the Semantic Tokens swatch-grid test for one scheme.
 *
 * This is the one scene whose entire subject is the scheme's token ramp, and
 * therefore the scene every resolved scheme is worth a baseline for. Declared
 * from a shared function so the two coverage tiers below cannot drift apart in
 * capture technique — and declared as a whole `test()` rather than a helper the
 * tests call, so `expect` stays lexically inside the test body (a helper trips
 * `playwright/expect-expect`, which would then be reporting a real smell about
 * a fake one).
 */
function declareSwatchGridTest(scheme: TwResolvedTheme): void {
  test(`@visual theme — Semantic Tokens swatch grid`, async ({ page }) => {
    await page.goto('/services/theme/examples');
    await waitForRoute(page, scheme);
    const swatches = section(page, 'Semantic Tokens');
    await expect(swatches).toBeVisible();
    // This is the capture that exposed both defects `prepareRegionCapture`
    // fixes: at 1284px it is the tallest region in the canary, and the theme
    // page's tabbed shell pushes it under the sticky header.
    await prepareRegionCapture(page, swatches);
    await expect(swatches).toHaveScreenshot(`theme-swatches.${scheme}.png`, {
      maxDiffPixelRatio: DIFF,
    });
  });
}

for (const scheme of FULL_SCENE_SCHEMES) {
  test.describe(`@visual ${scheme} scheme`, () => {
    test.beforeEach(async ({ context }) => {
      await applyScheme(context, scheme);
    });

    test(`@visual button — Variants section`, async ({ page }) => {
      await page.goto('/components/button/examples');
      await waitForRoute(page, scheme);
      const variants = section(page, 'Variants');
      await expect(variants).toBeVisible();
      await prepareRegionCapture(page, variants);
      await expect(variants).toHaveScreenshot(`button-variants.${scheme}.png`, {
        maxDiffPixelRatio: DIFF,
      });
    });

    test(`@visual button — Colors × Variants matrix`, async ({ page }) => {
      await page.goto('/components/button/examples');
      await waitForRoute(page, scheme);
      const colors = section(page, 'Colors');
      await expect(colors).toBeVisible();
      await prepareRegionCapture(page, colors);
      await expect(colors).toHaveScreenshot(`button-colors.${scheme}.png`, {
        maxDiffPixelRatio: DIFF,
      });
    });

    test(`@visual alert — all four colors`, async ({ page }) => {
      await page.goto('/components/alert/examples');
      await waitForRoute(page, scheme);
      const colors = section(page, 'Colors');
      await expect(colors).toBeVisible();
      await prepareRegionCapture(page, colors);
      await expect(colors).toHaveScreenshot(`alert-colors.${scheme}.png`, {
        maxDiffPixelRatio: DIFF,
      });
    });

    test(`@visual card — all three variants`, async ({ page }) => {
      await page.goto('/components/card/examples');
      await waitForRoute(page, scheme);
      const variants = section(page, 'Variants');
      await expect(variants).toBeVisible();
      await prepareRegionCapture(page, variants);
      await expect(variants).toHaveScreenshot(`card-variants.${scheme}.png`, {
        maxDiffPixelRatio: DIFF,
      });
    });

    test(`@visual tabs — Pill / Enclosed / Underlined`, async ({ page }) => {
      await page.goto('/components/tabs/examples');
      await waitForRoute(page, scheme);
      const variants = section(page, 'Variants');
      await expect(variants).toBeVisible();
      await prepareRegionCapture(page, variants);
      await expect(variants).toHaveScreenshot(`tabs-variants.${scheme}.png`, {
        maxDiffPixelRatio: DIFF,
      });
    });

    test(`@visual select — closed trigger`, async ({ page }) => {
      await page.goto('/components/select/examples');
      await waitForRoute(page, scheme);
      const colors = section(page, 'Colors');
      await expect(colors).toBeVisible();
      await prepareRegionCapture(page, colors);
      await expect(colors).toHaveScreenshot(`select-closed.${scheme}.png`, {
        maxDiffPixelRatio: DIFF,
      });
    });

    test(`@visual select — open overlay`, async ({ page }) => {
      await page.goto('/components/select/examples');
      await waitForRoute(page, scheme);
      const trigger = page.locator('main').getByRole('combobox').first();
      await trigger.click();
      const listbox = page.locator('.cdk-overlay-container [role="listbox"]');
      await expect(listbox).toBeVisible();
      const overlayPane = page.locator('.cdk-overlay-pane').first();
      await expect(overlayPane).toBeVisible();
      await stabiliseOverlayIds(page);
      await expect(overlayPane).toHaveScreenshot(`select-open.${scheme}.png`, {
        maxDiffPixelRatio: DIFF,
      });
    });

    test(`@visual date-picker — open calendar`, async ({ page }) => {
      // We pick a deterministic date via the constraints picker (already
      // has `min`/`max` set so today-highlighting is stable across
      // wall-clock drift); avoids the `frozenClock` fixture which had
      // race-conditioned with the lazy-chunk hydration of this large
      // route.
      await page.goto('/components/date-picker/examples');
      await waitForRoute(page, scheme);
      const trigger = page.locator('main').getByRole('button', { name: 'Open calendar' }).first();
      await trigger.click();
      const overlay = page.locator('.cdk-overlay-pane').first();
      await expect(overlay).toBeVisible();
      // `role="grid"` is the first signal that the calendar laid out.
      await expect(overlay.getByRole('grid').first()).toBeVisible();
      await stabiliseOverlayIds(page);
      await expect(overlay).toHaveScreenshot(`date-picker-open.${scheme}.png`, {
        maxDiffPixelRatio: DIFF,
        // Today-highlight + selection arrow change per run since we
        // don't freeze the clock here; mask the entire calendar grid
        // content area and rely on the surrounding chrome (header,
        // weekday row, footer) for diff signal.
        mask: [page.locator('.cdk-overlay-pane [role="grid"]')],
      });
    });

    test(`@visual dialog — open with backdrop`, async ({ page }) => {
      await page.goto('/components/dialog/examples');
      await waitForRoute(page, scheme);
      // Sizes section's "md" trigger is the canonical "default" dialog.
      const sizes = section(page, 'Sizes');
      await sizes.getByRole('button', { name: 'md', exact: true }).click();
      const dialog = page.locator('.cdk-overlay-container tw-dialog-container').first();
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute('data-state', 'open');
      await stabiliseOverlayIds(page);
      // Snapshot the entire overlay container so the backdrop is included.
      const overlayContainer = page.locator('.cdk-overlay-container');
      await expect(overlayContainer).toHaveScreenshot(`dialog-open.${scheme}.png`, {
        maxDiffPixelRatio: DIFF,
      });
    });

    declareSwatchGridTest(scheme);
  });
}

/**
 * Swatch-only tier — every resolved scheme outside `FULL_SCENE_SCHEMES`.
 *
 * Today that is `high-contrast` and `high-contrast-dark`. This loop is what
 * stops a new scheme from shipping with zero visual coverage: it is derived by
 * subtraction from `TW_RESOLVED_THEMES`, so a fifth scheme lands here with no
 * edit and fails on its first `@visual` run for want of a baseline.
 */
for (const scheme of SWATCH_ONLY_SCHEMES) {
  test.describe(`@visual ${scheme} scheme`, () => {
    test.beforeEach(async ({ context }) => {
      await applyScheme(context, scheme);
    });

    declareSwatchGridTest(scheme);
  });
}
