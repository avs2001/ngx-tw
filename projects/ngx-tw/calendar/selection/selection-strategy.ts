import { InjectionToken } from '@angular/core';
import type { DateRange } from '../calendar.types';

/** Outcome returned by a selection strategy's `select` call. */
export interface SelectionResult<D, S> {
  /** The new selection value after applying the click. */
  readonly selection: S;
  /** Whether the selection is committed. */
  readonly isComplete: boolean;
  /** Optional range used by the preview layer while the selection is in progress. */
  readonly preview?: DateRange<D> | null;
}

/**
 * Pluggable selection behaviour. Provide via `TW_CALENDAR_SELECTION_STRATEGY` to
 * customise how clicks mutate the calendar's `selected` value.
 *
 * `D` is the date type understood by the active `DateAdapter`.
 * `S` is the shape of the `selected` value — `D | null` for single,
 * `DateRange<D> | null` for range / week, `readonly D[]` for multi.
 */
export abstract class CalendarSelectionStrategy<D, S = unknown> {
  /** Produces the new selection after a click on `date`. */
  abstract select(date: D, current: S): SelectionResult<D, S>;

  /** Returns the range to highlight while the pointer hovers `active`. */
  abstract createPreview(active: D | null, current: S): DateRange<D> | null;

  /** Whether `date` should render as selected. */
  abstract isSelected(date: D, current: S): boolean;

  /** Whether `date` is the start of a committed range. */
  abstract isRangeStart(date: D, current: S): boolean;

  /** Whether `date` is the end of a committed range. */
  abstract isRangeEnd(date: D, current: S): boolean;

  /** Whether `date` sits strictly between the endpoints of a committed range. */
  abstract isRangeMiddle(date: D, current: S): boolean;
}

/** Injection token for the active selection strategy. */
export const TW_CALENDAR_SELECTION_STRATEGY = new InjectionToken<
  CalendarSelectionStrategy<unknown, unknown>
>('tw-calendar/SelectionStrategy');

/**
 * @deprecated Renamed to {@link TW_CALENDAR_SELECTION_STRATEGY} for consistency
 * with every other ngx-tw injection token. This is the *same token instance*,
 * not a copy — providing under either name and injecting under the other
 * resolves — so the rename is safe to adopt incrementally. Removed in the next
 * major.
 */
export const CALENDAR_SELECTION_STRATEGY = TW_CALENDAR_SELECTION_STRATEGY;
