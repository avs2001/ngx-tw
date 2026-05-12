import { expect, test } from '../../fixtures/base';
import { DialogPage } from '../../pages/dialog.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Reduced motion — chapter 08 §8.5.
 *
 * Drift guard, not a current-bug catch. `grep -rn "transition-all"` in
 * `projects/` returns zero today; the library transitions are scoped
 * (`transition-colors duration-200 motion-reduce:transition-none`,
 * `transition-[color,shadow] duration-200`, etc.).
 *
 * `playwright.config.ts` ships `contextOptions: { reducedMotion: 'reduce' }`
 * globally, so every test runs under the reduce media query. This file
 * is the explicit assertion that animated surfaces honour it.
 *
 * We assert via `getComputedStyle(...).transitionDuration === '0s'` on
 * the dialog container, select listbox, and alert root. The toast is
 * tested at the same surface via the dialog example's lifecycle
 * affordance only if available — otherwise the live coverage above is
 * the minimum bar.
 */
test.describe('Reduced motion drift guard', () => {
  test('@a11y dialog container: transitionDuration is 0s under prefers-reduced-motion', async ({
    page,
  }) => {
    const dialog = new DialogPage(page);
    await dialog.goto();

    await dialog.sizeTrigger('md').click();
    await dialog.waitForOpen();

    const duration = await dialog.topDialog.evaluate(
      (el) => getComputedStyle(el).transitionDuration,
    );
    // Tailwind v4 / theme CSS may report `0s` or `0s, 0s` for multi-property
    // transitions — every component element transitions for zero seconds.
    expect(duration.split(',').map((s) => s.trim())).toEqual(
      Array(duration.split(',').length).fill('0s'),
    );
  });

  test('@a11y select listbox: transitionDuration is 0s under prefers-reduced-motion', async ({
    page,
  }) => {
    await page.goto('/components/select/examples');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const trigger = page.locator('main').getByRole('combobox').first();
    await trigger.click();
    const listbox = page.locator('.cdk-overlay-container [role="listbox"]');
    await expect(listbox).toBeVisible();

    const duration = await listbox.evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration.split(',').map((s) => s.trim())).toEqual(
      Array(duration.split(',').length).fill('0s'),
    );
  });

  test('@a11y alert root: transitionDuration is 0s under prefers-reduced-motion', async ({
    page,
  }) => {
    await page.goto('/components/alert/examples');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const alert = page.getByRole('alert').first();
    await expect(alert).toBeVisible();

    const duration = await alert.evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration.split(',').map((s) => s.trim())).toEqual(
      Array(duration.split(',').length).fill('0s'),
    );
  });

  test('@a11y toast container: transitionDuration is 0s under prefers-reduced-motion', async ({
    page,
  }) => {
    await page.goto('/components/toast/examples');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Toast examples render trigger buttons that invoke ToastService.
    // First trigger on the page is sufficient — the surface under test
    // is the rendered `tw-toast` host, not the trigger.
    const firstShow = page.locator('main').getByRole('button').first();
    await firstShow.click();

    const toast = page.locator('tw-toast').first();
    await expect(toast).toBeVisible();

    const duration = await toast.evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration.split(',').map((s) => s.trim())).toEqual(
      Array(duration.split(',').length).fill('0s'),
    );
  });
});
