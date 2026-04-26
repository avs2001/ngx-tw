import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters } from '@angular/cdk/testing';

/** Filters accepted by `CalendarCellHarness.with`. */
export interface CalendarCellHarnessFilters extends BaseHarnessFilters {
  /** Match by the cell's visible display text (`1`, `Apr`, `2026`, etc.). */
  text?: string | RegExp;
  /** Match selected / unselected cells. */
  selected?: boolean;
  /** Match disabled / enabled cells. */
  disabled?: boolean;
}

/** Harness for interacting with a single calendar cell in tests. */
export class CalendarCellHarness extends ComponentHarness {
  static hostSelector = '[role="gridcell"]';

  private readonly button = this.locatorFor('button');

  /** Predicate for `locatorFor` / `locatorForAll`. */
  static with(options: CalendarCellHarnessFilters = {}): HarnessPredicate<CalendarCellHarness> {
    return new HarnessPredicate(CalendarCellHarness, options)
      .addOption('text', options.text, async (h, text) =>
        HarnessPredicate.stringMatches(await h.getText(), text),
      )
      .addOption('selected', options.selected, async (h, selected) => (await h.isSelected()) === selected)
      .addOption('disabled', options.disabled, async (h, disabled) => (await h.isDisabled()) === disabled);
  }

  /** The cell's rendered text, trimmed. */
  async getText(): Promise<string> {
    const btn = await this.button();
    return (await btn.text()).trim();
  }

  /** The cell's `aria-label`. */
  async getAriaLabel(): Promise<string | null> {
    const btn = await this.button();
    return btn.getAttribute('aria-label');
  }

  /** Whether the cell carries `aria-selected="true"`. */
  async isSelected(): Promise<boolean> {
    const btn = await this.button();
    return (await btn.getAttribute('aria-selected')) === 'true';
  }

  /** Whether the cell is disabled — true if the button has `disabled` or carries `aria-disabled="true"`. */
  async isDisabled(): Promise<boolean> {
    const btn = await this.button();
    if (await btn.getProperty<boolean>('disabled')) return true;
    return (await btn.getAttribute('aria-disabled')) === 'true';
  }

  /** Whether the cell represents today's date (`aria-current="date"`). */
  async isToday(): Promise<boolean> {
    const btn = await this.button();
    return (await btn.getAttribute('aria-current')) === 'date';
  }

  /** Click the cell. */
  async select(): Promise<void> {
    const btn = await this.button();
    return btn.click();
  }

  /** Dispatches `mouseenter` and `mousemove` on the cell to drive range-hover preview. */
  async hover(): Promise<void> {
    const btn = await this.button();
    await btn.dispatchEvent('mouseenter');
    await btn.dispatchEvent('mousemove');
  }

  /** Programmatically focus the cell. */
  async focus(): Promise<void> {
    const btn = await this.button();
    return btn.focus();
  }

  /** Whether the cell's button is the active document element. */
  async isFocused(): Promise<boolean> {
    const btn = await this.button();
    return btn.isFocused();
  }

  /** Dispatches a `keydown` for `key` on the cell button (e.g. `'ArrowRight'`, `'Enter'`, `' '`, `'PageUp'`). */
  async pressKey(
    key: string,
    modifiers: { shift?: boolean; meta?: boolean; ctrl?: boolean; alt?: boolean } = {},
  ): Promise<void> {
    const btn = await this.button();
    await btn.dispatchEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      shiftKey: !!modifiers.shift,
      metaKey: !!modifiers.meta,
      ctrlKey: !!modifiers.ctrl,
      altKey: !!modifiers.alt,
    });
  }
}
