import { expect, test } from '../../fixtures/base';
import { SeparatorPage } from '../../pages/separator.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Separator interaction + a11y suite.
 *
 * Per `chapter 04 §Separator`:
 *   - Horizontal vs vertical orientation toggles `aria-orientation`.
 *   - Decorative mode flips role to `'none'` + `aria-hidden="true"` and
 *     drops `aria-orientation`.
 *   - Label projection is silently dropped in vertical orientation.
 *
 * Rendering of the variant/weight/color matrix is covered by smoke and axe
 * sweeps in `00-smoke` / `03-accessibility`.
 */
test.describe('Separator', () => {
  test('@a11y horizontal separator exposes role="separator" + aria-orientation="horizontal"', async ({
    page,
  }) => {
    const sep = new SeparatorPage(page);
    await sep.goto();

    const first = sep.variantsSection.locator('tw-separator').first();
    await expect(first).toHaveAttribute('role', 'separator');
    await expect(first).toHaveAttribute('aria-orientation', 'horizontal');
    await expect(first).not.toHaveAttribute('aria-hidden', /.+/);
  });

  test('@a11y vertical orientation switches aria-orientation', async ({ page }) => {
    const sep = new SeparatorPage(page);
    await sep.goto();

    const verticals = sep.orientationSection.locator('tw-separator');
    await expect(verticals.first()).toHaveAttribute('aria-orientation', 'vertical');
    await expect(verticals.first()).toHaveAttribute('role', 'separator');
  });

  test('@a11y decorative=true flips role to "none" and sets aria-hidden="true"', async ({
    page,
  }) => {
    const sep = new SeparatorPage(page);
    await sep.goto();

    const decorative = sep.decorativeSection.locator('tw-separator').first();
    await expect(decorative).toHaveAttribute('role', 'none');
    await expect(decorative).toHaveAttribute('aria-hidden', 'true');
    // aria-orientation must NOT be set on a decorative separator — it carries
    // no semantic role to be oriented against.
    await expect(decorative).not.toHaveAttribute('aria-orientation', /.+/);
  });

  test('@interaction label projection renders in horizontal mode', async ({ page }) => {
    const sep = new SeparatorPage(page);
    await sep.goto();

    const orSeparator = sep.labelsSection.locator('tw-separator').first();
    await expect(orSeparator).toContainText('OR');
  });

  test('@interaction vertical separator drops projected label content from the rendered DOM', async ({
    page,
  }) => {
    const sep = new SeparatorPage(page);
    await sep.goto();

    // Flip the playground to vertical + enable the label toggle, then assert
    // the rendered separator has no visible text. The template's @if guard
    // means the label `<span>` is not rendered at all in vertical mode.
    await sep.playgroundButton('vertical').click();
    await sep.playgroundButton('label').click();

    await expect(sep.playgroundSeparator).toHaveAttribute('aria-orientation', 'vertical');
    await expect(sep.playgroundSeparator).toHaveText('');
  });
});
