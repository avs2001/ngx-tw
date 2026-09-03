import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters } from '@angular/cdk/testing';
import {
  TransferItemHarness,
  type TransferItemHarnessFilters,
} from './transfer-item-harness';

/**
 * Which panel of a `tw-transfer` a call addresses. Structurally identical to
 * the component's own `TwTransferSide`, redeclared here so the testing entry
 * point stays free of any import from the component entry point.
 */
export type TransferHarnessSide = 'source' | 'target';

/** Filters accepted by `TransferHarness.with`. */
export interface TransferHarnessFilters extends BaseHarnessFilters {
  /** Match by the control's accessible name (its `aria-label`). */
  label?: string | RegExp;
  /** Match disabled / enabled controls. */
  disabled?: boolean;
}

/**
 * Harness for `tw-transfer`.
 *
 * ## How the two panels are told apart
 *
 * The panels are one `ng-template` instantiated twice, and neither the panel
 * element nor its list carries a side marker. The only per-side hook the
 * component renders is the auto-generated panel-title id — `…-source-title` /
 * `…-target-title` — which the listbox references through `aria-labelledby`
 * and which the component's own `focusDestination()` already matches on for
 * the same reason. This harness scopes every per-side query with a suffix
 * match on that id.
 *
 * Two consequences worth knowing:
 *
 * - Ordering is never assumed, so a panel that has emptied (its listbox is
 *   removed entirely — an empty `role="listbox"` violates
 *   `aria-required-children`) does not shift the other panel's identity.
 *   {@link getItems} simply returns `[]` for the empty side.
 * - The hook is a derived id, not a declared contract. If the panels ever gain
 *   a real marker attribute, this is the code that should move onto it.
 *
 * The whole control lives inside the `tw-transfer` host — there is no CDK
 * overlay — so the ordinary fixture loader is enough.
 */
export class TransferHarness extends ComponentHarness {
  static hostSelector = 'tw-transfer';

  /**
   * The move buttons, in DOM order: `[0]` shuttles source → target and `[1]`
   * target → source (absent under `behavior.oneWay`).
   *
   * The `:not()` excludes buttons a consumer projected into a
   * `*twTransferItem` template, which would otherwise be picked up ahead of
   * the real controls — rows render before the button column.
   */
  private readonly moveButtons = this.locatorForAll(
    'button:not([role="listbox"] *)',
  );

  /** Predicate for `locatorFor` / `locatorForAll`. */
  static with(options: TransferHarnessFilters = {}): HarnessPredicate<TransferHarness> {
    return new HarnessPredicate(TransferHarness, options)
      .addOption('label', options.label, async (h, label) =>
        HarnessPredicate.stringMatches(await h.getLabel(), label),
      )
      .addOption(
        'disabled',
        options.disabled,
        async (h, disabled) => (await h.isDisabled()) === disabled,
      );
  }

  /** The control's accessible name, from `aria-label` when one is set. */
  async getLabel(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-label');
  }

  /** Whether the control reports `aria-disabled="true"`. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-disabled')) === 'true';
  }

  /** The title rendered in a panel's header. */
  async getTitle(side: TransferHarnessSide): Promise<string> {
    return (await (await this.locatorFor(titleSelector(side))()).text()).trim();
  }

  /**
   * Every visible row in a panel, in render order. Returns `[]` for a panel
   * with nothing in it — including one hidden behind a search query, since
   * filtering removes rows from the DOM rather than hiding them.
   *
   * `filters.ancestor` is ignored: picking the side *is* the ancestor.
   */
  async getItems(
    side: TransferHarnessSide,
    filters: TransferItemHarnessFilters = {},
  ): Promise<TransferItemHarness[]> {
    return this.locatorForAll(
      TransferItemHarness.with({ ...filters, ancestor: listSelector(side) }),
    )();
  }

  /** The visible text of every row in a panel, in render order. */
  async getItemTexts(side: TransferHarnessSide): Promise<string[]> {
    const items = await this.getItems(side);
    return Promise.all(items.map((item) => item.getText()));
  }

  /**
   * How many rows a panel is showing. This is the number the panel header's
   * count also reports, so it tracks the search query rather than total
   * membership.
   */
  async getItemCount(side: TransferHarnessSide): Promise<number> {
    return (await this.getItems(side)).length;
  }

  /**
   * Ticks the first row in a panel whose text matches, staging it for the next
   * move. Throws when nothing matches, rather than failing silently.
   */
  async checkItem(side: TransferHarnessSide, text: string | RegExp): Promise<void> {
    const matches = await this.getItems(side, { text });
    if (matches.length === 0) {
      throw new Error(
        `TransferHarness.checkItem: no ${side} item matching ${String(text)}.`,
      );
    }
    await matches[0].check();
  }

  /**
   * Drives a panel's header select-all checkbox to `checked`, ticking or
   * clearing every enabled visible row in one gesture. This is how "move
   * everything" is expressed: `setAllChecked('source', true)` then
   * {@link moveToTarget}.
   *
   * The checkbox is tri-state. From `mixed` a single click resolves to
   * *checked*, the way a native indeterminate checkbox does, so clearing from
   * a partial selection takes two clicks — which is what a user does too, and
   * what this method issues. Everything is ticked in between.
   *
   * Throws when the checkbox is not rendered (`display.showSelectAll: false`).
   */
  async setAllChecked(side: TransferHarnessSide, checked: boolean): Promise<void> {
    const checkbox = await this.locatorForOptional(selectAllSelector(side))();
    if (!checkbox) {
      throw new Error(
        `TransferHarness.setAllChecked: the ${side} panel has no select-all checkbox. It is hidden by \`display.showSelectAll: false\`.`,
      );
    }
    const want = String(checked);
    if ((await checkbox.getAttribute('aria-checked')) === want) return;
    await checkbox.click();
    // The second click of the `mixed` → `false` path.
    if ((await checkbox.getAttribute('aria-checked')) !== want) {
      await checkbox.click();
    }
  }

  /**
   * Presses the → button, shuttling the source panel's ticked rows to the
   * target. Rows that are disabled are skipped by the component.
   */
  async moveToTarget(): Promise<void> {
    const buttons = await this.moveButtons();
    if (buttons.length === 0) {
      throw new Error('TransferHarness.moveToTarget: no → button was found.');
    }
    await buttons[0].click();
    await this.waitForTasksOutsideAngular();
  }

  /**
   * Presses the ← button, shuttling the target panel's ticked rows back to the
   * source. Throws under `behavior.oneWay`, where that button is not rendered.
   */
  async moveToSource(): Promise<void> {
    const buttons = await this.moveButtons();
    if (buttons.length < 2) {
      throw new Error(
        'TransferHarness.moveToSource: no ← button is rendered. `behavior.oneWay` removes it.',
      );
    }
    await buttons[1].click();
    await this.waitForTasksOutsideAngular();
  }
}

/** The panel-title element for a side. */
function titleSelector(side: TransferHarnessSide): string {
  return `[id$="-${side}-title"]`;
}

/** The panel's listbox, matched through the title it is labelled by. */
function listSelector(side: TransferHarnessSide): string {
  return `[role="listbox"][aria-labelledby$="-${side}-title"]`;
}

/**
 * The panel header's select-all checkbox. The header is the element that has
 * the title as a *direct* child, which distinguishes it from the panel wrapper
 * around it; the checkbox is the header's sibling of that title.
 */
function selectAllSelector(side: TransferHarnessSide): string {
  return `div:has(> [id$="-${side}-title"]) > [role="checkbox"]`;
}
