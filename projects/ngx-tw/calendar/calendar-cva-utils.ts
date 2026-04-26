/** Pure helpers for CalendarComponent's ControlValueAccessor implementation. Extracted to keep `calendar.ts` focused on the class wiring; behavior is unchanged. */

import type { CalendarMode, CalendarSelectionState, CalendarValue } from './calendar.types';

/**
 * `true` when the incoming value's shape matches the shape required by `mode`.
 * `null` / `undefined` is handled upstream by callers and is NOT considered here.
 *
 * - `single`: anything that is not an array and not a `{ start, end }` object.
 * - `multiple`: any array.
 * - `range`: a non-array object with both `start` and `end` keys.
 */
export function matchesModeShape(mode: CalendarMode, value: unknown): boolean {
  if (mode === 'single') {
    if (Array.isArray(value)) return false;
    if (typeof value === 'object' && value !== null) {
      const r = value as Record<string, unknown>;
      if ('start' in r && 'end' in r) return false;
    }
    return true;
  }
  if (mode === 'multiple') {
    return Array.isArray(value);
  }
  // range
  if (typeof value !== 'object' || value === null) return false;
  if (Array.isArray(value)) return false;
  const range = value as Record<string, unknown>;
  return 'start' in range && 'end' in range;
}

/**
 * `true` when the incoming value is a partial range (`{ start: D, end: null }`).
 * Per §7.2, only EMPTY or COMPLETE shapes are valid form values for `mode: 'range'`,
 * so partial ranges arriving via `writeValue` are rejected.
 *
 * Caller must already have confirmed `mode === 'range'` and `matchesModeShape` passed.
 */
export function isPartialRangeValue(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as { start: unknown; end: unknown };
  return r.start != null && r.end == null;
}

/** `true` when `value` is the mode-agnostic empty value (null, `[]`, or `{ start: null, end: null }`). */
export function isEmptyCalendarValue(value: unknown): boolean {
  if (value == null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object' && 'start' in (value as object) && 'end' in (value as object)) {
    const r = value as { start: unknown; end: unknown };
    return r.start == null && r.end == null;
  }
  return false;
}

/** Derives selection state from a value shape. Used by `writeValue` to reconcile post-write state. */
export function deriveSelectionStateFromValue<M extends CalendarMode, D>(
  value: CalendarValue<M, D>,
): CalendarSelectionState {
  return isEmptyCalendarValue(value) ? 'EMPTY' : 'COMPLETE';
}
