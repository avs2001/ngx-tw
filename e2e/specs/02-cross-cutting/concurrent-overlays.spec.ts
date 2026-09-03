/* eslint playwright/expect-expect: ["warn", { "assertFunctionNames": ["expect", "pollUntil"] }] --
   `pollUntil` (support/timing.ts) wraps `expect.poll`, so a test that asserts only
   through it still asserts; without this the rule reports it as assertion-free. */
import { expect, test } from '../../fixtures/base';
import { DialogPage } from '../../pages/dialog.page';
import { pollUntil } from '../../support/timing';

test.describe.configure({ mode: 'parallel' });

/**
 * Concurrent overlays — chapter 05 §5.9 + chapter 08 §8.3.
 *
 * **Historically buggy area.** CDK overlays attach to a top-level
 * container outside `<app-root>`, and three patterns regress most often:
 *
 *   - Focus stolen by a toast that opens during a dialog's enter
 *     animation.
 *   - Multiple selects open simultaneously where clicking an option
 *     dismisses the wrong one.
 *   - Tooltip on a button inside a dialog rendered behind the dialog.
 *
 * **Today's demo only exercises stacked dialogs** (chapter 05 §5.9 §
 * "Two options"). The three "needs new affordance" scenarios stay
 * `test.fixme` until either a dedicated `_e2e/concurrent-overlays`
 * route ships, or the dialog examples grow inline triggers for the
 * three constructs. The z-index canary across all six overlay types
 * needs the same affordance.
 *
 * What this file asserts **today** against the existing "Stacked
 * dialogs" example:
 *   - Opening a child dialog from inside a parent stacks them in the
 *     overlay container (depth = 2).
 *   - Focus moves to the child container; the parent's "Invite someone
 *     new" trigger is no longer the active element.
 *   - Tab cycles inside the child only — focus never lands on a parent
 *     control while the child is open.
 *   - Esc closes the child; CDK FocusTrap returns focus to the parent's
 *     trigger that opened the child ("Invite someone new").
 *   - A second Esc closes the parent; focus returns to the route-level
 *     "Invite to project" trigger.
 *   - CDK overlay stack-order: the child container is a later DOM
 *     sibling than the parent (CDK's natural stack-order surrogate; an
 *     explicit `z-index` ordering test belongs in the canary spec).
 */

const FOCUS_TRAP_TAB_COUNT = 25;

