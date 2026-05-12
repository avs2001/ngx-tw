import { expect, test } from '../../../fixtures/base';
import { TimePickerPage } from '../../../pages/time-picker.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Three-strategy contract — `Time Picker`.
 *
 * Per chapter 04 §Time Picker + chapter 08 §2: the time-picker is in the
 * **overlay-deferred-form-control family** alongside date-picker and
 * date-range-picker. The new `onFormReset` helper subscribes to
 * `NgControl.events` and clears UI state without re-emitting `valueChange`
 * on the null path.
 *
 * **Calendar / Signal Forms gap (chapter 05 §5.1, chapter 08 §2):** the
 * `onFormReset` helper relies on `ngControl.control.events`. Signal Forms'
 * control type does not expose an `events` stream, so reset cleanup under
 * Signal Forms does not fire today. The Signal Forms reset test is
 * `test.fixme` until either the helper supports the Signal Forms control or
 * the demo wires its own reset hook.
 *
 * Inputs are observed via the `<input role="spinbutton" aria-valuenow="…">`
 * native attributes — the closest stable contract a consumer sees.
 */
test.describe('Forms · Three strategies · Time Picker', () => {
  // ──────────────────────────────────────────────────────────────────
  // Template-Driven (ngModel)
  // ──────────────────────────────────────────────────────────────────

  test('@forms @td template-driven: ngModel seeds the value into the spinbuttons', async ({
    page,
  }) => {
    const picker = new TimePickerPage(page);
    await picker.goto();

    // Demo seeds `callTime` to 14:00 in 12h mode (→ 02 PM).
    const root = picker.pickerIn('td');
    await expect(picker.hoursField(root)).toHaveAttribute('aria-valuenow', '2');
    await expect(picker.minutesField(root)).toHaveAttribute('aria-valuenow', '0');
    await expect(picker.meridiemButton(root, 'PM')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(picker.readoutIn('td')).toContainText('callTime');
  });

  // ──────────────────────────────────────────────────────────────────
  // Reactive (FormControl)
  // ──────────────────────────────────────────────────────────────────

  test('@forms @reactive reactive: `setValue` propagates into the spinbuttons', async ({
    page,
  }) => {
    const picker = new TimePickerPage(page);
    await picker.goto();

    const root = picker.pickerIn('reactive');
    // Initial value is null.
    await expect(picker.hoursField(root)).toHaveValue('');

    await picker.buttonIn('reactive', 'Set 06:30').click();
    await expect(picker.hoursField(root)).toHaveAttribute('aria-valuenow', '6');
    await expect(picker.minutesField(root)).toHaveAttribute('aria-valuenow', '30');
    await expect(picker.readoutIn('reactive')).toContainText('"status": "VALID"');
  });

  test('@forms @reactive reactive: `reset()` clears the spinbuttons and does NOT re-emit valueChange', async ({
    page,
  }) => {
    const picker = new TimePickerPage(page);
    await picker.goto();

    const root = picker.pickerIn('reactive');
    await picker.buttonIn('reactive', 'Set 06:30').click();
    await expect(picker.hoursField(root)).toHaveAttribute('aria-valuenow', '6');

    // The "Clear" button calls `alarmCtrl.reset(null)` (see demo source).
    // Overlay-deferred reset contract (chapter 05 §5.1 + chapter 08 §2):
    //   1. DOM clears.
    //   2. The reset path goes through `onFormReset`, which clears UI state
    //      *without* re-emitting `valueChange`. We assert (1) directly. The
    //      negative-valueChange assertion is verified via unit specs
    //      (date-picker.spec.ts, time-picker.spec.ts) since E2E has no spy
    //      hook on a CVA-only directive.
    await picker.buttonIn('reactive', 'Clear').click();
    await expect(picker.hoursField(root)).toHaveValue('');
    await expect(picker.minutesField(root)).toHaveValue('');
    await expect(picker.readoutIn('reactive')).toContainText('"value": null');
  });

  // ──────────────────────────────────────────────────────────────────
  // Signal Forms
  // ──────────────────────────────────────────────────────────────────

  test('@forms @signal signal-forms: user typing into the field updates the bound signal', async ({
    page,
  }) => {
    const picker = new TimePickerPage(page);
    await picker.goto();

    const root = picker.pickerIn('signal');
    const hours = picker.hoursField(root);
    await hours.focus();
    // Initial value is null → ArrowUp seeds to a default starting hour.
    await page.keyboard.press('ArrowUp');
    await expect(picker.readoutIn('signal')).toContainText('standupAt =');
    await expect(picker.readoutIn('signal')).not.toContainText('standupAt = —');
  });

  test.fixme(
    '@forms @signal signal-forms: reset clears the spinbuttons (BLOCKED — onFormReset has no Signal Forms events stream)',
    async () => {
      // BLOCKED (chapter 05 §5.1, chapter 08 §2): `onFormReset` subscribes to
      // `ngControl.control.events`, which Signal Forms' FieldState control
      // does not expose. The reset path therefore does not fire for
      // signal-forms-bound pickers. Demo has no Reset button in the
      // Signal Forms section either — when a Reset surface is wired, lift
      // this fixme.
    },
  );
});
