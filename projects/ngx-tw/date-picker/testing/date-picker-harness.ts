import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters, TestElement } from '@angular/cdk/testing';
import { CalendarHarness } from '@cdevhub/ngx-tw/calendar/testing';

/** Filters accepted by `DatePickerHarness.with`. */
export interface DatePickerHarnessFilters extends BaseHarnessFilters {
  /** Match by the text input's accessible name. */
  label?: string | RegExp;
  /** Match by the text currently displayed in the input. */
  value?: string | RegExp;
  /** Match disabled / enabled pickers. */
  disabled?: boolean;
}

/**
 * Harness for `tw-date-picker`.
 *
 * `tw-date-picker` splits its trigger across **two** elements and the
 * distinction matters for every method here:
 *
 * - `input[role="combobox"]` carries the displayed text, `aria-required`,
 *   `aria-invalid` and `aria-disabled`. `getValue`, `setValue`, `getLabel`,
 *   `isRequired`, `isInvalid` and `isDisabled` all read it.
 * - a sibling `button[aria-haspopup="dialog"]` opens the calendar. `open`,
 *   `close` and `isOpen` go through it.
 *
 * The calendar renders into the CDK overlay, outside the `tw-date-picker`
 * host, so it is resolved through `documentRootLocatorFactory()`. A consumer
 * loads this harness from the ordinary fixture loader — no
 * `documentRootLoader` ceremony required.
 *
 * Day-grid navigation is not reimplemented here: `getCalendar()` returns the
 * `CalendarHarness` from `@cdevhub/ngx-tw/calendar/testing`, which already
 * owns cells, view switching and header paging.
 *
 * **Not usable with a projected `[slot=trigger]`.** That opts the component out
 * of its default chrome, so neither the text input nor the trigger button is
 * rendered and every method here fails to resolve its element. A custom trigger
 * is whatever the consumer projected; drive it with their own harness or a
 * plain DOM query.
 */
export class DatePickerHarness extends ComponentHarness {
  static hostSelector = 'tw-date-picker';

  private readonly input = this.locatorFor('input[role="combobox"]');
  private readonly trigger = this.locatorFor('button[aria-haspopup="dialog"]');
  /**
   * The inline clear control — the only button in the default trigger chrome
   * that is not the calendar trigger. A consumer projecting `[slot=trigger]`
   * replaces that chrome entirely, so neither this nor `trigger` resolves then.
   */
  private readonly clearButton = this.locatorForOptional('button:not([aria-haspopup])');
  /** Resolves the overlay's calendar, which lives outside this harness's host. */
  private readonly calendar =
    this.documentRootLocatorFactory().locatorForOptional(CalendarHarness);

  /** Predicate for `locatorFor` / `locatorForAll`. */
  static with(options: DatePickerHarnessFilters = {}): HarnessPredicate<DatePickerHarness> {
    return new HarnessPredicate(DatePickerHarness, options)
      .addOption('label', options.label, async (h, label) =>
        HarnessPredicate.stringMatches(await h.getLabel(), label),
      )
      .addOption('value', options.value, async (h, value) =>
        HarnessPredicate.stringMatches(await h.getValue(), value),
      )
      .addOption(
        'disabled',
        options.disabled,
        async (h, disabled) => (await h.isDisabled()) === disabled,
      );
  }

  /** The text input's accessible name, from `aria-label` when one is set. */
  async getLabel(): Promise<string | null> {
    return (await this.input()).getAttribute('aria-label');
  }

  /**
   * The formatted date currently shown in the text input. Empty string when no
   * date is selected — the placeholder is not part of the value.
   */
  async getValue(): Promise<string> {
    return (await this.input()).getProperty<string>('value');
  }

  /** The text input's `placeholder`, or `null` when none is set. */
  async getPlaceholder(): Promise<string | null> {
    return (await this.input()).getAttribute('placeholder');
  }

