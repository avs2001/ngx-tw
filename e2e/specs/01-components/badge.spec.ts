import { expect, test } from '../../fixtures/base';
import { BadgePage } from '../../pages/badge.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Badge interaction + a11y suite.
 *
 * Per `chapter 04 §Badge / Spinner / Skeleton / Icon`:
 *   - Dismissible flow: clicking the close button emits `(dismissed)`. The
 *     badge does not remove itself; the parent updates state, so we assert
 *     the badge disappears from the DOM via the demo's signal-backed list.
 *   - Leading-slot detection — projected icons render inside the badge.
 *
 * Variant/color/size matrix is covered by smoke + axe sweeps.
 */
test.describe('Badge', () => {
  test('@interaction dismissible badge emits (dismissed) and parent state removes it', async ({
    page,
  }) => {
    const badge = new BadgePage(page);
    await badge.goto();

    const tagList = badge.dismissibleSection.locator('[twBadge]');
    // Demo seeds 5 tags.
    await expect(tagList).toHaveCount(5);

    const angularBadge = badge.dismissibleSection.locator('[twBadge]', { hasText: 'Angular' });
    // The dismiss control is a child <button> with aria-label inside the
    // badge — assert it exists and click it.
    const dismiss = angularBadge.getByRole('button');
    await expect(dismiss).toBeVisible();
    await dismiss.click();

    // Parent's `removeTag` splices the tag — badge disappears.
    await expect(tagList).toHaveCount(4);
    await expect(badge.dismissibleSection.locator('[twBadge]', { hasText: 'Angular' })).toHaveCount(0);
  });

  test('@interaction dismissing every tag renders the empty fallback copy', async ({ page }) => {
    const badge = new BadgePage(page);
    await badge.goto();

    const tagList = badge.dismissibleSection.locator('[twBadge]');
    // Demo seeds 5 tags — dismiss them one by one. Re-resolve the first badge
    // each iteration since Angular re-renders the @for block after every
    // splice; holding a stale Locator over the loop would race the rerender.
    for (let i = 5; i > 0; i--) {
      await expect(tagList).toHaveCount(i);
      await tagList.first().getByRole('button').click();
    }
    await expect(tagList).toHaveCount(0);
    await expect(badge.dismissibleSection).toContainText('All badges dismissed.');
  });

  test('@interaction leading icon is projected inside the badge', async ({ page }) => {
    const badge = new BadgePage(page);
    await badge.goto();

    // "Verified" badge in the With Icons / Semantic usage cluster.
    const verified = badge.iconsSection.locator('[twBadge]', { hasText: 'Verified' });
    await expect(verified.locator('tw-icon')).toHaveCount(1);
  });
});
