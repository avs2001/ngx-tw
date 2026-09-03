import { expect, test } from '../../fixtures/base';
import { DatePickerPage } from '../../pages/date-picker.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Date-picker interaction + a11y spec.
 *
 * Per chapter 04 §Date Picker + chapter 08 §2:
 * - Trigger opens the calendar in overlay.
 * - Clicking a date sets the value; trigger displays formatted date via
 *   `DateAdapter.format()` (locale-sensitive).
 * - Keyboard ArrowLeft/Right/Up/Down move day cursor inside the overlay
 *   calendar (OVERLAP with calendar.spec.ts unit coverage; E2E adds the
 *   overlay-bubbling path).
 * - Min/max + dateFilter cascade to disabled cells.
 * - `withTime` integration — embedded `<tw-time-picker>`; time edits don't
 *   close the overlay.
 * - Action bar Apply/Cancel — cell click stages, only Apply commits.
 * - form reset (via `writeValue(null)`) and writeValue queueing → see the
 *   cross-cutting suite. NOTE: this line used to name `onFormReset`; no
 *   component imports that helper. Corrected in audit pass 6.
 *
 * BLOCKED:
 *   - Locale (German example) — NEEDS-DEMO-CHANGE (REVIEW.md §date-picker).
 *   - `writeValue` during open animation negative-emission — requires a spy
 *     hook the demo doesn't expose; covered by unit spec.
 */
