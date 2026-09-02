import { expect, test } from '../../fixtures/base';
import { CalendarPage } from '../../pages/calendar.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Calendar interaction + a11y spec.
 *
 * Chapter 04 §Calendar OVERLAPS heavily with `calendar.spec.ts` unit
 * coverage (keyboard nav, view switching, range selection). E2E reserves
 * itself for browser-only behaviour and the in-flight diff:
 *
 * - `yearsPerPage` input (current diff).
 * - NG0200 fix regression guard (`[(ngModel)]` + `Validators.required`).
 * - Multi-month `hideOutsideDays` placeholders.
 * - Single-mode click commits, range-mode clicks span.
 * - Reactive forms `formControlName` round-trip.
 * - Range click `nearest-edge` strategy (§21.2 — current behavior input).
 *
 * BLOCKED:
 *   - `CalendarConstraints` shorthand — NEEDS-DEMO-CHANGE (the Constraints
 *     section uses the individual inputs, not the bundle).
 *   - Range click-strategy hand-off with custom
 *     `CALENDAR_SELECTION_STRATEGY` — requires a dedicated demo route.
 */
test.describe('Calendar', () => {
  test('@interaction @a11y single-selection: clicking a day cell commits the value', async ({
    page,
  }) => {
    const calendar = new CalendarPage(page);
    await calendar.goto();

    const target = calendar.calendarIn(calendar.singleSection);
    // The `startAt` is the 15th of the current month — click that cell.
    // `data-state-selected` lives on the `<tw-calendar-cell>` host, not on
    // the inner `<button>`.
    await calendar.activeCell(target).click();
    await expect(
      target.locator('tw-calendar-cell[data-state-selected]'),
    ).toHaveCount(1);
  });

  test('@interaction range-selection: clicking start then end highlights the in-between cells', async ({
    page,
  }) => {
    const calendar = new CalendarPage(page);
    await calendar.goto();

    const target = calendar.calendarIn(calendar.rangeSection);
    const enabled = target.locator(
      '[role="grid"] button:not([aria-disabled="true"])',
    );
    await enabled.nth(0).click();
    await enabled.nth(5).click();

    await expect(
      target.locator('tw-calendar-cell[data-state-in-range]'),
    ).not.toHaveCount(0);
  });

  test('@a11y constraints: cells outside [minDate, maxDate] or filtered weekends are disabled', async ({
    page,
  }) => {
    const calendar = new CalendarPage(page);
    await calendar.goto();

    const target = calendar.calendarIn(calendar.constraintsSection);
    // The demo sets weekendDays = [0, 6] → Sunday and Saturday cells carry
    // `data-state-weekend`. Cells outside [min, max] carry
    // `data-state-disabled` and `aria-disabled="true"` on their button.
    //
    // Deliberately NOT `button[disabled]`: calendar cells use `aria-disabled`,
    // never the native attribute, so a disabled cell stays focusable and the
    // roving tabindex cannot desynchronise from real DOM focus (SC 2.1.1).
    await expect(
      target.locator('[role="grid"] button[aria-disabled="true"]'),
    ).not.toHaveCount(0);
  });

  test.fixme('@interaction multi-month: range-selection renders two grids and supports cross-grid selection', async ({
    page,
  }) => {
    // Pre-existing drift: range mode no longer defaults to a two-month
    // layout post-S19 (`numberOfMonths` is now 1 by default; the
    // rangeBehavior config object owns this). Re-enable by setting
    // `[numberOfMonths]="2"` on the demo's Range section, or rewrite the
    // assertion to match the new single-grid default and explicitly opt
    // into the two-month variant elsewhere in the spec.
    const calendar = new CalendarPage(page);
    await calendar.goto();

    const target = calendar.calendarIn(calendar.rangeSection);
    await expect(target.locator('[role="grid"]')).toHaveCount(2);
  });

  test('@interaction presets slot: clicking a preset button commits a range', async ({
    page,
  }) => {
    const calendar = new CalendarPage(page);
    await calendar.goto();

    const presets = calendar.presetsSection;
    await presets.getByRole('button', { name: 'Last 7 days' }).click();
    const target = calendar.calendarIn(presets);
    // Preset commits a 7-day range — at least one in-range cell is visible
    // (the marker lives on the `<tw-calendar-cell>` host).
    await expect(
      target.locator('tw-calendar-cell[data-state-in-range]'),
    ).not.toHaveCount(0);
  });

  test('@interaction reactive forms: setValue propagates to the calendar', async ({
    page,
  }) => {
    const calendar = new CalendarPage(page);
    await calendar.goto();

    await calendar.reactiveSection
      .getByRole('button', { name: 'Write today' })
      .click();

    const target = calendar.calendarIn(calendar.reactiveSection);
    await expect(
      target.locator('tw-calendar-cell[data-state-selected]'),
    ).not.toHaveCount(0);
  });

  test('@interaction reactive forms: reset clears the selection (NG0200 regression guard)', async ({
    page,
  }) => {
    const calendar = new CalendarPage(page);
    await calendar.goto();

    // The mount itself would throw NG0200 if calendar resolved `ngControl` in
    // the constructor instead of `ngOnInit` — reaching this assertion means
    // the fix held.
    await calendar.reactiveSection
      .getByRole('button', { name: 'Write today' })
      .click();
    const target = calendar.calendarIn(calendar.reactiveSection);
    await expect(
      target.locator('tw-calendar-cell[data-state-selected]'),
    ).not.toHaveCount(0);

    await calendar.reactiveSection
      .getByRole('button', { name: 'Reset form' })
      .click();
    await expect(
      target.locator('tw-calendar-cell[data-state-selected]'),
    ).toHaveCount(0);
  });

  test.fixme(
    '@interaction reactive forms: toggle disabled propagates to every day cell',
    async ({ page }) => {
      // BUG / NEEDS-INVESTIGATION: calling `ctrl.disable()` on the bound
      // FormControl does NOT propagate to the individual day cells — the
      // grid buttons remain enabled even after the form-level disable.
      // Either the calendar's CVA `setDisabledState` is incomplete, or the
      // day cells render independently of host disabled state. Unit spec
      // covers the API surface; this E2E asserts the rendered contract.
      const calendar = new CalendarPage(page);
      await calendar.goto();
      const target = calendar.calendarIn(calendar.reactiveSection);
      await expect(
        target.locator('[role="grid"] button:not([aria-disabled="true"])'),
      ).not.toHaveCount(0);
      await calendar.reactiveSection
        .getByRole('button', { name: 'Toggle disabled' })
        .click();
      await expect(
        target.locator('[role="grid"] button:not([aria-disabled="true"])'),
      ).toHaveCount(0);
    },
  );

  test('@interaction range click behavior: `nearest-edge` drags the closer endpoint', async ({
    page,
  }) => {
    const calendar = new CalendarPage(page);
    await calendar.goto();

    const target = calendar.calendarIn(calendar.rangeClickSection);
    const cells = target.locator('[role="grid"] button:not([aria-disabled="true"])');

    // Form a range: click cells at indices 5 and 15.
    await cells.nth(5).click();
    await cells.nth(15).click();
    await expect(
      target.locator('tw-calendar-cell[data-state-in-range]'),
    ).not.toHaveCount(0);

    // Third click at index 4 — closer to the start than to the end. With
    // `nearest-edge`, the start drags rather than restarting.
    await cells.nth(4).click();
    await expect(
      target.locator('tw-calendar-cell[data-state-range-start]'),
    ).toHaveCount(1);
    await expect(
      target.locator('tw-calendar-cell[data-state-range-end]'),
    ).toHaveCount(1);
  });

  test.fixme(
    '@interaction CalendarConstraints shorthand (NEEDS-DEMO-CHANGE)',
    async () => {
      // BLOCKED — chapter 04 §Calendar + REVIEW.md: the demo's Constraints
      // section passes minDate/maxDate/disabledDates/disabledDaysOfWeek
      // individually. Add a section that passes
      // `[constraints]="{ before, after, disabledDates }"` to author this.
    },
  );

  test.fixme(
    '@interaction Range click-strategy hand-off with custom CALENDAR_SELECTION_STRATEGY',
    async () => {
      // BLOCKED — chapter 04 §Calendar: requires a dedicated demo route
      // that provides a custom selection strategy. Today's demo only
      // exercises the default strategy.
    },
  );
});