  /**
   * Types `value` into the text input and blurs, which is what commits it —
   * `tw-date-picker` parses on blur (and on Enter), never on keystroke. An
   * unparseable string commits `null` and puts the control in its parse-error
   * state, exactly as it would for a user.
   */
  async setValue(value: string): Promise<void> {
    const input = await this.input();
    await input.focus();
    await input.setInputValue(value);
    // `setInputValue` only assigns `element.value`; the component listens on
    // `input`, so the event has to be dispatched explicitly.
    await input.dispatchEvent('input');
    await input.blur();
    await this.waitForTasksOutsideAngular();
  }

  /** Whether the calendar overlay is open, read from the trigger's `aria-expanded`. */
  async isOpen(): Promise<boolean> {
    return (await (await this.trigger()).getAttribute('aria-expanded')) === 'true';
  }

  /** Whether the text input reports `aria-disabled="true"`. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.input()).getAttribute('aria-disabled')) === 'true';
  }

  /** Whether the text input reports `aria-invalid="true"`. */
  async isInvalid(): Promise<boolean> {
    return (await (await this.input()).getAttribute('aria-invalid')) === 'true';
  }

  /**
   * Whether the text input reports `aria-required="true"`. Reflects the
   * `required` input *and* a `Validators.required` on a bound control.
   */
  async isRequired(): Promise<boolean> {
    return (await (await this.input()).getAttribute('aria-required')) === 'true';
  }

  /**
   * Opens the calendar overlay by clicking the trigger button. No-op when
   * already open; a disabled picker ignores it, as it does in the browser.
   */
  async open(): Promise<void> {
    if (await this.isOpen()) return;
    await (await this.trigger()).click();
    await this.waitForTasksOutsideAngular();
  }

  /**
   * Closes the calendar overlay by clicking the trigger button again. No-op
   * when already closed.
   *
   * Deliberately not Escape: `tw-date-picker` treats Escape as *cancel* and
   * restores the value the overlay opened with, which would make `close()`
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
   * attached. Use it for anything grid-shaped — paging months, switching to the
   * year view, reading disabled cells.
   */
  async getCalendar(): Promise<CalendarHarness | null> {
    return this.calendar();
  }

  /**
   * Opens the overlay if needed and clicks the calendar cell whose text matches
   * `day` exactly (`'15'`, not `'April 15'`). Throws when no such cell is
   * visible in the current view.
   *
   * With `showActions` off this commits and closes; with it on the pick stays
   * pending until {@link clickAction} confirms it.
   */
  async selectDay(day: string): Promise<void> {
    await this.open();
    const calendar = await this.getCalendar();
    if (!calendar) {
      throw new Error('DatePickerHarness.selectDay: the calendar overlay is not attached.');
    }
    await calendar.selectCell(day);
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
      'tw-date-picker-overlay button:not([role="option"])',
    )();
    for (const button of buttons) {
      if (await HarnessPredicate.stringMatches((await button.text()).trim(), label)) {
        await button.click();
        await this.waitForTasksOutsideAngular();
        return;
      }
    }
    throw new Error(
      `DatePickerHarness.clickAction: no overlay action button matching ${String(label)}. Is the overlay open and \`showActions\` on?`,
    );
  }

  /**
   * Whether the inline clear control is rendered. It appears only while
   * `showClear` is on, the picker is enabled and not readonly, and a value is
   * set.
   */
  async hasClearButton(): Promise<boolean> {
    return (await this.clearButton()) !== null;
  }

  /** Clicks the inline clear control. Throws when none is rendered. */
  async clear(): Promise<void> {
    const button: TestElement | null = await this.clearButton();
    if (!button) {
      throw new Error(
        'DatePickerHarness.clear: no clear control is rendered. It appears only while `showClear` is on, the picker is enabled and not readonly, and a value is set.',
      );
    }
    await button.click();
    await this.waitForTasksOutsideAngular();
  }
}
