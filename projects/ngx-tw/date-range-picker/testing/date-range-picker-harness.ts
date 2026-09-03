import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters, TestElement } from '@angular/cdk/testing';
import { CalendarHarness } from '@cdevhub/ngx-tw/calendar/testing';

/** Filters accepted by `DateRangePickerHarness.with`. */
export interface DateRangePickerHarnessFilters extends BaseHarnessFilters {
  /** Match by the trigger's accessible name. */
  label?: string | RegExp;
  /** Match by the whole text currently rendered in the trigger. */
  triggerText?: string | RegExp;
  /** Match disabled / enabled pickers. */
  disabled?: boolean;
}

/**
 * Harness for `tw-date-range-picker`.
 *
 * Unlike `tw-date-picker`, this component has **no text input**: its trigger is
 * a `button[role="combobox"]` that renders the start label, a separator and the
 * end label as three sibling spans (or a single placeholder span when empty).
 * A range is therefore read, never typed — {@link getStartText} /
 * {@link getEndText} read it, and {@link selectRange} sets it through the
 * calendar.
 *
 * The calendar renders into the CDK overlay, outside the
 * `tw-date-range-picker` host, so it is resolved through
 * `documentRootLocatorFactory()`. A consumer loads this harness from the
 * ordinary fixture loader — no `documentRootLoader` ceremony required.
 *
 * Day-grid navigation is not reimplemented here: {@link getCalendar} returns
 * the `CalendarHarness` from `@cdevhub/ngx-tw/calendar/testing`, which already
 * owns cells, view switching and header paging.
 */
export class DateRangePickerHarness extends ComponentHarness {
  static hostSelector = 'tw-date-range-picker';

  private readonly trigger = this.locatorFor('button[role="combobox"]');
  /**
   * The start / separator / end spans, or a single placeholder span when the
   * range is empty. They carry no distinguishing attribute, so position inside
   * the trigger is the only handle — see {@link getStartText}.
   */
  private readonly triggerSpans = this.locatorForAll(
    'button[role="combobox"] span > span',
  );
  /**
   * The inline clear control — the only button in the host that is not the
   * trigger.
   */
  private readonly clearButton = this.locatorForOptional(
    'button:not([role="combobox"])',
  );
  /** Resolves the overlay's calendar, which lives outside this harness's host. */
  private readonly calendar =
    this.documentRootLocatorFactory().locatorForOptional(CalendarHarness);

  /** Predicate for `locatorFor` / `locatorForAll`. */
  static with(
    options: DateRangePickerHarnessFilters = {},
  ): HarnessPredicate<DateRangePickerHarness> {
    return new HarnessPredicate(DateRangePickerHarness, options)
      .addOption('label', options.label, async (h, label) =>
        HarnessPredicate.stringMatches(await h.getLabel(), label),
      )
      .addOption('triggerText', options.triggerText, async (h, text) =>
        HarnessPredicate.stringMatches(await h.getTriggerText(), text),
      )
      .addOption(
        'disabled',
        options.disabled,
        async (h, disabled) => (await h.isDisabled()) === disabled,
      );
  }

  /**
   * The trigger's accessible name.
   *
   * Note this is *composed*, not the bare `aria-label`: once a complete range
   * is set the component appends the range to it
   * (`"Report period. Current range: Apr 10 to Apr 15."`). Match with a RegExp
   * in {@link with} if you need it to survive a selection.
   */
  async getLabel(): Promise<string | null> {
    return (await this.trigger()).getAttribute('aria-label');
  }

  /**
   * The whole text rendered in the trigger, trimmed — start, separator and end
   * run together, or the placeholder when no range is set.
   */
  async getTriggerText(): Promise<string> {
    return (await (await this.trigger()).text()).trim();
  }

  /**
   * The formatted start date, or `null` when no range is set (the trigger then
   * renders a single placeholder span instead of the start/separator/end
   * triple).
   */
  async getStartText(): Promise<string | null> {
    return this.rangeSpanText(0);
  }

  /** The formatted end date, or `null` when no range is set. */
  async getEndText(): Promise<string | null> {
    return this.rangeSpanText(2);
  }

  /** Whether the calendar overlay is open, read from the trigger's `aria-expanded`. */
  async isOpen(): Promise<boolean> {
    return (await (await this.trigger()).getAttribute('aria-expanded')) === 'true';
  }

  /** Whether the trigger reports `aria-disabled="true"`. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.trigger()).getAttribute('aria-disabled')) === 'true';
  }

  /** Whether the trigger reports `aria-invalid="true"`. */
  async isInvalid(): Promise<boolean> {
    return (await (await this.trigger()).getAttribute('aria-invalid')) === 'true';
  }