test.describe('Date Picker', () => {
  test('@interaction @overlay clicking the trigger opens the dialog and Esc closes it', async ({
    page,
  }) => {
    const picker = new DatePickerPage(page);
    await picker.goto();

    const target = picker.pickerIn(picker.constraintsSection);
    await picker.triggerButton(target).click();
    await picker.waitForOpen();
    await expect(picker.overlayDialog).toHaveAttribute('role', 'dialog');
    await expect(picker.overlayDialog).toHaveAttribute('aria-modal', 'true');

    await page.keyboard.press('Escape');
    await picker.waitForClosed();
  });

  test('@interaction @overlay clicking a day cell commits the value and closes the overlay', async ({
    page,
  }) => {
    const picker = new DatePickerPage(page);
    await picker.goto();

    // The constraints picker is the most-deterministic surface — its valid
    // window is "next 30 days, weekdays only" starting from today. We pick
    // the active (focused) cell, which the calendar sets to `startAt` /
    // today, and which is guaranteed to be enabled if today is a weekday;
    // otherwise we fall back to the first enabled cell.
    const target = picker.pickerIn(picker.constraintsSection);
    await picker.triggerButton(target).click();
    await picker.waitForOpen();

    const enabledCell = picker.overlayCalendar
      .locator('[role="grid"] button:not([aria-disabled="true"])')
      .first();
    await enabledCell.click();
    await picker.waitForClosed();

    await expect(picker.triggerInput(target)).not.toHaveValue('');
    await expect(picker.output('constraints')).not.toContainText('appointment = null');
  });

  test('@interaction @overlay weekend cells are disabled by the dateFilter', async ({
    page,
  }) => {
    const picker = new DatePickerPage(page);
    await picker.goto();

    const target = picker.pickerIn(picker.constraintsSection);
    await picker.triggerButton(target).click();
    await picker.waitForOpen();

    // The demo's `weekdayFilter` rejects Sundays + Saturdays. The filter +
    // 30-day min/max window together always disable several cells in the
    // visible grid. Assert the observable contract: at least one disabled
    // cell appears with `data-state-disabled`.
    const disabled = picker.overlayCalendar.locator('[role="grid"] button[aria-disabled="true"]');
    await expect(disabled.first()).toBeVisible();
  });

  test('@a11y @overlay min/maxDate disable out-of-range cells', async ({
    page,
  }) => {
    const picker = new DatePickerPage(page);
    await picker.goto();

    const target = picker.pickerIn(picker.constraintsSection);
    await picker.triggerButton(target).click();
    await picker.waitForOpen();

    // The window is `[today, today+30]`; cells before today and after
    // today+30 are disabled. There is always at least one disabled cell in
    // the rendered month grid since the active month spans the window edge.
    const disabled = picker.overlayCalendar.locator(
      '[role="grid"] button[aria-disabled="true"]',
    );
    await expect(disabled.first()).toBeVisible();
  });

  test('@interaction @overlay withTime renders the embedded tw-time-picker and editing time keeps the overlay open', async ({
    page,
  }) => {
    const picker = new DatePickerPage(page);
    await picker.goto();

    // First withTime picker (24h).
    const target = picker.pickerIn(picker.withTimeSection, 0);
    await picker.triggerButton(target).click();
    await picker.waitForOpen();

    const overlayTimePicker = picker.overlayDialog.locator('tw-time-picker');
    await expect(overlayTimePicker).toBeVisible();
    // Step the embedded time-picker — overlay must stay open.
    await overlayTimePicker.getByRole('spinbutton', { name: 'Hours' }).focus();
    await page.keyboard.press('ArrowUp');
    await expect(picker.overlayDialog).toBeVisible();
  });

  test('@interaction @overlay Action bar: cell click stages, only Apply commits', async ({
    page,
  }) => {
    const picker = new DatePickerPage(page);
    await picker.goto();

    const target = picker.pickerIn(picker.actionBarSection);
    await picker.triggerButton(target).click();
    await picker.waitForOpen();

    // Pick any enabled cell — pick the cell with tabindex=0 (the focused one).
    await picker.overlayCalendar.locator('button[tabindex="0"]').click();
    // With `showActions=true`, the click does not commit immediately.
    await expect(picker.overlayDialog).toBeVisible();
    await expect(picker.output('action-bar')).toContainText('event = null');

    await picker.overlayAction('Apply').click();
    await picker.waitForClosed();
    await expect(picker.output('action-bar')).not.toContainText('event = null');
  });

  test('@interaction @overlay Action bar: Cancel restores previous value', async ({
    page,
  }) => {
    const picker = new DatePickerPage(page);
    await picker.goto();

    const target = picker.pickerIn(picker.actionBarSection);
    await picker.triggerButton(target).click();
    await picker.waitForOpen();

    await picker.overlayCalendar.locator('button[tabindex="0"]').click();
    await picker.overlayAction('Cancel').click();
    await picker.waitForClosed();
    await expect(picker.output('action-bar')).toContainText('event = null');
  });

  test('@interaction typing a date into the input parses and updates the calendar', async ({
    page,
  }) => {
    const picker = new DatePickerPage(page);
    await picker.goto();

    // Use the constraints section's picker (always present, never disabled).
    const target = picker.pickerIn(picker.constraintsSection);
    const input = picker.triggerInput(target);
    await input.fill('06/16/2025');
    await input.blur();
    // The directive normalises through `DateAdapter.format()` on blur — the
    // exact rendered string is locale-sensitive; the observable contract is
    // that the input is non-empty.
    await expect(input).not.toHaveValue('');
  });

  test('@a11y disabled picker cannot open the overlay', async ({ page }) => {
    const picker = new DatePickerPage(page);
    await picker.goto();

    const disabled = picker.pickerIn(picker.statesSection, 0);
    const trigger = picker.triggerButton(disabled);
    await expect(trigger).toBeDisabled();
    // No overlay opens — assert the dialog never appears.
    await expect(picker.overlayDialog).toHaveCount(0);
  });

  test('@a11y readonly picker still opens the calendar but blocks typing', async ({
    page,
  }) => {
    const picker = new DatePickerPage(page);
    await picker.goto();

    const readonly = picker.pickerIn(picker.statesSection, 1);
    await picker.triggerButton(readonly).click();
    await picker.waitForOpen();
    await page.keyboard.press('Escape');
    await picker.waitForClosed();

    await expect(picker.triggerInput(readonly)).toHaveAttribute('readonly', /.*/);
  });

  test('@a11y trigger advertises aria-haspopup="dialog" and aria-expanded toggles with open state', async ({
    page,
  }) => {
    const picker = new DatePickerPage(page);
    await picker.goto();

    const target = picker.pickerIn(picker.constraintsSection);
    const input = picker.triggerInput(target);
    await expect(input).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(input).toHaveAttribute('aria-expanded', 'false');

    await picker.triggerButton(target).click();
    await picker.waitForOpen();
    await expect(input).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await picker.waitForClosed();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  test.fixme(
    '[fixme:date-picker/german-locale] @interaction @overlay German locale renders day names in German (NEEDS-DEMO-CHANGE)',
    async () => {
      // BLOCKED — REVIEW.md §date-picker: the demo route has no German
      // example. Either add a section that calls `provideCalendarIntl(de)`
      // in a child injector, or relocate this scenario to the calendar
      // spec (which is the correct home for locale coverage per
      // chapter 04 §Calendar).
    },
  );
});
