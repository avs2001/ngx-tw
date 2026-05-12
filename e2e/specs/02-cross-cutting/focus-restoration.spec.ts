import { expect, test } from '../../fixtures/base';
import { DialogPage } from '../../pages/dialog.page';
import { SelectPage } from '../../pages/select.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Focus restoration — chapter 05 §5.3.
 *
 * Two distinct scenarios live here:
 *
 *  1. **Route navigation** — `test.fixme`d. The demo does **not** move
 *     focus on route change today (zero `NavigationEnd` listeners exist
 *     in `projects/demo/src/`, no `<h1 tabindex="-1">`). The chapter's
 *     prescribed assertions are placeholders until the P2 shell-side fix
 *     lands (labelled `<main tabindex="-1">` + a focus helper).
 *
 *  2. **Overlay close** — works today. CDK's FocusTrap returns focus to
 *     the element that opened the overlay. We exercise dialog and select
 *     here; overlay-specific component specs cover the rest.
 */
test.describe('Focus restoration', () => {
  test.fixme(
    '@keyboard route nav: focus moves to the new page landing target',
    async ({ page }) => {
      // chapter 05 §5.3: zero `NavigationEnd` listeners exist today.
      // Lift this fixme once the shell wires:
      //   - a `NavigationEnd` listener that focuses `<main tabindex="-1">`
      //   - a skip-link pointing at that target
      await page.goto('/components/button/examples');
      const sidebarLink = page.locator('nav a', { hasText: /^badge$/i }).first();
      await sidebarLink.click();
      await page.waitForURL(/\/components\/badge/);

      const focused = await page.evaluate(
        () => document.activeElement?.tagName?.toLowerCase() ?? '',
      );
      // Expected: focus inside <main>, not on the sidebar link.
      expect(['main', 'h1']).toContain(focused);
    },
  );

  test.fixme(
    '@keyboard route nav: History.back() restores focus to the originating link',
    async ({ page }) => {
      // chapter 05 §5.3 P2: needs the same shell affordance as above plus
      // an explicit "focus the link that caused the nav" branch on `popstate`.
      await page.goto('/components/button/examples');
      const sidebarLink = page.locator('nav a', { hasText: /^badge$/i }).first();
      await sidebarLink.click();
      await page.waitForURL(/\/components\/badge/);

      await page.goBack();
      await page.waitForURL(/\/components\/button/);

      const restored = await sidebarLink.evaluate((el) => el === document.activeElement);
      expect(restored).toBe(true);
    },
  );

  test('@keyboard @overlay focus returns to dialog trigger after Esc close', async ({
    page,
  }) => {
    const dialog = new DialogPage(page);
    await dialog.goto();

    const trigger = dialog.sizeTrigger('md');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await dialog.waitForOpen();

    await page.keyboard.press('Escape');
    await dialog.waitForClosed();

    const restored = await trigger.evaluate((el) => el === document.activeElement);
    expect(restored, 'focus did not return to the dialog trigger').toBe(true);
  });

  test('@keyboard @overlay focus returns to dialog trigger after backdrop close', async ({
    page,
  }) => {
    const dialog = new DialogPage(page);
    await dialog.goto();

    const trigger = dialog.sizeTrigger('md');
    await trigger.click();
    await dialog.waitForOpen();
    await dialog.backdrop.click({ position: { x: 5, y: 5 } });
    await dialog.waitForClosed();

    const restored = await trigger.evaluate((el) => el === document.activeElement);
    expect(restored, 'focus did not return to the dialog trigger after backdrop close').toBe(
      true,
    );
  });

  test('@keyboard @overlay focus returns to select trigger after Esc close', async ({
    page,
  }) => {
    const select = new SelectPage(page);
    await select.goto();

    // First combobox on the page — any section's trigger satisfies the
    // contract; we only need a stable focus-restoration target.
    const trigger = select.main.getByRole('combobox').first();
    await trigger.focus();
    await page.keyboard.press('Enter');
    await select.waitForOpen();
    await page.keyboard.press('Escape');
    await select.waitForClosed();

    const restored = await trigger.evaluate((el) => el === document.activeElement);
    expect(restored, 'focus did not return to the select trigger').toBe(true);
  });
});