test.describe('Concurrent overlays', () => {
  test('@overlay stacked dialogs: depth, focus transfer, trap, restoration', async ({
    page,
  }) => {
    const dialog = new DialogPage(page);
    await dialog.goto();

    // Track the demo's "Stack depth" readout — the parent template
    // mirrors `this.dialog.openDialogs.length` into a visible `<code>`.
    // Asserting on it catches a regression where CDK loses track of the
    // open stack (e.g. premature dispose of the parent ref when the
    // child opens). The numeric assertion via toHaveCount is the
    // structural truth; the readout is the user-visible truth.
    await expect(dialog.stackDepth).toContainText('0');

    const rootTrigger = dialog.stackedTrigger;
    await rootTrigger.focus();
    await page.keyboard.press('Enter');
    await dialog.waitForOpen();
    await expect(dialog.dialogs).toHaveCount(1);
    await expect(dialog.stackDepth).toContainText('1');

    // The parent dialog renders an "Invite someone new" trigger that
    // opens the child via the same DialogService instance. The exact
    // copy is documented in the demo template (`childTpl`).
    const parent = dialog.topDialog;
    const childTrigger = parent.getByRole('button', { name: /invite someone new/i });
    await childTrigger.focus();
    await page.keyboard.press('Enter');

    await expect(dialog.dialogs).toHaveCount(2);
    await expect(dialog.topDialog).toHaveAttribute('data-state', 'open');
    await expect(dialog.stackDepth).toContainText('2');

    // Focus must have transferred into the child container — CDK
    // FocusTrap autoFocus runs on each successive overlay open. A
    // regression here historically manifested as the parent's trigger
    // retaining focus while the child appeared above it.
    await pollUntil(
      page,
      () => {
        const containers = document.querySelectorAll('tw-dialog-container');
        const top = containers[containers.length - 1];
        return !!document.activeElement && !!top?.contains(document.activeElement);
      },
      'focus did not transfer into the child dialog',
    ).toBe(true);

    // Focus trap on the **child**: 25 Tabs, focus never escapes the
    // top container. Crucially, the parent must NOT receive focus while
    // the child is open (chapter 05 §5.9 — "only the top dialog
    // receives focus and keyboard events").
    for (let i = 0; i < FOCUS_TRAP_TAB_COUNT; i++) {
      await page.keyboard.press('Tab');
      // Polled as one object so both halves are read from the same sample —
      // two independent polls could each settle on a different instant.
      await pollUntil(
        page,
        () => {
          const containers = document.querySelectorAll('tw-dialog-container');
          const top = containers[containers.length - 1];
          const parent = containers[0];
          const active = document.activeElement;
          return {
            inTop: !!active && !!top?.contains(active),
            inParentOnly: !!active && !!parent?.contains(active) && !top?.contains(active),
          };
        },
        `iteration ${i}: focus must stay inside the child dialog and never reach the parent`,
      ).toEqual({ inTop: true, inParentOnly: false });
    }

    // First Esc closes only the child.
    await page.keyboard.press('Escape');
    await expect(dialog.dialogs).toHaveCount(1);
    await expect(dialog.stackDepth).toContainText('1');

    // CDK's FocusTrap returns focus to the element that opened the
    // child — the parent's "Invite someone new" button. This is the
    // chapter 05 §5.9 "existing today" assertion.
    const restoredToParentTrigger = await childTrigger.evaluate(
      (el) => el === document.activeElement,
    );
    expect(
      restoredToParentTrigger,
      'focus did not return to the parent dialog trigger',
    ).toBe(true);

    // Second Esc closes the parent; focus returns to the route trigger.
    await page.keyboard.press('Escape');
    await dialog.waitForClosed();
    await expect(dialog.stackDepth).toContainText('0');

    await expect(rootTrigger, 'focus did not return to the route-level trigger').toBeFocused();
  });

  test('@overlay stacked dialogs: child is layered above parent in the CDK overlay tree', async ({
    page,
  }) => {
    const dialog = new DialogPage(page);
    await dialog.goto();

    await dialog.stackedTrigger.click();
    await dialog.waitForOpen();
    await dialog.topDialog
      .getByRole('button', { name: /invite someone new/i })
      .click();
    await expect(dialog.dialogs).toHaveCount(2);

    // CDK appends each new overlay pane to the end of the container.
    // Asserting that the child is a later sibling (and renders above
    // the parent's bounding box) is the cheapest stack-order surrogate
    // available without painting. A failure here is the canonical
    // "child rendered behind parent" regression from chapter 08 §8.3.
    const order = await page.evaluate(() => {
      const container = document.querySelector('.cdk-overlay-container');
      if (!container) return null;
      const panes = Array.from(container.querySelectorAll('.cdk-overlay-pane'));
      const indexes = panes.map((p, i) => ({
        i,
        hasDialog: !!p.querySelector('tw-dialog-container'),
      }));
      return indexes;
    });
    expect(order, 'overlay container missing').not.toBeNull();
    const dialogPanes = order!.filter((o) => o.hasDialog);
    expect(dialogPanes).toHaveLength(2);
    // First-in array index is the parent (earlier sibling), last is the
    // child (later sibling). CDK paints later siblings on top.
    expect(dialogPanes[0].i).toBeLessThan(dialogPanes[1].i);
  });

  test.fixme(
    '[fixme:concurrent-overlays/dialog-select] @overlay dialog + select: opening a select inside a dialog does not break the dialog trap',
    async ({ page }) => {
      // chapter 05 §5.9: needs a `_e2e/concurrent-overlays` route or
      // an inline `tw-select` inside a dialog example. Today's
      // `dialog-examples.component.ts` has zero `tw-select` usages.
      const dialog = new DialogPage(page);
      await dialog.goto();
      await dialog.componentTrigger.click();
      await dialog.waitForOpen();
      const combobox = dialog.topDialog.getByRole('combobox').first();
      await combobox.click();
      // Listbox is visible.
      await expect(page.locator('.cdk-overlay-container [role="listbox"]')).toBeVisible();
      // Esc closes the listbox; dialog stays open.
      await page.keyboard.press('Escape');
      await expect(page.locator('.cdk-overlay-container [role="listbox"]')).toHaveCount(0);
      await expect(dialog.dialogs).toHaveCount(1);
      // Focus is back in the dialog.
      const inDialog = await page.evaluate(
        () => !!document.activeElement?.closest('tw-dialog-container'),
      );
      expect(inDialog).toBe(true);
    },
  );

  test.fixme(
    '[fixme:concurrent-overlays/dialog-toast] @overlay dialog + toast: toast appears above the dialog, focus stays in the dialog',
    async ({ page }) => {
      // chapter 05 §5.9 / chapter 08 §8.3: no dialog example injects
      // ToastService today. Lift this fixme once a "Show toast"
      // affordance lands inside a dialog example, or under
      // `_e2e/concurrent-overlays`.
      const dialog = new DialogPage(page);
      await dialog.goto();
      await dialog.lifecycleTrigger.click();
      await dialog.waitForOpen();
      const showToast = dialog.topDialog.getByRole('button', { name: /show toast/i });
      await showToast.click();
      await expect(page.locator('tw-toast')).toBeVisible();
      const inDialog = await page.evaluate(
        () => !!document.activeElement?.closest('tw-dialog-container'),
      );
      expect(inDialog).toBe(true);
    },
  );

  test.fixme(
    '[fixme:concurrent-overlays/dialog-tooltip] @overlay tooltip on dialog button: tooltip renders above the dialog backdrop',
    async ({ page }) => {
      // chapter 05 §5.9 / chapter 08 §8.3: no dialog example wires
      // `[twTooltip]` on a dialog action button today. Lift once the
      // affordance ships.
      const dialog = new DialogPage(page);
      await dialog.goto();
      await dialog.componentTrigger.click();
      await dialog.waitForOpen();
      const tooltipBtn = dialog.topDialog.locator('[twTooltip]').first();
      await tooltipBtn.hover();
      const tip = page.locator('[role="tooltip"]');
      await expect(tip).toBeVisible();
      // Tooltip must paint above the dialog: its bounding rect should
      // overlap the dialog's, and a synthetic elementFromPoint at the
      // tooltip's centre should resolve to a descendant of the tooltip
      // overlay pane — not to the dialog container.
      const onTop = await tip.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const hit = document.elementFromPoint(cx, cy);
        return !!hit && (hit === el || el.contains(hit));
      });
      expect(onTop).toBe(true);
    },
  );

  test.fixme(
    '[fixme:concurrent-overlays/z-index-canary] @overlay z-index canary: all six overlay types coexist with documented stacking',
    async ({ page }) => {
      // chapter 05 §5.9: requires the `_e2e/concurrent-overlays` route
      // to mount tooltip + popover + select + menu + dialog +
      // command-palette + toast simultaneously. Without that route the
      // six can't all be open at once. The canary asserts:
      //   - tooltip (`z-50` per `tooltip.ts`) wins over CDK overlays.
      //   - dialog backdrop sits below dialog content.
      //   - toast container sits above the dialog backdrop.
      await page.goto('/_e2e/concurrent-overlays');
      // ... open every overlay, screenshot the container.
    },
  );
});
