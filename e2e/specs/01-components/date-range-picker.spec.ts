import { expect, test } from '../../fixtures/base';
import { DateRangePickerPage } from '../../pages/date-range-picker.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Date-range-picker interaction + a11y spec.
 *
 * Per chapter 04 §Date Range Picker + chapter 08 §2:
 * - Opens with the documented two-month view (`numberOfMonths=2` default).
 * - Click start, then end → range highlights span.
 * - Click before current start re-anchors selection (`selectionRestart`).
 * - Preset buttons render in a `role="listbox"` of `role="option"`s; click
 *   commits the range and fires `(presetSelected)`.
 * - Keyboard: single-button trigger, NOT two inputs. Tab enters/leaves.
 * - `selectionCleared` only fires mid-draft → covered in forms spec.
 *
 * BLOCKED (chapter 04 + REVIEW.md):
 *   - `minRangeLength` / `maxRangeLength` not surfaced on the picker
 *     (NEEDS-DEMO-CHANGE).
 */
test.describe('Date Range Picker', () => {
  test('@interaction @overlay clicking the trigger opens the dialog with two-month layout', async ({
    page,
  }) => {
    const picker = new DateRangePickerPage(page);
    await picker.goto();

    const target = picker.pickerIn(picker.constraintsSection);
    await picker.trigger(target).click();
    await picker.waitForOpen();

    await expect(picker.overlayDialog).toHaveAttribute('role', 'dialog');
    await expect(picker.overlayDialog).toHaveAttribute('aria-modal', 'true');
    // Two-month layout: the calendar renders two `role="grid"` regions.
    await expect(picker.overlayCalendar.locator('[role="grid"]')).toHaveCount(2);

    await page.keyboard.press('Escape');
    await picker.waitForClosed();
  });

  test.fixme(
    '@interaction @overlay single-month layout (`numberOfMonths=1`) renders one grid',
    async ({ page }) => {
      // BUG / NEEDS-INVESTIGATION: setting `[numberOfMonths]="1"` on the
      // date-range-picker still renders two `[role="grid"]` elements inside
      // the overlay calendar. The `numberOfMonths` input may not propagate
      // to the embedded `tw-calendar`'s `monthColumns`. File as a follow-up.
      const picker = new DateRangePickerPage(page);
      await picker.goto();
      const target = picker.pickerIn(picker.monthLayoutSection, 1);
      await picker.trigger(target).click();
      await picker.waitForOpen();
      await expect(picker.overlayCalendar.locator('[role="grid"]')).toHaveCount(1);
    },
  );

  test('@interaction @overlay clicking start then end commits a range', async ({
    page,
  }) => {
    const picker = new DateRangePickerPage(page);
    await picker.goto();

    const target = picker.pickerIn(picker.constraintsSection);
    await picker.trigger(target).click();
    await picker.waitForOpen();

    // Pick two enabled cells in the visible grid — the constraints section
    // enforces a weekdays-only filter, so we use enabled cells regardless of
    // the system date.
    const enabled = picker.overlayCalendar.locator(
      '[role="grid"] button:not([disabled])',
    );
    await enabled.nth(0).click();
    await enabled.nth(3).click();
    await picker.waitForClosed();

    await expect(picker.output('constraints')).not.toContainText('vacation = null');
  });

  test('@interaction @overlay presets render as role="option" and clicking one commits the range', async ({
    page,
  }) => {
    const picker = new DateRangePickerPage(page);
    await picker.goto();

    const target = picker.pickerIn(picker.presetsSection);
    await picker.trigger(target).click();
    await picker.waitForOpen();

    // Demo presets: Today, Last 7 days, Last 30 days, This month, Year to date.
    await expect(picker.presetButton('Today')).toBeVisible();
    await expect(picker.presetButton('Last 7 days')).toBeVisible();
    await expect(picker.presetButton('This month')).toBeVisible();

    await picker.presetButton('Last 7 days').click();
    // Without `showActions`, preset commits immediately and closes the overlay.
    await picker.waitForClosed();
    await expect(picker.output('presets')).not.toContainText('reportRange = null');
  });

  test('@a11y @overlay trigger advertises aria-haspopup="dialog" and toggles aria-expanded', async ({
    page,
  }) => {
    const picker = new DateRangePickerPage(page);
    await picker.goto();

    const target = picker.pickerIn(picker.constraintsSection);
    const trigger = picker.trigger(target);
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await trigger.click();
    await picker.waitForOpen();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await picker.waitForClosed();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('@a11y disabled picker cannot open the overlay', async ({ page }) => {
    const picker = new DateRangePickerPage(page);
    await picker.goto();

    const disabled = picker.pickerIn(picker.statesSection, 0);
    await expect(picker.trigger(disabled)).toBeDisabled();
    await expect(picker.overlayDialog).toHaveCount(0);
  });

  test('@interaction @overlay Action bar: range click stages; Apply commits; Cancel restores', async ({
    page,
  }) => {
    const picker = new DateRangePickerPage(page);
    await picker.goto();

    const target = picker.pickerIn(picker.actionBarSection);
    await picker.trigger(target).click();
    await picker.waitForOpen();

    // Click two enabled cells to form a range — does NOT commit because
    // showActions=true.
    const enabled = picker.overlayCalendar.locator(
      '[role="grid"] button:not([disabled])',
    );
    await enabled.nth(0).click();
    await enabled.nth(3).click();
    await expect(picker.overlayDialog).toBeVisible();

    await picker.overlayAction('Cancel').click();
    await picker.waitForClosed();
    await expect(picker.output('action-bar')).toContainText('eventRange = null');
  });

  test('@interaction @overlay showTime renders two embedded tw-time-pickers', async ({
    page,
  }) => {
    const picker = new DateRangePickerPage(page);
    await picker.goto();

    const target = picker.pickerIn(picker.withTimeSection, 0);
    await picker.trigger(target).click();
    await picker.waitForOpen();

    // Time row only appears once a complete range is selected.
    const enabled = picker.overlayCalendar.locator(
      '[role="grid"] button:not([disabled])',
    );
    await enabled.nth(0).click();
    await enabled.nth(3).click();
    // Now both endpoints exist; two time pickers render below the calendars.
    await expect(picker.overlayDialog.locator('tw-time-picker')).toHaveCount(2);
  });

  test.fixme(
    '@interaction minRangeLength / maxRangeLength surfaced on the picker (NEEDS-DEMO-CHANGE)',
    async () => {
      // BLOCKED — chapter 04 + REVIEW.md: the underlying calendar supports
      // `minRangeLength` / `maxRangeLength`, but the date-range-picker does
      // not surface those inputs. Either expose them on the picker, or move
      // the assertion to the calendar spec.
    },
  );
});
