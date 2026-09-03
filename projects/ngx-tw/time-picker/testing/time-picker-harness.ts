import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters, TestElement } from '@angular/cdk/testing';

/**
 * The editable numeric fields, in render order. Mirrored here rather than
 * imported from `@cdevhub/ngx-tw/time-picker` so a test file does not have to
 * pull in the component entry point just to name a field.
 */
export type TimePickerHarnessField = 'hour' | 'minute' | 'second';

/** The two meridiem options of the 12h format. */
export type TimePickerHarnessMeridiem = 'AM' | 'PM';

/** Filters accepted by `TimePickerHarness.with`. */
export interface TimePickerHarnessFilters extends BaseHarnessFilters {
  /** Match by the field group's accessible name. */
  label?: string | RegExp;
  /** Match disabled / enabled time pickers. */
  disabled?: boolean;
}

/** Position of each field in the rendered `role="spinbutton"` sequence. */
const FIELD_ORDER: readonly TimePickerHarnessField[] = ['hour', 'minute', 'second'];

/**
 * Harness for `tw-time-picker`.
 *
 * Unlike every other picker in the library this component has **no CDK
 * overlay** — it renders three `input[role="spinbutton"]` fields inline inside
 * a `role="group"`, plus an optional stepper pair, an optional AM/PM
 * radiogroup, and an optional clear button. Nothing here reaches outside the
 * host, so no `documentRootLocatorFactory()` is involved.
 *
 * Fields are addressed by position, not by `aria-label`: every visible string
 * on this component comes from the injectable `TimePickerIntl` and a localized
 * app would break a label-based selector.
 */
export class TimePickerHarness extends ComponentHarness {
  static hostSelector = 'tw-time-picker';

  private readonly group = this.locatorFor('[role="group"]');
  private readonly fields = this.locatorForAll('input[role="spinbutton"]');
  /**
   * The two stepper buttons, up then down. They are the only buttons inside a
   * plain (role-less) wrapper div — the meridiem buttons live in a
   * `role="radiogroup"` and the clear button is a direct child of the host.
   */
  private readonly steppers = this.locatorForAll(':scope > div:not([role]) > button');
  /** The AM then PM radio, present only while `format` is `'12h'`. */
  private readonly meridiemButtons = this.locatorForAll(
    '[role="radiogroup"] button[role="radio"]',
  );

  /** Predicate for `locatorFor` / `locatorForAll`. */
  static with(options: TimePickerHarnessFilters = {}): HarnessPredicate<TimePickerHarness> {
    return new HarnessPredicate(TimePickerHarness, options)
      .addOption('label', options.label, async (h, label) =>
        HarnessPredicate.stringMatches(await h.getLabel(), label),
      )
      .addOption(
        'disabled',
        options.disabled,
        async (h, disabled) => (await h.isDisabled()) === disabled,
      );
  }

  /**
   * The field group's accessible name, from `aria-label` on the
   * `role="group"` wrapper. `null` when the group is named by reference
   * (`aria-labelledby`) instead — a `<tw-form-field>` label does exactly that.
   */
  async getLabel(): Promise<string | null> {
    return (await this.group()).getAttribute('aria-label');
  }

  /** Whether the seconds field is rendered (`showSeconds`). */
  async hasSeconds(): Promise<boolean> {
    return (await this.fields()).length > 2;
  }

  /** Whether the stepper buttons are rendered (`showSteppers`, suppressed at `xs` density). */
  async hasSteppers(): Promise<boolean> {
    return (await this.steppers()).length > 0;
  }

  /**
   * The numeric value of one field, read from its `aria-valuenow`. `null` when
   * the field is blank. In `12h` format the hour is 1–12 and the meridiem is
   * read separately via {@link getMeridiem}.
   */
  async getValue(field: TimePickerHarnessField): Promise<number | null> {
    const raw = await (await this.field(field)).getAttribute('aria-valuenow');
    return raw === null || raw === '' ? null : Number(raw);
  }

  /**
   * The spoken text of one field, from `aria-valuetext` — `'Empty'` for a blank
   * field, and the hour additionally carries the meridiem in `12h` format.
   * Exposed because it is what a screen reader announces, which no other read
   * on this harness reproduces.
   */
  async getValueText(field: TimePickerHarnessField): Promise<string | null> {
    return (await this.field(field)).getAttribute('aria-valuetext');
  }

  /**
   * Types `value` into one field as two digits, exactly as a user would.
   *
   * The component drives entry from `beforeinput`, buffering one digit at a
   * time, so the first digit lands on its own before the second replaces the
   * buffer. That means a *partial* time may be committed in between — the same
   * intermediate emission a real keystroke pair produces. Pass values inside
   * the field's range (hour 0–23, or 1–12 in `12h` format; minute/second 0–59)
   * or the component will reject the digit that overflows.
   */
  async setValue(field: TimePickerHarnessField, value: number): Promise<void> {
    const el = await this.field(field);
    await el.focus();
    const digits = value < 10 ? `0${value}` : `${value}`;
    for (const digit of digits) {
      await el.dispatchEvent('beforeinput', {
        inputType: 'insertText',
        data: digit,
      });
    }
    await this.waitForTasksOutsideAngular();
  }

