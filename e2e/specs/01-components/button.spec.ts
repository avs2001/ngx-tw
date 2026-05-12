import { expect, test } from '../../fixtures/base';
import { ButtonPage } from '../../pages/button.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Button interaction + a11y suite.
 *
 * Per `chapter 04 §Button`:
 *   - Anchor mode (`<a twButton>`) renders as a real link with `href`.
 *   - `loading` adds `aria-busy="true"` and `aria-disabled="true"` so clicks
 *     are blocked (the spinner is composed via `<tw-spinner color="current">`
 *     — its visual presence is left to smoke / visual regression).
 *   - `disabled` enforcement uses the native `disabled` attribute on
 *     `<button>` and `aria-disabled` on `<a>`.
 *   - `twButtonIcon` directive renders inside the button.
 */
test.describe('Button', () => {
  test('@interaction anchor mode renders an <a> with href', async ({ page }) => {
    const btn = new ButtonPage(page);
    await btn.goto();

    const defaultLink = btn.anchorSection.getByRole('link', { name: 'Default link' });
    await expect(defaultLink).toHaveAttribute('href', '#');
  });

  test('@a11y loading button advertises aria-busy + aria-disabled while in-flight', async ({
    page,
  }) => {
    const btn = new ButtonPage(page);
    await btn.goto();

    const save = btn.statesSection.getByRole('button', { name: 'Save' });
    await expect(save).not.toHaveAttribute('aria-busy', /.+/);

    await btn.statesSection.getByRole('button', { name: 'Toggle loading' }).click();
    // Save flips to "Saving..." while loading is true.
    const saving = btn.statesSection.getByRole('button', { name: 'Saving...' });
    await expect(saving).toHaveAttribute('aria-busy', 'true');
    await expect(saving).toHaveAttribute('aria-disabled', 'true');

    // Restore for cleanliness — toggling again switches the loading flag off.
    await btn.statesSection.getByRole('button', { name: 'Toggle loading' }).click();
  });

  test('@a11y disabled <button> uses the native disabled attribute', async ({ page }) => {
    const btn = new ButtonPage(page);
    await btn.goto();

    // The Disabled row in States renders one disabled button per variant.
    const disabled = btn.statesSection.locator('button[disabled]').first();
    await expect(disabled).toBeDisabled();
  });

  test('@interaction twButtonIcon directive projects an icon inside the button', async ({
    page,
  }) => {
    const btn = new ButtonPage(page);
    await btn.goto();

    // Every button in the With Icons section projects at least one svg with
    // the [twButtonIcon] attribute.
    const icons = btn.iconsSection.locator('button [twButtonIcon], button [twButtonIcon="trailing"]');
    expect(await icons.count()).toBeGreaterThan(0);
  });
});
