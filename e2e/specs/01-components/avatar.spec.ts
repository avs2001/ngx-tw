import { expect, test } from '../../fixtures/base';
import { AvatarPage } from '../../pages/avatar.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Avatar interaction + a11y suite.
 *
 * Per `chapter 04 §Avatar`:
 *   - Image fallback: when `src` 404s, initials render in its place.
 *   - Default silhouette when no src and no initials.
 *   - Avatar group `[max]` applies the `hidden` HTML attribute and
 *     `aria-hidden="true"` to overflowed children (not `style="display:none"`),
 *     keeping them out of the accessibility tree.
 */
test.describe('Avatar', () => {
  test('@interaction broken image src falls back to initials', async ({ page }) => {
    const avatar = new AvatarPage(page);
    // Intercept the broken-link URL up front — the demo wires
    // src="/broken-link.png" which 404s by default, but we make the failure
    // deterministic regardless of dev-server behaviour.
    await page.route('**/broken-link.png', (route) => route.fulfill({ status: 404, body: '' }));
    await avatar.goto();

    // The Fallback Cascade section's second avatar has src="/broken-link.png"
    // and initials="JD" — after the image errors, the rendered DOM should
    // contain the JD text and no <img>.
    const fallbackAvatar = avatar.fallbackSection.locator('tw-avatar').nth(1);
    await expect(fallbackAvatar).toContainText('JD');
    // Once the error path engages, the <img> is removed from the DOM and the
    // initials span paints. Wait for that final state.
    await expect(fallbackAvatar.locator('img')).toHaveCount(0);
  });

  test('@interaction no src and no initials renders the default silhouette', async ({ page }) => {
    const avatar = new AvatarPage(page);
    await avatar.goto();

    const silhouette = avatar.fallbackSection.locator('tw-avatar').nth(2);
    // The default silhouette is an inline <svg> child of the avatar.
    await expect(silhouette.locator('svg')).toHaveCount(1);
    await expect(silhouette.locator('img')).toHaveCount(0);
  });

  test('@a11y avatar-group [max]=3 hides overflowed children from the a11y tree', async ({
    page,
  }) => {
    const avatar = new AvatarPage(page);
    await avatar.goto();

    // The "With max overflow" group has 5 children + max=3 → 2 hidden, plus
    // the synthesized "+N" indicator. Source uses the `hidden` HTML attribute
    // and aria-hidden="true", per chapter 04.
    const group = avatar.groupSection.locator('tw-avatar-group').nth(1);
    const allAvatars = group.locator('tw-avatar');
    await expect(allAvatars).toHaveCount(5);

    // Overflowed avatars (indexes 3 and 4 here) carry both `hidden` and
    // `aria-hidden="true"`.
    await expect(allAvatars.nth(3)).toHaveAttribute('hidden', '');
    await expect(allAvatars.nth(3)).toHaveAttribute('aria-hidden', 'true');
    await expect(allAvatars.nth(4)).toHaveAttribute('hidden', '');

    // The first three remain in the a11y tree.
    await expect(allAvatars.nth(0)).not.toHaveAttribute('hidden', /.*/);
    await expect(allAvatars.nth(2)).not.toHaveAttribute('hidden', /.*/);

    // +N overflow indicator renders with the remaining count.
    await expect(group).toContainText('+2');
  });
});
