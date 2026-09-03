import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters } from '@angular/cdk/testing';

/** Filters accepted by `SelectOptionHarness.with`. */
export interface SelectOptionHarnessFilters extends BaseHarnessFilters {
  /** Match by the option's visible text. */
  text?: string | RegExp;
  /** Match selected / unselected options. */
  selected?: boolean;
  /** Match disabled / enabled options. */
  disabled?: boolean;
}

/**
 * Harness for a single option inside an open `tw-select` panel.
 *
 * Options render into the CDK overlay, not inside `tw-select`, so they are
 * reached through {@link SelectHarness} rather than located directly against a
 * fixture.
 */
export class SelectOptionHarness extends ComponentHarness {
  static hostSelector = '[role="option"]';

  /** Predicate for `locatorFor` / `locatorForAll`. */
  static with(
    options: SelectOptionHarnessFilters = {},
  ): HarnessPredicate<SelectOptionHarness> {
    return new HarnessPredicate(SelectOptionHarness, options)
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

  /** The option's rendered text, trimmed. */
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
