import { expect, test } from '../../../fixtures/base';
import { SegmentedControlPage } from '../../../pages/segmented-control.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Three-strategy contract — `SegmentedControl`.
 *
 * Synchronous-control family. The visible mono-font readout mirrors the
 * bound value. Sections anchored by H2 (Phase 0b markers not wired).
 */
test.describe('Forms · Three strategies · Segmented Control', () => {
  // Template-Driven
  test('@forms @td template-driven: programmatic set propagates to aria-checked', async ({ page }) => {
    const seg = new SegmentedControlPage(page);
    await seg.goto();

    // Initial: tdView = signal('list').
    await expect(seg.optionIn('td', 'List')).toHaveAttribute('aria-checked', 'true');

    await seg.buttonIn('td', 'Set grid').click();
    await expect(seg.optionIn('td', 'Grid')).toHaveAttribute('aria-checked', 'true');
    await expect(seg.optionIn('td', 'List')).toHaveAttribute('aria-checked', 'false');
    await expect(seg.readoutIn('td')).toContainText('value = grid');

    await seg.buttonIn('td', 'Clear').click();
    await expect(seg.readoutIn('td')).toContainText('value = null');
    await expect(seg.groupIn('td').locator('[role="radio"][aria-checked="true"]')).toHaveCount(0);
  });

  test('@forms @td template-driven: user click flows into the bound signal', async ({ page }) => {
    const seg = new SegmentedControlPage(page);
    await seg.goto();

    await seg.optionIn('td', 'Table').click();
    await expect(seg.readoutIn('td')).toContainText('value = table');
  });

  // Reactive
  test('@forms @reactive reactive: setValue propagates to aria-checked', async ({ page }) => {
    const seg = new SegmentedControlPage(page);
    await seg.goto();

    await seg.buttonIn('reactive', 'Set table').click();
    await expect(seg.optionIn('reactive', 'Table')).toHaveAttribute('aria-checked', 'true');
    await expect(seg.readoutIn('reactive')).toContainText('control.value = table');
  });

  test('@forms @reactive reactive: reset() clears the selected value', async ({ page }) => {
    const seg = new SegmentedControlPage(page);
    await seg.goto();

    await seg.optionIn('reactive', 'Table').click();
    await expect(seg.readoutIn('reactive')).toContainText('control.value = table');

    await seg.buttonIn('reactive', 'Reset').click();
    await expect(seg.readoutIn('reactive')).toContainText('control.value = null');
    await expect(seg.groupIn('reactive').locator('[role="radio"][aria-checked="true"]')).toHaveCount(0);
  });

  test('@forms @reactive reactive: disable() blocks click and writes aria-disabled', async ({ page }) => {
    const seg = new SegmentedControlPage(page);
    await seg.goto();

    const group = seg.groupIn('reactive');
    await seg.buttonIn('reactive', 'Disable').click();
    await expect(group).toHaveAttribute('aria-disabled', 'true');
    await expect(seg.readoutIn('reactive')).toContainText('disabled = true');

    await seg.optionIn('reactive', 'Table').click({ force: true });
    // Initial value is 'grid' — should not have flipped.
    await expect(seg.readoutIn('reactive')).toContainText('control.value = grid');
  });

  // Signal Forms
  test('@forms @signal signal-forms: programmatic set propagates to aria-checked', async ({ page }) => {
    const seg = new SegmentedControlPage(page);
    await seg.goto();

    await seg.buttonIn('signal', 'Set table').click();
    await expect(seg.optionIn('signal', 'Table')).toHaveAttribute('aria-checked', 'true');
    await expect(seg.readoutIn('signal')).toContainText('value = table');
  });

  test('@forms @signal signal-forms: user click updates the field signal', async ({ page }) => {
    const seg = new SegmentedControlPage(page);
    await seg.goto();

    await seg.optionIn('signal', 'Grid').click();
    await expect(seg.readoutIn('signal')).toContainText('value = grid');
  });

  test('@forms @signal signal-forms: reset() resets validation state (touched)', async ({ page }) => {
    // No-arg Signal Forms reset clears touched/dirty but not value.
    const seg = new SegmentedControlPage(page);
    await seg.goto();

    await seg.optionIn('signal', 'Grid').click();

    // `touched` flips on blur, not on change — aligned with Angular's native
    // controls in audit pass 4 (previously these controls marked themselves
    // touched from the change handler, so errors appeared a gesture early).
    // Blur explicitly before asserting; the click alone no longer suffices.
    await seg.optionIn('signal', 'Grid').blur();
    await expect(seg.readoutIn('signal')).toContainText('touched = true');

    await seg.buttonIn('signal', 'Reset').click();
    await expect(seg.readoutIn('signal')).toContainText('touched = false');
  });

  // Cross-strategy parity
  test('@forms cross-strategy: changing one strategy does not leak into the others', async ({ page }) => {
    const seg = new SegmentedControlPage(page);
    await seg.goto();

    await seg.optionIn('td', 'Grid').click();
    await seg.optionIn('reactive', 'Table').click();
    await seg.optionIn('signal', 'Grid').click();

    await expect(seg.readoutIn('td')).toContainText('value = grid');
    await expect(seg.readoutIn('reactive')).toContainText('control.value = table');
    await expect(seg.readoutIn('signal')).toContainText('value = grid');
  });
});
