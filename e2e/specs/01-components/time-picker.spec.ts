import { expect, test } from '../../fixtures/base';
import { TimePickerPage } from '../../pages/time-picker.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Time-picker interaction + a11y spec.
 *
 * The picker renders three text inputs as `role="spinbutton"` (Hours,
 * Minutes, optional Seconds) inside a `role="group"`. Per chapter 04 §Time
 * Picker:
 *
 * - 12h vs 24h modes: AM/PM toggle visible only in 12h.
 * - Hour / minute / second fields step by keyboard (ArrowUp/Down) with
 *   per-unit step config (`minuteStep=15` → 00/15/30/45 only).
 * - Locale: NEEDS-SOURCE-CHANGE — `time-picker.ts` has no `locale` input;
 *   meridiem labels are hardcoded `'AM'` / `'PM'`. Filed as `test.fixme`.
 * - `minTime` / `maxTime` with `errorStateMatcher` — `aria-invalid` toggles.
 * - `disabled` vs `readonly` semantics differ: `readonly` keeps fields
 *   focusable; `disabled` blocks every interaction.
 * - Clear button (`showClear`, `clearLabel`).
 * - `onFormReset` covered in the forms-three-strategies suite.
 */
test.describe('Time Picker', () => {
  test('@interaction renders the format-demo section with the documented spinbuttons', async ({
    page,
  }) => {
    const picker = new TimePickerPage(page);
    await picker.goto();

    // The 24h picker in the Format section has Hours + Minutes only.
    const all = picker.formatSection.locator('tw-time-picker');
    const twentyFour = all.nth(0);
    await expect(picker.hoursField(twentyFour)).toBeVisible();
    await expect(picker.minutesField(twentyFour)).toBeVisible();
    await expect(picker.secondsField(twentyFour)).toHaveCount(0);
    // 24h mode: no AM/PM toggle.
    await expect(picker.meridiemGroup(twentyFour)).toHaveCount(0);
  });

  test('@interaction 12h mode reveals the AM/PM radio group; 24h mode hides it', async ({
    page,
  }) => {
    const picker = new TimePickerPage(page);
    await picker.goto();

    const twelveHour = picker.formatSection.locator('tw-time-picker').nth(1);
    await expect(picker.meridiemGroup(twelveHour)).toBeVisible();
    await expect(picker.meridiemButton(twelveHour, 'AM')).toBeVisible();
    await expect(picker.meridiemButton(twelveHour, 'PM')).toBeVisible();
  });

  test('@interaction format=24h with showSeconds renders the Seconds spinbutton', async ({
    page,
  }) => {
    const picker = new TimePickerPage(page);
    await picker.goto();

    const withSeconds = picker.formatSection.locator('tw-time-picker').nth(2);
    await expect(picker.secondsField(withSeconds)).toBeVisible();
  });

  test('@interaction @keyboard ArrowUp / ArrowDown on a field step the value', async ({
    page,
  }) => {
    const picker = new TimePickerPage(page);
    await picker.goto();

    const target = picker.formatSection.locator('tw-time-picker').nth(0);
    const hours = picker.hoursField(target);
    await hours.focus();
    // Format demo seeds the value at 14:30:45. ArrowUp on hours rolls 14→15.
    const initialAriaValueNow = await hours.getAttribute('aria-valuenow');
    expect(initialAriaValueNow).toBe('14');
    await page.keyboard.press('ArrowUp');
    await expect(hours).toHaveAttribute('aria-valuenow', '15');
    await page.keyboard.press('ArrowDown');
    await expect(hours).toHaveAttribute('aria-valuenow', '14');
  });

  test('@interaction minuteStep=15 quantises ArrowUp from 00 to 15', async ({ page }) => {
    const picker = new TimePickerPage(page);
    await picker.goto();

    // Steps demo: first picker is `minuteStep=15`, seeded at 10:00.
    const quarter = picker.stepsSection.locator('tw-time-picker').first();
    const minutes = picker.minutesField(quarter);
    await minutes.focus();
    await expect(minutes).toHaveAttribute('aria-valuenow', '0');
    await page.keyboard.press('ArrowUp');
    await expect(minutes).toHaveAttribute('aria-valuenow', '15');
    await page.keyboard.press('ArrowUp');
    await expect(minutes).toHaveAttribute('aria-valuenow', '30');
  });

  test('@a11y disabled blocks every interaction; readonly keeps fields focusable', async ({
    page,
  }) => {
    const picker = new TimePickerPage(page);
    await picker.goto();

    const pickers = picker.statesSection.locator('tw-time-picker');
    const disabledHours = picker.hoursField(pickers.nth(0));
    const readonlyHours = picker.hoursField(pickers.nth(1));

    await expect(disabledHours).toBeDisabled();

    await expect(readonlyHours).toHaveAttribute('readonly', /.*/);
    await readonlyHours.focus();
    await expect(readonlyHours).toBeFocused();
    // Readonly keeps the field focusable. Native typing is blocked by the
    // browser's readonly handling; the unit spec
    // (`time-picker.spec.ts:298-329`) is the authoritative test for the
    // exact typing-suppressed contract.
  });

  test('@a11y out-of-range value (minTime / maxTime) flips aria-invalid on every field', async ({
    page,
  }) => {
    const picker = new TimePickerPage(page);
    await picker.goto();

    // Min/Max section seeds value at 10:30 inside 09:00–17:00, so aria-invalid
    // is initially absent. Drive the hour down to 7 → out of range.
    const root = picker.minMaxSection.locator('tw-time-picker').first();
    const hours = picker.hoursField(root);
    await hours.focus();
    await expect(hours).not.toHaveAttribute('aria-invalid', /./);
    // 10 → 7
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(hours).toHaveAttribute('aria-invalid', 'true');
  });

  test('@interaction Playground toggling format → 12h reveals the AM/PM group; 24h hides it', async ({
    page,
  }) => {
    const picker = new TimePickerPage(page);
    await picker.goto();

    const root = picker.playgroundSection.locator('tw-time-picker').first();
    // Default playground is 24h — no meridiem.
    await expect(picker.meridiemGroup(root)).toHaveCount(0);

    // Click the Format toggle row's "12h" button.
    await picker.playgroundSection
      .getByRole('button', { name: '12h', exact: true })
      .click();
    await expect(picker.meridiemGroup(root)).toBeVisible();

    await picker.playgroundSection
      .getByRole('button', { name: '24h', exact: true })
      .click();
    await expect(picker.meridiemGroup(root)).toHaveCount(0);
  });

  test.fixme(
    '@a11y locale: meridiem labels switch per locale (NEEDS-DEMO-WIRING)',
    async () => {
      // `TimePickerIntl` (provided via `provideTimePickerIntl`) now controls
      // the AM/PM labels, group label, and announcements — i18n support has
      // landed at the library level. This e2e remains `fixme` until the demo
      // app wires up a locale switcher that re-binds `TimePickerIntl`; the
      // unit spec (`time-picker.spec.ts → intl`) is the authoritative check.
    },
  );
});
