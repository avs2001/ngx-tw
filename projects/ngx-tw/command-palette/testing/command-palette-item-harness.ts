import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters } from '@angular/cdk/testing';

/** Filters accepted by `CommandPaletteItemHarness.with`. */
export interface CommandPaletteItemHarnessFilters extends BaseHarnessFilters {
  /** Match by the item's visible text, which includes its description when it has one. */
  text?: string | RegExp;
  /** Match the active (`aria-activedescendant`) item. */
  active?: boolean;
  /** Match disabled / enabled items. */
  disabled?: boolean;
}

/**
 * Harness for a single result row in an open `tw-command-palette`.
 *
 * These rows are `role="option"` inside an activedescendant listbox: they never
 * receive DOM focus and have no keyboard handlers of their own. "Active" here
 * therefore means *referenced by the input's `aria-activedescendant`*, which the
 * component mirrors onto each row as `aria-selected`. It does **not** mean
 * `document.activeElement`.
 */
export class CommandPaletteItemHarness extends ComponentHarness {
  static hostSelector = '[role="option"]';

  /** Predicate for `locatorFor` / `locatorForAll`. */
  static with(
    options: CommandPaletteItemHarnessFilters = {},
  ): HarnessPredicate<CommandPaletteItemHarness> {
    return new HarnessPredicate(CommandPaletteItemHarness, options)
      .addOption('text', options.text, async (harness, text) =>
        HarnessPredicate.stringMatches(await harness.getText(), text),
      )
      .addOption(
        'active',
        options.active,
        async (harness, active) => (await harness.isActive()) === active,
      )
      .addOption(
        'disabled',
        options.disabled,
        async (harness, disabled) => (await harness.isDisabled()) === disabled,
      );
  }

  /** The row's rendered text, trimmed. Includes the description when one is rendered. */
  async getText(): Promise<string> {
    return (await (await this.host()).text()).trim();
  }

  /** The row's DOM id, which is what `aria-activedescendant` points at. */
  async getId(): Promise<string | null> {
    return (await this.host()).getAttribute('id');
  }

  /**
   * Whether this row is the active descendant. Read from `aria-selected`, which
   * the component binds to the active id — not from DOM focus, which never moves
   * off the search input.
   */
  async isActive(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-selected')) === 'true';
  }

  /** Whether the row reports `aria-disabled="true"`. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-disabled')) === 'true';
  }

  /** Clicks the row, activating the command. */
  async click(): Promise<void> {
    await (await this.host()).click();
  }
}
