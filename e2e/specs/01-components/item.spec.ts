import { expect, test } from '../../fixtures/base';
import { ItemPage } from '../../pages/item.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Item interaction + a11y suite.
 *
 * Per `chapter 04 §Item`:
 *   - `interactive` switches the host to `role="button"`, adds a focus ring,
 *     and emits `(selected)` on click / Enter / Space.
 *   - `disabled` swallows the `(selected)` emission while the click still
 *     fires — assertable via the demo's `lastSelected` readout.
 *
 * Slot composition (`twItemLeading|Title|Description|Trailing`) is exercised
 * indirectly by clicking on the rendered DOM produced from those slots.
 */
test.describe('Item', () => {
  test('@a11y interactive item exposes role="button"', async ({ page }) => {
    const item = new ItemPage(page);
    await item.goto();

    const first = item.interactiveSection.locator('tw-item').first();
    await expect(first).toHaveAttribute('role', 'button');
  });

  test('@interaction click emits (selected) and updates the parent readout', async ({ page }) => {
    const item = new ItemPage(page);
    await item.goto();

    await expect(item.lastSelectedReadout).toContainText('—');

    // The Interactive section's first row in the demo's PEOPLE array — we
    // anchor by the visible name to stay resilient to row reorderings.
    const adaRow = item.interactiveSection.locator('tw-item').filter({
      has: page.locator('[twItemTitle]', { hasText: /Ada Lovelace/ }),
    });
    await adaRow.click();
    await expect(item.lastSelectedReadout).toContainText('Ada Lovelace');
  });

  test('@interaction disabled item swallows (selected) — click does NOT update the readout', async ({
    page,
  }) => {
    const item = new ItemPage(page);
    await item.goto();

    // Margaret Hamilton has `status === 'suspended'` → disabled=true. Click
    // her row; the host click still fires but (selected) does not, so the
    // readout must stay at its current value.
    const margaret = item.interactiveSection.locator('tw-item').filter({
      has: page.locator('[twItemTitle]', { hasText: /Margaret Hamilton/ }),
    });
    await expect(margaret).toHaveAttribute('aria-disabled', 'true');

    // Establish a baseline by clicking an enabled row first.
    await item.interactiveSection
      .locator('tw-item')
      .filter({ has: page.locator('[twItemTitle]', { hasText: /Ada Lovelace/ }) })
      .click();
    await expect(item.lastSelectedReadout).toContainText('Ada Lovelace');

    await margaret.click({ force: true });
    // Still Ada — the suspended row did not emit (selected).
    await expect(item.lastSelectedReadout).toContainText('Ada Lovelace');
  });
});
