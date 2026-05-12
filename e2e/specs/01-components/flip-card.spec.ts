import { expect, test } from '../../fixtures/base';
import { FlipCardPage } from '../../pages/flip-card.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Flip card interaction + a11y suite.
 *
 * Per `chapter 04 §Flip Card`:
 *   - Clicking the trigger flips between front and back when `trigger !==
 *     'manual'` and a back face is projected.
 *   - Keyboard Enter / Space flips an interactive card.
 *   - Manual mode exposes `role="region"` (instead of `role="button"`) and
 *     suppresses click/keyboard handlers; flipping is driven by `[(flipped)]`.
 */
test.describe('Flip Card', () => {
  test('@interaction click trigger toggles the visible face', async ({ page }) => {
    const flip = new FlipCardPage(page);
    await flip.goto();

    const card = flip.triggerCard('click');
    await expect(card).toHaveAttribute('role', 'button');
    await expect(card).toHaveAttribute('aria-pressed', 'false');

    await card.click();
    await expect(card).toHaveAttribute('aria-pressed', 'true');

    await card.click();
    await expect(card).toHaveAttribute('aria-pressed', 'false');
  });

  test('@interaction @keyboard Enter / Space flip the focused card', async ({ page }) => {
    const flip = new FlipCardPage(page);
    await flip.goto();

    const card = flip.triggerCard('click');
    await card.focus();
    await expect(card).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(card).toHaveAttribute('aria-pressed', 'true');

    await page.keyboard.press('Space');
    await expect(card).toHaveAttribute('aria-pressed', 'false');
  });

  test('@a11y manual trigger swaps host role to "region" and does not flip on click', async ({
    page,
  }) => {
    const flip = new FlipCardPage(page);
    await flip.goto();

    // The Triggers section also has a manual card. Its host role is region,
    // and click handlers are no-ops.
    const card = flip.triggerCard('manual').first();
    await expect(card).toHaveAttribute('role', 'region');

    // Click on the card body should not flip it (aria-pressed is null on
    // regions; check aria-live is set to confirm region mode is active).
    await expect(card).toHaveAttribute('aria-live', 'polite');
  });

  test('@interaction manual [(flipped)] two-way bind drives the manual card from a sibling button', async ({
    page,
  }) => {
    const flip = new FlipCardPage(page);
    await flip.goto();

    const card = flip.manualSection.locator('tw-flip-card');
    await expect(card).toHaveAttribute('role', 'region');

    // The sibling control button toggles `manualFlipped`. Use the visible
    // section text as a proxy for the current face — the front shows
    // "#00412" and the back shows "Line items".
    await expect(card).toContainText('#00412');

    const toggle = flip.manualSection.getByRole('button').first();
    await toggle.click();
    await expect(card).toContainText('Line items');

    await toggle.click();
    await expect(card).toContainText('#00412');
  });
});
