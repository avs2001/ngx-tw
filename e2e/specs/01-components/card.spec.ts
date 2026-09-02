import { expect, test } from '../../fixtures/base';
import { CardPage } from '../../pages/card.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Card interaction + a11y suite.
 *
 * Per `chapter 04 §Card`:
 *   - Card template is just `<ng-content />` — slots are attribute
 *     directives on consumer-owned elements (`[twCardHeader|Body|Footer|Media]`).
 *   - Omitting `[twCardHeader]` or `[twCardFooter]` leaves no header- or
 *     footer-styled element in the DOM (absence is observable).
 *
 * Visual states (`elevated` hover shadow, `outline` + color compound) are
 * left to smoke/visual regression.
 */
test.describe('Card', () => {
  test('@interaction Variants section renders the documented header / body / footer composition', async ({
    page,
  }) => {
    const card = new CardPage(page);
    await card.goto();

    // Each card in the Variants section has all three slots projected; the
    // header reads "Starter plan", the body has the dummy copy, and the
    // footer prints the variant name.
    const variantsCards = card.variantsSection.locator('tw-card');
    await expect(variantsCards).toHaveCount(3);

    for (let i = 0; i < 3; i++) {
      const c = variantsCards.nth(i);
      await expect(c.locator('[twCardHeader]')).toHaveCount(1);
      await expect(c.locator('[twCardBody]')).toHaveCount(1);
      await expect(c.locator('[twCardFooter]')).toHaveCount(1);
    }
  });

  test('@interaction Body-only card omits header and footer markers entirely', async ({ page }) => {
    const card = new CardPage(page);
    await card.goto();

    const bodyOnly = card.bodyOnlySection.locator('tw-card');
    await expect(bodyOnly.locator('[twCardBody]')).toHaveCount(1);
    await expect(bodyOnly.locator('[twCardHeader]')).toHaveCount(0);
    await expect(bodyOnly.locator('[twCardFooter]')).toHaveCount(0);
  });
});
