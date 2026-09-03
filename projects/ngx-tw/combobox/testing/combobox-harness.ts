import { ComponentHarness, HarnessPredicate, TestKey } from '@angular/cdk/testing';
import type { BaseHarnessFilters, TestElement } from '@angular/cdk/testing';
import {
  ComboboxOptionHarness,
  type ComboboxOptionHarnessFilters,
} from './combobox-option-harness';

/** Filters accepted by `ComboboxHarness.with`. */
export interface ComboboxHarnessFilters extends BaseHarnessFilters {
  /** Match by the input's accessible name. */
  label?: string | RegExp;
  /** Match by the text currently typed into (or displayed in) the input. */
  inputValue?: string | RegExp;
  /** Match disabled / enabled comboboxes. */
  disabled?: boolean;
}

/**
 * Harness for `tw-combobox`.
 *
 * The options panel renders into the CDK overlay container, outside the
 * `tw-combobox` host, so this harness resolves it through
 * `documentRootLocatorFactory()`. A consumer can therefore load this harness
 * from the ordinary fixture loader and still reach the options — no
 * `documentRootLoader` ceremony required.
 *
 * The panel is *disposed* on close rather than merely detached, so option
 * harnesses must be re-read after each `open()`. Do not cache them across a
 * close.
 */
export class ComboboxHarness extends ComponentHarness {
  static hostSelector = 'tw-combobox';

  private readonly input = this.locatorFor('input[role="combobox"]');
  /**
   * The inline clear (×) control. Its `aria-label` is a template literal in
   * `combobox.ts` — not a consumer input — so matching on it is stable.
   */
  private readonly clearButton = this.locatorForOptional('button[aria-label="Clear"]');
  /** Resolves the overlay panel, which lives outside this harness's host. */
  private readonly panel = this.documentRootLocatorFactory().locatorForOptional(
    '[role="listbox"]',
  );

  /** Predicate for `locatorFor` / `locatorForAll`. */
  static with(options: ComboboxHarnessFilters = {}): HarnessPredicate<ComboboxHarness> {
    return new HarnessPredicate(ComboboxHarness, options)
      .addOption('label', options.label, async (h, label) =>
        HarnessPredicate.stringMatches(await h.getLabel(), label),
      )
      .addOption('inputValue', options.inputValue, async (h, value) =>
        HarnessPredicate.stringMatches(await h.getInputValue(), value),
      )
      .addOption(
        'disabled',
        options.disabled,
        async (h, disabled) => (await h.isDisabled()) === disabled,
      );
  }

  /** The input's accessible name, from `aria-label` when one is set. */
  async getLabel(): Promise<string | null> {
    return (await this.input()).getAttribute('aria-label');
  }

  /**
   * The text currently in the input — the typed query while the user is
   * filtering, the committed option's label afterwards. Empty string when the
   * combobox holds nothing (the placeholder is not part of the value).
   */
  async getInputValue(): Promise<string> {
    return (await this.input()).getProperty<string>('value');
  }

  /** The input's `placeholder`, or `null` when none is set. */
  async getPlaceholder(): Promise<string | null> {
    return (await this.input()).getAttribute('placeholder');
  }

  /**
   * Replaces the input text and lets the component filter against it — the
   * harness equivalent of selecting all and typing a query.
   *
   * Does NOT commit a value: `tw-combobox` commits on option pick, Enter, blur
   * or Tab. Follow with `selectOption(...)` to pick from the filtered list.
   */
  async setInputValue(value: string): Promise<void> {
    const input = await this.input();
    await input.focus();
    await input.setInputValue(value);
    // `setInputValue` only assigns `element.value`; the component listens on
    // `input`, so the event has to be dispatched explicitly.
    await input.dispatchEvent('input');
    await this.waitForTasksOutsideAngular();
  }

  /** Whether the panel is open, read from the input's `aria-expanded`. */
  async isOpen(): Promise<boolean> {
    return (await (await this.input()).getAttribute('aria-expanded')) === 'true';
  }

