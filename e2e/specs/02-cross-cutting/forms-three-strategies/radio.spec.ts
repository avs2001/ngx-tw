import { expect, test } from '../../../fixtures/base';
import { RadioPage } from '../../../pages/radio.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Three-strategy contract — `RadioGroup`.
 *
 * Synchronous-control family. The bound value is the radio group's
 * `value` model; the visible mono-font readout mirrors it.
 *
 * **NOTE — Phase 0b markers not wired** for radio either; sections are
 * anchored by H2.
 */
test.describe('Forms · Three strategies · Radio', () => {
  // Template-Driven
  test('@forms @td template-driven: programmatic set propagates to aria-checked', async ({ page }) => {
    const radio = new RadioPage(page);
    await radio.goto();

    const red = radio.radioIn('td', 'Red');
    await expect(red).toHaveAttribute('aria-checked', 'true');

    await radio.buttonIn('td', 'Set green').click();
    const green = radio.radioIn('td', 'Green');
    await expect(green).toHaveAttribute('aria-checked', 'true');
    await expect(red).toHaveAttribute('aria-checked', 'false');
    await expect(radio.readoutIn('td')).toContainText('value = green');

    await radio.buttonIn('td', 'Clear').click();
    await expect(radio.readoutIn('td')).toContainText('value = null');
    await expect(radio.groupIn('td').locator('[role="radio"][aria-checked="true"]')).toHaveCount(0);
  });

  test('@forms @td template-driven: user click flows into the bound signal', async ({ page }) => {
    const radio = new RadioPage(page);
    await radio.goto();

    await radio.radioIn('td', 'Blue').click();
    await expect(radio.readoutIn('td')).toContainText('value = blue');
  });

  // Reactive
  test('@forms @reactive reactive: setValue propagates to aria-checked', async ({ page }) => {
    const radio = new RadioPage(page);
    await radio.goto();

    await radio.buttonIn('reactive', 'Set express').click();
    await expect(radio.radioIn('reactive', /^Express/)).toHaveAttribute('aria-checked', 'true');
    await expect(radio.readoutIn('reactive')).toContainText('control.value = express');
  });

  test('@forms @reactive reactive: user click updates control.value', async ({ page }) => {
    const radio = new RadioPage(page);
    await radio.goto();

    await radio.radioIn('reactive', /^Express/).click();
    await expect(radio.readoutIn('reactive')).toContainText('control.value = express');
  });

  test('@forms @reactive reactive: disable() blocks click and writes aria-disabled', async ({ page }) => {
    const radio = new RadioPage(page);
    await radio.goto();

    const group = radio.groupIn('reactive');
    await expect(group).not.toHaveAttribute('aria-disabled', 'true');

    await radio.buttonIn('reactive', 'Disable').click();
    await expect(group).toHaveAttribute('aria-disabled', 'true');

    const express = radio.radioIn('reactive', /^Express/);
    await express.click({ force: true });
    // Standard value remains; the demo control defaults to 'standard'.
    await expect(radio.readoutIn('reactive')).toContainText('control.value = standard');
  });

  test('@forms @reactive reactive: reset() clears the selected value', async ({ page }) => {
    const radio = new RadioPage(page);
    await radio.goto();

    await radio.radioIn('reactive', /^Express/).click();
    await expect(radio.readoutIn('reactive')).toContainText('control.value = express');

    await radio.buttonIn('reactive', 'Reset').click();
    await expect(radio.readoutIn('reactive')).toContainText('control.value = null');
    await expect(radio.groupIn('reactive').locator('[role="radio"][aria-checked="true"]')).toHaveCount(0);
  });

  // Signal Forms
  test('@forms @signal signal-forms: programmatic set propagates to aria-checked', async ({ page }) => {
    const radio = new RadioPage(page);
    await radio.goto();

    await radio.buttonIn('signal', 'Set pro').click();
    await expect(radio.radioIn('signal', /^Pro/)).toHaveAttribute('aria-checked', 'true');
    await expect(radio.readoutIn('signal')).toContainText('value = pro');
  });

  test('@forms @signal signal-forms: user click updates the field signal', async ({ page }) => {
    const radio = new RadioPage(page);
    await radio.goto();

    await radio.radioIn('signal', /^Team/).click();
    await expect(radio.readoutIn('signal')).toContainText('value = team');
  });

  test('@forms @signal signal-forms: reset() resets validation state (touched)', async ({ page }) => {
    // No-arg Signal Forms reset clears touched/dirty but not value
    // (see forms-three-strategies/README.md §"Signal Forms reset is not symmetric").
    const radio = new RadioPage(page);
    await radio.goto();

    await radio.radioIn('signal', /^Pro/).click();

    // `touched` flips on blur, not on change — aligned with Angular's native
    // controls in audit pass 4 (previously these controls marked themselves
    // touched from the change handler, so errors appeared a gesture early).
    // Blur explicitly before asserting; the click alone no longer suffices.
    await radio.radioIn('signal', /^Pro/).blur();
    await expect(radio.readoutIn('signal')).toContainText('touched = true');

    await radio.buttonIn('signal', 'Reset').click();
    await expect(radio.readoutIn('signal')).toContainText('touched = false');
  });

  // Cross-strategy parity
  test('@forms cross-strategy: clicking in one strategy does not leak into the others', async ({ page }) => {
    const radio = new RadioPage(page);
    await radio.goto();

    await radio.radioIn('td', 'Green').click();
    await radio.radioIn('reactive', /^Express/).click();
    await radio.radioIn('signal', /^Pro/).click();

    await expect(radio.readoutIn('td')).toContainText('value = green');
    await expect(radio.readoutIn('reactive')).toContainText('control.value = express');
    await expect(radio.readoutIn('signal')).toContainText('value = pro');
  });
});
