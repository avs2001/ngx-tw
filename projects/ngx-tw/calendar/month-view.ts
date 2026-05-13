import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  viewChildren,
  type InputSignal,
  type Signal,
} from '@angular/core';
import { CalendarCellComponent, type CalendarCellKeyNavEvent } from './calendar-cell';
import type { CalendarCell, CalendarViewState } from './calendar.types';
import { DAYS_PER_WEEK, WEEKS_PER_MONTH, createCalendarCell } from './calendar.types';
import {
  createGrid,
  getFirstDayOfMonth,
  getWeekdayHeaders,
  isDateDisabled,
  isWeekend,
  type WeekdayHeader,
} from './calendar.utils';
import { CalendarViewBase } from './calendar-view-base';

const TOTAL_CELLS = DAYS_PER_WEEK * WEEKS_PER_MONTH;

/**
 * Month view — renders a 7×6 grid of day cells, with leading/trailing days
 * from adjacent months marked as "outside".
 */
@Component({
  selector: 'tw-calendar-month-view',
  imports: [CalendarCellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      role="grid"
      [attr.aria-label]="gridLabel()"
      [attr.aria-multiselectable]="multiSelectable() || null"
      (mouseleave)="onGridMouseLeave()"
    >
      <!-- gap-0: weekday headers align column-by-column with the day grid below, which itself must be gap-0 for contiguous range backgrounds. -->
      <div role="row" class="grid grid-cols-7 gap-0">
        @for (header of weekdayHeaders(); track $index) {
          <div
            role="columnheader"
            class="flex items-center justify-center h-9 text-xs font-medium text-fg-muted"
            [attr.aria-label]="header.label"
          >
            {{ header.narrow }}
          </div>
        }
      </div>
      @for (row of cells(); track $index) {
        <!-- gap-0: cells must touch so range-selection wrapper backgrounds (bg-primary-100 + rounded-l/r-full) form a continuous bar across adjacent days. -->
        <div role="row" class="grid grid-cols-7 gap-0">
          @for (cell of row; track cell.compareValue) {
            <tw-calendar-cell
              [cell]="cell"
              [view]="view"
              [outside]="isOutsideMonth(cell)"
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
export class MonthViewComponent<D> extends CalendarViewBase<D> {
  protected readonly view: CalendarViewState = 'day';

  protected readonly cellComponents: Signal<readonly CalendarCellComponent<D>[]> =
    viewChildren<CalendarCellComponent<D>>(CalendarCellComponent);

  /** Override first day of week (0=Sun, 1=Mon). */
  readonly firstDayOfWeek: InputSignal<number> = input<number>(0);

  /** Index within a multi-month row (0=left, 1+=right) — used by the orchestrator to disambiguate focus. */
  readonly gridIndex: InputSignal<number> = input<number>(0);

  readonly weekdayHeaders: Signal<WeekdayHeader[]> = computed(() =>
    getWeekdayHeaders(this.dateAdapter, 'long', this.firstDayOfWeek()),
  );

  readonly displayMonth: Signal<number> = computed(() =>
    this.dateAdapter.getMonth(this.activeDate()),
  );

  readonly displayYear: Signal<number> = computed(() =>
    this.dateAdapter.getYear(this.activeDate()),
  );

  readonly cells: Signal<CalendarCell<D>[][]> = computed(() => {
    const active = this.activeDate();
    const firstOfMonth = getFirstDayOfMonth(active, this.dateAdapter);
    const firstDayOfWeek = this.firstDayOfWeek();
    const firstDayOfMonthWeekday = this.dateAdapter.getDayOfWeek(firstOfMonth);
    const offset = (firstDayOfMonthWeekday - firstDayOfWeek + DAYS_PER_WEEK) % DAYS_PER_WEEK;
    const startDate = this.dateAdapter.addDays(firstOfMonth, -offset);

    const today = this.today();
    const minDate = this.minDate();
    const maxDate = this.maxDate();
    const dateFilter = this.dateFilter();
    const disabledDates = this.disabledDates();
    const disabledDaysOfWeek = this.disabledDaysOfWeek();
    const dateClass = this.dateClass();
    const displayedMonth = this.displayMonth();

    const days: CalendarCell<D>[] = [];
    for (let i = 0; i < TOTAL_CELLS; i++) {
      const date = this.dateAdapter.addDays(startDate, i);
      const dayOfMonth = this.dateAdapter.getDate(date);
      const cellMonth = this.dateAdapter.getMonth(date);
      const cellYear = this.dateAdapter.getYear(date);
      const compareValue = cellYear * 10000 + cellMonth * 100 + dayOfMonth;
      const cell = createCalendarCell<D>({
        value: date,
        displayValue: String(dayOfMonth),
        ariaLabel: this.dateAdapter.format(date, { dateTimeFormat: { dateStyle: 'full' } }),
        enabled: !isDateDisabled(
          date,
          minDate,
          maxDate,
          dateFilter,
          this.dateAdapter,
          disabledDates,
          disabledDaysOfWeek,
        ),
        cssClasses: dateClass ? dateClass(date, this.view) : '',
        compareValue,
      });
      cell.isToday = this.dateAdapter.sameDate(date, today);
      cell.isSelected = this.isSelected(date);
      cell.isRangeStart = this.isRangeStart(date);
      cell.isRangeEnd = this.isRangeEnd(date);
      cell.isRangeMiddle = this.isRangeMiddle(date);
      cell.isPreviewStart = this.isPreviewStart(date);
      cell.isPreviewEnd = this.isPreviewEnd(date);
      cell.isPreviewMiddle = this.isPreviewMiddle(date);
      cell.isOutOfMonth = cellMonth !== displayedMonth;
      cell.isWeekend = isWeekend(date, this.dateAdapter);
      const flashDate = this.invalidFlashDate();
      cell.isInvalidFlash = flashDate !== null && this.dateAdapter.sameDate(date, flashDate);
      days.push(cell);
    }
    return createGrid(days, DAYS_PER_WEEK);
  });

  readonly gridLabel: Signal<string> = computed(() => {
    const months = this.dateAdapter.getMonthNames('long');
    return `${months[this.displayMonth()]} ${this.displayYear()}`;
  });

  protected getActiveCompareValue(): number {
    const d = this.activeDate();
    return (
      this.dateAdapter.getYear(d) * 10000 +
      this.dateAdapter.getMonth(d) * 100 +
      this.dateAdapter.getDate(d)
    );
  }

  /** True when the cell's date sits in a neighbouring month (leading/trailing). */
  isOutsideMonth(cell: CalendarCell<D>): boolean {
    return this.dateAdapter.getMonth(cell.value) !== this.displayMonth();
  }

  onKeyNav(event: CalendarCellKeyNavEvent<D>): void {
    const currentDate = event.cell.value;
    let newDate: D | null = null;

    switch (event.direction) {
      case 'left':
        newDate = this.dateAdapter.addDays(currentDate, -1);
        break;
      case 'right':
        newDate = this.dateAdapter.addDays(currentDate, 1);
        break;
      case 'up':
        newDate = this.dateAdapter.addDays(currentDate, -DAYS_PER_WEEK);
        break;
      case 'down':
        newDate = this.dateAdapter.addDays(currentDate, DAYS_PER_WEEK);
        break;
      case 'home': {
        const dow = this.dateAdapter.getDayOfWeek(currentDate);
        const first = this.firstDayOfWeek();
        const diff = (dow - first + DAYS_PER_WEEK) % DAYS_PER_WEEK;
        newDate = this.dateAdapter.addDays(currentDate, -diff);
        break;
      }
      case 'end': {
        const dow = this.dateAdapter.getDayOfWeek(currentDate);
        const first = this.firstDayOfWeek();
        const daysUntilEnd = (6 - dow + first + DAYS_PER_WEEK) % DAYS_PER_WEEK;
        newDate = this.dateAdapter.addDays(currentDate, daysUntilEnd);
        break;
      }
      case 'pageUp':
        newDate = this.dateAdapter.addMonths(currentDate, -1);
        break;
      case 'pageDown':
        newDate = this.dateAdapter.addMonths(currentDate, 1);
        break;
    }

    if (newDate) {
      const year = this.dateAdapter.getYear(newDate);
      const month = this.dateAdapter.getMonth(newDate);
      const day = this.dateAdapter.getDate(newDate);
      const compareValue = year * 10000 + month * 100 + day;
      this.focusCell(compareValue);
      this.activeDateChange.emit(newDate);
    }
  }
}
