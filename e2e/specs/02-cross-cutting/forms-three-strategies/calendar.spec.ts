import { expect, test } from '../../../fixtures/base';
import { CalendarPage } from '../../../pages/calendar.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Three-strategy contract — `Calendar`.
 *
 * Calendar exposes **two** strategies in the demo: reactive forms and
 * signal forms. There is no template-driven section.
 *
 * **Reset semantics (chapter 05 §5.1, chapter 08 §2):** `calendar.ts`
 * subscribes to `ngControl.control.events` directly (not via the
 * `onFormReset` helper used by date/time pickers). Signal Forms' control
 * lacks an `events` stream, so calendar's reset cleanup **does not fire
 * under Signal Forms** today. The Signal Forms reset assertion is
 * `test.fixme` until the underlying gap is addressed.
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
    '@forms @signal signal-forms: reset clears the selection (BLOCKED — calendar.events guard skips Signal Forms)',
    async () => {
      // BLOCKED — chapter 05 §5.1, chapter 08 §2: `calendar.ts` handles
      // `FormResetEvent` directly with an `if (ctrl?.events)` guard. Signal
      // Forms' FieldState control lacks the `events` stream, so the reset
      // cleanup path does not fire. There is no Reset button in the demo's
      // Signal Forms section today either.
    },
  );
});
