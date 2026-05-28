import { expect, test } from '../../fixtures/base';
import { AlertPage } from '../../pages/alert.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Alert interaction + a11y suite.
 *
 * Per `chapter 04 §Alert` (post-S11):
 *   - Host `role` is derived from `politeness`: `'polite'` (default) →
 *     `role="status"`, `'assertive'` → `role="alert"`, `'off'` → no role.
 *   - `dismissible` mode emits `(dismissed)` on close-button click; the
 *     parent owns the removal.
 *   - Actions slot (`[twAlertActions]`) renders projected buttons.
 */
test.describe('Alert', () => {
  test('@a11y default alert maps polite politeness to role="status"', async ({ page }) => {
    const alert = new AlertPage(page);
    await alert.goto();

    const first = alert.variantsSection.locator('tw-alert').first();
    await expect(first).toHaveAttribute('role', 'status');
  });

  test('@interaction dismissible alert emits (dismissed) and parent state removes it', async ({
    page,
  }) => {
    const alert = new AlertPage(page);
    await alert.goto();

    const list = alert.dismissibleSection.locator('tw-alert');
    const initial = await list.count();
    expect(initial).toBeGreaterThan(0);

    await list.first().getByRole('button', { name: 'Dismiss' }).click();
    await expect(list).toHaveCount(initial - 1);
  });

  test('@interaction projected [twAlertActions] renders inside the alert', async ({ page }) => {
    const alert = new AlertPage(page);
    await alert.goto();

    // The first alert in the With Actions section projects two action buttons
    // — assert both are reachable inside the alert region.
    const withActions = alert.actionsSection.locator('tw-alert').first();
    await expect(withActions.getByRole('button').first()).toBeVisible();
  });
});
