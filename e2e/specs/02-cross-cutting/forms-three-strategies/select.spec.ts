import { expect, test } from '../../../fixtures/base';
import { SelectPage } from '../../../pages/select.page';
import { OVERLAY_SETTLE_TIMEOUT_MS } from '../../../support/timing';

test.describe.configure({ mode: 'parallel' });

/**
 * Three-strategy contract — `Select`.
 *
 * Mirrors the canonical `input.spec.ts` (see
 * `e2e/specs/02-cross-cutting/forms-three-strategies/README.md`). Select sits
 * in the **synchronous control family** (chapter 05 §5.1): `reset()` clears
 * the DOM and the readout; there is no negative-emission contract here — that
 * belongs to date-picker / date-range-picker / time-picker.
 *
 * Observable signal: each strategy section renders a readout `<p>` tagged
 * `data-testid="output-{strategy}-forms"` — the SelectPage POM aliases it as
 * `readoutIn(strategy)`.
 *
 * Known gap (do NOT add here): Signal Forms' `FieldState.reset()` without an
 * argument only resets touched/dirty, NOT the model — see the README. The
 * select demo's signal Reset button calls `reset()` (no value), so the
 * signal-section reset path is intentionally absent from this file.
 */
test.describe('Forms · Three strategies · Select', () => {
  // ──────────────────────────────────────────────────────────────────
  // Template-Driven (ngModel)
  // ──────────────────────────────────────────────────────────────────

  test('@forms @td template-driven: initial signal value renders in the trigger', async ({
    page,
  }) => {
    const select = new SelectPage(page);
    await select.goto();

    // Seeded with 'apple'.
    const trigger = select.triggerIn(select.templateDrivenSection, 'Fruit (template-driven)');
    await expect(trigger).toContainText('Apple');
    await expect(select.readoutIn('td')).toContainText('value = apple');
  });

  test('@forms @td template-driven: programmatic signal write propagates to the trigger', async ({
    page,
  }) => {
    const select = new SelectPage(page);
    await select.goto();

    const trigger = select.triggerIn(select.templateDrivenSection, 'Fruit (template-driven)');
    await select.buttonIn('td', 'Set banana').click();

    await expect(trigger).toContainText('Banana');
    await expect(select.readoutIn('td')).toContainText('value = banana');
  });

  test('@forms @td template-driven: user picking an option writes back through CVA into the bound signal', async ({
    page,
  }) => {
    const select = new SelectPage(page);
    await select.goto();

    const trigger = select.triggerIn(select.templateDrivenSection, 'Fruit (template-driven)');
    await select.openVia(trigger);
    await select.optionByLabel('Cherry').click();
    await select.waitForClosed();

    await expect(trigger).toContainText('Cherry');
    await expect(select.readoutIn('td')).toContainText('value = cherry');
  });

  test('@forms @td template-driven: Clear button writes null and the trigger falls back to the placeholder', async ({
    page,
  }) => {
    const select = new SelectPage(page);
    await select.goto();

    const trigger = select.triggerIn(select.templateDrivenSection, 'Fruit (template-driven)');
    await select.buttonIn('td', 'Clear').click();

    await expect(select.readoutIn('td')).toContainText('value = null');
    await expect(trigger).toContainText('Choose a fruit');
  });

  // ──────────────────────────────────────────────────────────────────
  // Reactive (FormControl)
  // ──────────────────────────────────────────────────────────────────

  test('@forms @reactive reactive: initial FormControl value renders in the trigger', async ({
    page,
  }) => {
    const select = new SelectPage(page);
    await select.goto();

    // Seeded with 'banana'.
    const trigger = select.triggerIn(select.reactiveSection, 'Fruit');
    await expect(trigger).toContainText('Banana');
    await expect(select.readoutIn('reactive')).toContainText('control.value = banana');
  });

  test('@forms @reactive reactive: setValue propagates to the trigger', async ({ page }) => {
    const select = new SelectPage(page);
    await select.goto();

    const trigger = select.triggerIn(select.reactiveSection, 'Fruit');
    await select.buttonIn('reactive', 'Set cherry').click();

    await expect(trigger).toContainText('Cherry');
    await expect(select.readoutIn('reactive')).toContainText('control.value = cherry');
  });

  test('@forms @reactive reactive: user picking an option updates FormControl.value', async ({
    page,
  }) => {
    const select = new SelectPage(page);
    await select.goto();

    const trigger = select.triggerIn(select.reactiveSection, 'Fruit');
    await select.openVia(trigger);
    await select.optionByLabel('Date').click();
    await select.waitForClosed();

    await expect(select.readoutIn('reactive')).toContainText('control.value = date');
  });

  test('@forms @reactive reactive: disable() blocks the trigger and Enable restores it', async ({
    page,
  }) => {
    const select = new SelectPage(page);
    await select.goto();

    const trigger = select.triggerIn(select.reactiveSection, 'Fruit');
    await expect(trigger).toBeEnabled();

    await select.buttonIn('reactive', 'Disable').click();
    await expect(trigger).toBeDisabled();
    await expect(select.readoutIn('reactive')).toContainText('disabled = true');

    // Clicking a disabled combobox should not open the listbox even with
    // `force: true` (the directive's own guard returns early).
    await trigger.click({ force: true });
    await expect(select.listbox).toHaveCount(0, { timeout: OVERLAY_SETTLE_TIMEOUT_MS });

    await select.buttonIn('reactive', 'Enable').click();
    await expect(trigger).toBeEnabled();
    await expect(select.readoutIn('reactive')).toContainText('disabled = false');
  });

  test('@forms @reactive reactive: reset() clears the trigger and the readout via the CVA path', async ({
    page,
  }) => {
    // `select.ts` clears through the standard CVA path: `formControl.reset()`
    // reaches the accessor as `writeValue(null)` (`select.ts:1650`). Nothing in
    // the library uses `core/form-reset.ts`'s `onFormReset` helper — this file
    // was the only one of six that already said so, and audit pass 6 corrected
    // the other five to match. Assert both observable surfaces clear.
    const select = new SelectPage(page);
    await select.goto();

    const trigger = select.triggerIn(select.reactiveSection, 'Fruit');
    await expect(trigger).toContainText('Banana');

    await select.buttonIn('reactive', 'Reset').click();

    await expect(select.readoutIn('reactive')).toContainText('control.value = null');
    await expect(trigger).toContainText('Choose a fruit');
  });

  // ──────────────────────────────────────────────────────────────────
  // Signal Forms
  // ──────────────────────────────────────────────────────────────────

  test('@forms @signal signal-forms: initial signal-form value renders (null → placeholder)', async ({
    page,
  }) => {
    const select = new SelectPage(page);
    await select.goto();

    const trigger = select.triggerIn(select.signalSection, 'Fruit (signal forms)');
    await expect(trigger).toContainText('Choose a fruit');
    await expect(select.readoutIn('signal')).toContainText('value = null');
    await expect(select.readoutIn('signal')).toContainText('valid = false');
  });

  test('@forms @signal signal-forms: programmatic set on the field signal propagates to the trigger', async ({
    page,
  }) => {
    const select = new SelectPage(page);
    await select.goto();

    const trigger = select.triggerIn(select.signalSection, 'Fruit (signal forms)');
    await select.buttonIn('signal', 'Set cherry').click();

    await expect(trigger).toContainText('Cherry');
    await expect(select.readoutIn('signal')).toContainText('value = cherry');
    await expect(select.readoutIn('signal')).toContainText('valid = true');
  });

  test('@forms @signal signal-forms: user picking an option updates the bound field signal', async ({
    page,
  }) => {
    const select = new SelectPage(page);
    await select.goto();

    const trigger = select.triggerIn(select.signalSection, 'Fruit (signal forms)');
    await select.openVia(trigger);
    await select.optionByLabel('Elderberry').click();
    await select.waitForClosed();

    await expect(select.readoutIn('signal')).toContainText('value = elderberry');
    await expect(select.readoutIn('signal')).toContainText('valid = true');
  });

  // ──────────────────────────────────────────────────────────────────
  // Cross-strategy parity — the same SelectComponent handles all three
  // ──────────────────────────────────────────────────────────────────

  test('@forms cross-strategy: picking an option in one strategy does not leak into the others', async ({
    page,
  }) => {
    const select = new SelectPage(page);
    await select.goto();

    // Initial state:
    //   td       → 'apple'
    //   reactive → 'banana'
    //   signal   → null
    await expect(select.readoutIn('td')).toContainText('value = apple');
    await expect(select.readoutIn('reactive')).toContainText('control.value = banana');
    await expect(select.readoutIn('signal')).toContainText('value = null');

    const signalTrigger = select.triggerIn(select.signalSection, 'Fruit (signal forms)');
    await select.openVia(signalTrigger);
    await select.optionByLabel('Date').click();
    await select.waitForClosed();

    await expect(select.readoutIn('td')).toContainText('value = apple');
    await expect(select.readoutIn('reactive')).toContainText('control.value = banana');
    await expect(select.readoutIn('signal')).toContainText('value = date');
  });
});