  /** Whether the input reports `aria-disabled="true"`. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.input()).getAttribute('aria-disabled')) === 'true';
  }

  /** Whether the input reports `aria-invalid="true"`. */
  async isInvalid(): Promise<boolean> {
    return (await (await this.input()).getAttribute('aria-invalid')) === 'true';
  }

  /**
   * Whether the input reports `aria-required="true"`. Reflects the `required`
   * input *and* a `Validators.required` on a bound control.
   */
  async isRequired(): Promise<boolean> {
    return (await (await this.input()).getAttribute('aria-required')) === 'true';
  }

  /**
   * Opens the panel with `Alt+ArrowDown`. No-op when already open.
   *
   * Deliberately not a click: `openOnFocus` defaults to `true` but can be
   * turned off, whereas `Alt+ArrowDown` is the APG force-open gesture and works
   * either way. A disabled combobox ignores it, as it does in the browser.
   */
  async open(): Promise<void> {
    if (await this.isOpen()) return;
    await (await this.input()).sendKeys({ alt: true }, TestKey.DOWN_ARROW);
    await this.waitForTasksOutsideAngular();
  }

  /**
   * Closes the panel with `Alt+ArrowUp`. No-op when already closed.
   *
   * Deliberately not Escape: Escape *also* reverts the input text to the last
   * committed label, which would make `close()` silently destroy a typed query.
   *
   * The overlay runs a leave animation before it detaches, so `isOpen()` flips
   * to `false` immediately while the panel element lingers for a few more
   * frames. Two consequences worth knowing:
   *
   * - Do not assert `getOptions()` is empty on the tick after a close; the
   *   old panel is still mounted.
   * - An `open()` inside that window does **not** attach a fresh panel — the
   *   component sees an overlay ref it has not disposed yet and silently
   *   keeps the outgoing one. Let the animation finish before reopening.
   */
  async close(): Promise<void> {
    if (!(await this.isOpen())) return;
    await (await this.input()).sendKeys({ alt: true }, TestKey.UP_ARROW);
    await this.waitForTasksOutsideAngular();
  }

  /**
   * Every option in the open panel, in render order and already filtered by
   * whatever query the input holds. Returns an empty array when the panel has
   * never been opened, because the overlay is disposed rather than hidden.
   */
  async getOptions(
    filters: ComboboxOptionHarnessFilters = {},
  ): Promise<ComboboxOptionHarness[]> {
    if (!(await this.panel())) return [];
    return this.documentRootLocatorFactory().locatorForAll(
      ComboboxOptionHarness.with(filters),
    )();
  }

  /**
   * The text of every option currently rendered in the open panel. Opens the
   * panel if needed — this is how a consumer reads the result of a filter
   * query.
   */
  async getOptionTexts(): Promise<string[]> {
    await this.open();
    const options = await this.getOptions();
    return Promise.all(options.map((option) => option.getText()));
  }

  /**
   * Opens the panel if needed and clicks the first option whose text matches.
   * Throws when nothing matches, rather than failing silently.
   */
  async selectOption(text: string | RegExp): Promise<void> {
    await this.open();
    const matches = await this.getOptions({ text });
    if (matches.length === 0) {
      throw new Error(
        `ComboboxHarness.selectOption: no option matching ${String(text)}.`,
      );
    }
    await matches[0].click();
    await this.waitForTasksOutsideAngular();
  }

  /**
   * Whether the inline clear control is rendered. It appears only while
   * `clearable` is on, the combobox is enabled, and the input is non-empty.
   */
  async hasClearButton(): Promise<boolean> {
    return (await this.clearButton()) !== null;
  }

  /** Clicks the clear control. Throws when none is rendered. */
  async clear(): Promise<void> {
    const button: TestElement | null = await this.clearButton();
    if (!button) {
      throw new Error(
        'ComboboxHarness.clear: no clear control is rendered. It appears only while `clearable` is on, the combobox is enabled, and the input is non-empty.',
      );
    }
    await button.click();
    await this.waitForTasksOutsideAngular();
  }
}
