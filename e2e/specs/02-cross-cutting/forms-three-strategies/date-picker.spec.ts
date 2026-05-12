import { expect, test } from '../../../fixtures/base';
import { DatePickerPage } from '../../../pages/date-picker.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Three-strategy contract — `Date Picker`.
 *
 * Per chapter 04 §Date Picker + chapter 08 §2: the date-picker is an
 * **overlay-deferred form control**. The new `onFormReset` helper subscribes
 * to `NgControl.events` and clears UI state without re-emitting `dateChange`
 * on the null path. Signal Forms' control type does not expose an `events`
 * stream — reset cleanup does not fire under Signal Forms today; that path
 * is `test.fixme`.
 *
 * The picker is a `ControlValueAccessor` with a `dateChange` output, but
 * neither the demo's bound `<p>`/`<pre>` readouts nor a Playwright locator
 * give us a clean spy on emission counts — the negative-emission assertion
 * (reset path must NOT emit `dateChange`) is covered in unit specs. E2E
 * here verifies the observable DOM contract.
 */
test.describe('Forms · Three strategies · Date Picker', () => {
  // ──────────────────────────────────────────────────────────────────
  // Template-Driven (ngModel)
  // ──────────────────────────────────────────────────────────────────

  test('@forms @td template-driven: typing a date updates the bound model readout', async ({
    page,
  }) => {
    const picker = new DatePickerPage(page);
    await picker.goto();

    const target = picker.pickerForStrategy('td');
    await picker.triggerInput(target).fill('06/16/2025');
    await picker.triggerInput(target).blur();
    await expect(picker.output('td-forms')).not.toContainText('birthday = null');
  });

  // ──────────────────────────────────────────────────────────────────
  // Reactive (FormControl)
  // ──────────────────────────────────────────────────────────────────

  test('@forms @reactive reactive: `setValue` propagates to the trigger input', async ({
    page,
  }) => {
    const picker = new DatePickerPage(page);
    await picker.goto();

    const target = picker.pickerForStrategy('reactive');
    await expect(picker.triggerInput(target)).toHaveValue('');

    await picker.reactiveSection
      .getByRole('button', { name: 'Set to today' })
      .click();
    await expect(picker.triggerInput(target)).not.toHaveValue('');
    await expect(picker.output('reactive-forms')).toContainText('"status": "VALID"');
  });

  test('@forms @reactive reactive: `reset()` clears the input via onFormReset (no dateChange re-emit)', async ({
    page,
  }) => {
    const picker = new DatePickerPage(page);
    await picker.goto();

    const target = picker.pickerForStrategy('reactive');
    await picker.reactiveSection
      .getByRole('button', { name: 'Set to today' })
      .click();
    await expect(picker.triggerInput(target)).not.toHaveValue('');

    // Overlay-deferred-reset contract (chapter 05 §5.1 + chapter 08 §2):
    //   1. DOM clears — `onFormReset` invokes the picker's clear path.
    //   2. The reset code path explicitly skips `dateChange` emission — see
    //      `date-picker.ts:1294-1313` `applyValue()`. The unit spec
    //      (`date-picker.spec.ts:804-846`) is the authoritative negative
    //      assertion; the E2E test asserts the observable DOM clear.
    await picker.reactiveSection.getByRole('button', { name: 'Clear', exact: true }).click();
    await expect(picker.triggerInput(target)).toHaveValue('');
    await expect(picker.output('reactive-forms')).toContainText('"value": null');
  });

  // ──────────────────────────────────────────────────────────────────
  // Signal Forms
  // ──────────────────────────────────────────────────────────────────

  test('@forms @signal signal-forms: picking a date via the overlay drives the bound signal field readout', async ({
    page,
  }) => {
    const picker = new DatePickerPage(page);
    await picker.goto();

    const target = picker.pickerForStrategy('signal');
    await picker.triggerButton(target).click();
    await picker.waitForOpen();
    await picker.overlayCalendar.locator('button[tabindex="0"]').click();
    await picker.waitForClosed();
    await expect(picker.output('signal-forms')).not.toContainText('shipDate = null');
  });

  test.fixme(
    '@forms @signal signal-forms: reset clears the trigger (BLOCKED — onFormReset has no Signal Forms events stream)',
    async () => {
      // BLOCKED (chapter 05 §5.1 + chapter 08 §2): `onFormReset` subscribes
      // to `NgControl.control.events`, which Signal Forms' FieldState does
      // not expose. The reset path does not fire under signal forms today,
      // and the demo's Signal Forms section has no Reset button either.
      // Lift this when either the helper supports Signal Forms or the demo
      // wires its own reset surface.
    },
  );
});
