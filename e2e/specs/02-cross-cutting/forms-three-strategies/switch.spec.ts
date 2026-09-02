import { expect, test } from '../../../fixtures/base';
import { SwitchPage } from '../../../pages/switch.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Three-strategy contract — `Switch`.
 *
 * Synchronous-control family. Visible mono-font readout mirrors the
 * bound value. Sections anchored by H2 (Phase 0b markers not wired).
 */
test.describe('Forms · Three strategies · Switch', () => {
  // Template-Driven
  test('@forms @td template-driven: programmatic set propagates to aria-checked', async ({ page }) => {
    const sw = new SwitchPage(page);
    await sw.goto();

    const el = sw.switchIn('td');
    // Demo TD initial: tdNotifications = signal(true).
    await expect(el).toHaveAttribute('aria-checked', 'true');

    await sw.buttonIn('td', 'Set false').click();
    await expect(el).toHaveAttribute('aria-checked', 'false');
    await expect(sw.readoutIn('td')).toContainText('value = false');

    await sw.buttonIn('td', 'Set true').click();
    await expect(el).toHaveAttribute('aria-checked', 'true');
    await expect(sw.readoutIn('td')).toContainText('value = true');
  });

  test('@forms @td template-driven: user click flows into the bound signal', async ({ page }) => {
    const sw = new SwitchPage(page);
    await sw.goto();

    await sw.buttonIn('td', 'Set false').click();
    const el = sw.switchIn('td');
    await el.click();
    await expect(sw.readoutIn('td')).toContainText('value = true');
  });

  // Reactive
  test('@forms @reactive reactive: setValue propagates to aria-checked', async ({ page }) => {
    const sw = new SwitchPage(page);
    await sw.goto();

    const el = sw.switchIn('reactive');
    await expect(el).toHaveAttribute('aria-checked', 'false');

    await sw.buttonIn('reactive', 'Set true').click();
    await expect(el).toHaveAttribute('aria-checked', 'true');
    await expect(sw.readoutIn('reactive')).toContainText('control.value = true');
  });

  test('@forms @reactive reactive: disable() writes through and blocks click', async ({ page }) => {
    const sw = new SwitchPage(page);
    await sw.goto();

    const el = sw.switchIn('reactive');
    await sw.buttonIn('reactive', 'Disable').click();
    await expect(el).toHaveAttribute('aria-disabled', 'true');
    await expect(sw.readoutIn('reactive')).toContainText('disabled = true');

    await el.click({ force: true });
    await expect(sw.readoutIn('reactive')).toContainText('control.value = false');
  });

  // Signal Forms
  test('@forms @signal signal-forms: programmatic set propagates to aria-checked', async ({ page }) => {
    const sw = new SwitchPage(page);
    await sw.goto();

    await sw.buttonIn('signal', 'Set true').click();
    await expect(sw.switchIn('signal')).toHaveAttribute('aria-checked', 'true');
    await expect(sw.readoutIn('signal')).toContainText('value = true');
  });

  test('@forms @signal signal-forms: user click updates the field signal', async ({ page }) => {
    const sw = new SwitchPage(page);
    await sw.goto();

    await sw.switchIn('signal').click();
    await expect(sw.readoutIn('signal')).toContainText('value = true');
  });

  test('@forms @signal signal-forms: reset() resets validation state (touched)', async ({ page }) => {
    // No-arg Signal Forms reset clears touched/dirty but not value.
    const sw = new SwitchPage(page);
    await sw.goto();

    await sw.switchIn('signal').click();

    // `touched` flips on blur, not on change — aligned with Angular's native
    // controls in audit pass 4 (previously these controls marked themselves
    // touched from the change handler, so errors appeared a gesture early).
    // Blur explicitly before asserting; the click alone no longer suffices.
    await sw.switchIn('signal').blur();
    await expect(sw.readoutIn('signal')).toContainText('touched = true');

    await sw.buttonIn('signal', 'Reset').click();
    await expect(sw.readoutIn('signal')).toContainText('touched = false');
  });

  // Cross-strategy parity
  test('@forms cross-strategy: toggling in one strategy does not leak into the others', async ({ page }) => {
    const sw = new SwitchPage(page);
    await sw.goto();

    // Normalize TD to false first so all three start at false.
    await sw.buttonIn('td', 'Set false').click();

    await sw.switchIn('td').click();
    await expect(sw.readoutIn('td')).toContainText('value = true');
    await expect(sw.readoutIn('reactive')).toContainText('control.value = false');
    await expect(sw.readoutIn('signal')).toContainText('value = false');

    await sw.switchIn('reactive').click();
    await expect(sw.readoutIn('reactive')).toContainText('control.value = true');
    await expect(sw.readoutIn('signal')).toContainText('value = false');

    await sw.switchIn('signal').click();
    await expect(sw.readoutIn('signal')).toContainText('value = true');
  });
});
