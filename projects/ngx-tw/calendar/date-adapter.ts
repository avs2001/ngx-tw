import { InjectionToken } from '@angular/core';

/** Names of month / day-of-week labels, in three densities. */
export type TwDateNameStyle = 'long' | 'short' | 'narrow';

/**
 * Injection token for a per-instance timezone override (§7.4, §4.3).
 * When set, TZ-aware adapters resolve `today()` and date-range math against
 * the supplied IANA timezone. Floating (naive) adapters ignore the token.
 */
export const TZ_OVERRIDE = new InjectionToken<string>('tw-calendar/TZ_OVERRIDE');

/**
 * Injection token for the default value transformer (§7.4, §7.6). Phase 14 wires
 * the component-level `valueTransformer` input to override this DI default.
 * Shipped as a token shell now so later phases can bind against it without a
 * breaking change.
 */
export const DATE_SERIALIZATION = new InjectionToken<unknown>('tw-calendar/DATE_SERIALIZATION');

/**
 * Format definitions consumed by the calendar header, views, and text-input
 * directive. Each field accepts an adapter-specific format token — the default
 * {@link NativeDateAdapter} interprets them as `Intl.DateTimeFormatOptions`
 * bags wrapped in a {@link NativeDateFormat}.
 *
 * Phases 2+ only require the `input`, `display`, `monthLabel`, and `yearLabel`
 * members; the rest ship as slots now so later phases (5 — CalendarIntl, 9 —
 * multi-month, 11 — text input) can populate them without an API break.
 */
export interface DateFormats {
  /** Format used when parsing user-typed input. */
  readonly input?: unknown;
  /** Format used when rendering a date into a text input's display value. */
  readonly display?: unknown;
  /** Format used for the header's month label (e.g., `"January 2026"`). */
  readonly monthLabel?: unknown;
  /** Format used for the header's year label in month view (e.g., `"2026"`). */
  readonly yearLabel?: unknown;
  /** Format used for the years-view header (e.g., `"2020 – 2039"`). */
  readonly decadeLabel?: unknown;
  /** Format used for a day-cell's accessible label. */
  readonly a11yLabel?: unknown;
  /** Format used for a month-cell's accessible label. */
  readonly monthA11yLabel?: unknown;
  /** Format used for a day-of-week column header's accessible label. */
  readonly dayA11yLabel?: unknown;
  /** Format used for a month name inside the year view's accessible label. */
  readonly yearViewMonthA11yLabel?: unknown;
}

/** DI token carrying the default `DateFormats`. The calendar's `dateFormats` input overrides. */
export const DATE_FORMATS = new InjectionToken<DateFormats>('tw-calendar/DateFormats');

/**
 * Abstract date adapter. Ship a subclass to swap the underlying date library
 * (Luxon, date-fns, Temporal). The calendar consumes only the methods defined
 * here — nothing else.
 *
 * `D` is the native date type understood by the underlying library.
 *
 * Method contract aligned with spec §20.1 / §20.2: `addYears`/`addMonths`/
 * `addDays`, `compare`, 1-based-month `create`, `toIso`/`fromIso`, and
 * optional TZ virtuals.
 */
export abstract class DateAdapter<D> {
  /** Returns today at midnight, local time (or in the adapter's configured TZ). */
  abstract today(): D;

  /**
   * Constructs a date.
   *
   * **`month` is 1-based** — pass `1` for January, `12` for December.
   * Callers migrating from the pre-v1 `createDate(year, zeroBasedMonth, day)`
   * must bump the month argument by one.
   *
   * `day` is 1-based.
   */
  abstract create(year: number, month: number, day: number): D;

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
   *
   * **Not part of the calendar's v1 spec surface** — the calendar does not
   * consume time-of-day. Retained for the companion time-picker component.
   */
  abstract withTime(date: D, hours: number, minutes: number, seconds: number): D;

  /** 0 = Sunday, 1 = Monday, etc. */
  abstract getFirstDayOfWeek(): number;

  /** Days per week. Override only for non-Gregorian adapters (WONT v1). */
  getDaysInWeek(): number {
    return 7;
  }

  /** Returns month names for the current locale. */
  abstract getMonthNames(style: TwDateNameStyle): string[];
  /** Returns day-of-week names for the current locale, starting at Sunday. */
  abstract getDayOfWeekNames(style: TwDateNameStyle): string[];
  /** Returns 1-based day-of-month names (`["1", "2", ..., "31"]`) for locales that localize numerals. Default implementation returns Latin digits. */
  getDateNames(_style: TwDateNameStyle = 'short'): string[] {
    return Array.from({ length: 31 }, (_, i) => String(i + 1));
  }
  /** Returns the localised year label (e.g. `"2026"`). */
  abstract getYearName(date: D): string;

