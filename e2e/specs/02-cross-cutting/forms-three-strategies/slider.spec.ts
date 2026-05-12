import { expect, test } from '../../../fixtures/base';
import { SliderPage } from '../../../pages/slider.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Three-strategy contract — `Slider`.
 *
 * Synchronous-control family. Slider exposes no `(valueChange)` output
 * in the demo readout — the bound value (visible via the `value = …`
 * mono-font readout) is the observable substitute.
 *
 * Sections anchored by H2 (Phase 0b markers not wired).
 */
test.describe('Forms · Three strategies · Slider', () => {
  // Template-Driven
  test('@forms @td template-driven: programmatic set propagates to aria-valuenow', async ({ page }) => {
    const slider = new SliderPage(page);
    await slider.goto();

    const thumb = slider.thumbIn('td');
    await expect(thumb).toHaveAttribute('aria-valuenow', '50');

    await slider.buttonIn('td', 'Set 0').click();
    await expect(thumb).toHaveAttribute('aria-valuenow', '0');
    await expect(slider.readoutIn('td')).toContainText('value = 0');

    await slider.buttonIn('td', 'Set 100').click();
    await expect(thumb).toHaveAttribute('aria-valuenow', '100');
    await expect(slider.readoutIn('td')).toContainText('value = 100');
  });

  test('@forms @td template-driven: keyboard step flows into the bound signal', async ({ page }) => {
    const slider = new SliderPage(page);
    await slider.goto();

    const thumb = slider.thumbIn('td');
    await slider.buttonIn('td', 'Set 50').click();
    await thumb.focus();
    await page.keyboard.press('ArrowRight');

    await expect(slider.readoutIn('td')).toContainText('value = 51');
  });

  // Reactive
  test('@forms @reactive reactive: setValue propagates to aria-valuenow', async ({ page }) => {
    const slider = new SliderPage(page);
    await slider.goto();

    await slider.buttonIn('reactive', 'Set 0').click();
    await expect(slider.thumbIn('reactive')).toHaveAttribute('aria-valuenow', '0');
    await expect(slider.readoutIn('reactive')).toContainText('control.value = 0');

    await slider.buttonIn('reactive', 'Set 100').click();
    await expect(slider.thumbIn('reactive')).toHaveAttribute('aria-valuenow', '100');
  });

  test('@forms @reactive reactive: disable() blocks the slider', async ({ page }) => {
    const slider = new SliderPage(page);
    await slider.goto();

    const thumb = slider.thumbIn('reactive');
    await slider.buttonIn('reactive', 'Disable').click();
    await expect(thumb).toHaveAttribute('aria-disabled', 'true');

    // Keyboard interaction should be a no-op while disabled.
    const before = await thumb.getAttribute('aria-valuenow');
    await thumb.focus();
    await page.keyboard.press('ArrowRight');
    await expect(thumb).toHaveAttribute('aria-valuenow', before ?? '');
  });

  // Signal Forms
  test('@forms @signal signal-forms: programmatic set propagates to aria-valuenow', async ({ page }) => {
    const slider = new SliderPage(page);
    await slider.goto();

    const thumb = slider.thumbIn('signal');
    // Initial signal model: fontSize = 16.
    await expect(thumb).toHaveAttribute('aria-valuenow', '16');

    await slider.buttonIn('signal', 'Set 12').click();
    await expect(thumb).toHaveAttribute('aria-valuenow', '12');
    await expect(slider.readoutIn('signal')).toContainText('value = 12');

    await slider.buttonIn('signal', 'Set 64').click();
    await expect(thumb).toHaveAttribute('aria-valuenow', '64');
  });

  test('@forms @signal signal-forms: reset() does not error after a user blur (touched cleared)', async ({
    page,
  }) => {
    // Slider notifies onTouched only on blur (`onThumbBlur()`), not on each
    // keyboard step. Focus, blur, then reset, and assert the touched flag
    // returns to false. No-arg Signal Forms `reset()` does not clear value.
    const slider = new SliderPage(page);
    await slider.goto();

    const thumb = slider.thumbIn('signal');
    await thumb.focus();
    await thumb.blur();
    await expect(slider.readoutIn('signal')).toContainText('touched = true');

    await slider.buttonIn('signal', 'Reset').click();
    await expect(slider.readoutIn('signal')).toContainText('touched = false');
  });

  // Cross-strategy parity
  test('@forms cross-strategy: changing one strategy does not leak into the others', async ({ page }) => {
    const slider = new SliderPage(page);
    await slider.goto();

    await slider.buttonIn('td', 'Set 0').click();
    await slider.buttonIn('reactive', 'Set 100').click();
    await slider.buttonIn('signal', 'Set 64').click();

    await expect(slider.thumbIn('td')).toHaveAttribute('aria-valuenow', '0');
    await expect(slider.thumbIn('reactive')).toHaveAttribute('aria-valuenow', '100');
    await expect(slider.thumbIn('signal')).toHaveAttribute('aria-valuenow', '64');
  });
});
