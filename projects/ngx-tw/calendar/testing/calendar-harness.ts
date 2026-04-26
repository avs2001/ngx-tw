import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters, TestElement } from '@angular/cdk/testing';
import { CalendarCellHarness, type CalendarCellHarnessFilters } from './calendar-cell-harness';

/** The available calendar views, mirrored so consumers don't have to import from the library's main entry point. */
export type CalendarHarnessView = 'day' | 'month' | 'year';

/** Filters accepted by `CalendarHarness.with`. */
export type CalendarHarnessFilters = BaseHarnessFilters;

/** Harness for interacting with a `<tw-calendar>` in tests. */
export class CalendarHarness extends ComponentHarness {
  static hostSelector = 'tw-calendar';

  private readonly headerNavButtons = this.locatorForAll('tw-calendar-header button');
  private readonly grid = this.locatorFor('[role="grid"]');

  /** Predicate for `locatorFor` / `locatorForAll`. */
  static with(options: CalendarHarnessFilters = {}): HarnessPredicate<CalendarHarness> {
    return new HarnessPredicate(CalendarHarness, options);
  }

  /** The header period label (e.g. `"October 2026"`, `"2026"`, `"2024 – 2047"`). */
  async getPeriodLabel(): Promise<string> {
    const [, periodBtn] = await this.orderedHeaderButtons();
    return (await periodBtn.text()).trim();
  }

  /** Click the previous-page nav button. */
  async goToPreviousPage(): Promise<void> {
    const [prev] = await this.orderedHeaderButtons();
    return prev.click();
  }

  /** Click the next-page nav button. */
  async goToNextPage(): Promise<void> {
    const [, , next] = await this.orderedHeaderButtons();
    return next.click();
  }

  /** Whether the previous nav button is disabled. */
  async isPreviousDisabled(): Promise<boolean> {
    const [prev] = await this.orderedHeaderButtons();
    return prev.getProperty<boolean>('disabled');
  }

  /** Whether the next nav button is disabled. */
  async isNextDisabled(): Promise<boolean> {
    const [, , next] = await this.orderedHeaderButtons();
    return next.getProperty<boolean>('disabled');
  }

  /**
   * Click the period label button to move up one view (`day` → `month` → `year`).
   * Accepts an optional `target` to call it multiple times until the current view matches.
   */
  async switchView(target?: CalendarHarnessView): Promise<void> {
    if (!target) {
      const [, periodBtn] = await this.orderedHeaderButtons();
      await periodBtn.click();
      return;
    }
    for (let i = 0; i < 3; i++) {
      if ((await this.getCurrentView()) === target) return;
      const [, periodBtn] = await this.orderedHeaderButtons();
      await periodBtn.click();
    }
  }

  /** Identify the currently rendered view by inspecting which view component is present. */
  async getCurrentView(): Promise<CalendarHarnessView> {
    const day = await this.locatorForOptional('tw-calendar-month-view')();
    if (day) return 'day';
    const month = await this.locatorForOptional('tw-calendar-year-view')();
    if (month) return 'month';
    return 'year';
  }

  /** All cell harnesses in the currently rendered view. */
  async getCells(filters: CalendarCellHarnessFilters = {}): Promise<CalendarCellHarness[]> {
    return this.locatorForAll(CalendarCellHarness.with(filters))();
  }

  /** Click the cell whose text matches exactly. Throws if no match. */
  async selectCell(text: string): Promise<void> {
    const cell = await this.findCellByText(text);
    return cell.select();
  }

  /**
   * Selects a date range by clicking the cell whose text matches `start`, then
   * the cell whose text matches `end`. Caller is responsible for ensuring the
   * calendar is in `mode: 'range'` and that both cells are visible in the
   * current view.
   */
  async selectRange(start: string, end: string): Promise<void> {
    const startCell = await this.findCellByText(start);
    await startCell.select();
    const endCell = await this.findCellByText(end);
    await endCell.select();
  }

  /** Hovers the cell whose text matches `text` (dispatches `mouseenter` + `mousemove`). Throws if no match. */
  async hoverCell(text: string): Promise<void> {
    const cell = await this.findCellByText(text);
    return cell.hover();
  }

  /**
   * Dispatches a `keydown` for `key` on the currently focused cell — falls back
   * to the calendar grid host when no cell owns focus. Supports `'ArrowLeft'`,
   * `'ArrowRight'`, `'ArrowUp'`, `'ArrowDown'`, `'Home'`, `'End'`, `'PageUp'`,
   * `'PageDown'`, `'Enter'`, and `' '` (Space).
   */
  async pressKey(
    key: string,
    modifiers: { shift?: boolean; meta?: boolean; ctrl?: boolean; alt?: boolean } = {},
  ): Promise<void> {
    const cells = await this.getCells();
    for (const cell of cells) {
      if (await cell.isFocused()) {
        return cell.pressKey(key, modifiers);
      }
    }
    const target: TestElement = await this.grid();
    await target.dispatchEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      shiftKey: !!modifiers.shift,
      metaKey: !!modifiers.meta,
      ctrlKey: !!modifiers.ctrl,
      altKey: !!modifiers.alt,
    });
  }

  /** All cells currently rendered with `aria-selected="true"`. */
  async getSelectedCells(): Promise<CalendarCellHarness[]> {
    return this.getCells({ selected: true });
  }

  /** The cell representing today, or `null` if not visible in the current view. */
  async getTodayCell(): Promise<CalendarCellHarness | null> {
    const cells = await this.getCells();
    for (const cell of cells) {
      if (await cell.isToday()) return cell;
    }
    return null;
  }

  /** All disabled cells in the current view. */
  async getDisabledCells(): Promise<CalendarCellHarness[]> {
    return this.getCells({ disabled: true });
  }

  /** Whether the calendar host carries `aria-disabled="true"`. */
  async isDisabled(): Promise<boolean> {
    const host = await this.host();
    return (await host.getAttribute('aria-disabled')) === 'true';
  }

  /** @internal Returns the header buttons in [prev, period, next] order. */
  private async orderedHeaderButtons() {
    const buttons = await this.headerNavButtons();
    // Header renders [period, prev, next] visually, but the DOM is [period-button, prev-button, next-button].
    // We normalise to [prev, period, next] by treating the first button as "period".
    const [period, prev, next] = buttons;
    return [prev, period, next] as const;
  }

  /** @internal Resolves the first cell whose text matches `text`. Throws if no match. */
  private async findCellByText(text: string): Promise<CalendarCellHarness> {
    const cells = await this.getCells({ text });
    if (cells.length === 0) {
      throw new Error(`Could not find calendar cell with text "${text}"`);
    }
    return cells[0]!;
  }
}
