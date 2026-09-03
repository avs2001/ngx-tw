import { ComponentHarness, HarnessPredicate, TestKey } from '@angular/cdk/testing';
import type { BaseHarnessFilters, TestElement } from '@angular/cdk/testing';
import {
  SelectOptionHarness,
  type SelectOptionHarnessFilters,
} from './select-option-harness';

/** Filters accepted by `SelectHarness.with`. */
export interface SelectHarnessFilters extends BaseHarnessFilters {
  /** Match by the trigger's accessible name. */
  label?: string | RegExp;
  /** Match by the text currently displayed in the trigger. */
  triggerText?: string | RegExp;
  /** Match disabled / enabled selects. */
  disabled?: boolean;
}

/**
 * Harness for `tw-select`.
 *
 * The options panel renders into the CDK overlay container, outside the
 * `tw-select` host, so this harness resolves it through
 * `documentRootLocatorFactory()`. A consumer can therefore load this harness
 * from the ordinary fixture loader and still reach the options — no
 * `documentRootLoader` ceremony required.
 *
 * The panel is *disposed* on close rather than merely detached, so option
 * harnesses must be re-read after each `open()`. Do not cache them across a
 * close.
 */
export class SelectHarness extends ComponentHarness {
  static hostSelector = 'tw-select';

  private readonly trigger = this.locatorFor('button[role="combobox"]');
  private readonly clearButton = this.locatorForOptional(
    'button[aria-label="Clear selection"]',
  );
  /** Resolves the overlay panel, which lives outside this harness's host. */
  private readonly panel = this.documentRootLocatorFactory().locatorForOptional(
    '[role="listbox"]',
  );

  /** Predicate for `locatorFor` / `locatorForAll`. */
  static with(options: SelectHarnessFilters = {}): HarnessPredicate<SelectHarness> {
    return new HarnessPredicate(SelectHarness, options)
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

  /** The trigger's accessible name, from `aria-label` when one is set. */
  async getLabel(): Promise<string | null> {
    return (await this.trigger()).getAttribute('aria-label');
  }

  /**
   * The text currently rendered in the trigger, trimmed. This is the
   * placeholder when the select holds no value.
   */
  async getTriggerText(): Promise<string> {
    return (await (await this.trigger()).text()).trim();
  }

  /** Whether the panel is open, read from the trigger's `aria-expanded`. */
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

  /** Whether the trigger reports `aria-required="true"`. */
  async isRequired(): Promise<boolean> {
    return (await (await this.trigger()).getAttribute('aria-required')) === 'true';
  }

  /** Opens the panel. No-op when already open. */
  async open(): Promise<void> {
    if (await this.isOpen()) return;
    await (await this.trigger()).click();
    await this.waitForTasksOutsideAngular();
  }

  /** Closes the panel with Escape. No-op when already closed. */
  async close(): Promise<void> {
    if (!(await this.isOpen())) return;
    await (await this.trigger()).sendKeys(TestKey.ESCAPE);
    await this.waitForTasksOutsideAngular();
  }

  /**
   * Every option in the open panel. Returns an empty array when the panel is
   * closed, because the overlay is disposed rather than hidden.
   */
  async getOptions(
    filters: SelectOptionHarnessFilters = {},
  ): Promise<SelectOptionHarness[]> {
    if (!(await this.panel())) return [];
    return this.documentRootLocatorFactory().locatorForAll(
      SelectOptionHarness.with(filters),
    )();
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
        `SelectHarness.selectOption: no option matching ${String(text)}.`,
      );
    }
    await matches[0].click();
    await this.waitForTasksOutsideAngular();
  }

  /**
   * The text of every currently selected option. Opens the panel if needed,
   * because selection state is exposed on the options, which only exist while
   * the panel is attached.
   */
  async getSelectedOptionTexts(): Promise<string[]> {
    await this.open();
    const selected = await this.getOptions({ selected: true });
    return Promise.all(selected.map((option) => option.getText()));
  }

  /**
   * Whether a clear control is rendered. `tw-select` has no `clearable` input —
   * the control appears whenever the select is enabled and holds a value.
   */
  async hasClearButton(): Promise<boolean> {
    return (await this.clearButton()) !== null;
  }

  /**
   * Clicks the clear control. Throws when none is rendered.
   *
   * The control is a native `<button>` and a *sibling* of the trigger, not a
   * descendant — HTML's content model forbids interactive content inside a
   * `<button>`.
   */
  async clear(): Promise<void> {
    const button: TestElement | null = await this.clearButton();
    if (!button) {
      throw new Error(
        'SelectHarness.clear: no clear control is rendered. It appears only when the select is enabled and holds a value.',
      );
    }
    await button.click();
    await this.waitForTasksOutsideAngular();
  }
}
