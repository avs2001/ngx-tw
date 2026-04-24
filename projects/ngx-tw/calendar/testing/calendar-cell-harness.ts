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
    const host = await this.host();
    return (await host.getAttribute('aria-selected')) === 'true';
  }

  /** Whether the cell's button is disabled. */
  async isDisabled(): Promise<boolean> {
    const btn = await this.button();
    return btn.getProperty<boolean>('disabled');
  }

  /** Whether the cell carries the "today" ring styling. */
  async isToday(): Promise<boolean> {
    const btn = await this.button();
    const cls = (await btn.getProperty<string>('className')) ?? '';
    return cls.includes('ring-1');
  }

  /** Click the cell. */
  async select(): Promise<void> {
    const btn = await this.button();
    return btn.click();
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
}
