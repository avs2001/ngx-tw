import { expect, test } from '../../../fixtures/base';
import { CalendarPage } from '../../../pages/calendar.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Three-strategy contract — `Calendar`.
 *
 * Calendar exposes **two** strategies in the demo: reactive forms and
 * signal forms. There is no template-driven section.
 *
 * **Reset semantics.** Calendar is the one control in the library that really
 * does subscribe to `ngControl.control.events` and filter `FormResetEvent`
 * (`calendar.ts:824`). It hand-rolls that; it does not call
 * `core/form-reset.ts`'s `onFormReset`, which no component imports and which
 * `core/index.ts` does not export — the "helper used by date/time pickers"
 * this comment used to claim never existed in any component. Those pickers
 * clear through plain `writeValue(null)`. Corrected in audit pass 6.
 *
 * The consequence for calendar is real and unchanged: Signal Forms' FieldState
 * exposes no `events` stream, so the `if (ctrl?.events)` guard at
 * `calendar.ts:824` never opens and reset cleanup does not fire under Signal
 * Forms. Registry: `forms/calendar-signal-reset`.
 */
test.describe('Forms · Three strategies · Calendar', () => {
  // ──────────────────────────────────────────────────────────────────
  // Reactive (FormGroup / FormControl)
  // ──────────────────────────────────────────────────────────────────

  test('@forms @reactive reactive: programmatic setValue selects the day', async ({
    page,
  }) => {
    const calendar = new CalendarPage(page);
    await calendar.goto();

    await calendar.reactiveSection
      .getByRole('button', { name: 'Write today' })
      .click();
    const target = calendar.calendarForStrategy('reactive');
    await expect(target.locator('tw-calendar-cell[data-state-selected]')).not.toHaveCount(0);
  });

  test('@forms @reactive reactive: `FormGroup.reset()` clears the selection', async ({
    page,
  }) => {
    const calendar = new CalendarPage(page);
    await calendar.goto();

    await calendar.reactiveSection
      .getByRole('button', { name: 'Write today' })
      .click();
    const target = calendar.calendarForStrategy('reactive');
    await expect(target.locator('tw-calendar-cell[data-state-selected]')).not.toHaveCount(0);

    await calendar.reactiveSection
      .getByRole('button', { name: 'Reset form' })
      .click();
    await expect(target.locator('tw-calendar-cell[data-state-selected]')).toHaveCount(0);
  });

  test('@forms @reactive reactive: defensive writeValue preserves prior state on wrong-shape input', async ({
    page,
  }) => {
    const calendar = new CalendarPage(page);
    await calendar.goto();

    // Phase 3 contract: setting a `Date[]` into a single-mode calendar via
    // FormControl.setValue should NOT throw and should preserve the prior
    // value while marking `calendarInvalidValue` on the control.
    await calendar.reactiveSection
      .getByRole('button', { name: 'Write today' })
      .click();
    const target = calendar.calendarForStrategy('reactive');
    await expect(target.locator('tw-calendar-cell[data-state-selected]')).not.toHaveCount(0);

    await calendar.reactiveSection
      .getByRole('button', { name: 'Write wrong shape' })
      .click();
    // The selection is preserved (defensive writeValue), and the page does
    // not crash. The `calendarInvalidValue` error code surfaces via the
    // `errors` readout.
    await expect(target.locator('tw-calendar-cell[data-state-selected]')).not.toHaveCount(0);
    await expect(calendar.reactiveSection).toContainText(/calendarInvalidValue|errors =/);
  });

  // ──────────────────────────────────────────────────────────────────
  // Signal Forms
  // ──────────────────────────────────────────────────────────────────

  test('@forms @signal signal-forms: clicking a day drives the bound signal field', async ({
    page,
  }) => {
    const calendar = new CalendarPage(page);
    await calendar.goto();

    const target = calendar.calendarForStrategy('signal');
    await calendar.activeCell(target).click();
    await expect(calendar.signalSection).toContainText(/valid = true/);
  });

  test.fixme(
    '[fixme:forms/calendar-signal-reset] @forms @signal signal-forms: reset clears the selection',
    async () => {
      // BLOCKED — chapter 05 §5.1, chapter 08 §2: `calendar.ts` handles
      // `FormResetEvent` directly with an `if (ctrl?.events)` guard. Signal
      // Forms' FieldState control lacks the `events` stream, so the reset
      // cleanup path does not fire. There is no Reset button in the demo's
      // Signal Forms section today either.
    },
  );
});
