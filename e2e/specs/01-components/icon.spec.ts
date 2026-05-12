import { expect, test } from '../../fixtures/base';
import { IconPage } from '../../pages/icon.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Icon interaction + a11y suite.
 *
 * Per `chapter 04 §Badge / Spinner / Skeleton / Icon`:
 * the ariaLabel ↔ aria-hidden / role="img" toggle is the one
 * observable behaviour smoke + axe sweeps don't directly cover.
 * The variant/color/size matrix is left to those existing sweeps.
 */
test.describe('Icon', () => {
  test('@a11y default icon is hidden from the accessibility tree', async ({ page }) => {
    const icon = new IconPage(page);
    await icon.goto();

    // Color inheritance section has decorative icons next to visible text —
    // these are the canonical "icon is purely decorative" case.
    const decorative = icon.colorInheritanceSection.locator('tw-icon svg').first();
    await expect(decorative).toHaveAttribute('aria-hidden', 'true');
    await expect(decorative).not.toHaveAttribute('role', /.+/);
    await expect(decorative).not.toHaveAttribute('aria-label', /.+/);
  });

  test('@a11y ariaLabel flips aria-hidden → role="img" + aria-label', async ({ page }) => {
    const icon = new IconPage(page);
    await icon.goto();

    // The Accessibility section's first icon has ariaLabel="Synchronised".
    const labelled = icon.accessibilitySection.locator('tw-icon svg').first();
    await expect(labelled).toHaveAttribute('role', 'img');
    await expect(labelled).toHaveAttribute('aria-label', 'Synchronised');
    await expect(labelled).not.toHaveAttribute('aria-hidden', /.+/);
  });
});
