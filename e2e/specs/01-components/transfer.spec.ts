/* eslint playwright/expect-expect: ["warn", { "assertFunctionNames": ["expect", "pollUntil"] }] --
   `pollUntil` (support/timing.ts) wraps `expect.poll`, so a test that asserts only
   through it still asserts; without this the rule reports it as assertion-free. */
import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/base';
import { formatViolations } from '../../support/a11y';
import { pollUntil } from '../../support/timing';

test.describe.configure({ mode: 'parallel' });

/**
 * Transfer (dual-listbox shuttle) interaction + a11y suite.
 *
 * Covers the three checks that the component's unit tests can't reach in jsdom:
 *   - axe sweep of the full examples page (empty-list state, the dual-listbox
 *     `aria-labelledby` wiring, the projected-avatar rows);
 *   - focus-after-move: a real browser blurs a button that disables itself, so
 *     this proves focus lands back in a listbox rather than on `<body>`;
 *   - a `required` transfer inside `tw-form-field` surfaces its error once the
 *     control is touched (exercises the FormFieldControl error-state path).
 */
test.describe('Transfer', () => {
  const EXAMPLES = '/components/transfer/examples';

  const section = (page: Page, heading: string) =>
    page.locator('section').filter({ has: page.getByRole('heading', { name: heading, level: 2 }) });

  test('@a11y the examples page has no axe violations', async ({ page, axe }) => {
    await page.goto(EXAMPLES);
    await page.getByRole('heading', { name: 'Playground', level: 2 }).waitFor();
    const results = await axe.include('app-transfer-examples').analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  test('@a11y each panel is a listbox labelled by its title', async ({ page }) => {
    await page.goto(EXAMPLES);
    const search = section(page, 'Search & Select-all');
    const listboxes = search.getByRole('listbox');
    await expect(listboxes).toHaveCount(2);
    await expect(listboxes.first()).toHaveAccessibleName(/all time zones/i);
    await expect(listboxes.nth(1)).toHaveAccessibleName(/working hours/i);
    // Options expose role="option" with aria-selected.
    await expect(listboxes.first().getByRole('option').first()).toHaveAttribute('aria-selected', /.+/);
  });

  test('@interaction moving items keeps focus in the control, not on <body>', async ({ page }) => {
    await page.goto(EXAMPLES);
    const search = section(page, 'Search & Select-all');
    const sourceListbox = search.getByRole('listbox').first();
    await sourceListbox.getByRole('option').first().click();
    const moveToTarget = search.getByRole('button', { name: 'Move selected to target' });
    await expect(moveToTarget).toBeEnabled();
    await moveToTarget.click();

    // The button disables itself as its checked set drains; focus must not fall
    // back to <body>. The fix re-homes focus into the destination listbox.
    // `afterNextRender` re-homes focus, so the answer is not available on the
    // instant the click resolves. Poll rather than sample — a one-shot
    // `page.evaluate` here was the pass-5 flake (passed 5/5 in isolation,
    // failed once under full-suite contention). See `support/timing.ts`.
    await pollUntil(
      page,
      () => {
        const active = document.activeElement;
        if (!active || active.tagName === 'BODY') return 'body';
        return active.closest('[role="listbox"]') ? 'listbox' : active.tagName.toLowerCase();
      },
      'focus must be re-homed into a listbox, not left on <body>',
    ).toBe('listbox');
  });

  test('@interaction moving the first item into an empty destination keeps focus in the new listbox', async ({
    page,
  }) => {
    await page.goto(EXAMPLES);
    // The One-Way section starts with an empty target (no listbox at all).
    const oneWay = section(page, 'One-Way');
    await expect(oneWay.getByRole('listbox')).toHaveCount(1);

    await oneWay.getByRole('listbox').first().getByRole('option').first().click();
    await oneWay.getByRole('button', { name: 'Move selected to target' }).click();

    // The destination listbox mounts during the move's render; afterNextRender
    // must home focus into it rather than letting it fall to <body>.
    await expect(oneWay.getByRole('listbox')).toHaveCount(2);
    // Same shape as the test above: the destination listbox mounts during the
    // move's render and `afterNextRender` homes focus into it afterwards, so
    // the value settles a tick or more after the click resolves.
    await pollUntil(
      page,
      () => {
        const active = document.activeElement;
        if (!active || active.tagName === 'BODY') return 'body';
        return active.closest('[role="listbox"]') ? 'listbox' : active.tagName.toLowerCase();
      },
      'focus must be re-homed into the newly mounted listbox, not left on <body>',
    ).toBe('listbox');
  });

  test('@a11y a required transfer inside tw-form-field surfaces an error once touched', async ({
    page,
  }) => {
    await page.goto(EXAMPLES);
    const ff = section(page, 'Inside form-field');
    // Target the rendered error by its alert role (the code snippet below the demo
    // contains the same text, so getByText would be ambiguous).
    const error = ff.getByRole('alert').filter({ hasText: 'Select at least one reviewer.' });

    // Untouched → no error even though the target is empty (invalid).
    await expect(error).toBeHidden();

    // Touch the control: focus an option, then blur the whole control.
    await ff.getByRole('listbox').first().getByRole('option').first().click();
    await page.getByRole('heading', { name: 'Playground', level: 2 }).click();

    await expect(error).toBeVisible();
  });
});
