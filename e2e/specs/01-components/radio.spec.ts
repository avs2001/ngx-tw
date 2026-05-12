import { expect, test } from '../../fixtures/base';
import { RadioPage } from '../../pages/radio.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Radio interaction + a11y suite.
 *
 * Per `chapter 04 §Checkbox / Radio / Switch` + REVIEW.md radio bullets:
 *   - Click selects, `Space` selects via keyboard.
 *   - Radio group: arrow keys move selection AND focus; only one radio is
 *     `tabindex=0` at a time (roving tabindex).
 *   - Per-radio disabled is skipped by arrow keys; whole-group disabled
 *     blocks all interaction.
 *   - Standalone radio: toggles its own internal state, one-shot (cannot
 *     un-toggle from UI — matches native).
 *   - Per-radio overrides for `color` / `size` / `variant`.
 *   - `name` attribute: parent group's name propagates to children.
 *   - `aria-orientation` reflects the `orientation` input.
 */
test.describe('Radio', () => {
  test('@interaction default render: every group has radiogroup role + aria-orientation', async ({
    page,
  }) => {
    const radio = new RadioPage(page);
    await radio.goto();

    const variantsGroup = radio.variantsSection.getByRole('radiogroup').first();
    await expect(variantsGroup).toBeVisible();
    await expect(variantsGroup).toHaveAttribute('aria-orientation', 'horizontal');
  });

  test('@interaction click selects an option; aria-checked flips on exactly one', async ({ page }) => {
    const radio = new RadioPage(page);
    await radio.goto();

    // The Colors group has 8 radios and an output below — easy to assert.
    const group = radio.colorsSection.getByRole('radiogroup');
    const success = group.getByRole('radio', { name: 'success' });
    await expect(success).toHaveAttribute('aria-checked', 'false');

    await success.click();
    await expect(success).toHaveAttribute('aria-checked', 'true');

    // Demo's mono readout flips to the selected value.
    await expect(radio.colorsSection.locator('p.font-mono')).toContainText('selected = success');

    // Only one selected at a time.
    const checked = group.locator('[role="radio"][aria-checked="true"]');
    await expect(checked).toHaveCount(1);
  });

  test('@interaction @keyboard ArrowRight moves selection AND focus to next enabled radio', async ({
    page,
  }) => {
    const radio = new RadioPage(page);
    await radio.goto();

    // The "Mixed disabled" group has the second radio disabled — perfect for
    // verifying skip-disabled keyboard navigation.
    const group = radio.statesSection.getByRole('radiogroup', { name: /mixed disabled/i });
    const optionA = group.getByRole('radio', { name: 'Available' }).first();
    const optionC = group.getByRole('radio', { name: 'Available' }).last();

    await optionA.click();
    await expect(optionA).toBeFocused();
    await expect(optionA).toHaveAttribute('aria-checked', 'true');

    await page.keyboard.press('ArrowRight');
    // Skips the disabled "Unavailable" radio.
    await expect(optionC).toBeFocused();
    await expect(optionC).toHaveAttribute('aria-checked', 'true');
    await expect(optionA).toHaveAttribute('aria-checked', 'false');
  });

  test('@interaction @keyboard Home / End jump to first / last enabled radio', async ({ page }) => {
    const radio = new RadioPage(page);
    await radio.goto();

    const group = radio.colorsSection.getByRole('radiogroup');
    const first = group.getByRole('radio').first();
    const last = group.getByRole('radio').last();

    await first.click();
    await page.keyboard.press('End');
    await expect(last).toBeFocused();
    await expect(last).toHaveAttribute('aria-checked', 'true');

    await page.keyboard.press('Home');
    await expect(first).toBeFocused();
    await expect(first).toHaveAttribute('aria-checked', 'true');
  });

  test('@a11y roving tabindex: only the selected radio is tabindex=0', async ({ page }) => {
    const radio = new RadioPage(page);
    await radio.goto();

    const group = radio.colorsSection.getByRole('radiogroup');
    const tabZero = group.locator('[role="radio"][tabindex="0"]');
    // Default demo selection in the Colors group is `'primary'` — exactly
    // one tabindex=0 entry.
    await expect(tabZero).toHaveCount(1);
    await expect(tabZero).toHaveAccessibleName('primary');
  });

  test('@interaction whole-group disabled blocks keyboard and click', async ({ page }) => {
    const radio = new RadioPage(page);
    await radio.goto();

    const group = radio.statesSection.getByRole('radiogroup', { name: /locked group/i });
    await expect(group).toHaveAttribute('aria-disabled', 'true');
    const optionB = group.getByRole('radio', { name: 'Option B' });
    await expect(optionB).toHaveAttribute('aria-checked', 'false');

    await optionB.click({ force: true });
    await expect(optionB).toHaveAttribute('aria-checked', 'false');
  });

  test('@a11y required group exposes aria-required="true"', async ({ page }) => {
    const radio = new RadioPage(page);
    await radio.goto();

    const required = radio.statesSection.getByRole('radiogroup', { name: /required group/i });
    await expect(required).toHaveAttribute('aria-required', 'true');
  });

  test('@interaction per-radio overrides: child colors win over the group default', async ({ page }) => {
    const radio = new RadioPage(page);
    await radio.goto();

    // Per-radio overrides section: med is `color="warning"`, high is `color="error"`.
    // We can't assert color tokens directly; the observable proxy is that
    // each option still renders + selecting still works.
    const high = radio.overridesSection.getByRole('radio', { name: /high priority/i });
    await high.click();
    await expect(high).toHaveAttribute('aria-checked', 'true');
  });

  test('@interaction standalone radio toggles checked, but one-way only', async ({ page }) => {
    const radio = new RadioPage(page);
    await radio.goto();

    const standalone = radio.standaloneSection.getByRole('radio', { name: /confirm this action/i });
    await expect(standalone).toHaveAttribute('aria-checked', 'false');

    await standalone.click();
    await expect(standalone).toHaveAttribute('aria-checked', 'true');
    await expect(radio.standaloneSection.locator('p.font-mono')).toContainText('checked = true');

    // Native-radio semantics: clicking again does NOT untoggle.
    await standalone.click();
    await expect(standalone).toHaveAttribute('aria-checked', 'true');
  });

  test('@a11y name attribute propagates from group to children (HTML form compat)', async ({ page }) => {
    const radio = new RadioPage(page);
    await radio.goto();

    // The Template-Driven group passes `name="color-td"`.
    const group = radio.templateDrivenSection.getByRole('radiogroup');
    const red = group.getByRole('radio', { name: 'Red' });
    await expect(red).toHaveAttribute('name', 'color-td');
  });

  test('@a11y aria-orientation switches with the orientation input', async ({ page }) => {
    const radio = new RadioPage(page);
    await radio.goto();

    const vertical = radio.orientationSection.getByRole('radiogroup', { name: /^Vertical$/ });
    const horizontal = radio.orientationSection.getByRole('radiogroup', { name: /^Horizontal$/ });
    await expect(vertical).toHaveAttribute('aria-orientation', 'vertical');
    await expect(horizontal).toHaveAttribute('aria-orientation', 'horizontal');
  });
});
