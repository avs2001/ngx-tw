import { type AbstractControl, type ValidatorFn, Validators } from '@angular/forms';
import type {
  CalendarConstraints,
  CalendarMode,
  CalendarValidationErrors,
  CalendarValue,
} from './calendar.types';
import type { DateAdapter } from './date-adapter';
import { rangeCrossesDisabled, rangeLengthDays, resolveDateDisabled } from './calendar.utils';

/**
 * Shape of the read-only context the calendar validator needs from the
 * hosting component. Kept as a structural type so tests and custom consumers
 * can synthesize one without subclassing `CalendarComponent`.
 */
export interface CalendarValidatorContext<M extends CalendarMode = CalendarMode, D = unknown> {
  /** Current mode — used to decide which shape counts as "empty". */
  readonly mode: M;
  /** The raw form value whose last write was rejected as wrong-shape (§7.2). `null` when no rejected write is outstanding. */
  readonly lastInvalidFormValue: unknown;
  /** Aggregated constraint inputs (§10.1). Optional — when omitted, only `calendarRequired` / `calendarInvalidValue` codes are produced. */
  readonly constraints?: CalendarConstraints<D>;
  /** Adapter used to evaluate constraint codes. Required when `constraints` is set. */
  readonly adapter?: DateAdapter<D>;
  /** Minimum range length, days. `mode: 'range'` only. */
  readonly minRangeLength?: number | null;
  /** Maximum range length, days. `mode: 'range'` only. */
  readonly maxRangeLength?: number | null;
  /** Maximum number of selections. `mode: 'multiple'` only. */
  readonly maxSelections?: number | null;
}

/** `true` when `value` matches the mode-specific empty state (§7.1, §6.4). */
export function isCalendarValueEmpty<M extends CalendarMode, D>(
  mode: M,
  value: CalendarValue<M, D> | null | undefined,
): boolean {
  if (mode === 'single') return value == null;
  if (mode === 'multiple') return !Array.isArray(value) || value.length === 0;
  // range
  if (value == null) return true;
  const range = value as unknown as { start: unknown; end: unknown };
  return range.start == null && range.end == null;
}

/**
 * Built-in synchronous validator (§6.1, §10.2). Emits the full v1 error code set:
 *
 * Phase 3 codes:
 * - `calendarRequired` when the hosting control carries `Validators.required`
 *   and the calendar value is mode-specific empty.
 * - `calendarInvalidValue` when the most recent `writeValue` was rejected as
 *   wrong-shape (§7.2) — the raw value is held on the component's
 *   `lastInvalidFormValue` until a valid write clears it.
 *
 * Phase 4 codes (active when `ctx.constraints` + `ctx.adapter` are supplied):
 * - `calendarMinDate` / `calendarMaxDate` — value (or any range endpoint /
 *   array entry) falls outside `[minDate, maxDate]`.
 * - `calendarDisabledDate` — value matches `dateFilter` / `disabledDates` /
 *   `disabledDaysOfWeek` (constraint resolver).
 * - `calendarRangeTooShort` / `calendarRangeTooLong` — `mode: 'range'` length
 *   violates `minRangeLength` / `maxRangeLength`.
 * - `calendarMaxSelections` — `mode: 'multiple'` array exceeds `maxSelections`.
 * - `calendarInvalidRange` — committed range has `start > end` (the orchestrator
 *   normalizes via auto-swap; this only triggers on programmatic writeValue).
 *
 * Each code's payload mirrors §10.2 — `{ min, actual }`, `{ max, actual }`,
 * `{ length, min }`, etc.
 */
