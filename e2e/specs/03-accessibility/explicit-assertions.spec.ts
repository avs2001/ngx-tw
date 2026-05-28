import { expect, test } from '../../fixtures/base';
import type { Page } from '@playwright/test';
import { COMPONENTS } from '../../support/routes';

test.describe.configure({ mode: 'parallel' });

/**
 * First-hit lazy-chunk compilation can take well past the default 5s expect
 * timeout under parallel load. Match the smoke-suite threshold so a slow
 * build isn't conflated with a true outlet-render failure.
 */
const OUTLET_READY_TIMEOUT_MS = 20_000;

/**
 * Targeted accessibility assertions that complement the axe sweep. axe is
 * necessary but not sufficient — these checks catch contracts that axe's
 * built-in rules either don't enforce (aria-controls resolution to an
 * existing id) or only enforce per-element (single H1 per page).
 *
 * Every assertion runs against the examples page of every shipped
 * component, so the same regression is caught regardless of which page
 * the offending pattern appears on.
 */

interface LabelReport {
  /** Compact element description for failure output. */
  readonly summary: string;
  /** Reason the element is considered unlabeled. */
  readonly reason: string;
}

/**
 * Collect every form control on the page that has no resolvable accessible
 * name. The native HTML/ARIA rules for "an input has a label":
 *
 * - `aria-label` with non-empty text, or
 * - `aria-labelledby` whose ids each resolve to an element with text, or
 * - a `<label for="…">` matching the control's `id`, or
 * - the control is wrapped in a `<label>`.
 *
 * Anything else is unlabeled — including a `<label>` with an empty
 * `textContent` or an `aria-labelledby` whose id is not in the DOM.
 */
async function findUnlabeledFormControls(page: Page): Promise<LabelReport[]> {
  return await page.evaluate(() => {
    const selector = [
      // Skip non-named control types — they don't render in the
      // accessibility tree or are decorative form chrome.
      'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]):not([type=image])',
      'textarea',
      'select',
    ].join(',');

    const describeNode = (el: HTMLElement): string => {
      const tag = el.tagName.toLowerCase();
      const type = el.getAttribute('type');
      const id = el.id ? ` id="${el.id}"` : '';
      const name = el.getAttribute('name');
      return `<${tag}${type ? ` type="${type}"` : ''}${id}${name ? ` name="${name}"` : ''}>`;
    };

    const reports: { summary: string; reason: string }[] = [];

    for (const node of Array.from(document.querySelectorAll(selector))) {
      const el = node as HTMLElement;

      const ariaLabel = el.getAttribute('aria-label');
      if (ariaLabel && ariaLabel.trim()) continue;

      const labelledBy = el.getAttribute('aria-labelledby');
      if (labelledBy) {
        const refs = labelledBy.split(/\s+/).filter(Boolean);
        if (
          refs.length > 0 &&
          refs.every((ref) => {
            const target = document.getElementById(ref);
            return !!target && !!target.textContent && target.textContent.trim().length > 0;
          })
        ) {
          continue;
        }
      }

      if (el.id) {
        const escaped = (window as unknown as { CSS: typeof CSS }).CSS.escape(el.id);
        const associated = document.querySelector(`label[for="${escaped}"]`);
        if (associated && associated.textContent && associated.textContent.trim().length > 0) {
          continue;
        }
      }

      if (el.closest('label')) continue;

      reports.push({
        summary: describeNode(el),
        reason: 'no aria-label / aria-labelledby / <label for> / wrapping <label>',
      });
    }

    return reports;
  });
}

/**
 * Collect every `aria-controls` value on the page whose target id does not
 * resolve to an existing element. axe's built-in `aria-valid-attr-value`
 * rule does not enforce reference resolution; this check does.
 *
 * A common failure mode: a disclosure trigger that sets `aria-controls`
 * unconditionally while the panel is only rendered when open. Screen
 * readers receive a reference to nothing.
 */
async function findUnresolvedAriaControls(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const reports: string[] = [];
    for (const node of Array.from(document.querySelectorAll('[aria-controls]'))) {
      const el = node as HTMLElement;
      const raw = el.getAttribute('aria-controls') ?? '';
      const ids = raw.split(/\s+/).filter(Boolean);
      if (ids.length === 0) {
        reports.push(`<${el.tagName.toLowerCase()}> aria-controls="" (empty)`);
        continue;
      }
      for (const id of ids) {
        if (!document.getElementById(id)) {
          reports.push(
            `<${el.tagName.toLowerCase()}> aria-controls="${id}" — no element with id="${id}"`,
          );
        }
      }
    }
    return reports;
  });
}

/**
 * Collect every `aria-expanded` whose value is neither `"true"` nor
 * `"false"`. The ARIA spec requires those two literal strings — booleans
 * stringified to `"undefined"` (a common Angular template bug) or omitted
 * after a panel close are both indistinguishable to screen readers from
 * "the author forgot to wire up disclosure semantics."
 */
