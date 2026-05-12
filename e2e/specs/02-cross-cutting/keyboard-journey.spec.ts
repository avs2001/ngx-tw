import { expect, test } from '../../fixtures/base';
import { ButtonPage } from '../../pages/button.page';
import { DialogPage } from '../../pages/dialog.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Keyboard end-to-end journey — chapter 05 §5.2.
 *
 * The library claims comprehensive keyboard support. This file exercises
 * the contract as a user journey, not a per-component unit:
 *
 *  - **Tab order** matches visual order on the button examples page
 *    (Variants section — the leftmost, most stable surface).
 *  - **Skip link** — `test.fixme`d; the demo shell does not ship a skip
 *    link today (chapter 05 §5.2). Lift the fixme alongside the
 *    focus-restoration P2 in §5.3.
 *  - **Focus visibility** — every focused element shows the documented
 *    focus ring (`focus-visible:outline-2 outline-offset-2 outline-primary-500`),
 *    asserted via `getComputedStyle`.
 *  - **Esc semantics** — `Esc` closes the deepest open overlay only.
 *  - **Focus trap** — opening a dialog and Tab-cycling keeps focus inside;
 *    closing it returns focus to the trigger.
 */
test.describe('Keyboard · cross-cutting journey', () => {
  test('@keyboard Tab order on the button Variants section matches visual order', async ({
    page,
  }) => {
    const button = new ButtonPage(page);
    await button.goto();

    const variantsSection = button.main.locator('section').filter({
      has: page.locator('h2').filter({ hasText: /^Variants$/ }),
    });
    const variantButtons = variantsSection.locator('button[twButton]');
    const visualOrder = await variantButtons.allInnerTexts();
    expect(visualOrder.length).toBeGreaterThanOrEqual(5);

    // Seed focus on the first variant button, then Tab through the row.
    await variantButtons.first().focus();

    const tabbedLabels: string[] = [];
    for (let i = 0; i < visualOrder.length; i++) {
      const label = await page.evaluate(
        () => (document.activeElement as HTMLElement | null)?.textContent?.trim() ?? '',
      );
      tabbedLabels.push(label);
      if (i < visualOrder.length - 1) {
        await page.keyboard.press('Tab');
      }
    }

    expect(tabbedLabels).toEqual(visualOrder.map((s) => s.trim()));
  });

  test.fixme(
    '@keyboard skip link jumps focus to <main> (demo shell does not ship one yet)',
    async ({ page }) => {
      // chapter 05 §5.2: the shell-side fix is paired with §5.3's
      // focus-restoration P2 — file together. Until then, this test is a
      // placeholder documenting the expected behaviour.
      await page.goto('/components/button/examples');
      await page.keyboard.press('Tab'); // first tab from URL bar should land on skip link
      const text = await page.evaluate(
        () => (document.activeElement as HTMLAnchorElement | null)?.textContent ?? '',
      );
      expect(text.toLowerCase()).toContain('skip');
    },
  );

  test('@keyboard focused button shows the documented focus-visible ring', async ({ page }) => {
    const button = new ButtonPage(page);
    await button.goto();

    const variantsSection = button.main.locator('section').filter({
      has: page.locator('h2').filter({ hasText: /^Variants$/ }),
    });
    const first = variantsSection.locator('button[twButton]').first();

    // `focus()` alone does not arm `:focus-visible` in Chromium — Playwright
    // needs the prior key event to flip the heuristic. Pressing Tab from the
    // body achieves the same in a deterministic way.
    await page.locator('body').click({ position: { x: 1, y: 1 } });
    await page.keyboard.press('Tab');
    // Walk Tab until focus reaches the first variant button. Keeps the test
    // independent of any shell chrome (sidebar links, theme toggles).
    for (let i = 0; i < 200; i++) {
      const reached = await first.evaluate((el) => el === document.activeElement);
      if (reached) break;
      await page.keyboard.press('Tab');
    }

    const ring = await first.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        outlineWidth: cs.outlineWidth,
        outlineStyle: cs.outlineStyle,
        outlineOffset: cs.outlineOffset,
        outlineColor: cs.outlineColor,
      };
    });

    // CLAUDE.md §"Focus Rings": outline-2, outline-offset-2, primary-500.
    // The colour resolution depends on the consumer's theme — we assert the
    // structural rule (2px solid outline at 2px offset) and trust the theme
    // matrix spec to cover colour.
    expect(ring.outlineStyle).toBe('solid');
    expect(parseFloat(ring.outlineWidth)).toBeGreaterThanOrEqual(2);
    expect(parseFloat(ring.outlineOffset)).toBeGreaterThanOrEqual(2);
    expect(ring.outlineColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('@keyboard @overlay Esc closes the deepest open overlay, then the next', async ({
    page,
  }) => {
    const dialog = new DialogPage(page);
    await dialog.goto();

    await dialog.stackedTrigger.click();
    await dialog.waitForOpen();

    // The "Invite to project" parent renders an "Invite someone new" button
    // that opens a second, nested dialog.
    const inner = dialog.topDialog.getByRole('button', { name: /invite someone new/i });
    await inner.click();
    await expect(dialog.dialogs).toHaveCount(2);

    // First Esc closes only the top (deepest) dialog.
    await page.keyboard.press('Escape');
    await expect(dialog.dialogs).toHaveCount(1);

    // Second Esc closes the parent.
    await page.keyboard.press('Escape');
    await dialog.waitForClosed();
  });

  test('@keyboard @overlay focus trap: Tab cycles inside dialog; focus returns to trigger on close', async ({
    page,
  }) => {
    const dialog = new DialogPage(page);
    await dialog.goto();

    const trigger = dialog.sizeTrigger('md');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await dialog.waitForOpen();

    // Tab 30× — focus must remain inside the dialog container.
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(
        () => !!document.activeElement?.closest('tw-dialog-container'),
      );
      expect(inside, `focus escaped the dialog at iteration ${i}`).toBe(true);
    }

    await page.keyboard.press('Escape');
    await dialog.waitForClosed();

    // CDK FocusTrap returns focus to the trigger element.
    const restored = await trigger.evaluate((el) => el === document.activeElement);
    expect(restored, 'focus did not return to the trigger after dialog close').toBe(true);
  });
});
