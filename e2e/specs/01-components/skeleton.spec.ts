import { expect, test } from '../../fixtures/base';
import { SkeletonPage } from '../../pages/skeleton.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Skeleton interaction + a11y suite.
 *
 * Per `chapter 04 §Badge / Spinner / Skeleton / Icon`:
 *   - Default skeleton is hidden from AT (`aria-hidden="true"`).
 *   - `announce` flips to `role="status"` + `aria-busy` + `aria-live="polite"`.
 *   - Multi-line text mode renders one row per `lines` input.
 */
test.describe('Skeleton', () => {
  test('@a11y default skeleton is decorative (aria-hidden="true", no role)', async ({ page }) => {
    const skel = new SkeletonPage(page);
    await skel.goto();

    const first = skel.shapesSection.locator('tw-skeleton').first();
    await expect(first).toHaveAttribute('aria-hidden', 'true');
    await expect(first).not.toHaveAttribute('role', /.+/);
    await expect(first).not.toHaveAttribute('aria-busy', /.+/);
  });

  test('@a11y announce=true flips to role="status" + aria-busy + aria-live="polite"', async ({
    page,
  }) => {
    const skel = new SkeletonPage(page);
    await skel.goto();

    const announced = skel.announceSection.locator('tw-skeleton').first();
    await expect(announced).toHaveAttribute('role', 'status');
    await expect(announced).toHaveAttribute('aria-busy', 'true');
    await expect(announced).toHaveAttribute('aria-live', 'polite');
    await expect(announced).not.toHaveAttribute('aria-hidden', /.+/);
  });

  test('@interaction multi-line text mode renders one row per `lines` input', async ({ page }) => {
    const skel = new SkeletonPage(page);
    await skel.goto();

    // The Multi-line section renders skeletons with lines=1, 3, 5 in order.
    const skeletons = skel.multiLineSection.locator('tw-skeleton');
    await expect(skeletons).toHaveCount(3);

    // The lines render as descendant elements — count the row spans inside
    // each skeleton. Source uses N children for N lines.
    // Single-line skeleton uses its own host as the row — no inner spans.
    // Multi-line mode (lines>1) renders one inner <span> per line.
    await expect(skeletons.nth(0).locator('> span')).toHaveCount(0);
    await expect(skeletons.nth(1).locator('> span')).toHaveCount(3);
    await expect(skeletons.nth(2).locator('> span')).toHaveCount(5);
  });

  test('@interaction list reload swaps real rows for skeleton rows during loading', async ({
    page,
  }) => {
    const skel = new SkeletonPage(page);
    await skel.goto();

    const list = skel.listSection.locator('ul');
    await expect(list).toHaveAttribute('aria-busy', 'false');
    await expect(list.locator('tw-skeleton')).toHaveCount(0);

    await skel.listSection.getByRole('button', { name: 'Reload' }).click();

    // While loading the list flips to aria-busy="true" and renders skeletons.
    await expect(list).toHaveAttribute('aria-busy', 'true');
    await expect(list.locator('tw-skeleton').first()).toBeVisible();

    // Demo restores after 1.8s.
    await expect(list).toHaveAttribute('aria-busy', 'false', { timeout: 4000 });
    await expect(list.locator('tw-skeleton')).toHaveCount(0);
  });
});
