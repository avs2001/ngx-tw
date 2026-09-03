import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters } from '@angular/cdk/testing';

/** Filters accepted by `MenuItemHarness.with`. */
export interface MenuItemHarnessFilters extends BaseHarnessFilters {
  /** Match by the item's visible text. */
  text?: string | RegExp;
  /** Match disabled / enabled items. */
  disabled?: boolean;
  /** Match checked / unchecked checkbox and radio items. Never matches a plain item. */
  checked?: boolean;
}

/**
 * Harness for a single item inside an open `tw-menu` panel.
 *
 * Hosts on the ARIA role rather than on the `twMenuItem*` attribute selectors,
 * so one harness covers plain items, checkbox items and radio items — the roles
 * are contributed by the CDK directives `tw-menu` composes and are the same
 * thing assistive technology reads.
 *
 * Items render into the CDK overlay, not inside the trigger, so they are reached
 * through {@link MenuHarness} rather than located directly against a fixture.
 */
export class MenuItemHarness extends ComponentHarness {
  static hostSelector =
    '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';

  /** Predicate for `locatorFor` / `locatorForAll`. */
  static with(
    options: MenuItemHarnessFilters = {},
  ): HarnessPredicate<MenuItemHarness> {
    return new HarnessPredicate(MenuItemHarness, options)
      .addOption('text', options.text, async (h, text) =>
        HarnessPredicate.stringMatches(await h.getText(), text),
      )
      .addOption(
        'disabled',
        options.disabled,
        async (h, disabled) => (await h.isDisabled()) === disabled,
      )
      .addOption(
        'checked',
        options.checked,
        async (h, checked) => (await h.isChecked()) === checked,
      );
  }

  /** The item's rendered text, trimmed. Includes any projected description or shortcut text. */
  async getText(): Promise<string> {
    return (await (await this.host()).text()).trim();
  }

  /**
   * The item's ARIA role — `'menuitem'`, `'menuitemcheckbox'` or
   * `'menuitemradio'`. Lets a test tell the three kinds apart.
   */
  async getRole(): Promise<string | null> {
    return (await this.host()).getAttribute('role');
  }

  /** Whether the item reports `aria-disabled="true"`. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-disabled')) === 'true';
  }

  /**
   * Checked state of a checkbox or radio item, or `null` for a plain item,
   * which carries no `aria-checked` at all.
   */
  async isChecked(): Promise<boolean | null> {
    const checked = await (await this.host()).getAttribute('aria-checked');
    return checked === null ? null : checked === 'true';
  }

  /** Clicks the item. A disabled item ignores the click, as in the browser. */
  async click(): Promise<void> {
    await (await this.host()).click();
  }
}
