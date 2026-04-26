import { type AbstractControl, type ValidatorFn, Validators } from '@angular/forms';
import type { CalendarMode, CalendarValidationErrors, CalendarValue } from './calendar.types';

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
 * Built-in synchronous validator (§6.1, §10.2). Emits the Phase 3 codes:
 * - `calendarRequired` when the hosting control carries `Validators.required`
 *   and the calendar value is mode-specific empty.
 * - `calendarInvalidValue` when the most recent `writeValue` was rejected as
 *   wrong-shape (§7.2) — the raw value is held on the component's
 *   `lastInvalidFormValue` until a valid write clears it.
 *
 * Constraint error codes (`calendarMinDate`, `calendarMaxDate`,
 * `calendarDisabledDate`, `calendarRangeTooShort`, `calendarRangeTooLong`,
 * `calendarMaxSelections`, `calendarInvalidRange`) are stubbed and wired by
 * Phase 4.
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

    return Object.keys(errors).length > 0 ? errors : null;
  };
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
