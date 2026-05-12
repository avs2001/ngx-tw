import { expect, test } from '../../../fixtures/base';
import { DateRangePickerPage } from '../../../pages/date-range-picker.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Three-strategy contract — `Date Range Picker`.
 *
 * Per chapter 04 §Date Range Picker + chapter 08 §2: the range-picker is in
 * the **overlay-deferred-form-control family**. The new `onFormReset` hook
 * clears state without re-emitting `valueChange`. `selectionCleared` only
 * fires mid-draft.
 *
 * Signal Forms reset path is BLOCKED — `onFormReset` subscribes to
 * `NgControl.events`, which Signal Forms does not expose. The
 * `selectionCleared` mid-draft assertion needs a spy hook the demo doesn't
 * expose — covered by unit spec (`date-range-picker.spec.ts:700`).
 */
test.describe('Forms · Three strategies · Date Range Picker', () => {
  // ──────────────────────────────────────────────────────────────────
  // Template-Driven (ngModel)
  // ──────────────────────────────────────────────────────────────────

  test('@forms @td template-driven: picking a range updates the bound model readout', async ({
    page,
  }) => {
    const picker = new DateRangePickerPage(page);
    await picker.goto();

    const target = picker.pickerForStrategy('td');
    await picker.trigger(target).click();
    await picker.waitForOpen();
    const enabled = picker.overlayCalendar.locator(
      '[role="grid"] button:not([disabled])',
    );
    await enabled.nth(0).click();
    await enabled.nth(3).click();
    await picker.waitForClosed();

    await expect(picker.output('td-forms')).not.toContainText('holiday = null');
  });

  // ──────────────────────────────────────────────────────────────────
  // Reactive (FormControl)
  // ──────────────────────────────────────────────────────────────────

  test('@forms @reactive reactive: `setValue` propagates to the trigger spans', async ({
    page,
  }) => {
    const picker = new DateRangePickerPage(page);
    await picker.goto();

    await picker.reactiveSection
      .getByRole('button', { name: 'Set to last 7 days' })
      .click();
    await expect(picker.output('reactive-forms')).toContainText('"status": "VALID"');
  });

  test('@forms @reactive reactive: `reset()` clears the trigger via onFormReset', async ({
    page,
  }) => {
    const picker = new DateRangePickerPage(page);
    await picker.goto();

    await picker.reactiveSection
      .getByRole('button', { name: 'Set to last 7 days' })
      .click();
    await expect(picker.output('reactive-forms')).not.toContainText('"value": null');

    await picker.reactiveSection.getByRole('button', { name: 'Clear', exact: true }).click();
    // Overlay-deferred-reset contract (chapter 05 §5.1, chapter 08 §2):
    //   onFormReset clears UI state WITHOUT re-emitting `valueChange` /
    //   `dateChange`. The unit spec (`date-range-picker.spec.ts:700-820`)
    //   asserts the negative-emission contract; E2E asserts the DOM clear.
    await expect(picker.output('reactive-forms')).toContainText('"value": null');
  });

  // ──────────────────────────────────────────────────────────────────
  // Signal Forms
  // ──────────────────────────────────────────────────────────────────

  test('@forms @signal signal-forms: picking a range drives the bound signal field', async ({
    page,
  }) => {
    const picker = new DateRangePickerPage(page);
    await picker.goto();

    const target = picker.pickerForStrategy('signal');
    await picker.trigger(target).click();
    await picker.waitForOpen();
    const enabled = picker.overlayCalendar.locator(
      '[role="grid"] button:not([disabled])',
    );
    await enabled.nth(0).click();
    await enabled.nth(3).click();
    await picker.waitForClosed();

    await expect(picker.output('signal-forms')).not.toContainText('window = null');
  });

  test.fixme(
    '@forms @signal signal-forms: reset clears the trigger (BLOCKED — onFormReset has no Signal Forms events stream)',
    async () => {
      // BLOCKED (chapter 08 §2): `onFormReset` uses `NgControl.events`,
      // which Signal Forms' FieldState control does not expose. Reset
      // cleanup does not fire under Signal Forms today.
    },
  );

  test.fixme(
    '@forms @reactive `selectionCleared` only fires mid-draft (needs spy hook in demo)',
    async () => {
      // BLOCKED — chapter 08 §2(c): assertion requires observing the
      // `selectionCleared` output count, which the demo does not surface
      // into visible state. Unit spec
      // (`date-range-picker.spec.ts:700-820`) is the authoritative test;
      // E2E lifts this fixme only if the demo adds a counter readout.
    },
  );
});
