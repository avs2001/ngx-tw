import { expect, test } from '../../../fixtures/base';
import { CheckboxPage } from '../../../pages/checkbox.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Three-strategy contract — `Checkbox`.
 *
 * Synchronous-control family (chapter 05 §5.1, forms-three-strategies/README):
 *   `reset()` → DOM matches default; bound value flips to default. Checkbox
 *   exposes a `(change)` output, but the demo doesn't expose it via a
 *   readout — the visible `value = …` readout (mirroring the bound model)
 *   is the observable substitute.
 *
 * **NOTE — Phase 0b markers not yet wired.** The checkbox examples page does
 * not carry `data-section` / `data-testid="value-readout"` markers today, so
 * the strategy sections are anchored by H2 (CheckboxPage). When Phase 0b
 * lands those markers, swap the POM accessors to the canonical pattern.
 */
test.describe('Forms · Three strategies · Checkbox', () => {
  // ────────────────────────────────────────────────────────────
  // Template-Driven (ngModel)
  // ────────────────────────────────────────────────────────────

  test('@forms @td template-driven: programmatic set propagates to aria-checked', async ({ page }) => {
    const checkbox = new CheckboxPage(page);
    await checkbox.goto();

    const el = checkbox.checkboxIn('td');
    await expect(el).toHaveAttribute('aria-checked', 'false');

    await checkbox.buttonIn('td', 'Set true').click();
    await expect(el).toHaveAttribute('aria-checked', 'true');
    await expect(checkbox.readoutIn('td')).toContainText('value = true');

    await checkbox.buttonIn('td', 'Set false').click();
    await expect(el).toHaveAttribute('aria-checked', 'false');
    await expect(checkbox.readoutIn('td')).toContainText('value = false');
  });

  test('@forms @td template-driven: user click flows into the bound signal', async ({ page }) => {
    const checkbox = new CheckboxPage(page);
    await checkbox.goto();

    const el = checkbox.checkboxIn('td');
    await el.click();

    await expect(el).toHaveAttribute('aria-checked', 'true');
    await expect(checkbox.readoutIn('td')).toContainText('value = true');
  });

  // ────────────────────────────────────────────────────────────
  // Reactive (FormControl)
  // ────────────────────────────────────────────────────────────

  test('@forms @reactive reactive: setValue propagates to aria-checked', async ({ page }) => {
    const checkbox = new CheckboxPage(page);
    await checkbox.goto();

    const el = checkbox.checkboxIn('reactive');
    await expect(el).toHaveAttribute('aria-checked', 'false');

    await checkbox.buttonIn('reactive', 'Set true').click();
    await expect(el).toHaveAttribute('aria-checked', 'true');
    await expect(checkbox.readoutIn('reactive')).toContainText('control.value = true');

    await checkbox.buttonIn('reactive', 'Set false').click();
    await expect(el).toHaveAttribute('aria-checked', 'false');
    await expect(checkbox.readoutIn('reactive')).toContainText('control.value = false');
  });

  test('@forms @reactive reactive: disable() writes through to aria-disabled and blocks click', async ({
    page,
  }) => {
    const checkbox = new CheckboxPage(page);
    await checkbox.goto();

    const el = checkbox.checkboxIn('reactive');
    await expect(el).not.toHaveAttribute('aria-disabled', 'true');

    await checkbox.buttonIn('reactive', 'Disable').click();
    await expect(el).toHaveAttribute('aria-disabled', 'true');
    await expect(checkbox.readoutIn('reactive')).toContainText('disabled = true');

    // Forced click on a pointer-events:none target should not flip the value.
    await el.click({ force: true });
    await expect(checkbox.readoutIn('reactive')).toContainText('control.value = false');

    await checkbox.buttonIn('reactive', 'Enable').click();
    await expect(el).not.toHaveAttribute('aria-disabled', 'true');
  });

  // ────────────────────────────────────────────────────────────
  // Signal Forms
  // ────────────────────────────────────────────────────────────

  test('@forms @signal signal-forms: programmatic set propagates to aria-checked', async ({ page }) => {
    const checkbox = new CheckboxPage(page);
    await checkbox.goto();

    const el = checkbox.checkboxIn('signal');
    await expect(el).toHaveAttribute('aria-checked', 'false');

    await checkbox.buttonIn('signal', 'Set true').click();
    await expect(el).toHaveAttribute('aria-checked', 'true');
    await expect(checkbox.readoutIn('signal')).toContainText('value = true');
  });

  test('@forms @signal signal-forms: user click updates the bound signal field', async ({ page }) => {
    const checkbox = new CheckboxPage(page);
    await checkbox.goto();

    const el = checkbox.checkboxIn('signal');
    await el.click();

    await expect(el).toHaveAttribute('aria-checked', 'true');
    await expect(checkbox.readoutIn('signal')).toContainText('value = true');
  });

  test('@forms @signal signal-forms: reset() resets validation state (touched)', async ({ page }) => {
    // Signal Forms' `FieldState.reset()` (no-arg form, as wired in the demo)
    // resets touched/dirty but does NOT clear the value. This differs from
    // `FormControl.reset()` (reactive), which clears both. See
    // `forms-three-strategies/README.md` §"Signal Forms reset is not symmetric".
    const checkbox = new CheckboxPage(page);
    await checkbox.goto();

    const el = checkbox.checkboxIn('signal');
    await el.click();
    await expect(el).toHaveAttribute('aria-checked', 'true');

    // `touched` flips on blur, not on change — aligned with Angular's native
    // controls in audit pass 4 (previously these controls marked themselves
    // touched from the change handler, so errors appeared a gesture early).
    // Blur explicitly before asserting; the click alone no longer suffices.
    await el.blur();
    await expect(checkbox.readoutIn('signal')).toContainText('touched = true');

    await checkbox.buttonIn('signal', 'Reset').click();
    await expect(checkbox.readoutIn('signal')).toContainText('touched = false');
    // Value is NOT cleared by no-arg reset — the demo's button does not
    // pass an initial value. Assert that explicitly so a regression to
    // value-clearing semantics is loud.
    await expect(el).toHaveAttribute('aria-checked', 'true');
  });

  // ────────────────────────────────────────────────────────────
  // Cross-strategy parity
  // ────────────────────────────────────────────────────────────

  test('@forms cross-strategy: clicking in one strategy does not leak into the others', async ({ page }) => {
    const checkbox = new CheckboxPage(page);
    await checkbox.goto();

    await checkbox.checkboxIn('td').click();
    await expect(checkbox.readoutIn('td')).toContainText('value = true');
    await expect(checkbox.readoutIn('reactive')).toContainText('control.value = false');
    await expect(checkbox.readoutIn('signal')).toContainText('value = false');

    await checkbox.checkboxIn('reactive').click();
    await expect(checkbox.readoutIn('td')).toContainText('value = true');
    await expect(checkbox.readoutIn('reactive')).toContainText('control.value = true');
    await expect(checkbox.readoutIn('signal')).toContainText('value = false');

    await checkbox.checkboxIn('signal').click();
    await expect(checkbox.readoutIn('td')).toContainText('value = true');
    await expect(checkbox.readoutIn('reactive')).toContainText('control.value = true');
    await expect(checkbox.readoutIn('signal')).toContainText('value = true');
  });
});
