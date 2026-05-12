import { expect, test } from '../../fixtures/base';
import { SliderPage } from '../../pages/slider.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Slider interaction + a11y suite.
 *
 * Per `chapter 04 §Slider` + REVIEW.md:
 *   - Single thumb: keyboard arrows step by `step`; Home/End jump.
 *   - Range slider: two thumbs that can't cross.
 *   - ARIA `aria-valuenow/min/max/text` populated; `aria-orientation`
 *     is always `'horizontal'` (slider has NO vertical mode).
 *   - `step="null"` allows continuous values.
 *   - `[marks]` rendering (true → one per step, array → custom).
 *   - Custom `valueFormatter` drives bubble + aria-valuetext.
 *
 * Pointer drag relies on `setPointerCapture` + rAF and is real-browser
 * only; keyboard nav is the most reliable cross-browser path.
 */
test.describe('Slider', () => {
  test('@a11y default render: thumb has role=slider, valuenow / valuemin / valuemax / valuetext / orientation', async ({
    page,
  }) => {
    const slider = new SliderPage(page);
    await slider.goto();

    const thumb = slider.variantsSection.getByRole('slider').first();
    await expect(thumb).toBeVisible();
    // Demo's `solid` variant starts at 60.
    await expect(thumb).toHaveAttribute('aria-valuenow', '60');
    await expect(thumb).toHaveAttribute('aria-valuemin', '0');
    await expect(thumb).toHaveAttribute('aria-valuemax', '100');
    // Default formatter mirrors the numeric value into aria-valuetext.
    await expect(thumb).toHaveAttribute('aria-valuetext', /\d/);
    await expect(thumb).toHaveAttribute('aria-orientation', 'horizontal');
  });

  test('@interaction @keyboard ArrowRight / ArrowLeft step by `step`', async ({ page }) => {
    const slider = new SliderPage(page);
    await slider.goto();

    const thumb = slider.thumbIn('td');
    // TD demo defaults to 50; step defaults to 1.
    await thumb.focus();
    await expect(thumb).toHaveAttribute('aria-valuenow', '50');

    await page.keyboard.press('ArrowRight');
    await expect(thumb).toHaveAttribute('aria-valuenow', '51');

    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(thumb).toHaveAttribute('aria-valuenow', '49');
  });

  test('@interaction @keyboard Home / End jump to min and max', async ({ page }) => {
    const slider = new SliderPage(page);
    await slider.goto();

    const thumb = slider.thumbIn('td');
    await thumb.focus();

    await page.keyboard.press('End');
    await expect(thumb).toHaveAttribute('aria-valuenow', '100');

    await page.keyboard.press('Home');
    await expect(thumb).toHaveAttribute('aria-valuenow', '0');
  });

  test('@interaction range slider: two thumbs, each with its own valuenow', async ({ page }) => {
    const slider = new SliderPage(page);
    await slider.goto();

    // "Price" range: [150, 650] over 0..1000, step 10.
    const priceSlider = slider.rangeSection
      .locator('tw-slider')
      .filter({ has: page.getByText('Price') });
    const thumbs = priceSlider.getByRole('slider');
    await expect(thumbs).toHaveCount(2);

    await expect(thumbs.first()).toHaveAttribute('aria-valuenow', '150');
    await expect(thumbs.last()).toHaveAttribute('aria-valuenow', '650');
    // Start thumb's max is bounded by end thumb's value.
    await expect(thumbs.first()).toHaveAttribute('aria-valuemax', '650');
    // End thumb's min is bounded by start thumb's value.
    await expect(thumbs.last()).toHaveAttribute('aria-valuemin', '150');
  });

  test('@interaction @keyboard range thumbs cannot cross (start clamps at end - step)', async ({ page }) => {
    const slider = new SliderPage(page);
    await slider.goto();

    // "Working hours" range: [9, 17] in 0..24, step 1.
    const hoursSlider = slider.rangeSection
      .locator('tw-slider')
      .filter({ has: page.getByText('Working hours') });
    const startThumb = hoursSlider.getByRole('slider').first();

    await startThumb.focus();
    // Press ArrowRight enough times that start would exceed end without
    // clamping. With step=1 and end=17, start should clamp at 17.
    for (let i = 0; i < 20; i++) await page.keyboard.press('ArrowRight');
    const valuenow = await startThumb.getAttribute('aria-valuenow');
    // Start can equal end but cannot exceed.
    expect(Number(valuenow)).toBeLessThanOrEqual(17);
  });

  test('@interaction custom valueFormatter mirrors to aria-valuetext + bubble text', async ({ page }) => {
    const slider = new SliderPage(page);
    await slider.goto();

    // Completion slider in Value Formatters section uses PERCENT_FORMATTER.
    const completion = slider.formattersSection
      .locator('tw-slider')
      .filter({ has: page.getByText('Completion') });
    const thumb = completion.getByRole('slider');
    await expect(thumb).toHaveAttribute('aria-valuetext', /%$/);
    // Demo initial value: 68.
    await expect(thumb).toHaveAttribute('aria-valuetext', '68%');
  });

  test('@interaction disabled slider blocks keyboard input', async ({ page }) => {
    const slider = new SliderPage(page);
    await slider.goto();

    // First disabled slider in States: value=35, single-thumb.
    const states = slider.statesSection.locator('tw-slider').first();
    const thumb = states.getByRole('slider');
    await expect(thumb).toHaveAttribute('aria-disabled', 'true');
    await expect(thumb).toHaveAttribute('aria-valuenow', '35');
    await expect(thumb).toHaveAttribute('tabindex', '-1');

    // Even when focused programmatically, keyboard handler should return early.
    await thumb.focus();
    await page.keyboard.press('ArrowRight');
    await expect(thumb).toHaveAttribute('aria-valuenow', '35');
  });

  test('@interaction custom marks render one tick per mark', async ({ page }) => {
    const slider = new SliderPage(page);
    await slider.goto();

    // "Mode" slider in Step & Marks uses custom 5-mark array.
    const mode = slider.stepMarksSection
      .locator('tw-slider')
      .filter({ has: page.getByText('Mode') });
    // Marks render as positioned `<span>` elements inside the track row.
    // Custom-label row carries the human-readable text.
    await expect(mode.getByText('Off', { exact: true })).toBeVisible();
    await expect(mode.getByText('Max', { exact: true })).toBeVisible();
  });
});
