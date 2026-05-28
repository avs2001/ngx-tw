import { expect, test } from '../../fixtures/base';
import { PopoverPage } from '../../pages/popover.page';

test.describe.configure({ mode: 'parallel' });

test.describe('Popover', () => {
  test('@interaction @overlay click trigger opens; outside click closes', async ({ page }) => {
    const p = new PopoverPage(page);
    await p.goto();

    await p.triggerInTriggers('click').click();
    await p.waitForOpen();
    await expect(p.topPopover).toContainText('Opened by click');

    // Default backdrop is `transparent` — outside click closes the popover.
    await p.backdrop.click({ position: { x: 5, y: 5 } });
    await p.waitForClosed();
  });

  test('@interaction @overlay Escape closes the popover', async ({ page }) => {
    const p = new PopoverPage(page);
    await p.goto();

    await p.triggerInTriggers('click').click();
    await p.waitForOpen();
    await page.keyboard.press('Escape');
    await p.waitForClosed();
  });

  test('@a11y @overlay overlay carries role="dialog"; trigger reflects aria-expanded/controls', async ({
    page,
  }) => {
    const p = new PopoverPage(page);
    await p.goto();

    const trigger = p.triggerInTriggers('click');
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await trigger.click();
    await p.waitForOpen();

    await expect(p.topPopover).toHaveAttribute('role', 'dialog');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await expect(
      trigger,
      'aria-controls should reference the overlay id',
    ).toHaveAttribute('aria-controls', /^tw-popover-/);
    const controls = await trigger.getAttribute('aria-controls');
    expect(controls).toMatch(/^tw-popover-/);
  });

  test('@interaction @overlay focus trigger opens; blur closes', async ({ page }) => {
    const p = new PopoverPage(page);
    await p.goto();

    const trigger = p.triggerInTriggers('focus');
    await trigger.focus();
    await p.waitForOpen();

    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await p.waitForClosed();
  });

  test('@interaction @overlay manual trigger does not open on click; toggle() drives it', async ({
    page,
  }) => {
    const p = new PopoverPage(page);
    await p.goto();

    const manualTrigger = p.triggerInTriggers('manual');
    await manualTrigger.click();
    await expect(p.popovers).toHaveCount(0);

    await p.manualToggleButton.click();
    await p.waitForOpen();
    // The transparent backdrop intercepts pointer events while the popover
    // is open, so the second toggle click needs to bypass actionability.
    await p.manualToggleButton.click({ force: true });
    await p.waitForClosed();
  });

  test('@interaction @overlay [twPopoverDisabled] suppresses every trigger', async ({ page }) => {
    const p = new PopoverPage(page);
    await p.goto();

    await p.disabledTrigger.click();
    await expect(p.popovers).toHaveCount(0);
  });

  test('@interaction @overlay programmatic open()/close()/toggle() round-trip', async ({
    page,
  }) => {
    const p = new PopoverPage(page);
    await p.goto();

    await p.programmaticControl('open()').click();
    await p.waitForOpen();

    // Backdrop is in the way once the overlay is open; force the click
    // so the test exercises the close() handler regardless.
    await p.programmaticControl('close()').click({ force: true });
    await p.waitForClosed();

    await p.programmaticControl('toggle()').click();
    await p.waitForOpen();

    await p.programmaticControl('toggle()').click({ force: true });
    await p.waitForClosed();
  });

  test('@interaction @overlay [(twPopoverOpen)] model round-trips with external state', async ({
    page,
  }) => {
    const p = new PopoverPage(page);
    await p.goto();

    await expect(p.modelStatus).toHaveText('isOpen = false');

    await p.modelTrigger.click();
    await p.waitForOpen();
    await expect(p.modelStatus).toHaveText('isOpen = true');

    // External signal mutation should close the popover. The transparent
    // backdrop intercepts pointer events while open, so force the click.
    await p.modelExternalToggle.click({ force: true });
    await p.waitForClosed();
    await expect(p.modelStatus).toHaveText('isOpen = false');
  });

  test('@interaction @overlay twPopoverClose directive closes from inside', async ({ page }) => {
    const p = new PopoverPage(page);
    await p.goto();

    await p.closeDirectiveTrigger.click();
    await p.waitForOpen();

    await p.topPopover.getByRole('button', { name: 'Cancel' }).click();
    await p.waitForClosed();
  });

  test('@interaction @overlay TemplateRef context exposes data + close()', async ({ page }) => {
    const p = new PopoverPage(page);
    await p.goto();

    await p.inviteTeammateTrigger.click();
    await p.waitForOpen();
    await expect(p.topPopover).toContainText('Invite Tomás Aguilar');

    await p.topPopover.getByRole('button', { name: 'Send invite' }).click();
    await p.waitForClosed();
    // The recordInvite handler updates the visible "Last action" label.
    await expect(p.contextSection).toContainText('Last action: invited');
    await expect(p.contextSection).toContainText('Tomás Aguilar');
  });

  test('@interaction @overlay component content receives POPOVER_DATA + POPOVER_REF', async ({
    page,
  }) => {
    const p = new PopoverPage(page);
    await p.goto();

    await p.inviteComponentTrigger.click();
    await p.waitForOpen();
    await expect(p.topPopover).toContainText('Invite Erin Shaw');
    await expect(p.topPopover).toContainText('Design systems');

    // Component injects POPOVER_REF and calls close() in its accept handler.
    await p.topPopover.getByRole('button', { name: 'Send invite' }).click();
    await p.waitForClosed();
  });

  for (const pos of ['top', 'right', 'bottom', 'left'] as const) {
    test(`@interaction @overlay position "${pos}" opens a panel`, async ({ page }) => {
      const p = new PopoverPage(page);
      await p.goto();

      await p.positionTrigger(pos).click();
      await p.waitForOpen();
      await expect(p.topPopover).toContainText(pos);
    });
  }
});