  /**
   * Whether the trigger reports `aria-required="true"`. Reflects the `required`
   * input *and* a `Validators.required` on a bound control.
   */
  async isRequired(): Promise<boolean> {
    return (await (await this.trigger()).getAttribute('aria-required')) === 'true';
  }

  /**
   * Opens the calendar overlay by clicking the trigger. No-op when already
   * open; a disabled picker ignores it, as it does in the browser.
   */
  async open(): Promise<void> {
    if (await this.isOpen()) return;
    await (await this.trigger()).click();
    await this.waitForTasksOutsideAngular();
  }

  /**
   * Closes the calendar overlay by clicking the trigger again. No-op when
   * already closed.
   *
   * Deliberately not Escape: `tw-date-range-picker` treats Escape as *cancel*
   * and restores the range the overlay opened with, which would make `close()`
   * silently undo a selection. The trigger toggles without that side effect.
   *
   * The overlay runs a leave animation before it detaches, so `isOpen()` flips
   * to `false` immediately while the panel element lingers for a few more
   * frames. Two consequences worth knowing:
   *
   * - Do not assert `getCalendar()` is `null` on the tick after a close; the
   *   old panel is still mounted.
   * - An `open()` inside that window does **not** attach a fresh panel — the
   *   component sees an overlay ref it has not disposed yet and silently
   *   keeps the outgoing one. Let the animation finish before reopening.
   */
  async close(): Promise<void> {
    if (!(await this.isOpen())) return;
    await (await this.trigger()).click();
    await this.waitForTasksOutsideAngular();
  }

  /**
   * The `CalendarHarness` for the open overlay, or `null` when no overlay is
   * attached. One `tw-calendar` renders all `numberOfMonths` months under a
   * single header, so this is a single harness whatever that input is set to.
   */
  async getCalendar(): Promise<CalendarHarness | null> {
    return this.calendar();
  }

  /**
   * Opens the overlay if needed and clicks the two cells whose text matches
   * `start` then `end` exactly (`'10'`, not `'April 10'`). Throws when either
   * cell is not visible in the current view.
   *
   * With more than one month rendered a day number appears once per month grid;
   * the first match wins, which is the earliest visible month. Page the
   * calendar via {@link getCalendar} first if you need a later one.
   *
   * With `showActions` off this commits and closes on the second click; with it
   * on the range stays pending until {@link clickAction} confirms it.
   */
  async selectRange(start: string, end: string): Promise<void> {
    await this.open();
    const calendar = await this.getCalendar();
    if (!calendar) {
      throw new Error(
        'DateRangePickerHarness.selectRange: the calendar overlay is not attached.',
      );
    }
    await calendar.selectRange(start, end);
    await this.waitForTasksOutsideAngular();
  }

  /**
   * Clicks a button in the overlay's action bar (`Today`, `Clear`, `Cancel`,
   * `Apply`) by its visible text. Matching on text rather than position is what
   * keeps this usable when a consumer relabels the actions via `todayLabel` and
   * friends — pass whatever label you configured.
   *
   * Preset entries are excluded: they are `role="option"`, not action buttons.
   * Throws when the overlay is closed or nothing matches.
   */
  async clickAction(label: string | RegExp): Promise<void> {
    const buttons = await this.documentRootLocatorFactory().locatorForAll(
      'tw-date-range-picker-overlay button:not([role="option"])',
    )();
    for (const button of buttons) {
      if (await HarnessPredicate.stringMatches((await button.text()).trim(), label)) {
        await button.click();
        await this.waitForTasksOutsideAngular();
        return;
      }
    }
    throw new Error(
      `DateRangePickerHarness.clickAction: no overlay action button matching ${String(label)}. Is the overlay open and \`showActions\` on?`,
    );
  }

  /**
   * Whether the inline clear control is rendered. It appears only while
   * `showClear` is on, the picker is enabled, and a range is set.
   */
  async hasClearButton(): Promise<boolean> {
    return (await this.clearButton()) !== null;
  }

  /** Clicks the inline clear control. Throws when none is rendered. */
  async clear(): Promise<void> {
    const button: TestElement | null = await this.clearButton();
    if (!button) {
      throw new Error(
        'DateRangePickerHarness.clear: no clear control is rendered. It appears only while `showClear` is on, the picker is enabled, and a range is set.',
      );
    }
    await button.click();
    await this.waitForTasksOutsideAngular();
  }

  /** @internal Text of one of the start/separator/end spans, or `null` when the trigger is empty. */
  private async rangeSpanText(index: number): Promise<string | null> {
    const spans = await this.triggerSpans();
    // One span means the placeholder branch rendered — no range is set.
    if (spans.length < 3) return null;
    return (await spans[index].text()).trim();
  }
}