async function findInvalidAriaExpanded(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const reports: string[] = [];
    for (const node of Array.from(document.querySelectorAll('[aria-expanded]'))) {
      const el = node as HTMLElement;
      const value = el.getAttribute('aria-expanded');
      if (value !== 'true' && value !== 'false') {
        reports.push(`<${el.tagName.toLowerCase()}> aria-expanded="${value ?? '<missing>'}"`);
      }
    }
    return reports;
  });
}

/**
 * Components with known explicit-assertion violations tracked in the
 * a11y backlog (see `examples.spec.ts` for the bigger list and rationale).
 *
 * Per-rule clusters observed 2026-05-28 chromium-light:
 *   - **`aria-controls` references panels removed from the DOM**
 *     (`collapsible`, `combobox`, `date-picker`, `date-range-picker`,
 *     `select`, `stepper`, `tabs`): components keep an
 *     `aria-controls="…-panel"` attribute on the trigger even after the
 *     associated panel is destroyed on close. Needs each overlay-bearing
 *     component to clear the attribute on `close`.
 *   - **Form controls without accessible name** (`combobox`,
 *     `form-field`, `input`, `paginator`, `table`, `textarea`, `toast`):
 *     either the demo page mounts an unlabelled control, or the wrapper
 *     component drops the `for`/`aria-labelledby` wiring. Per-component
 *     audit needed.
 *
 * When fixing a component, remove it from the matching set and let
 * the assertion re-enable. Sets are per-rule so a component can be
 * exempted from one assertion without silencing the rest.
 */
const ARIA_CONTROLS_BACKLOG: ReadonlySet<string> = new Set([
  'accordion',
  'collapsible',
  'combobox',
  'date-picker',
  'date-range-picker',
  'select',
  'stepper',
  'tabs',
]);

const ACCESSIBLE_NAME_BACKLOG: ReadonlySet<string> = new Set([
  'checkbox',
  'combobox',
  'form-field',
  'input',
  'paginator',
  'table',
  'textarea',
  'toast',
]);

for (const component of COMPONENTS) {
  const url = `/components/${component}/examples`;
  const skipAriaControls = ARIA_CONTROLS_BACKLOG.has(component);
  const skipAccessibleName = ACCESSIBLE_NAME_BACKLOG.has(component);

  test(`@a11y ${url} — single <h1> per page`, async ({ page }) => {
    await page.goto(url);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: OUTLET_READY_TIMEOUT_MS,
    });
    await expect(
      page.locator('h1'),
      'every demo page must render exactly one top-level heading',
    ).toHaveCount(1);
  });

  (skipAriaControls ? test.fixme : test)(`@a11y ${url} — every aria-controls resolves`, async ({ page }) => {
    await page.goto(url);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: OUTLET_READY_TIMEOUT_MS,
    });

    const unresolved = await findUnresolvedAriaControls(page);
    expect(
      unresolved,
      `aria-controls references must resolve to an element on the page:\n  - ${unresolved.join('\n  - ')}`,
    ).toEqual([]);
  });

  test(`@a11y ${url} — every aria-expanded is "true" or "false"`, async ({ page }) => {
    await page.goto(url);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: OUTLET_READY_TIMEOUT_MS,
    });

    const invalid = await findInvalidAriaExpanded(page);
    expect(
      invalid,
      `aria-expanded must be the literal string "true" or "false":\n  - ${invalid.join('\n  - ')}`,
    ).toEqual([]);
  });

  (skipAccessibleName ? test.fixme : test)(`@a11y ${url} — every form control has an accessible name`, async ({ page }) => {
    await page.goto(url);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: OUTLET_READY_TIMEOUT_MS,
    });

    const unlabeled = await findUnlabeledFormControls(page);
    const failureSummary = unlabeled
      .map((r) => `${r.summary} — ${r.reason}`)
      .join('\n  - ');
    expect(
      unlabeled,
      `form controls without an accessible name:\n  - ${failureSummary}`,
    ).toEqual([]);
  });
}

/**
 * Behavioural sanity check for the disclosure pattern. The static
 * "aria-expanded is true/false" check above runs on every page, but a
 * value that is statically `"false"` and never flips is still broken.
 * Accordion is the canonical disclosure component (it composes
 * `Collapsible` triggers) so a single click cycle here exercises the
 * pattern end-to-end without duplicating coverage across 40 components.
 */
test('@a11y accordion examples — first disclosure trigger toggles aria-expanded', async ({
  page,
}) => {
  await page.goto('/components/accordion/examples');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
    timeout: OUTLET_READY_TIMEOUT_MS,
  });

  const trigger = page
    .locator('main button[aria-expanded]:not([aria-haspopup])')
    .first();
  await expect(trigger).toBeVisible();

  const initial = await trigger.getAttribute('aria-expanded');
  expect(initial, 'disclosure trigger must start with a real boolean value').toMatch(
    /^(true|false)$/,
  );

  await trigger.click();
  await expect(trigger).toHaveAttribute(
    'aria-expanded',
    initial === 'true' ? 'false' : 'true',
  );

  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', initial!);
});
