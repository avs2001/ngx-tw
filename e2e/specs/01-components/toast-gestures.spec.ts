import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../../fixtures/base';
import { ToastPage } from '../../pages/toast.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Toast dismissal gestures — swipe and Escape.
 *
 * Both paths were untested in every layer. They live in a separate file from
 * `toast.spec.ts` (severity / action / region semantics) because they need real
 * pointer capture and real geometry:
 *
 *   - **Swipe.** `onSwipeEnd` compares the drag distance against
 *     `boundingRect.width * 0.4`. In jsdom that rect is all-zero, so the
 *     threshold collapses to 0 and *every* drag "passes" — a unit test can only
 *     assert the arithmetic with a stubbed rect (which `toast.spec.ts` now
 *     does). Only a browser measures the toast, captures the pointer, and runs
 *     the direction gate against a real stacking edge.
 *   - **Escape.** Every toast is a tab stop specifically so a keyboard user can
 *     stop the auto-dismiss clock and close it. That the tab stop is reachable
 *     by Tab — and that Escape closes the toast Tab landed on — is a browser
 *     fact, not a jsdom one.
 *
 * The demo's "Pause on Interaction & Swipe" section is the fixture: both of its
 * buttons open a `duration: 0` toast, so nothing here can pass because a timer
 * happened to fire. The two toasts also carry distinct text, which is what makes
 * "the right one closed" assertable.
 */
test.describe('Toast gestures', () => {
  const SWIPEABLE = 'Drag me horizontally to dismiss.';
  const NOT_SWIPEABLE = 'Swipe is disabled';

  const swipeSection = (page: Page): Locator =>
    page.locator('section').filter({
      has: page.getByRole('heading', { name: 'Pause on Interaction & Swipe', level: 2 }),
    });

  /** The entry wrapper the container binds its pointer / key handlers to. */
  const wrapper = (page: Page, text: string): Locator =>
    page.locator('.cdk-overlay-container [data-toast-id]').filter({ hasText: text });

  async function openSwipeable(page: Page, enabled: boolean): Promise<Locator> {
    const label = enabled ? 'Swipeable (default)' : 'Swipe disabled';
    await swipeSection(page).getByRole('button', { name: label, exact: true }).click();
    const el = wrapper(page, enabled ? SWIPEABLE : NOT_SWIPEABLE);
    await expect(el).toBeVisible();
    return el;
  }

  /**
   * Press near the left edge of the toast, drag horizontally by `dx` in steps
   * (a single jump can be coalesced away and never crosses the 6px engage
   * gate), then release. Pointer capture keeps the events on the toast even
   * when the path leaves it.
   */
  async function drag(page: Page, el: Locator, dx: number): Promise<void> {
    const box = await el.boundingBox();
    if (!box) throw new Error('toast has no layout box');
    const startX = box.x + 24;
    const y = box.y + box.height / 2;
    await page.mouse.move(startX, y);
    await page.mouse.down();
    for (let i = 1; i <= 8; i++) {
      await page.mouse.move(startX + (dx * i) / 8, y);
    }
    await page.mouse.up();
  }

  test('@interaction a drag past the threshold dismisses the toast', async ({ page }) => {
    const toast = new ToastPage(page);
    await toast.goto();
    const el = await openSwipeable(page, true);

    const box = await el.boundingBox();
    // The threshold is 40% of the toast's own width, so derive the gesture from
    // the measured box rather than hard-coding pixels.
    await drag(page, el, Math.round(box!.width * 0.6));

    await expect(el).toBeHidden();
    await expect(toast.toasts).toHaveCount(0);
  });

  test('@interaction a drag short of the threshold snaps back and keeps the toast', async ({
    page,
  }) => {
    const toast = new ToastPage(page);
    await toast.goto();
    const el = await openSwipeable(page, true);

    const before = await el.boundingBox();
    await drag(page, el, Math.round(before!.width * 0.15)); // well under 40%

    await expect(el).toBeVisible();
    await expect(toast.toasts).toHaveCount(1);
    // Snap-back clears the inline transform the drag applied, so the toast
    // returns to where it started instead of sitting where it was dropped.
    const after = await el.boundingBox();
    expect(Math.abs(after!.x - before!.x)).toBeLessThan(2);
  });

  test('@interaction a drag against the stacking edge never dismisses', async ({ page }) => {
    const toast = new ToastPage(page);
    await toast.goto();
    const el = await openSwipeable(page, true);

    // The demo anchors toasts bottom-right, so only a rightward drag may
    // dismiss. Dragging left — twice the threshold — must snap back.
    const box = await el.boundingBox();
    await drag(page, el, -Math.round(box!.width * 0.8));

    await expect(el).toBeVisible();
    await expect(toast.toasts).toHaveCount(1);
  });

  test('@interaction swipeToDismiss=false ignores the gesture entirely', async ({ page }) => {
    const toast = new ToastPage(page);
    await toast.goto();
    const el = await openSwipeable(page, false);

    const box = await el.boundingBox();
    await drag(page, el, Math.round(box!.width * 0.8));

    await expect(el).toBeVisible();
    await expect(toast.toasts).toHaveCount(1);
  });

  test('@a11y Escape dismisses the focused toast and leaves the others open', async ({
    page,
  }) => {
    const toast = new ToastPage(page);
    await toast.goto();
    const first = await openSwipeable(page, true);
    const second = await openSwipeable(page, false);
    await expect(toast.toasts).toHaveCount(2);

    await second.focus();
    await expect(second).toBeFocused();
    await page.keyboard.press('Escape');

    await expect(second).toBeHidden();
    await expect(first).toBeVisible();
    await expect(toast.toasts).toHaveCount(1);
  });

  test('@a11y the toast is a tab stop and Escape works from a control inside it', async ({
    page,
  }) => {
    const toast = new ToastPage(page);
    await toast.goto();
    // Open from the keyboard, exactly as a keyboard-only user would.
    await swipeSection(page)
      .getByRole('button', { name: 'Swipeable (default)', exact: true })
      .focus();
    await page.keyboard.press('Enter');
    const el = wrapper(page, SWIPEABLE);
    await expect(el).toBeVisible();

    // SC 2.2.1: the wrapper itself is in the tab order, so a toast whose only
    // affordances are opted out still has something a keyboard user can reach
    // to stop its clock.
    expect(await el.evaluate((node) => (node as HTMLElement).tabIndex)).toBe(0);

    // Escape from the dismiss button inside the toast still closes it — the
    // handler sits on the wrapper and relies on the event bubbling.
    const dismiss = el.getByRole('button', { name: 'Dismiss' });
    await dismiss.focus();
    await expect(dismiss).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(el).toBeHidden();
  });
});
