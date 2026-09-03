import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/base';
import { formatViolations, partitionViolations, runAxe } from '../../support/a11y';
import type { RuleBacklog } from '../../support/a11y';
import { OUTLET_READY_TIMEOUT_MS } from '../../support/timing';

test.describe.configure({ mode: 'parallel' });

/**
 * Axe sweep of components in their OPEN state.
 *
 * `examples.spec.ts` scans every page at rest — it navigates, waits for the
 * heading, and scans. Nothing it does ever opens an overlay, so the entire
 * overlay surface of this library has never been scanned: no listbox, no
 * dialog, no menu, no date-picker panel, no command palette. That is precisely
 * where accessibility bugs live, because an overlay is where roles, focus
 * management and `aria-activedescendant` all have to agree at once.
 *
 * The interaction is deliberately role-based rather than per-component. There
 * are page objects for most of these, but their shapes differ, and a sweep
 * that depends on thirteen bespoke helpers rots the first time one changes.
 * Clicking the first element that advertises a popup and waiting for a popup
 * role to appear is the contract every one of these components already claims
 * to implement — if that fails, the component has a bug worth knowing about.
 */

/**
 * How a popup gets opened, in priority order.
 *
 * Scoped to `main` on purpose: the demo SHELL has its own `aria-haspopup`
 * controls (the theme and preset pickers in the header), and an unscoped
 * "first trigger on the page" picks one of those on every route — it opens
 * shell chrome, no component overlay appears, and the sweep reports a failure
 * that has nothing to do with the component under test.
 *
 * Three strategies rather than one because the trigger contract genuinely
 * differs: value-pickers expose `role="combobox"`, menu and popover expose
 * `aria-haspopup`, and dialog / sheet / command-palette are opened by an
 * ordinary button. Measured: 9 of the 10 components below open via one of
 * these.
 */
const TRIGGER_STRATEGIES = [
  { label: 'combobox', selector: '[role="combobox"]' },
  { label: 'haspopup', selector: '[aria-haspopup]' },
] as const;

/** Accessible-name pattern for components opened by a plain button. */
const OPEN_BUTTON_NAME = /open|show|launch|pick|select date|trigger/i;

/**
 * Any CDK overlay pane. Deliberately not role-specific — asserting a role here
 * would conflate "the overlay never opened" with "the overlay opened with the
 * wrong role", and the second is a finding this sweep should report as an axe
 * violation rather than swallow as a timeout.
 *
 * Readiness is the pane's first CHILD being visible, not the pane itself. For
 * `sheet` and `command-palette` the pane is a zero-size positioning box and
 * the rendered surface sits inside it, so waiting on the pane's own visibility
 * reports "never opened" for two components that opened correctly.
 */
const POPUP = '.cdk-overlay-pane';
const POPUP_CONTENT = '.cdk-overlay-pane > *';

/**
 * Components whose examples page exposes a popup-bearing trigger.
 *
 * `time-picker` is deliberately absent: its examples page renders the control
 * inline with steppers and none of the three strategies produces an overlay
 * there. Listing it would assert a popup that page does not have.
 */
const OVERLAY_COMPONENTS = [
  'select',
  'combobox',
  'menu',
  'date-picker',
  'date-range-picker',
  'popover',
  'dialog',
  'sheet',
  'command-palette',
] as const;

/**
 * Same contract as `examples.spec.ts`: rules a page may still fail, keyed
 * `component:open`. An entry that stops firing is reported as stale and must
 * be deleted, so this cannot decay into blanket permission.
 *
 * Seeded from a measured run. Empty entries are not placeholders — a component
 * absent from this map must scan clean in its open state.
 */
const OPEN_STATE_BACKLOG: RuleBacklog = new Map<string, ReadonlySet<string>>([
  // `region` — overlay content is portalled to the document body, outside any
  // landmark. Inherent to the CDK overlay, and a best-practice rule rather
  // than a WCAG failure, but recorded rather than silently excluded so the
  // decision is visible. Fixing it means giving the overlay container a
  // landmark role.
  ['menu:open', new Set(['region'])],
  ['combobox:open', new Set(['region'])],

  // `select` previously also fired `aria-prohibited-attr` and `button-name`
  // here — both fixed this pass (the clear control gained a name, and the
  // demo's dead `[attr.aria-label]` binding was corrected). Only the portal
  // landmark rule remains.
  ['select:open', new Set(['region'])],

  // `dialog` scroll container is not keyboard reachable — a mouse user can
  // scroll the dialog body, a keyboard user cannot.
  ['dialog:open', new Set(['scrollable-region-focusable'])],

  // `popover` renders role="dialog" with no accessible name.
  ['popover:open', new Set(['aria-dialog-name'])],
]);

/**
 * axe samples computed colour at the instant it runs, and every overlay here
 * animates in. Scanning mid-transition reports contrast failures that do not
 * exist at rest — the sibling sweep found 43 such phantoms before it settled.
 */
const SETTLE_MS = 900;

async function openFirstPopup(page: Page): Promise<boolean> {
  const main = page.locator('main');
  const candidates = [
    ...TRIGGER_STRATEGIES.map(s => main.locator(s.selector)),
    main.getByRole('button', { name: OPEN_BUTTON_NAME }),
  ];

  for (const locator of candidates) {
    if ((await locator.count()) === 0) {
      continue;
    }
    // Dismiss anything a previous strategy left open. Without this, a
    // transparent CDK backdrop from a failed attempt intercepts the next
    // click, and the component reads as "has no trigger" when it simply had
    // one tried before it.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);

    const trigger = locator.first();
    try {
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click({ timeout: 4_000 });
    } catch {
      continue;
    }
    try {
      await page.locator(POPUP).first().waitFor({ state: 'attached', timeout: 4_000 });
      await page.locator(POPUP_CONTENT).first().waitFor({ state: 'visible', timeout: 4_000 });
      return true;
    } catch {
      continue;
    }
  }
  return false;
}

for (const component of OVERLAY_COMPONENTS) {
  const url = `/components/${component}/examples`;

  test(`@a11y @openstate ${url} — open state scans clean`, async ({ page }) => {
    await page.goto(url);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: OUTLET_READY_TIMEOUT_MS });

    const opened = await openFirstPopup(page);
    // Not a soft skip: every component in this list documents a popup
    // trigger, so failing to open one is itself the finding.
    expect(
      opened,
      `no popup opened on ${url} — none of the three trigger strategies ` +
        `produced a .cdk-overlay-pane`,
    ).toBe(true);

    await page.waitForTimeout(SETTLE_MS);

    const results = await runAxe(page);
    const { unexpected, staleAllowances } = partitionViolations(
      results.violations,
      OPEN_STATE_BACKLOG.get(`${component}:open`),
    );
    expect(unexpected, formatViolations(unexpected)).toEqual([]);
    expect(
      staleAllowances,
      `rules listed in OPEN_STATE_BACKLOG for "${component}" no longer fire — delete them`,
    ).toEqual([]);
  });
}