  /** Clears one field's text, leaving the time incomplete. */
  async clearValue(field: TimePickerHarnessField): Promise<void> {
    const el = await this.field(field);
    await el.focus();
    await el.setInputValue('');
    await el.dispatchEvent('input', { inputType: 'deleteContentBackward' });
    await this.waitForTasksOutsideAngular();
  }

  /**
   * The current meridiem, or `null` in `24h` format where no radiogroup is
   * rendered.
   */
  async getMeridiem(): Promise<TimePickerHarnessMeridiem | null> {
    const buttons = await this.meridiemButtons();
    if (buttons.length === 0) return null;
    return (await buttons[0].getAttribute('aria-checked')) === 'true' ? 'AM' : 'PM';
  }

  /**
   * Clicks the AM or PM radio. Throws in `24h` format, where the control does
   * not exist. Selecting the already-selected meridiem is a no-op, as it is for
   * a user.
   */
  async setMeridiem(meridiem: TimePickerHarnessMeridiem): Promise<void> {
    const buttons = await this.meridiemButtons();
    if (buttons.length === 0) {
      throw new Error(
        'TimePickerHarness.setMeridiem: no AM/PM control is rendered. It exists only while `format` is "12h".',
      );
    }
    await buttons[meridiem === 'AM' ? 0 : 1].click();
    await this.waitForTasksOutsideAngular();
  }

  /**
   * Focuses `field` and clicks the up stepper, which steps whichever field
   * holds focus by that field's configured step, wrapping at its bounds.
   * Throws when the steppers are not rendered.
   */
  async stepUp(field: TimePickerHarnessField = 'hour'): Promise<void> {
    await this.clickStepper(field, 0);
  }

  /** Focuses `field` and clicks the down stepper. Throws when the steppers are not rendered. */
  async stepDown(field: TimePickerHarnessField = 'hour'): Promise<void> {
    await this.clickStepper(field, 1);
  }

  /** Whether every field reports `aria-disabled="true"`. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.field('hour')).getAttribute('aria-disabled')) === 'true';
  }

  /** Whether the fields report `aria-invalid="true"`. */
  async isInvalid(): Promise<boolean> {
    return (await (await this.field('hour')).getAttribute('aria-invalid')) === 'true';
  }

  /**
   * Whether the fields report `aria-required="true"`. Reflects the `required`
   * input *and* a `Validators.required` on a bound control.
   */
  async isRequired(): Promise<boolean> {
    return (await (await this.field('hour')).getAttribute('aria-required')) === 'true';
  }

  /**
   * Whether the clear control is rendered. It appears only while `showClear` is
   * on, the picker is enabled and not readonly, and a value is set.
   */
  async hasClearButton(): Promise<boolean> {
    return (await this.clearButton()) !== null;
  }

  /** Clicks the clear control. Throws when none is rendered. */
  async clear(): Promise<void> {
    const button = await this.clearButton();
    if (!button) {
      throw new Error(
        'TimePickerHarness.clear: no clear control is rendered. It appears only while `showClear` is on, the picker is enabled and not readonly, and a value is set.',
      );
    }
    await button.click();
    await this.waitForTasksOutsideAngular();
  }

  /** @internal Resolves one field by its position in the spinbutton sequence. */
  private async field(field: TimePickerHarnessField): Promise<TestElement> {
    const elements = await this.fields();
    const index = FIELD_ORDER.indexOf(field);
    const element = elements[index];
    if (!element) {
      throw new Error(
        `TimePickerHarness: the "${field}" field is not rendered. The seconds field requires \`showSeconds\`.`,
      );
    }
    return element;
  }

  /**
   * @internal The clear button — the only `<button>` that is a direct child of
   * the host, the steppers and meridiem radios both sitting inside wrapper
   * divs.
   */
  private async clearButton(): Promise<TestElement | null> {
    return this.locatorForOptional(':scope > button')();
  }

  /** @internal Focuses a field, then clicks the stepper at `index` (0 = up, 1 = down). */
  private async clickStepper(
    field: TimePickerHarnessField,
    index: 0 | 1,
  ): Promise<void> {
    const buttons = await this.steppers();
    if (buttons.length < 2) {
      throw new Error(
        'TimePickerHarness: the steppers are not rendered. They require `showSteppers` and a density above `xs`.',
      );
    }
    await (await this.field(field)).focus();
    await buttons[index].click();
    await this.waitForTasksOutsideAngular();
  }
}
