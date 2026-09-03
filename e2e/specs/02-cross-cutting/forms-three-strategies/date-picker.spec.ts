import { expect, test } from '../../../fixtures/base';
import { DatePickerPage } from '../../../pages/date-picker.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Three-strategy contract — `Date Picker`.
 *
 * Per chapter 04 §Date Picker + chapter 08 §2: the date-picker is an
 * **overlay-deferred form control**.
 *
 * **How reset actually works here.** Through the plain CVA path:
 * `DatePickerComponent.writeValue(null)` (`date-picker.ts:1514`) clears
 * `internalValue`, `value`, `rawInputText` and the parse-error state. It does
 * NOT go through `core/form-reset.ts`'s `onFormReset` helper — no component in
 * the library imports that helper, and it is not exported from `core/index.ts`
 * either. Earlier revisions of this file (and five of its siblings) attributed
 * the behaviour to it; corrected in audit pass 6. `calendar` is the one control
 * that really does hand-roll a `control.events` / `FormResetEvent`
 * subscription (`calendar.ts:824`).
 *
 * Because the mechanism is `writeValue`, whether reset works under Signal
 * Forms is a question about how Signal Forms drives the accessor, not about an
 * `events` stream. The Signal Forms reset test stays suppressed for a
 * different and simpler reason: the demo's Signal Forms section renders no
 * reset surface at all.
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

  test('@forms @reactive reactive: `reset()` clears the input via writeValue(null) (no dateChange re-emit)', async ({
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
    //   1. DOM clears — `formControl.reset()` reaches the accessor as
    //      `writeValue(null)`, which takes the picker's clear path.
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
    '[fixme:forms/date-picker-signal-reset] @forms @signal signal-forms: reset clears the trigger',
    async () => {
      // BLOCKED — and NOT for the reason this comment used to give. It
      // blamed `onFormReset` having no Signal Forms events stream; the
      // date-picker does not use that helper at all (see the file header).
      // The real blocker is smaller and entirely demo-side: the Signal Forms
      // section of `date-picker-examples.component.ts` renders a
      // `tw-date-picker` and a readout and nothing else — there is no reset
      // control to click. Registry: `forms/date-picker-signal-reset`.
    },
  );
});
