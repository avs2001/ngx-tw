import { expect, test } from '../../../fixtures/base';
import { DateRangePickerPage } from '../../../pages/date-range-picker.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Three-strategy contract — `Date Range Picker`.
 *
 * Per chapter 04 §Date Range Picker + chapter 08 §2: the range-picker is in
 * the **overlay-deferred-form-control family**.
 *
 * **How reset actually works here.** Through the plain CVA path:
 * `DateRangePickerComponent.writeValue(null)` (`date-range-picker.ts:1465`)
 * clears `internalValue`, `value` and the parse/range error flags. It does NOT
 * go through `core/form-reset.ts`'s `onFormReset` helper — no component in the
 * library imports it, and it is not exported from `core/index.ts`. Earlier
 * revisions of this file attributed the behaviour to it; corrected in audit
 * pass 6.
 *
 * The Signal Forms reset test stays suppressed because the demo's Signal Forms
 * section renders no reset surface. The `selectionCleared` mid-draft assertion
 * needs an emission spy the demo does not expose — covered by the unit spec
 * (`date-range-picker.spec.ts:700`).
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
      '[role="grid"] button:not([aria-disabled="true"])',
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

  test('@forms @reactive reactive: `reset()` clears the trigger via writeValue(null)', async ({
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
    //   writeValue(null) clears UI state WITHOUT re-emitting `valueChange` /
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
      '[role="grid"] button:not([aria-disabled="true"])',
    );
    await enabled.nth(0).click();
    await enabled.nth(3).click();
    await picker.waitForClosed();

    await expect(picker.output('signal-forms')).not.toContainText('window = null');
  });

  test.fixme(
    '[fixme:forms/date-range-picker-signal-reset] @forms @signal signal-forms: reset clears the trigger',
    async () => {
      // BLOCKED — but not for the reason this comment used to give (it
      // blamed `onFormReset`, which this picker does not use; see the file
      // header). The demo's Signal Forms section renders no reset control.
      // Historical text follows: `onFormReset` uses `NgControl.events`,
      // which Signal Forms' FieldState control does not expose. Reset
      // cleanup does not fire under Signal Forms today.
    },
  );

  test.fixme(
    '[fixme:forms/date-range-picker-selection-cleared] @forms @reactive `selectionCleared` only fires mid-draft',
    async () => {
      // BLOCKED — chapter 08 §2(c): assertion requires observing the
      // `selectionCleared` output count, which the demo does not surface
      // into visible state. Unit spec
      // (`date-range-picker.spec.ts:700-820`) is the authoritative test;
      // E2E lifts this fixme only if the demo adds a counter readout.
    },
  );
});
