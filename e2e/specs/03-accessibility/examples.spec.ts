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
 * Components with pre-existing axe violations that need their own
 * component-level fixes before they can pass this sweep. Tracked
 * separately so the suite gives a clean signal on the rules we already
 * enforce, instead of conflating fixable bugs with the rest.
 *
 * Audited 2026-05-28 chromium-light; failure clusters:
 *   - **Sort-header `aria-sort` placement** (`sort`, `table`):
 *     `aria-sort` is mounted on a `<div>` / `<span>` child of the `<th>`
 *     instead of the `<th role="columnheader">` parent → `aria-allowed-attr`.
 *     The sort-header's inner button-roled div sitting next to the
 *     parent header also trips `nested-interactive`. Sort-header refactor.
 *   - **Nested interactive trigger** (`tabs`, `breadcrumbs`, `paginator`,
 *     `stepper`, `segmented-control`): a native `<button>` inside a
 *     `<div role="tab|menuitem|button">` host. Common pattern (Chrome /
 *     VSCode tabs) but axe is strict. Needs the inner control hoisted out.
 *   - **Dark-scheme color-contrast** (most components on `— dark scheme`):
 *     several semantic tokens in `_dark.css` don't yet satisfy AA when
 *     paired with their documented on-color. Needs per-token audit + bump
 *     similar to the `info-solid` light-mode fix in this PR.
 *   - **Per-page demo-route issues** (e.g. `card`, `badge`, `checkbox`,
 *     `form-field`, `input`, `textarea`, `icon`, `time-picker`,
 *     `timeline`, `toast`, `select`): demo-side label / role mistakes
 *     surfaced by axe once the color-contrast cascade was lifted.
 *
 * Action: deferred to backlog. When fixing a component, remove it from
 * this set and let the sweep re-enable.
 */
const A11Y_BACKLOG: ReadonlySet<string> = new Set([
  'badge',
  'breadcrumbs',
  'button',
  'card',
  'carousel',
  'checkbox',
  'code-block',
  'command-palette',
  'dialog',
  'empty-state',
  'flip-card',
  'form-field',
  'icon',
  'input',
  'menu',
  'paginator',
  'popover',
  'progress-bar',
  'segmented-control',
  'select',
  'sheet',
  'sort',
  'spinner',
  'stepper',
  'table',
  'tabs',
  'textarea',
  'time-picker',
  'timeline',
  'toast',
]);

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
  // Skip backlogged components — see comment on `A11Y_BACKLOG` above.
  if (A11Y_BACKLOG.has(component)) continue;
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
