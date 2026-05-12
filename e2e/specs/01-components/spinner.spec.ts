import { expect, test } from '../../fixtures/base';
import { SpinnerPage } from '../../pages/spinner.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Spinner interaction + a11y suite.
 *
 * Per `chapter 04 §Badge / Spinner / Skeleton / Icon`:
 *   - `role="status"` + polite live region for screen readers.
 *   - Composes inside buttons via `color="current"` so it inherits the
 *     button's text color when shown via `[loading]`.
 *
 * The variant/color/size matrix and the visual rotation are covered by
 * smoke + axe sweeps (with `reducedMotion: 'reduce'` for screenshots).
 */
test.describe('Spinner', () => {
  test('@a11y exposes role="status" with a polite live region and a visually hidden label', async ({
    page,
  }) => {
    const spinner = new SpinnerPage(page);
    await spinner.goto();

    const first = spinner.variantsSection.locator('tw-spinner').first();
    await expect(first).toHaveAttribute('role', 'status');
    await expect(first).toHaveAttribute('aria-live', 'polite');

    // Default `label` input is `'Loading'` and renders inside a visually
    // hidden span — assert the text node is present in the DOM (accessible
    // name from `role="status"` is not derived from descendants by the WAI
    // ARIA name-computation algorithm, so we check the rendered span).
    await expect(first).toContainText('Loading');
  });

  test('@interaction shows inside a button when [loading] is set, hides after the timer', async ({
    page,
  }) => {
    const spinner = new SpinnerPage(page);
    await spinner.goto();

    const save = spinner.buttonsSection.getByRole('button', { name: 'Save' });
    await expect(save.locator('tw-spinner')).toHaveCount(0);
    await save.click();
    // The demo toggles `loadingSolid` for 2s; the spinner appears immediately
    // after the click.
    await expect(save.locator('tw-spinner')).toHaveCount(1);

    // Auto-resolves back to idle ≈2s later.
    await expect(save.locator('tw-spinner')).toHaveCount(0, { timeout: 4000 });
  });
});
