import {
  ChangeDetectionStrategy,
  Component,
  computed,
  viewChildren,
  type Signal,
} from '@angular/core';
import { CalendarCellComponent, type CalendarCellKeyNavEvent } from './calendar-cell';
import type { CalendarCell, CalendarViewState } from './calendar.types';
import { YEARS_PER_PAGE, YEARS_PER_ROW, createCalendarCell } from './calendar.types';
import { createGrid, getMultiYearStartingYear, isYearDisabled } from './calendar.utils';
import { CalendarViewBase } from './calendar-view-base';

/** Default years per page — kept until Phase 7 introduces the `yearsPerPage` input. */
export const yearsPerPage = YEARS_PER_PAGE;

/**
 * Year view — 4×6 grid (24 years by default). A user clicks a year to drill
 * down to the month-of-year view. In the spec vocabulary this is the
 * `'year'` view state (§7.4, §22).
 */
@Component({
  selector: 'tw-calendar-years-view',
  imports: [CalendarCellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      role="grid"
      [attr.aria-label]="gridLabel()"
      [attr.aria-multiselectable]="multiSelectable() || null"
      [attr.aria-readonly]="readonlyGrid() || null"
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
export class YearsViewComponent<D> extends CalendarViewBase<D> {
  protected readonly view: CalendarViewState = 'year';

  protected readonly cellComponents: Signal<readonly CalendarCellComponent<D>[]> =
    viewChildren<CalendarCellComponent<D>>(CalendarCellComponent);

  readonly startYear: Signal<number> = computed(() =>
    getMultiYearStartingYear(this.dateAdapter.getYear(this.activeDate()), YEARS_PER_PAGE),
  );

  readonly endYear: Signal<number> = computed(() => this.startYear() + YEARS_PER_PAGE - 1);

  readonly cells: Signal<CalendarCell<D>[][]> = computed(() => {
    const start = this.startYear();
    const today = this.today();
    const todayYear = this.dateAdapter.getYear(today);
    const minDate = this.minDate();
    const maxDate = this.maxDate();
    const dateClass = this.dateClass();

    const years: CalendarCell<D>[] = [];
    for (let i = 0; i < YEARS_PER_PAGE; i++) {
      const year = start + i;
      const date = this.dateAdapter.create(year, 1, 1);
      const label = this.dateAdapter.getYearName(date);
      const cell = createCalendarCell<D>({
        value: date,
        displayValue: label,
        ariaLabel: label,
        enabled: !isYearDisabled(year, minDate, maxDate, this.dateAdapter),
        cssClasses: dateClass ? dateClass(date, this.view) : '',
        compareValue: year,
      });
      cell.isToday = year === todayYear;
      cell.isSelected = this.isYearSelected(year);
      cell.isRangeStart = this.isYearRangeStart(year);
      cell.isRangeEnd = this.isYearRangeEnd(year);
      cell.isRangeMiddle = this.isYearRangeMiddle(year);
      cell.isPreviewStart = this.isYearPreviewStart(year);
      cell.isPreviewEnd = this.isYearPreviewEnd(year);
      cell.isPreviewMiddle = this.isYearPreviewMiddle(year);
      years.push(cell);
    }
    return createGrid(years, YEARS_PER_ROW);
  });

  readonly gridLabel: Signal<string> = computed(() => `${this.startYear()} – ${this.endYear()}`);

  protected getActiveCompareValue(): number {
    return this.dateAdapter.getYear(this.activeDate());
  }

  onKeyNav(event: CalendarCellKeyNavEvent<D>): void {
    const currentYear = this.dateAdapter.getYear(event.cell.value);
    const start = this.startYear();
    const end = this.endYear();
    const indexInPage = currentYear - start;
    let newDate: D | null = null;

    switch (event.direction) {
      case 'left':
        if (currentYear > start) {
          newDate = this.dateAdapter.addYears(event.cell.value, -1);
          this.focusCell(currentYear - 1);
        }
        break;
      case 'right':
        if (currentYear < end) {
          newDate = this.dateAdapter.addYears(event.cell.value, 1);
          this.focusCell(currentYear + 1);
        }
        break;
      case 'up':
        if (indexInPage >= YEARS_PER_ROW) {
          newDate = this.dateAdapter.addYears(event.cell.value, -YEARS_PER_ROW);
          this.focusCell(currentYear - YEARS_PER_ROW);
        }
        break;
      case 'down':
        if (indexInPage < YEARS_PER_PAGE - YEARS_PER_ROW) {
          newDate = this.dateAdapter.addYears(event.cell.value, YEARS_PER_ROW);
          this.focusCell(currentYear + YEARS_PER_ROW);
        }
        break;
      case 'home':
        newDate = this.dateAdapter.create(start, 1, 1);
        this.focusCell(start);
        break;
      case 'end':
        newDate = this.dateAdapter.create(end, 1, 1);
        this.focusCell(end);
        break;
      case 'pageUp':
        newDate = this.dateAdapter.addYears(
          event.cell.value,
          event.shiftKey ? -YEARS_PER_PAGE * 10 : -YEARS_PER_PAGE,
        );
        break;
      case 'pageDown':
        newDate = this.dateAdapter.addYears(
          event.cell.value,
          event.shiftKey ? YEARS_PER_PAGE * 10 : YEARS_PER_PAGE,
        );
        break;
    }
    if (newDate) this.activeDateChange.emit(newDate);
  }

  private isYearSelected(year: number): boolean {
    const sel = this.selected();
    if (!sel) return false;
    if (Array.isArray(sel)) {
      return sel.some((d) => this.dateAdapter.getYear(d) === year);
    }
    if (!this.isDateRange(sel)) {
      return this.dateAdapter.getYear(sel) === year;
    }
    const r = sel;
    if (r.start && this.dateAdapter.getYear(r.start) === year) return true;
    if (r.end && this.dateAdapter.getYear(r.end) === year) return true;
    return false;
  }

  private isYearRangeStart(year: number): boolean {
    const sel = this.selected();
    if (!sel || !this.isDateRange(sel) || !sel.start) return false;
    return this.dateAdapter.getYear(sel.start) === year;
  }

  private isYearRangeEnd(year: number): boolean {
    const sel = this.selected();
    if (!sel || !this.isDateRange(sel) || !sel.end) return false;
    return this.dateAdapter.getYear(sel.end) === year;
  }

  private isYearRangeMiddle(year: number): boolean {
    const sel = this.selected();
    if (!sel || !this.isDateRange(sel) || !sel.start || !sel.end) return false;
    const startYear = this.dateAdapter.getYear(sel.start);
    const endYear = this.dateAdapter.getYear(sel.end);
    return year > startYear && year < endYear;
  }

  private isYearPreviewStart(year: number): boolean {
    const s = this.previewStart();
    return s !== null && this.dateAdapter.getYear(s) === year;
  }

  private isYearPreviewEnd(year: number): boolean {
    const e = this.previewEnd();
    return e !== null && this.dateAdapter.getYear(e) === year;
  }

  private isYearPreviewMiddle(year: number): boolean {
    const s = this.previewStart();
    const e = this.previewEnd();
    if (!s || !e) return false;
    return year > this.dateAdapter.getYear(s) && year < this.dateAdapter.getYear(e);
  }
}
