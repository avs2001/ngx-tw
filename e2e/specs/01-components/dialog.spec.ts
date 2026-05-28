import { expect, test } from '../../fixtures/base';
import { DialogPage, type DialogSize } from '../../pages/dialog.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Tab depth used for the focus-trap assertion. WAI-ARIA APG demands the
 * trap survive at least one full cycle of every focusable element in the
 * dialog; 30 hops is comfortably above the largest dialog (Component
 * content has 8 focusable elements) and still fast.
 */
const FOCUS_TRAP_TAB_COUNT = 30;

/**
 * Dialog reference E2E suite. Every overlay spec under
 * `e2e/specs/01-components/` should be readable as a copy of this file —
 * see `e2e/pages/README.md` for the recipe.
 *
 * Known source bugs flagged during initial bring-up (each triaged via a
 * dedicated `test.fixme` below):
 *
 *  - **`aria-modal` defaults to `false`** — `TwDialogConfig` extends
 *    `CdkDialogConfig` whose `ariaModal = false`, and the library never
 *    overrides it. Every TwDialog therefore advertises `aria-modal="false"`
 *    even though focus is trapped and the backdrop is modal. File as a
 *    library bug: TwDialogConfig should default `ariaModal = true`.
 *
 *  - **`tw-dialog-backdrop` class never applied** — `dialog.ts` reads
 *    `merged.backdropClass ?? 'tw-dialog-backdrop'`, but CDK's
 *    `DialogConfig` initialises `backdropClass = ''`, which is not nullish
 *    — the fallback never fires. Theme rules targeting
 *    `.tw-dialog-backdrop` (opacity / motion-reduce) are dead. File as a
 *    library bug: switch to `||` or move the default into
 *    `TwDialogConfig`.
 *
 *  - **Body scroll lock is a no-op under the demo shell layout** — the
 *    demo wraps content in `<main class="overflow-y-auto">`; `<html>`
 *    never overflows, so CDK's `BlockScrollStrategy._canBeEnabled()`
 *    returns `false`. The dialog opens modal but the underlying main
 *    region remains scrollable. File as either a dialog scroll-strategy
 *    bug or a documented shell-layout constraint.
 */
