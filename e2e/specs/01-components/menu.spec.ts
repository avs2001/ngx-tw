import { expect, test } from '../../fixtures/base';
import { MenuPage } from '../../pages/menu.page';

test.describe.configure({ mode: 'parallel' });

test.describe('Menu', () => {
  test('@interaction @overlay click trigger opens overlay; outside-click closes it', async ({
    page,
  }) => {
    const m = new MenuPage(page);
    await m.goto();

    await m.basicTrigger.click();
    await m.waitForOpen();
    await expect(m.topMenu.getByRole('menuitem', { name: 'Rename' })).toBeVisible();

    // CDK overlays attach a transparent backdrop — clicking outside closes.
    await page.mouse.click(5, 5);
    await m.waitForClosed();
  });

  test('@interaction @overlay menu closes on item activation', async ({ page }) => {
    const m = new MenuPage(page);
    await m.goto();

    await m.basicTrigger.click();
    await m.waitForOpen();

    await m.topMenu.getByRole('menuitem', { name: 'Rename' }).click();
    await m.waitForClosed();
  });

  test('@a11y @overlay ArrowDown from trigger opens menu and focuses first item; Esc returns focus', async ({
    page,
  }) => {
    const m = new MenuPage(page);
    await m.goto();

    await m.basicTrigger.focus();
    await page.keyboard.press('ArrowDown');
    await m.waitForOpen();

    // CDK's CdkMenuTrigger focuses the first item on keyboard open.
    const focusedRole = await page.evaluate(
      () => (document.activeElement?.getAttribute('role') ?? null),
    );
    expect(focusedRole, 'first menuitem should hold focus after open').toBe('menuitem');

    await page.keyboard.press('Escape');
    await m.waitForClosed();
    await expect(m.basicTrigger).toBeFocused();
  });

  test('@a11y @overlay disabled items are skipped by keyboard navigation', async ({ page }) => {
    const m = new MenuPage(page);
    await m.goto();

    await m.basicTrigger.focus();
    await page.keyboard.press('ArrowDown');
    await m.waitForOpen();
    // Three enabled items, then a disabled "Archive", then "Delete project".
    // ArrowDown four times must skip Archive and land on "Delete project",
    // not Archive.
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('ArrowDown');
    }
    const focusedName = await page.evaluate(
      () => document.activeElement?.textContent?.trim() ?? '',
    );
    expect(focusedName, 'disabled "Archive" must be skipped').not.toMatch(/^Archive$/);
  });

  test('@interaction @overlay hovering a submenu trigger opens the nested overlay', async ({
    page,
  }) => {
    const m = new MenuPage(page);
    await m.goto();

    await m.editTrigger.click();
    await m.waitForOpen();

    // CdkMenuTrigger nested in a menu opens its submenu on hover (mouse
    // intent) — assert the second overlay materialises with the submenu's
    // contents. Match by aria-haspopup="menu" since the Share button is
    // both a `menuitem` and a submenu trigger.
    const shareTrigger = m.topMenu.locator('[aria-haspopup="menu"]');
    await shareTrigger.hover();

    await expect(m.menus).toHaveCount(2);
    await expect(m.topMenu.getByRole('menuitem', { name: /Email link/ })).toBeVisible();
  });

  test('@interaction @overlay checkbox menu items toggle external state via (triggered)', async ({
    page,
  }) => {
    const m = new MenuPage(page);
    await m.goto();

    await expect(m.checkRadioStatus).toContainText('toolbar = true');

    await m.viewOptionsTrigger.click();
    await m.waitForOpen();

    await m.topMenu.getByRole('menuitemcheckbox', { name: 'Toolbar' }).click();
    // Activation closes the menu by default.
    await m.waitForClosed();

    await expect(m.checkRadioStatus).toContainText('toolbar = false');
  });

  test('@interaction @overlay radio menu items enforce single-select via (triggered)', async ({
    page,
  }) => {
    const m = new MenuPage(page);
    await m.goto();

    await expect(m.checkRadioStatus).toContainText('view = grid');

    await m.viewOptionsTrigger.click();
    await m.waitForOpen();

    await m.topMenu.getByRole('menuitemradio', { name: 'List view' }).click();
    await m.waitForClosed();
    await expect(m.checkRadioStatus).toContainText('view = list');
  });

  test('@interaction @overlay context menu opens on right-click in the target zone', async ({
    page,
  }) => {
    const m = new MenuPage(page);
    await m.goto();

    await m.contextZone.click({ button: 'right' });
    await m.waitForOpen();
    await expect(m.topMenu.getByRole('menuitem', { name: /Copy/ })).toBeVisible();

    await page.keyboard.press('Escape');
    await m.waitForClosed();
  });
});
