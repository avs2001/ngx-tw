import { inject, Injectable } from '@angular/core';
import type { DateRange } from '../calendar.types';
import { type DateAdapter, DATE_ADAPTER } from '../date-adapter';
import { isDateInRange } from '../calendar.utils';
import { CalendarSelectionStrategy, type SelectionResult } from './selection-strategy';

/**
 * Week selection.
 *
 * - Any click selects the entire week containing that day.
 * - Week bounds use `DateAdapter.getFirstDayOfWeek()`.
 * - Each click commits immediately.
 * - Hovering previews the week the cursor is in.
 *
 * `selected` has shape `DateRange<D> | null`.
 */
@Injectable()
export class WeekSelectionStrategy<D> extends CalendarSelectionStrategy<D, DateRange<D> | null> {
  private readonly dateAdapter: DateAdapter<D> = inject(DATE_ADAPTER) as DateAdapter<D>;

  select(date: D, _current: DateRange<D> | null): SelectionResult<D, DateRange<D> | null> {
    return { selection: this.weekRange(date), isComplete: true };
  }

  createPreview(active: D | null, _current: DateRange<D> | null): DateRange<D> | null {
    if (!active) return null;
    return this.weekRange(active);
  }

  isSelected(date: D, current: DateRange<D> | null): boolean {
    if (!current?.start || !current?.end) return false;
    return isDateInRange(date, current.start, current.end, this.dateAdapter);
  }

  isRangeStart(date: D, current: DateRange<D> | null): boolean {
    if (!current?.start) return false;
    return this.dateAdapter.sameDate(date, current.start);
  }

  isRangeEnd(date: D, current: DateRange<D> | null): boolean {
    if (!current?.end) return false;
    return this.dateAdapter.sameDate(date, current.end);
  }

  isRangeMiddle(date: D, current: DateRange<D> | null): boolean {
    if (!current?.start || !current?.end) return false;
    return (
      this.isSelected(date, current) &&
      !this.isRangeStart(date, current) &&
      !this.isRangeEnd(date, current)
    );
  }

  private weekRange(date: D): DateRange<D> {
    const dow = this.dateAdapter.getDayOfWeek(date);
    const first = this.dateAdapter.getFirstDayOfWeek();
    const daysToSubtract = (dow - first + 7) % 7;
    const start = this.dateAdapter.addDays(date, -daysToSubtract);
    const end = this.dateAdapter.addDays(start, 6);
    return { start, end };
  }
}