test.describe('Dialog', () => {
  test('@interaction @overlay opens, traps focus, Esc closes when disableClose is false', async ({
    page,
  }) => {
    const dialog = new DialogPage(page);
    await dialog.goto();

    const trigger = dialog.sizeTrigger('md');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await dialog.waitForOpen();

    // Focus must land somewhere inside the dialog after the enter animation
    // settles. CDK's autoFocus targets the first focusable element.
    const focusedInside = await page.evaluate(
      () => !!document.activeElement?.closest('tw-dialog-container'),
    );
    expect(focusedInside, 'focus did not land inside the dialog').toBe(true);

    await page.keyboard.press('Escape');
    await dialog.waitForClosed();
  });

  test('@interaction @overlay backdrop click closes the dialog when allowed', async ({
    page,
  }) => {
    const dialog = new DialogPage(page);
    await dialog.goto();

    await dialog.sizeTrigger('md').click();
    await dialog.waitForOpen();

    // Click the backdrop near a corner — the dialog panel sits centred, so a
    // corner click is guaranteed not to hit any projected content.
    await dialog.backdrop.click({ position: { x: 5, y: 5 } });
    await dialog.waitForClosed();
  });

  test('@a11y @overlay applies the documented modal ARIA contract', async ({ page }) => {
    const dialog = new DialogPage(page);
    await dialog.goto();

    await dialog.sizeTrigger('md').click();
    await dialog.waitForOpen();

    await expect(dialog.topDialog).toHaveAttribute('role', 'dialog');
    await expect(dialog.topDialog).toHaveAttribute('tabindex', '-1');
  });

  test.fixme(
    '@a11y @overlay BUG: aria-modal should be "true" while open',
    async ({ page }) => {
      // BUG (ngx-tw/dialog#aria-modal-default): CdkDialogConfig defaults
      // `ariaModal = false`; TwDialogConfig should override to `true`. Until
      // fixed, screen readers may not enter modal-only browse mode even
      // though the dialog is visually modal. Re-enable this test once the
      // library default is corrected.
      const dialog = new DialogPage(page);
      await dialog.goto();
      await dialog.sizeTrigger('md').click();
      await dialog.waitForOpen();
      await expect(dialog.topDialog).toHaveAttribute('aria-modal', 'true');
    },
  );

  test('@a11y @overlay confirmation dialog uses role="alertdialog"', async ({ page }) => {
    const dialog = new DialogPage(page);
    await dialog.goto();

    await dialog.confirmationTrigger.click();
    await dialog.waitForOpen();

    await expect(dialog.topDialog).toHaveAttribute('role', 'alertdialog');

    // Exercise the destructive branch end-to-end — `[twDialogClose]="true"`
    // becomes the `afterClosed` result and surfaces as "confirmed" in the
    // visible Result code block.
    await dialog.topDialog.getByRole('button', { name: 'Delete repository' }).click();
    await dialog.waitForClosed();
    await expect(dialog.confirmationResult).toHaveText('confirmed');
  });

  test('@a11y @overlay aria-labelledby points at the rendered title id', async ({ page }) => {
    const dialog = new DialogPage(page);
    await dialog.goto();

    await dialog.sizeTrigger('md').click();
    await dialog.waitForOpen();

    // The DialogTitleDirective generates a unique id and pushes it onto
    // the container's aria-labelledby queue. The exact id is generated, but
    // it must resolve to the title element with the expected text.
    const labelledBy = await dialog.topDialog.getAttribute('aria-labelledby');
    expect(labelledBy, 'aria-labelledby should be set when [twDialogTitle] is projected').toBeTruthy();
    const titleEl = page.locator(`#${labelledBy}`);
    await expect(titleEl).toHaveText('Create a new project');
  });

  for (const size of ['xs', 'sm', 'md', 'lg', 'xl', 'fullscreen'] as const satisfies readonly DialogSize[]) {
    test(`@interaction @overlay size preset "${size}" opens a panel`, async ({ page }) => {
      const dialog = new DialogPage(page);
      await dialog.goto();

      await dialog.sizeTrigger(size).click();
      await dialog.waitForOpen();

      // Each size variant resolves a distinct `max-w-*` class on the
      // container, except fullscreen which drops the radius and border.
      const expectedClassFragment: Record<DialogSize, string> = {
        xs: 'max-w-sm',
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        fullscreen: 'w-screen',
      };
      await expect(dialog.topDialog).toHaveClass(new RegExp(expectedClassFragment[size]));
    });
  }

  test('@interaction @overlay component content receives `data` via TW_DIALOG_DATA', async ({
    page,
  }) => {
    const dialog = new DialogPage(page);
    await dialog.goto();

    await dialog.componentTrigger.click();
    await dialog.waitForOpen();

    // Demo passes a UserProfileData payload — the rendered component must
    // display the injected `name`, `handle`, and `location` fields.
    await expect(dialog.topDialog).toContainText('Elena Moreau');
    await expect(dialog.topDialog).toContainText('@elena');
    await expect(dialog.topDialog).toContainText('Lyon, France');

    // [twDialogClose]="'followed'" → afterClosed result mirrored into the
    // demo's `lastProfileResult` signal and rendered in `<code>Result</code>`.
    await dialog.topDialog.getByRole('button', { name: 'Follow' }).click();
    await dialog.waitForClosed();
    await expect(dialog.componentResult).toHaveText('followed');
  });

  test('@interaction @overlay close guard vetoes Esc/backdrop/button until predicate passes', async ({
    page,
  }) => {
    const dialog = new DialogPage(page);
    await dialog.goto();

    await dialog.guardTrigger.click();
    await dialog.waitForOpen();

    // Predicate starts as `() => guardReady()` with guardReady=false → block.
    await page.keyboard.press('Escape');
    await expect(dialog.dialogs).toHaveCount(1);

    await dialog.backdrop.click({ position: { x: 5, y: 5 } });
    await expect(dialog.dialogs).toHaveCount(1);

    const discard = dialog.topDialog.getByRole('button', { name: 'Discard changes' });
    await discard.click();
    await expect(dialog.dialogs).toHaveCount(1);

    // Tick the consent checkbox — predicate now returns true.
    await dialog.topDialog.getByRole('checkbox').check();
    await discard.click();
    await dialog.waitForClosed();
  });

  test('@interaction @overlay lifecycle events fire in order opened → beforeClosed → afterClosed', async ({
    page,
  }) => {
    const dialog = new DialogPage(page);
    await dialog.goto();

    await dialog.lifecycleTrigger.click();
    await dialog.waitForOpen();
    // `afterOpened` resolves after the enter animation completes — the demo
    // mirrors it into `lifecycleLog`. Poll the rendered `<code>` rather than
    // the signal so we exercise the same surface a consumer would observe.
    await expect(dialog.lifecycleLog).toHaveText('opened');

    await page.keyboard.press('Escape');
    await dialog.waitForClosed();
    await expect(dialog.lifecycleLog).toHaveText('opened → beforeClosed → afterClosed');
  });

  test.fixme(
    '@interaction @overlay BUG: body scroll is locked by the default block scroll strategy',
    async ({ page }) => {
      // BUG (ngx-tw/dialog#scroll-lock-shell-layout): CDK's
      // `BlockScrollStrategy` only engages when `<html>` overflows. The
      // demo shell uses `<main class="overflow-y-auto">` as its scroll
      // container, so `<html>` never overflows and the lock never applies.
      // The dialog is still visually modal but the underlying main region
      // remains scrollable.
      //
      // Either ship a strategy that also locks the nearest scrollable
      // ancestor of the trigger, or document that consumers must let
      // `<html>` be the scroll container. Re-enable once resolved.
      const dialog = new DialogPage(page);
      await dialog.goto();

      await expect(page.locator('html')).not.toHaveClass(/cdk-global-scrollblock/);
      await dialog.sizeTrigger('md').click();
      await dialog.waitForOpen();
      await expect(page.locator('html')).toHaveClass(/cdk-global-scrollblock/);

      await page.keyboard.press('Escape');
      await dialog.waitForClosed();
      await expect(page.locator('html')).not.toHaveClass(/cdk-global-scrollblock/);
    },
  );

  test('@interaction @overlay playground scrollBehavior=noop does not add the global scroll lock', async ({
    page,
  }) => {
    const dialog = new DialogPage(page);
    await dialog.goto();

    // Switch the playground to the `noop` scroll strategy.
    await dialog.playgroundSection.getByRole('button', { name: 'noop', exact: true }).click();
    await dialog.playgroundTrigger.click();
    await dialog.waitForOpen();

    await expect(page.locator('html')).not.toHaveClass(/cdk-global-scrollblock/);

    await page.keyboard.press('Escape');
    await dialog.waitForClosed();
  });

  test('@interaction @overlay playground disableClose blocks Esc and backdrop click', async ({
    page,
  }) => {
    const dialog = new DialogPage(page);
    await dialog.goto();

    await dialog.playgroundFeatureToggle('disableClose').click();
    await dialog.playgroundTrigger.click();
    await dialog.waitForOpen();

    await page.keyboard.press('Escape');
    await expect(dialog.dialogs).toHaveCount(1);

    await dialog.backdrop.click({ position: { x: 5, y: 5 } });
    await expect(dialog.dialogs).toHaveCount(1);

    // Explicit Cancel button still closes — it calls `ref.close()` directly,
    // which bypasses the disableClose guard (that guard only intercepts
    // Esc/backdrop).
    await dialog.topDialog.getByRole('button', { name: 'Cancel' }).click();
    await dialog.waitForClosed();
  });

  test('@interaction @overlay stacked dialogs: opening B keeps A; closing B keeps A; closing A restores trigger focus', async ({
    page,
  }) => {
    const dialog = new DialogPage(page);
    await dialog.goto();

    await dialog.stackedTrigger.focus();
    await page.keyboard.press('Enter');
    await dialog.waitForOpen();
    await expect(dialog.dialogs).toHaveCount(1);
    await expect(dialog.stackDepth).toHaveText('1');

    // Open child from inside the parent dialog.
    await dialog.topDialog.getByRole('button', { name: 'Invite someone new' }).click();
    await expect(dialog.dialogs).toHaveCount(2);
    await expect(dialog.stackDepth).toHaveText('2');

    // Esc closes only the top-most dialog.
    await page.keyboard.press('Escape');
    await expect(dialog.dialogs).toHaveCount(1);
    await expect(dialog.stackDepth).toHaveText('1');

    // Now top dialog is the parent; closing it restores focus to the
    // original trigger.
    await page.keyboard.press('Escape');
    await dialog.waitForClosed();
    await expect(dialog.stackDepth).toHaveText('0');
    await expect(dialog.stackedTrigger).toBeFocused();
  });

  test('@a11y @overlay focus trap: 30 Tabs never escape the dialog', async ({ page }) => {
    const dialog = new DialogPage(page);
    await dialog.goto();

    await dialog.scrollTrigger.focus();
    await page.keyboard.press('Enter');
    await dialog.waitForOpen();

    for (let i = 0; i < FOCUS_TRAP_TAB_COUNT; i++) {
      await page.keyboard.press('Tab');
      const stillInside = await page.evaluate(
        () => !!document.activeElement?.closest('tw-dialog-container'),
      );
      expect(stillInside, `Tab #${i + 1} let focus escape the dialog`).toBe(true);
    }

    await page.keyboard.press('Escape');
    await dialog.waitForClosed();
  });

  test('@a11y @overlay focus restoration: trigger regains focus after close', async ({ page }) => {
    const dialog = new DialogPage(page);
    await dialog.goto();

    const trigger = dialog.sizeTrigger('md');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await dialog.waitForOpen();

    await page.keyboard.press('Escape');
    await dialog.waitForClosed();

    await expect(trigger).toBeFocused();
  });

  test('@a11y @overlay slot directives compose the documented header + body + actions layout', async ({
    page,
  }) => {
    const dialog = new DialogPage(page);
    await dialog.goto();

    // The Confirmation dialog is the canonical full composition surface —
    // it projects every dialog-content directive. Angular strips directive
    // selectors from the rendered DOM (they exist only at compile time),
    // so we assert the *observable behaviour* each directive contributes
    // rather than the attribute itself.
    await dialog.confirmationTrigger.click();
    await dialog.waitForOpen();

    const container = dialog.topDialog;

    // [twDialogTitle] — semibold heading-level title text, registered with
    // the container's aria-labelledby queue.
    const titleId = await container.getAttribute('aria-labelledby');
    expect(titleId, '[twDialogTitle] should populate aria-labelledby').toBeTruthy();
    await expect(page.locator(`#${titleId}`)).toHaveText('Permanently delete acme-ledger?');

    // [twDialogSubtitle] — supporting muted-fg line below the title.
    await expect(container).toContainText('This removes the repository and everything it contains.');

    // [twDialogContent] — scrollable region with `overflow-y-auto`.
    const content = container.locator('[class*="overflow-y-auto"]');
    await expect(content).toHaveCount(1);

    // [twDialogActions] — bottom action bar with the two close buttons.
    const cancel = container.getByRole('button', { name: 'Cancel' });
    const destructive = container.getByRole('button', { name: 'Delete repository' });
    await expect(cancel).toBeVisible();
    await expect(destructive).toBeVisible();

    // [twDialogClose] on the Cancel button propagates `false` to
    // `afterClosed()` — surfaced as the "cancelled" branch.
    await cancel.click();
    await dialog.waitForClosed();
    await expect(dialog.confirmationResult).toHaveText('cancelled');
  });
});
