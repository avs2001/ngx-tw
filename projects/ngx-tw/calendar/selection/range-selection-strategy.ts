import { inject, Injectable } from '@angular/core';
import type { DateRange } from '../calendar.types';
import { type DateAdapter, TW_DATE_ADAPTER } from '../date-adapter';
import { isDateInRange } from '../calendar.utils';
import { CalendarSelectionStrategy, type SelectionResult } from './selection-strategy';

/**
 * Date-range selection.
 *
 * - First click sets the start (selection incomplete).
 * - Second click sets the end (selection complete).
 * - If the second date is before the first, endpoints are swapped.
 * - Hovering after the first click produces a preview range.
 *
 * `selected` has shape `DateRange<D> | null`.
 */
@Injectable()
export class RangeSelectionStrategy<D> extends CalendarSelectionStrategy<D, DateRange<D> | null> {
  private readonly dateAdapter: DateAdapter<D> = inject(TW_DATE_ADAPTER) as DateAdapter<D>;

  select(date: D, current: DateRange<D> | null): SelectionResult<D, DateRange<D> | null> {
    // No start yet, or the previous range is already complete — start over.
    if (!current || (current.start && current.end)) {
      return { selection: { start: date, end: null }, isComplete: false };
    }
    const start = current.start!;
    let rangeStart: D;
    let rangeEnd: D;
    if (this.dateAdapter.compare(date, start) < 0) {
      rangeStart = date;
      rangeEnd = start;
    } else {
      rangeStart = start;
      rangeEnd = date;
    }
    return { selection: { start: rangeStart, end: rangeEnd }, isComplete: true };
  }

  createPreview(active: D | null, current: DateRange<D> | null): DateRange<D> | null {
    if (!active || !current?.start || current.end) return null;
    const s = current.start;
    if (this.dateAdapter.compare(active, s) < 0) {
      return { start: active, end: s };
    }
    return { start: s, end: active };
  }

  isSelected(date: D, current: DateRange<D> | null): boolean {
    if (!current) return false;
    if (current.start && this.dateAdapter.sameDate(date, current.start)) return true;
    if (current.end && this.dateAdapter.sameDate(date, current.end)) return true;
    return false;
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
      isDateInRange(date, current.start, current.end, this.dateAdapter) &&
      !this.isRangeStart(date, current) &&
      !this.isRangeEnd(date, current)
    );
  }
}
