import { expect, test } from '../../fixtures/base';
import { ShellPage } from '../../pages/shell.page';

test.describe.configure({ mode: 'parallel' });

const ROOT = 'html';

test.describe('@smoke theme persistence', () => {
  test('dark mode persists across reload', async ({ page }) => {
    const shell = new ShellPage(page);
    await shell.gotoComponent('button', 'examples');

    // Sanity: the base fixture seeds `'light'`.
    await expect(page.locator(ROOT)).toHaveAttribute('data-theme', 'light');

    await shell.themeToggleDark.click();
    await expect(page.locator(ROOT)).toHaveAttribute('data-theme', 'dark');

    const stored = await page.evaluate(() => window.localStorage.getItem('ngx-tw-theme'));
    expect(stored).toBe('dark');

    await page.reload();
    await expect(page.locator(ROOT)).toHaveAttribute('data-theme', 'dark');
  });

  test('color preset persists across navigation', async ({ page }) => {
    const shell = new ShellPage(page);
    await shell.gotoComponent('button', 'examples');

    await shell.presetMenuButton.click();
    await expect(shell.presetListbox).toBeVisible();
    await shell.presetListbox.getByRole('option', { name: 'Ocean' }).click();
    await expect(shell.presetListbox).toBeHidden();

    await expect(page.locator(ROOT)).toHaveAttribute('data-preset', 'ocean');
    const storedPreset = await page.evaluate(() => window.localStorage.getItem('ngx-tw-preset'));
    expect(storedPreset).toBe('ocean');

    // Navigate to a different component — preset is global, must survive.
    await shell.gotoComponent('alert', 'examples');
    await expect(page.locator(ROOT)).toHaveAttribute('data-preset', 'ocean');

    // And back.
    await shell.gotoComponent('button', 'overview');
    await expect(page.locator(ROOT)).toHaveAttribute('data-preset', 'ocean');
  });

  test('resetting to the Default preset clears the data-preset attribute', async ({ page }) => {
    const shell = new ShellPage(page);
    await shell.gotoComponent('button', 'examples');

    // First set a non-default preset.
    await shell.presetMenuButton.click();
    await shell.presetListbox.getByRole('option', { name: 'Forest' }).click();
    await expect(page.locator(ROOT)).toHaveAttribute('data-preset', 'forest');

    // Then switch back to Default — the shell removes the attribute entirely
    // rather than writing `data-preset="default"`.
    await shell.presetMenuButton.click();
    await shell.presetListbox.getByRole('option', { name: 'Default' }).click();
    await expect(page.locator(ROOT)).not.toHaveAttribute('data-preset', /.*/);

    const storedPreset = await page.evaluate(() => window.localStorage.getItem('ngx-tw-preset'));
    expect(storedPreset).toBe('default');
  });
});
