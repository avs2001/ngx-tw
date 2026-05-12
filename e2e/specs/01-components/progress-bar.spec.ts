import { expect, test } from '../../fixtures/base';
import { ProgressBarPage } from '../../pages/progress-bar.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Progress bar interaction + a11y suite.
 *
 * Per `chapter 04 §Progress Bar`:
 *   - Determinate: `aria-valuenow` mirrors the value; `aria-busy` is absent.
 *   - Indeterminate: `aria-valuenow` is dropped and `aria-busy="true"` is
 *     set; the visible animation runs (smoke + reduced-motion covers visuals).
 *   - Segmented variant: clicking Next adds another filled segment.
 *   - `valueFormatter` mirrors into `aria-valuetext`.
 */
test.describe('Progress Bar', () => {
  test('@a11y determinate bar populates aria-valuenow and omits aria-busy', async ({ page }) => {
    const bar = new ProgressBarPage(page);
    await bar.goto();

    const determinate = bar.statesSection
      .locator('tw-progress-bar')
      .filter({ hasText: 'Rendering report' });
    const role = determinate.getByRole('progressbar');
    await expect(role).toHaveAttribute('aria-valuenow', '42');
    await expect(role).toHaveAttribute('aria-valuemax', '100');
    await expect(role).not.toHaveAttribute('aria-busy', /.+/);
  });

  test('@a11y indeterminate bar drops aria-valuenow and sets aria-busy="true"', async ({ page }) => {
    const bar = new ProgressBarPage(page);
    await bar.goto();

    const indeterminate = bar.statesSection
      .locator('tw-progress-bar')
      .filter({ hasText: 'Waiting for server' });
    const role = indeterminate.getByRole('progressbar');
    await expect(role).toHaveAttribute('aria-busy', 'true');
    await expect(role).not.toHaveAttribute('aria-valuenow', /.+/);
  });

  test('@interaction segmented variant advances one filled cell per Next click', async ({
    page,
  }) => {
    const bar = new ProgressBarPage(page);
    await bar.goto();

    const segmented = bar.variantsSection.locator('tw-progress-bar[variant="segmented"]');
    const role = segmented.getByRole('progressbar');
    // Demo starts step=1, value=25.
    await expect(role).toHaveAttribute('aria-valuenow', '25');

    await bar.variantsSection.getByRole('button', { name: 'Next' }).click();
    await expect(role).toHaveAttribute('aria-valuenow', '50');

    await bar.variantsSection.getByRole('button', { name: 'Next' }).click();
    await expect(role).toHaveAttribute('aria-valuenow', '75');
  });

  test('@a11y custom valueFormatter mirrors to aria-valuetext', async ({ page }) => {
    const bar = new ProgressBarPage(page);
    await bar.goto();

    // The formatter section uses `formatBytes` — the visible string contains
    // " / " (e.g. "12 MB / 24 MB"). Confirm aria-valuetext carries that text.
    const role = bar.formatterSection.locator('tw-progress-bar').first().getByRole('progressbar');
    const valuetext = await role.getAttribute('aria-valuetext');
    expect(valuetext, 'aria-valuetext should be present').toBeTruthy();
    expect(valuetext).toMatch(/\//);
  });
});