  /** Formats a date for display. Subclasses pick their own format tokens. */
  abstract format(date: D, displayFormat: unknown): string;

  /** Date arithmetic — preserve original in immutable adapters. */
  abstract addYears(date: D, years: number): D;
  abstract addMonths(date: D, months: number): D;
  abstract addDays(date: D, days: number): D;

  /** Time arithmetic. Default implementation derives hours/minutes from day arithmetic via `addDays` — adapters with better precision should override. */
  addHours(date: D, hours: number): D {
    const minutes = hours * 60;
    return this.addMinutes(date, minutes);
  }
  abstract addMinutes(date: D, minutes: number): D;

  /** Returns negative when `first` is earlier, 0 when equal, positive when later. */
  abstract compare(first: D, second: D): number;
  abstract sameDate(first: D | null | undefined, second: D | null | undefined): boolean;

  /** Whether a raw value can be turned into a valid date. */
  abstract isValid(date: D): boolean;
  /** Returns an invalid sentinel of type `D` (NaN-date for native). */
  abstract invalid(): D;

  /** Attempt to parse an ISO or free-form string. Return `null` on failure. */
  abstract parse(value: unknown, parseFormat?: unknown): D | null;

  /** Coerce an incoming value from form writes. */
  abstract deserialize(value: unknown): D | null;

  /** ISO 8601 (`YYYY-MM-DD`) serialization. Phases using serialized forms call this. */
  abstract toIso(date: D): string;

  /** ISO 8601 (`YYYY-MM-DD`) deserialization counterpart to `toIso`. */
  fromIso(iso: string): D | null {
    return this.parse(iso);
  }

  // ---------------------------------------------------------------------------
  // Spec §20.2 extension methods (concrete with sensible defaults; adapters may
  // override for precision or DST correctness).
  // ---------------------------------------------------------------------------

  /**
   * Start-of-day normalization. Default implementation rebuilds the date at
   * `00:00:00.000` local time; DST-skipped hours (e.g., 02:00 on DST start) are
   * resolved to the wall-clock midnight the adapter considers valid.
   *
   * TZ-aware adapters MUST override to normalize in the adapter's TZ.
   */
  abstract startOfDay(date: D): D;

  /** First day of the week containing `date`. `firstDayOfWeek` defaults to `getFirstDayOfWeek()`. */
  startOfWeek(date: D, firstDayOfWeek?: number): D {
    const first = firstDayOfWeek ?? this.getFirstDayOfWeek();
    const dow = this.getDayOfWeek(date);
    const diff = (dow - first + this.getDaysInWeek()) % this.getDaysInWeek();
    return this.addDays(date, -diff);
  }

  /** Last day of the week containing `date`. */
  endOfWeek(date: D, firstDayOfWeek?: number): D {
    return this.addDays(this.startOfWeek(date, firstDayOfWeek), this.getDaysInWeek() - 1);
  }

  /** Equality on year + month. */
  sameMonth(first: D, second: D): boolean {
    return (
      this.getYear(first) === this.getYear(second) &&
      this.getMonth(first) === this.getMonth(second)
    );
  }

  /** Equality on year only. */
  sameYear(first: D, second: D): boolean {
    return this.getYear(first) === this.getYear(second);
  }

  /** Clamp a date into the [min, max] window. */
  clampDate(date: D, min?: D | null, max?: D | null): D {
    if (min && this.compare(date, min) < 0) return min;
    if (max && this.compare(date, max) > 0) return max;
    return date;
  }

  // ---------------------------------------------------------------------------
  // Optional TZ-aware virtuals (§4.2). Floating adapters implement as
  // pass-through; TZ-aware adapters (Luxon, Temporal) override.
  // ---------------------------------------------------------------------------

  /** Returns the adapter's configured timezone, or `null` for floating adapters. */
  getTimezone(): string | null {
    return null;
  }

  /** Returns a copy of `date` reinterpreted in `tz`. Floating adapters pass through. */
  withTimezone(date: D, _tz: string): D {
    return date;
  }

  /** Returns `true` when `date` sits inside a DST-transition. Floating adapters return `false`. */
  isDST(_date: D): boolean {
    return false;
  }

  /** Resolves an ambiguous wall-clock time (DST fall-back) to one of the two candidates. Floating adapters pass through. */
  resolveAmbiguous(date: D, _prefer: 'earlier' | 'later'): D {
    return date;
  }
}

/**
 * Injection token for the calendar's `DateAdapter`. Prefer `provideNativeDateAdapter()`
 * or `provideTwCalendar({ adapter })` over binding this token directly.
 */
export const DATE_ADAPTER = new InjectionToken<DateAdapter<unknown>>('tw-calendar/DateAdapter');
