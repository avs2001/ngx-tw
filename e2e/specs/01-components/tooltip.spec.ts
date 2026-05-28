import { expect, test } from '../../fixtures/base';
import { TooltipPage } from '../../pages/tooltip.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Tooltip E2E suite. The directive listens for `(mouseenter)` /
 * `(focusin)` / `(touchstart)` and integrates with CDK's `AriaDescriber`
 * to push an `aria-describedby` id onto the trigger.
 */
test.describe('Tooltip', () => {
  test('@interaction @overlay hover shows the tooltip and mouseleave hides it', async ({
    page,
  }) => {
    const t = new TooltipPage(page);
    await t.goto();

    const trigger = t.colorTrigger('primary');
    await trigger.hover();
    await t.waitForOpen();
    await expect(t.topTooltip).toHaveText('primary tooltip');

    // Move pointer to the page heading — well clear of the trigger.
    await page.getByRole('heading', { level: 1 }).hover();
    await t.waitForClosed();
  });

  test('@interaction @overlay focus opens the tooltip; blur closes it', async ({
    page,
  }) => {
    const t = new TooltipPage(page);
    await t.goto();

    const trigger = t.colorTrigger('neutral');
    await trigger.focus();
    await t.waitForOpen();

    // Move focus elsewhere — focusout fires and the overlay tears down.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await t.waitForClosed();
  });

  test('@interaction @overlay Escape on the trigger hides the tooltip', async ({ page }) => {
    const t = new TooltipPage(page);
    await t.goto();

    const trigger = t.colorTrigger('info');
    await trigger.focus();
    await t.waitForOpen();

    await page.keyboard.press('Escape');
    await t.waitForClosed();
  });

  test('@a11y @overlay overlay has role="tooltip" and trigger picks up aria-describedby', async ({
    page,
  }) => {
    const t = new TooltipPage(page);
    await t.goto();

    const trigger = t.colorTrigger('success');
    await trigger.hover();
    await t.waitForOpen();

    await expect(t.topTooltip).toHaveAttribute('role', 'tooltip');
    // AriaDescriber wires the trigger's `aria-describedby` to a CDK-managed
    // describer message id while the tooltip is visible.
    await expect(
      trigger,
      'aria-describedby should be set while tooltip is visible',
    ).toHaveAttribute('aria-describedby', /\S/);
  });

  test('@interaction @overlay [twTooltipDisabled] suppresses showing entirely', async ({
    page,
  }) => {
    const t = new TooltipPage(page);
    await t.goto();

    await t.disabledTrigger.hover();
    // Give the host a chance to schedule a (would-be) show; nothing should
    // attach because the directive short-circuits on disabled.
    await expect(t.tooltips).toHaveCount(0);

    await t.enabledTrigger.hover();
    await t.waitForOpen();
  });

  test('@interaction @overlay programmatic show()/hide()/toggle() drive the overlay', async ({
    page,
  }) => {
    const t = new TooltipPage(page);
    await t.goto();

    await t.programmaticControl('Show').click();
    await t.waitForOpen();

    await t.programmaticControl('Hide').click();
    await t.waitForClosed();

    await t.programmaticControl('Toggle').click();
    await t.waitForOpen();

    await t.programmaticControl('Toggle').click();
    await t.waitForClosed();
  });

  test('@interaction @overlay [twTooltipArrow]="false" omits the arrow span', async ({ page }) => {
    const t = new TooltipPage(page);
    await t.goto();

    await t.noArrowTrigger.hover();
    await t.waitForOpen();
    // Arrow is the only `aria-hidden="true"` span inside the overlay.
    await expect(t.topTooltip.locator('span[aria-hidden="true"]')).toHaveCount(0);

    await page.getByRole('heading', { level: 1 }).hover();
    await t.waitForClosed();

    await t.withArrowTrigger.hover();
    await t.waitForOpen();
    await expect(t.topTooltip.locator('span[aria-hidden="true"]')).toHaveCount(1);
  });

  test('@interaction @overlay rich-content TemplateRef renders inside the panel', async ({
    page,
  }) => {
    const t = new TooltipPage(page);
    await t.goto();

    await t.richContentTrigger.hover();
    await t.waitForOpen();
    // The template projects a `Save` label and a `Ctrl+S` shortcut chip.
    await expect(t.topTooltip).toContainText('Ctrl+S');
  });

  for (const size of ['sm', 'md', 'lg'] as const) {
    test(`@interaction @overlay size "${size}" opens a panel`, async ({ page }) => {
      const t = new TooltipPage(page);
      await t.goto();

      await t.sizeTrigger(size).hover();
      await t.waitForOpen();
      await expect(t.topTooltip).toContainText(`This is a ${size} tooltip`);
    });
  }

  test('@interaction @overlay opening a second tooltip does not leak the first', async ({
    page,
  }) => {
    const t = new TooltipPage(page);
    await t.goto();

    await t.colorTrigger('primary').hover();
    await t.waitForOpen();

    await t.colorTrigger('error').hover();
    await expect(t.topTooltip).toHaveText('error tooltip');
    // Only one tooltip should be visible at a time.
    await expect(t.tooltips).toHaveCount(1);
  });
});
