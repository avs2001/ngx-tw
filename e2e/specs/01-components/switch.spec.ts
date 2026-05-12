import { expect, test } from '../../fixtures/base';
import { SwitchPage } from '../../pages/switch.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Switch interaction + a11y suite.
 *
 * Per `chapter 04 §Checkbox / Radio / Switch`:
 *   - Renders with `role="switch"`, toggles on click and on `Space`.
 *   - Disabled state blocks interaction.
 *   - `required` drives `aria-required="true"`.
 *   - `name` mirrors to the host element (HTML form compat).
 */
test.describe('Switch', () => {
  test('@interaction default render: role=switch with aria-checked', async ({ page }) => {
    const sw = new SwitchPage(page);
    await sw.goto();

    const first = sw.colorsSection.getByRole('switch').first();
    await expect(first).toBeVisible();
    // Demo defaults every color value to `true`.
    await expect(first).toHaveAttribute('aria-checked', 'true');
  });

  test('@interaction click toggles aria-checked', async ({ page }) => {
    const sw = new SwitchPage(page);
    await sw.goto();

    // Beta features in the "With Description" section starts unchecked.
    const beta = sw.descriptionSection.getByRole('switch', { name: /beta features/i });
    await expect(beta).toHaveAttribute('aria-checked', 'false');

    await beta.click();
    await expect(beta).toHaveAttribute('aria-checked', 'true');

    await beta.click();
    await expect(beta).toHaveAttribute('aria-checked', 'false');
  });

  test('@interaction @keyboard Space toggles via keyboard', async ({ page }) => {
    const sw = new SwitchPage(page);
    await sw.goto();

    const beta = sw.descriptionSection.getByRole('switch', { name: /beta features/i });
    await beta.focus();
    await expect(beta).toBeFocused();
    await expect(beta).toHaveAttribute('aria-checked', 'false');

    await page.keyboard.press('Space');
    await expect(beta).toHaveAttribute('aria-checked', 'true');
  });

  test('@interaction disabled switch blocks click', async ({ page }) => {
    const sw = new SwitchPage(page);
    await sw.goto();

    const notifications = sw.statesSection.getByRole('switch', { name: /notifications/i });
    await expect(notifications).toHaveAttribute('aria-disabled', 'true');
    await expect(notifications).toHaveAttribute('aria-checked', 'false');

    await notifications.click({ force: true });
    await expect(notifications).toHaveAttribute('aria-checked', 'false');
  });

  test('@a11y required switch advertises aria-required="true"', async ({ page }) => {
    const sw = new SwitchPage(page);
    await sw.goto();

    const required = sw.statesSection.getByRole('switch', {
      name: /i agree to the terms/i,
    });
    await expect(required).toHaveAttribute('aria-required', 'true');
  });

  test('@a11y name attribute mirrors to the host (HTML form compat)', async ({ page }) => {
    const sw = new SwitchPage(page);
    await sw.goto();

    const td = sw.templateDrivenSection.getByRole('switch');
    await expect(td).toHaveAttribute('name', 'notificationsTd');
  });

  test('@a11y aria-describedby links to description content', async ({ page }) => {
    const sw = new SwitchPage(page);
    await sw.goto();

    const sync = sw.descriptionSection.getByRole('switch', { name: /auto-sync/i });
    const describedBy = await sync.getAttribute('aria-describedby');
    expect(describedBy, 'aria-describedby should be set when description input is provided').toBeTruthy();
    const ids = (describedBy ?? '').split(/\s+/).filter(Boolean);
    for (const id of ids) {
      await expect(page.locator(`#${id}`)).toContainText(/sync changes every minute/i);
    }
  });
});
