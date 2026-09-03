import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters } from '@angular/cdk/testing';

/** Filters accepted by `ComboboxOptionHarness.with`. */
export interface ComboboxOptionHarnessFilters extends BaseHarnessFilters {
  /** Match by the option's visible text. */
  text?: string | RegExp;
  /** Match selected / unselected options. */
  selected?: boolean;
  /** Match disabled / enabled options. */
  disabled?: boolean;
}

/**
 * Harness for a single option inside an open `tw-combobox` panel.
 *
 * Options render into the CDK overlay, not inside `tw-combobox`, so they are
 * reached through {@link ComboboxHarness} rather than located directly against
 * a fixture.
 *
 * `tw-combobox` is an `aria-activedescendant` listbox: DOM focus never leaves
 * the input, so an option is never the active element. Keyboard highlight is
 * expressed on the input's `aria-activedescendant`, not on the option, and is
 * therefore not exposed here.
 */
export class ComboboxOptionHarness extends ComponentHarness {
  static hostSelector = '[role="option"]';

  /** Predicate for `locatorFor` / `locatorForAll`. */
  static with(
    options: ComboboxOptionHarnessFilters = {},
  ): HarnessPredicate<ComboboxOptionHarness> {
    return new HarnessPredicate(ComboboxOptionHarness, options)
      .addOption('text', options.text, async (h, text) =>
        HarnessPredicate.stringMatches(await h.getText(), text),
      )
      .addOption(
        'selected',
        options.selected,
        async (h, selected) => (await h.isSelected()) === selected,
      )
      .addOption(
        'disabled',
        options.disabled,
        async (h, disabled) => (await h.isDisabled()) === disabled,
      );
  }

  /**
   * The option's rendered text, trimmed. An option carrying a `description`
   * renders label and description as sibling block spans, so this returns both
   * concatenated with no separator.
   */
  async getText(): Promise<string> {
    return (await (await this.host()).text()).trim();
  }

  /** Whether the option reports `aria-selected="true"`. */
  async isSelected(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-selected')) === 'true';
  }

  /** Whether the option reports `aria-disabled="true"`. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-disabled')) === 'true';
  }

  /** Clicks the option. A disabled option ignores the click, as in the browser. */
  async click(): Promise<void> {
    await (await this.host()).click();
  }
}
