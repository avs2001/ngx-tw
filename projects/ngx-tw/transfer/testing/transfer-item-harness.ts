import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters } from '@angular/cdk/testing';

/** Filters accepted by `TransferItemHarness.with`. */
export interface TransferItemHarnessFilters extends BaseHarnessFilters {
  /** Match by the row's visible text. */
  text?: string | RegExp;
  /** Match ticked / unticked rows. */
  checked?: boolean;
  /** Match disabled / enabled rows. */
  disabled?: boolean;
}

/**
 * Harness for a single row inside one of a `tw-transfer`'s two panels.
 *
 * Rows are `CdkOption`s, so the harness reads ARIA that CDK owns rather than
 * anything ngx-tw renders: `aria-selected` for the ticked state and
 * `aria-disabled` for the per-item disable predicate.
 *
 * "Checked" here is the *ephemeral pending-move* state — which rows the next
 * move button press will shuttle — not membership of a side. Membership is the
 * component's value; read it by asking {@link TransferHarness} which panel a
 * row is in.
 *
 * Reach these through {@link TransferHarness.getItems}: located from a document
 * root the selector would match every listbox option on the page.
 */
export class TransferItemHarness extends ComponentHarness {
  static hostSelector = '[role="option"]';

  /** Predicate for `locatorFor` / `locatorForAll`. */
  static with(
    options: TransferItemHarnessFilters = {},
  ): HarnessPredicate<TransferItemHarness> {
    return new HarnessPredicate(TransferItemHarness, options)
      .addOption('text', options.text, async (h, text) =>
        HarnessPredicate.stringMatches(await h.getText(), text),
      )
      .addOption(
        'checked',
        options.checked,
        async (h, checked) => (await h.isChecked()) === checked,
      )
      .addOption(
        'disabled',
        options.disabled,
        async (h, disabled) => (await h.isDisabled()) === disabled,
      );
  }

  /**
   * The row's rendered text, trimmed. With the default row rendering this is
   * `labelFn(item)`; a projected `*twTransferItem` template makes it whatever
   * that template renders.
   */
  async getText(): Promise<string> {
    return (await (await this.host()).text()).trim();
  }

  /** Whether the row is ticked for the next move, from `aria-selected`. */
  async isChecked(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-selected')) === 'true';
  }

  /** Whether the row reports `aria-disabled="true"` (`behavior.disabledItem`). */
  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-disabled')) === 'true';
  }

  /** Ticks the row for the next move. No-op when already ticked. */
  async check(): Promise<void> {
    if (await this.isChecked()) return;
    await (await this.host()).click();
  }

  /** Unticks the row. No-op when already unticked. */
  async uncheck(): Promise<void> {
    if (!(await this.isChecked())) return;
    await (await this.host()).click();
  }
}
