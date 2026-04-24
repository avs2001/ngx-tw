import {
  ChangeDetectionStrategy,
  Component,
  computed,
  viewChildren,
  type Signal,
} from '@angular/core';
import { CalendarCellComponent, type CalendarCellKeyNavEvent } from './calendar-cell';
import type { CalendarCell, CalendarViewState } from './calendar.types';
import { MONTHS_PER_ROW, createCalendarCell } from './calendar.types';
import { createGrid, isMonthDisabled } from './calendar.utils';
import { CalendarViewBase } from './calendar-view-base';

const MONTHS_PER_YEAR = 12;

/**
 * Year view — 4×3 grid of month cells inside the active year.
 */
@Component({
  selector: 'tw-calendar-year-view',
  imports: [CalendarCellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      role="grid"
      [attr.aria-label]="gridLabel()"
      (mouseleave)="onGridMouseLeave()"
    >
      @for (row of cells(); track $index) {
        <div role="row" class="grid grid-cols-4 gap-1">
          @for (cell of row; track cell.compareValue) {
            <tw-calendar-cell
              [cell]="cell"
              [view]="view"
              [tabindex]="isActiveCell(cell) ? 0 : -1"
              [cellTemplate]="cellTemplate()"
              [attr.data-compare-value]="cell.compareValue"
              (selected)="onCellSelected($event)"
              (previewed)="onCellPreviewed($event)"
              (keyNav)="onKeyNav($event)"
            />
          }
        </div>
      }
    </div>
  `,
})
export class YearViewComponent<D> extends CalendarViewBase<D> {
  protected readonly view: CalendarViewState = 'month';

  protected readonly cellComponents: Signal<readonly CalendarCellComponent<D>[]> =
    viewChildren<CalendarCellComponent<D>>(CalendarCellComponent);

  readonly displayYear: Signal<number> = computed(() =>
    this.dateAdapter.getYear(this.activeDate()),
  );

  readonly cells: Signal<CalendarCell<D>[][]> = computed(() => {
    const year = this.displayYear();
    const monthNames = this.dateAdapter.getMonthNames('short');
    const today = this.today();
    const todayYear = this.dateAdapter.getYear(today);
    const todayMonth = this.dateAdapter.getMonth(today);
    const minDate = this.minDate();
    const maxDate = this.maxDate();
    const dateClass = this.dateClass();

    const months: CalendarCell<D>[] = [];
    for (let m = 0; m < MONTHS_PER_YEAR; m++) {
      const date = this.dateAdapter.create(year, m + 1, 1);
      const name = monthNames[m] ?? '';
      const cell = createCalendarCell<D>({
        value: date,
        displayValue: name,
        ariaLabel: `${name} ${year}`,
        enabled: !isMonthDisabled(year, m, minDate, maxDate, this.dateAdapter),
        cssClasses: dateClass ? dateClass(date, this.view) : '',
        compareValue: m,
      });
      cell.isToday = year === todayYear && m === todayMonth;
      cell.isSelected = this.isMonthSelected(year, m);
      cell.isRangeStart = this.isMonthRangeStart(year, m);
      cell.isRangeEnd = this.isMonthRangeEnd(year, m);
      cell.isRangeMiddle = this.isMonthRangeMiddle(year, m);
      cell.isPreviewStart = this.isMonthPreviewStart(year, m);
      cell.isPreviewEnd = this.isMonthPreviewEnd(year, m);
      cell.isPreviewMiddle = this.isMonthPreviewMiddle(year, m);
      months.push(cell);
    }
    return createGrid(months, MONTHS_PER_ROW);
  });

  readonly gridLabel: Signal<string> = computed(() => `${this.displayYear()}`);

  protected getActiveCompareValue(): number {
    return this.dateAdapter.getMonth(this.activeDate());
  }

  onKeyNav(event: CalendarCellKeyNavEvent<D>): void {
    const currentMonth = this.dateAdapter.getMonth(event.cell.value);
    const year = this.displayYear();
    let newDate: D | null = null;

    switch (event.direction) {
      case 'left':
        if (currentMonth > 0) {
          newDate = this.dateAdapter.addMonths(event.cell.value, -1);
          this.focusCell(currentMonth - 1);
        }
        break;
      case 'right':
        if (currentMonth < 11) {
          newDate = this.dateAdapter.addMonths(event.cell.value, 1);
          this.focusCell(currentMonth + 1);
        }
        break;
      case 'up':
        if (currentMonth >= MONTHS_PER_ROW) {
          newDate = this.dateAdapter.addMonths(event.cell.value, -MONTHS_PER_ROW);
          this.focusCell(currentMonth - MONTHS_PER_ROW);
        }
        break;
      case 'down':
        if (currentMonth < MONTHS_PER_YEAR - MONTHS_PER_ROW) {
          newDate = this.dateAdapter.addMonths(event.cell.value, MONTHS_PER_ROW);
          this.focusCell(currentMonth + MONTHS_PER_ROW);
        }
        break;
      case 'home':
        newDate = this.dateAdapter.create(year, 1, 1);
        this.focusCell(0);
        break;
      case 'end':
        newDate = this.dateAdapter.create(year, 12, 1);
        this.focusCell(11);
        break;
      case 'pageUp':
        newDate = this.dateAdapter.addYears(event.cell.value, -1);
        break;
      case 'pageDown':
        newDate = this.dateAdapter.addYears(event.cell.value, 1);
        break;
    }
    if (newDate) this.activeDateChange.emit(newDate);
  }

  private isMonthSelected(year: number, month: number): boolean {
    const sel = this.selected();
    if (!sel) return false;
    if (Array.isArray(sel)) {
      return sel.some(
        (d) => this.dateAdapter.getYear(d) === year && this.dateAdapter.getMonth(d) === month,
      );
    }
    if (!this.isDateRange(sel)) {
      return this.dateAdapter.getYear(sel) === year && this.dateAdapter.getMonth(sel) === month;
    }
    const r = sel;
    if (r.start && this.dateAdapter.getYear(r.start) === year && this.dateAdapter.getMonth(r.start) === month) {
      return true;
    }
    if (r.end && this.dateAdapter.getYear(r.end) === year && this.dateAdapter.getMonth(r.end) === month) {
      return true;
    }
    return false;
  }

  private isMonthRangeStart(year: number, month: number): boolean {
    const sel = this.selected();
    if (!sel || !this.isDateRange(sel) || !sel.start) return false;
    return this.dateAdapter.getYear(sel.start) === year && this.dateAdapter.getMonth(sel.start) === month;
  }

  private isMonthRangeEnd(year: number, month: number): boolean {
    const sel = this.selected();
    if (!sel || !this.isDateRange(sel) || !sel.end) return false;
    return this.dateAdapter.getYear(sel.end) === year && this.dateAdapter.getMonth(sel.end) === month;
  }

  private isMonthRangeMiddle(year: number, month: number): boolean {
    const sel = this.selected();
    if (!sel || !this.isDateRange(sel) || !sel.start || !sel.end) return false;
    const monthDate = this.dateAdapter.create(year, month + 1, 1);
    const startMonth = this.dateAdapter.create(
      this.dateAdapter.getYear(sel.start),
      this.dateAdapter.getMonth(sel.start) + 1,
      1,
    );
    const endMonth = this.dateAdapter.create(
      this.dateAdapter.getYear(sel.end),
      this.dateAdapter.getMonth(sel.end) + 1,
      1,
    );
    return (
      this.dateAdapter.compare(monthDate, startMonth) > 0 &&
      this.dateAdapter.compare(monthDate, endMonth) < 0
    );
  }

  private isMonthPreviewStart(year: number, month: number): boolean {
    const s = this.previewStart();
    if (!s) return false;
    return this.dateAdapter.getYear(s) === year && this.dateAdapter.getMonth(s) === month;
  }

  private isMonthPreviewEnd(year: number, month: number): boolean {
    const e = this.previewEnd();
    if (!e) return false;
    return this.dateAdapter.getYear(e) === year && this.dateAdapter.getMonth(e) === month;
  }

  private isMonthPreviewMiddle(year: number, month: number): boolean {
    const s = this.previewStart();
    const e = this.previewEnd();
    if (!s || !e) return false;
    const monthDate = this.dateAdapter.create(year, month + 1, 1);
    const startMonth = this.dateAdapter.create(
      this.dateAdapter.getYear(s),
      this.dateAdapter.getMonth(s) + 1,
      1,
    );
    const endMonth = this.dateAdapter.create(
      this.dateAdapter.getYear(e),
      this.dateAdapter.getMonth(e) + 1,
      1,
    );
    return (
      this.dateAdapter.compare(monthDate, startMonth) > 0 &&
      this.dateAdapter.compare(monthDate, endMonth) < 0
    );
  }
}
