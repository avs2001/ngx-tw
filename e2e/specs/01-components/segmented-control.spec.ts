import { expect, test } from '../../fixtures/base';
import { SegmentedControlPage } from '../../pages/segmented-control.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Segmented control interaction + a11y suite.
 *
 * Per `chapter 04 §Segmented Control` + REVIEW.md:
 *   - Selecting an option emits change; only one is selected.
 *   - Disabled segment is skipped on keyboard nav (parent + per-option
 *     disabled compose via `isDisabled`).
 *   - Home / End jump to first / last enabled option.
 *   - `aria-orientation` reflects the orientation input.
 */
test.describe('Segmented Control', () => {
  test('@a11y default render: role=radiogroup with radio options + aria-orientation', async ({ page }) => {
    const seg = new SegmentedControlPage(page);
    await seg.goto();

    const group = seg.variantsSection.getByRole('radiogroup').first();
    await expect(group).toBeVisible();
    await expect(group).toHaveAttribute('aria-orientation', 'horizontal');
    // Each option has role=radio.
    await expect(group.getByRole('radio')).toHaveCount(3);
  });

  test('@interaction click selects exactly one option', async ({ page }) => {
    const seg = new SegmentedControlPage(page);
    await seg.goto();

    // Use the icon-section group which starts with `grid` selected.
    const group = seg.iconsSection.getByRole('radiogroup');
    const list = group.getByRole('radio', { name: 'List' });
    await expect(list).toHaveAttribute('aria-checked', 'false');
    await list.click();
    await expect(list).toHaveAttribute('aria-checked', 'true');
    await expect(group.locator('[role="radio"][aria-checked="true"]')).toHaveCount(1);
  });

  test('@interaction @keyboard ArrowRight cycles and skips disabled options', async ({ page }) => {
    const seg = new SegmentedControlPage(page);
    await seg.goto();

    // States section: Free/Pro/Enterprise-disabled. Start at 'free' (default).
    const plan = seg.statesSection.getByRole('radiogroup', { name: /plan/i });
    const free = plan.getByRole('radio', { name: 'Free' });
    const pro = plan.getByRole('radio', { name: 'Pro' });

    await free.focus();
    await page.keyboard.press('ArrowRight');
    await expect(pro).toHaveAttribute('aria-checked', 'true');

    // Pressing ArrowRight again would target the disabled Enterprise option;
    // the keyboard handler skips it and wraps to Free.
    await page.keyboard.press('ArrowRight');
    await expect(free).toHaveAttribute('aria-checked', 'true');
  });

  test('@interaction @keyboard Home / End jump to first / last enabled option', async ({ page }) => {
    const seg = new SegmentedControlPage(page);
    await seg.goto();

    // Use the Colors section: 3 options each, no disabled.
    const group = seg.colorsSection.getByRole('radiogroup').first();
    const first = group.getByRole('radio').first();
    const last = group.getByRole('radio').last();

    await first.click();
    await page.keyboard.press('End');
    await expect(last).toHaveAttribute('aria-checked', 'true');

    await page.keyboard.press('Home');
    await expect(first).toHaveAttribute('aria-checked', 'true');
  });

  test('@interaction whole-group disabled blocks click', async ({ page }) => {
    const seg = new SegmentedControlPage(page);
    await seg.goto();

    const theme = seg.statesSection.getByRole('radiogroup', { name: /theme/i });
    await expect(theme).toHaveAttribute('aria-disabled', 'true');
    const dark = theme.getByRole('radio', { name: 'Dark' });
    await dark.click({ force: true });
    // Initial demo value is 'light'; assert dark did not flip.
    await expect(dark).toHaveAttribute('aria-checked', 'false');
  });

  test('@a11y aria-orientation switches with orientation input', async ({ page }) => {
    const seg = new SegmentedControlPage(page);
    await seg.goto();

    const vertical = seg.orientationSection.getByRole('radiogroup', { name: /alignment/i });
    await expect(vertical).toHaveAttribute('aria-orientation', 'vertical');
  });

  test('@a11y roving tabindex: only the selected option is tabindex=0', async ({ page }) => {
    const seg = new SegmentedControlPage(page);
    await seg.goto();

    const group = seg.iconsSection.getByRole('radiogroup');
    const tabZero = group.locator('[role="radio"][tabindex="0"]');
    await expect(tabZero).toHaveCount(1);
    await expect(tabZero).toHaveAccessibleName(/^Grid$/);
  });
});
