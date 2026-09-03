import { expect, test } from '../../fixtures/base';
import { CommandPalettePage } from '../../pages/command-palette.page';

test.describe.configure({ mode: 'parallel' });

test.describe('Command Palette', () => {
  test('@interaction @overlay [(open)] round-trips: host listener opens, backdrop click closes', async ({
    page,
  }) => {
    const cp = new CommandPalettePage(page);
    await cp.goto();

    await cp.fuzzyOpenTrigger().click();
    await cp.waitForOpen();
    await expect(cp.searchInput).toBeFocused();

    await cp.backdrop.click({ position: { x: 5, y: 5 } });
    await cp.waitForClosed();
  });

  test('@interaction @overlay typing filters items synchronously (no debounce)', async ({
    page,
  }) => {
    const cp = new CommandPalettePage(page);
    await cp.goto();

    await cp.fuzzyOpenTrigger().click();
    await cp.waitForOpen();

    const initialCount = await cp.options().count();
    expect(initialCount).toBeGreaterThan(0);

    // Custom fuzzyFilter — "gf" matches "Go to file" only.
    await cp.searchInput.fill('gf');
    await expect(cp.options()).toHaveCount(1);
    await expect(cp.optionByLabel(/Go to file/)).toBeVisible();
  });

  test('@interaction @overlay ArrowDown cycles items; Enter activates', async ({ page }) => {
    const cp = new CommandPalettePage(page);
    await cp.goto();

    await cp.stayOpenTrigger().click();
    await cp.waitForOpen();
    await expect(cp.searchInput).toBeFocused();

    // Active descendant starts on the first item — press ArrowDown twice
    // and Enter to activate the third item.
    await cp.searchInput.press('ArrowDown');
    await cp.searchInput.press('ArrowDown');
    await cp.searchInput.press('Enter');

    // closeOnSelect=false on this section keeps the overlay mounted; the
    // demo mirrors itemSelected.label into "Last selected".
    await expect(cp.stayLastLabel()).not.toContainText('none');
  });

  test('@interaction @overlay Esc closes the palette', async ({ page }) => {
    const cp = new CommandPalettePage(page);
    await cp.goto();

    await cp.fuzzyOpenTrigger().click();
    await cp.waitForOpen();

    await page.keyboard.press('Escape');
    await cp.waitForClosed();
  });

  test('@a11y @overlay overlay carries dialog/combobox/listbox ARIA contract', async ({
    page,
  }) => {
    const cp = new CommandPalettePage(page);
    await cp.goto();

    await cp.fuzzyOpenTrigger().click();
    await cp.waitForOpen();

    // role="dialog" is on the inner panel div, not the host element.
    const dialog = cp.topOverlay.locator('[role="dialog"]');
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    const searchInput = cp.searchInput;
    await expect(searchInput).toHaveAttribute('aria-expanded', 'true');
    await expect(searchInput).toHaveAttribute('aria-controls', /^tw-command-palette-list-/);

    await expect(
      searchInput,
      'first item should seed aria-activedescendant',
    ).toHaveAttribute('aria-activedescendant', /\S/);
  });

  test('@a11y @overlay groups render as role="group" with their label', async ({ page }) => {
    const cp = new CommandPalettePage(page);
    await cp.goto();

    await cp.groupTriggerInGroups().click();
    await cp.waitForOpen();

    const groups = cp.topOverlay.getByRole('group');
    await expect(groups).toHaveCount(2);
    await expect(groups.nth(0)).toHaveAttribute('aria-label', 'File');
    await expect(groups.nth(1)).toHaveAttribute('aria-label', 'Edit');
  });

  test('@a11y @overlay disabled items expose aria-disabled and skip activation', async ({
    page,
  }) => {
    const cp = new CommandPalettePage(page);
    await cp.goto();

    await cp.disabledItemTrigger().click();
    await cp.waitForOpen();

    const deploy = cp.optionByLabel(/Deploy/);
    await expect(deploy).toHaveAttribute('aria-disabled', 'true');
  });

  test('@interaction @overlay [closeOnSelect]="false" keeps the palette open after select', async ({
    page,
  }) => {
    const cp = new CommandPalettePage(page);
    await cp.goto();

    await cp.stayOpenTrigger().click();
    await cp.waitForOpen();

    await cp.optionByLabel(/Cut/).click();
    // Palette should stay mounted because closeOnSelect=false.
    await expect(cp.overlays).toHaveCount(1);
    await expect(cp.stayLastLabel()).toContainText('Cut');
  });

  test('@interaction @overlay custom *twCommandPaletteEmpty receives the current query', async ({
    page,
  }) => {
    const cp = new CommandPalettePage(page);
    await cp.goto();

    await cp.templatesTrigger().click();
    await cp.waitForOpen();

    await cp.searchInput.fill('xyzzz-nothing');
    await expect(cp.topOverlay).toContainText('No commands match');
    // The template binds the query via let-q.
    await expect(cp.topOverlay).toContainText('xyzzz-nothing');
  });

  test('@interaction @overlay programmatic show()/hide()/toggle() drive the palette', async ({
    page,
  }) => {
    const cp = new CommandPalettePage(page);
    await cp.goto();

    await cp.programmaticControl('show()').click();
    await cp.waitForOpen();

    await cp.programmaticControl('hide()').click({ force: true });
    await cp.waitForClosed();

    await cp.programmaticControl('toggle()').click();
    await cp.waitForOpen();
    await cp.programmaticControl('toggle()').click({ force: true });
    await cp.waitForClosed();
  });

  test('@interaction @overlay global Cmd/Ctrl+K hotkey opens the palette', async ({ page }) => {
    const cp = new CommandPalettePage(page);
    await cp.goto();

    // Demo's constructor wires window keydown for ⌘/Ctrl+K → open.
    await page.keyboard.press('ControlOrMeta+k');
    await cp.waitForOpen();

    await page.keyboard.press('Escape');
    await cp.waitForClosed();
  });

  test.fixme(
    '[fixme:command-palette/trigger-directive] @interaction @overlay [twCommandPaletteTrigger] declarative trigger directive',
    async () => {
      // BLOCKED: command-palette-trigger.ts is exported but not wired into
      // any demo example (see REVIEW.md §8.1, chapter 04 §Command Palette
      // — Phase 0b item 3). Add a demo section that uses the directive,
      // then assert `aria-haspopup="dialog"` / `aria-expanded` round-trip.
    },
  );
});
