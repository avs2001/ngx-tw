import { expect, test } from '../../fixtures/base';
import { COMPONENTS } from '../../support/routes';
import { formatViolations, partitionViolations, runAxe } from '../../support/a11y';
import type { RuleBacklog } from '../../support/a11y';
import { OUTLET_READY_TIMEOUT_MS } from '../../support/timing';

test.describe.configure({ mode: 'parallel' });


/**
 * Settle time before scanning.
 *
 * axe samples computed colour at the instant it runs. Several demo surfaces
 * fade or slide in, so scanning immediately after the heading appears reads
 * mid-transition colours and reports `color-contrast` failures that do not
 * exist once the page is at rest. This was not a small effect: without the
 * wait the sweep reported `color-contrast` on 49 of 52 components; with it,
 * on 6. Every one of those 43 was an artefact of the demo shell's own
 * fade-in, not a token defect.
 */
const SETTLE_MS = 1200;

/**
 * Rules each page is still allowed to fail, BY RULE ID.
 *
 * This replaced a set of component-wide skips. Excluding a whole component
 * hid every rule it did *not* violate as well as the one it did — so a
 * backlogged component could regress on anything at all and the sweep stayed
 * green, and the `wcag22aa` target-size rules were invisible for twelve
 * components at once.
 *
 * Seeded from a measured sweep, not from the old list: each entry below was
 * observed failing on that page in light or dark. Fixing a component means
 * deleting its rule ids one at a time; every rule NOT listed is enforced on
 * that page today. An entry that stops firing is reported as a stale
 * allowance and must be deleted, so this list cannot rot into permission.
 */
const A11Y_BACKLOG: RuleBacklog = new Map<string, ReadonlySet<string>>([
  // `carousel` carried the only `target-size` entries — the rule this suite
  // could not see until `wcag22aa` was added to AXE_TAGS. All 17 nodes were
  // indicator buttons measuring 12x12 (18x18 for the scaled active one). The
  // painted mark is now a child of the button and the button itself is floored
  // at 24x24, so the entries are deleted rather than allowed.

  // form-field / input / textarea / time-picker each carried a
  // `color-contrast` entry here. Both causes are now fixed at the source:
  //
  //  * form-field / input / textarea — the disabled wash (`opacity-50`) sat on
  //    the form-field HOST, so it composited the subscript row too and dropped
  //    `text-fg-muted` hints from 7.56:1 to 2.34:1 light / 3.92:1 dark. The
  //    wash moved to the control row (`form-field.ts`), which is the only fix
  //    available: no foreground token survives 50% alpha (black at 50% over
  //    white is 3.95:1). axe already exempts the disabled control and its
  //    `<label for>`, so the hint was the single flagged node on each page.
  //  * time-picker — the selected AM/PM button used `bg-primary-500` +
  //    `text-on-primary` (3.76:1 light / 3.92:1 dark) instead of the theme's
  //    AA-checked `{role}-solid` / `-solid-fg` pair.

  // Nested interactive: a native <button> inside a host carrying an
  // interactive role. Needs the inner control hoisted out of the host.
  // (`tabs` cleared this: the close affordance is now a pointer-only span
  // with Delete as its keyboard path — see `tabs.html`.)
  //
  // `sort` and `table` carried `aria-allowed-attr` (+ `nested-interactive` on
  // sort, `empty-table-header` on table). All three are fixed at the source:
  //
  //  * `aria-sort` is valid only on a `columnheader` / `rowheader`, and
  //    `SortHeaderComponent` emitted it on every host — including the
  //    `<span tw-sort-header>` inside `tw-table`'s generated `<th>`, which
  //    already owned the attribute via `tw-column`'s `sortState`. The host
  //    binding is now gated on the host actually being a header cell
  //    (`sort-header.ts`).
  //  * the same component always rendered an inner `role="button"`
  //    `tabindex="0"` container, so `<button tw-sort-header>` nested one widget
  //    inside another. The container is inert when the host is already a
  //    control, and the focus ring moves onto the host.
  //  * the two unlabelled `<th>`s were the demo's `actions` / `toggle` columns
  //    (`headerLabel=""`); each now projects an `sr-only` header template. The
  //    library's own selection column had the same latent hole when the master
  //    checkbox is suppressed for non-array data — it renders a visually hidden
  //    `labels.selectionColumnLabel` there now.

  // `stepper` carried `aria-required-children` in both schemes and
  // `color-contrast` in dark only. Both are fixed at the source:
  //
  //  * the vertical stepper rendered its panel INSIDE the header strip, and a
  //    tablist may own nothing but tabs. Vertical now renders the disclosure
  //    shape instead — no tablist, headers as buttons with `aria-expanded`,
  //    panel as a named group (`stepper.html`).
  //  * the dark-only contrast failure was a demo-side class, not a token:
  //    `text-primary-700 dark:text-primary-300` on a custom step label. The
  //    theme layer already inverts the ramp, so the `dark:` override
  //    re-inverted it to blue-700 on gray-900 (2.59:1). It now uses
  //    `text-primary-fg`.

  // The `States` section renders a deliberately disabled paginator. `disabled`
  // puts `opacity-50 pointer-events-none` on the host — the treatment CLAUDE.md
  // prescribes — which drags the page-info line to 2.34:1 (light) / 3.92:1
  // (dark). WCAG 1.4.3 exempts text that is part of an INACTIVE user interface
  // component from the contrast requirement; axe cannot model that exception,
  // so it reports the node regardless. One node, one example, and no other
  // contrast failure on this page. Do NOT clear it by lightening the disabled
  // treatment: making a disabled paginator look like an enabled one is a worse
  // accessibility outcome than the warning.
  ['paginator:light', new Set(['color-contrast'])],
  ['paginator:dark', new Set(['color-contrast'])],
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
  const url = `/components/${component}/examples`;

  test(`@a11y ${url} — light scheme`, async ({ page }) => {
    const SCHEME = 'light';
    await page.goto(url);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: OUTLET_READY_TIMEOUT_MS,
    });
    // The base fixture seeds `'light'` on first paint; assert before the
    // scan so a regression in the fixture order doesn't silently mask a
    // dark-mode page being audited as if it were light.
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.waitForTimeout(SETTLE_MS);

    const results = await runAxe(page);
    const { unexpected, staleAllowances } = partitionViolations(
      results.violations,
      A11Y_BACKLOG.get(`${component}:${SCHEME}`),
    );
    expect(unexpected, formatViolations(unexpected)).toEqual([]);
    expect(
      staleAllowances,
      `these rules are listed in A11Y_BACKLOG for "${component}" but no longer fire — delete them`,
    ).toEqual([]);
  });

  test(`@a11y ${url} — dark scheme`, async ({ page }) => {
    const SCHEME = 'dark';
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

    await page.waitForTimeout(SETTLE_MS);

    const results = await runAxe(page);
    const { unexpected, staleAllowances } = partitionViolations(
      results.violations,
      A11Y_BACKLOG.get(`${component}:${SCHEME}`),
    );
    expect(unexpected, formatViolations(unexpected)).toEqual([]);
    expect(
      staleAllowances,
      `these rules are listed in A11Y_BACKLOG for "${component}" but no longer fire — delete them`,
    ).toEqual([]);
  });
}