export function calendarValidator<M extends CalendarMode, D>(
  ctx: CalendarValidatorContext<M, D>,
): ValidatorFn {
  return (control: AbstractControl): CalendarValidationErrors | null => {
    const errors: CalendarValidationErrors = {};

    if (ctx.lastInvalidFormValue !== null && ctx.lastInvalidFormValue !== undefined) {
      errors.calendarInvalidValue = {
        expected: ctx.mode as 'single' | 'multiple' | 'range',
        actual: ctx.lastInvalidFormValue,
        reason: 'shape',
      };
    }

    if (control.hasValidator(Validators.required)) {
      const value = control.value as CalendarValue<M, D> | null | undefined;
      if (isCalendarValueEmpty(ctx.mode, value)) {
        errors.calendarRequired = true;
      }
    }

    // Phase 4 — constraint codes (only when the host wires constraints + adapter).
    if (ctx.constraints && ctx.adapter) {
      const value = control.value as CalendarValue<M, D> | null | undefined;
      if (
        value !== null &&
        value !== undefined &&
        !isCalendarValueEmpty<M, D>(ctx.mode, value)
      ) {
        applyConstraintCodes<M, D>(ctx, value, errors);
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };
}

/**
 * Mode-aware constraint validator. Mutates `errors` in place — the caller
 * decides whether the resulting object is `null` (no codes) or non-null.
 *
 * @internal
 */
function applyConstraintCodes<M extends CalendarMode, D>(
  ctx: CalendarValidatorContext<M, D>,
  value: CalendarValue<M, D>,
  errors: CalendarValidationErrors,
): void {
  const adapter = ctx.adapter!;
  const constraints = ctx.constraints!;
  const min = constraints.minDate;
  const max = constraints.maxDate;

  const checkSingle = (date: D): void => {
    if (min && adapter.compare(date, min) < 0) {
      errors.calendarMinDate = { min, actual: date };
    }
    if (max && adapter.compare(date, max) > 0) {
      errors.calendarMaxDate = { max, actual: date };
    }
    if (resolveDateDisabled(date, constraints, adapter)) {
      // Suppress when min/max already flagged the same date — `calendarDisabledDate`
      // is the catch-all for the non-range constraint sources.
      if (!errors.calendarMinDate && !errors.calendarMaxDate) {
        errors.calendarDisabledDate = { actual: date };
      }
    }
  };

  if (ctx.mode === 'single') {
    checkSingle(value as unknown as D);
    return;
  }

  if (ctx.mode === 'multiple') {
    const arr = value as unknown as D[];
    for (const d of arr) {
      checkSingle(d);
      if (errors.calendarMinDate || errors.calendarMaxDate || errors.calendarDisabledDate) break;
    }
    const limit = ctx.maxSelections;
    if (limit !== null && limit !== undefined && arr.length > limit) {
      errors.calendarMaxSelections = { limit, actual: arr.length };
    }
    return;
  }

  // range
  const range = value as unknown as { start: D | null; end: D | null };
  if (range.start) checkSingle(range.start);
  if (range.end) checkSingle(range.end);
  if (range.start && range.end) {
    if (adapter.compare(range.start, range.end) > 0) {
      errors.calendarInvalidRange = { start: range.start, end: range.end };
      return;
    }
    if (rangeCrossesDisabled(range.start, range.end, constraints, adapter, false)) {
      errors.calendarDisabledDate = { actual: range };
    }
    const length = rangeLengthDays(range.start, range.end, adapter);
    const minLen = ctx.minRangeLength;
    const maxLen = ctx.maxRangeLength;
    if (minLen !== null && minLen !== undefined && length < minLen) {
      errors.calendarRangeTooShort = { length, min: minLen };
    }
    if (maxLen !== null && maxLen !== undefined && length > maxLen) {
      errors.calendarRangeTooLong = { length, max: maxLen };
    }
  }
}

/**
 * Standalone required-validator helper for consumers who want to compose
 * calendar-required on a control that is **not** bound directly to a
 * `CalendarComponent`. The rule is identical: mode-specific empty ⇒ error.
 */
export function calendarRequiredValidator<M extends CalendarMode, D>(mode: M): ValidatorFn {
  return (control: AbstractControl): CalendarValidationErrors | null => {
    const value = control.value as CalendarValue<M, D> | null | undefined;
    return isCalendarValueEmpty(mode, value) ? { calendarRequired: true } : null;
  };
}
