import { InjectionToken } from '@angular/core';

/** Names of month / day-of-week labels, in three densities. */
export type TwDateNameStyle = 'long' | 'short' | 'narrow';

/**
 * Abstract date adapter. Ship a subclass to swap the underlying date library
 * (Luxon, date-fns, Temporal). The calendar consumes only the methods defined
 * here — nothing else.
 *
 * `D` is the native date type understood by the underlying library.
 */
export abstract class DateAdapter<D> {
  /** Returns today at midnight, local time. */
  abstract today(): D;

  /** Constructs a date. `month` is zero-based. `day` is 1-based. */
  abstract createDate(year: number, month: number, day: number): D;

  /** Returns a defensive copy. */
  abstract clone(date: D): D;

  /** Locale for label formatting. Subclasses may honour this or ignore. */
  abstract setLocale(locale: string): void;
  abstract getLocale(): string;

  /** Field getters. `month` is zero-based. */
  abstract getYear(date: D): number;
  abstract getMonth(date: D): number;
  abstract getDate(date: D): number;
  /** 0 = Sunday, 6 = Saturday. */
  abstract getDayOfWeek(date: D): number;

  abstract getNumDaysInMonth(date: D): number;

  /** Time getters — hours are 0–23, minutes and seconds are 0–59. */
  abstract getHours(date: D): number;
  abstract getMinutes(date: D): number;
  abstract getSeconds(date: D): number;

  /**
   * Returns a new date with the same year/month/day as `date` but the supplied
   * time-of-day. Adapters must not mutate `date`. `hours` is 0–23.
   */
  abstract withTime(date: D, hours: number, minutes: number, seconds: number): D;

  /** 0 = Sunday, 1 = Monday, etc. */
  abstract getFirstDayOfWeek(): number;

  /** Returns month names for the current locale. */
  abstract getMonthNames(style: TwDateNameStyle): string[];
  /** Returns day-of-week names for the current locale, starting at Sunday. */
  abstract getDayOfWeekNames(style: TwDateNameStyle): string[];
  /** Returns the localised year label (e.g. `"2026"`). */
  abstract getYearName(date: D): string;

  /** Formats a date for display. Subclasses pick their own format tokens. */
  abstract format(date: D, displayFormat: unknown): string;

  /** Date arithmetic — preserve original in immutable adapters. */
  abstract addCalendarYears(date: D, years: number): D;
  abstract addCalendarMonths(date: D, months: number): D;
  abstract addCalendarDays(date: D, days: number): D;

  /** Returns negative when `first` is earlier, 0 when equal, positive when later. */
  abstract compareDate(first: D, second: D): number;
  abstract sameDate(first: D | null | undefined, second: D | null | undefined): boolean;

  /** Whether a raw value can be turned into a valid date. */
  abstract isValid(date: D): boolean;
  /** Returns an invalid sentinel of type `D` (NaN-date for native). */
  abstract invalid(): D;

  /** Attempt to parse an ISO or free-form string. Return `null` on failure. */
  abstract parse(value: unknown, parseFormat?: unknown): D | null;

  /** Coerce an incoming value from form writes. */
  abstract deserialize(value: unknown): D | null;

  /** ISO 8601 serialisation for persistence. */
  abstract toIso8601(date: D): string;

  /** Equality on year + month. */
  sameMonth(first: D, second: D): boolean {
    return this.getYear(first) === this.getYear(second) && this.getMonth(first) === this.getMonth(second);
  }

  /** Equality on year only. */
  sameYear(first: D, second: D): boolean {
    return this.getYear(first) === this.getYear(second);
  }

  /** Clamp a date into the [min, max] window. */
  clampDate(date: D, min?: D | null, max?: D | null): D {
    if (min && this.compareDate(date, min) < 0) return min;
    if (max && this.compareDate(date, max) > 0) return max;
    return date;
  }
}

/**
 * Injection token for the calendar's `DateAdapter`. Prefer `provideNativeDateAdapter()`
 * or `provideTwCalendar({ adapter })` over binding this token directly.
 */
export const DATE_ADAPTER = new InjectionToken<DateAdapter<unknown>>('tw-calendar/DateAdapter');
