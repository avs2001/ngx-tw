import { Injectable, type EnvironmentProviders, type Provider, makeEnvironmentProviders, inject } from '@angular/core';
import { DateTime, Info, Settings } from 'luxon';
import { DateAdapter, DATE_ADAPTER, TZ_OVERRIDE, type TwDateNameStyle } from 'ngx-tw/calendar';

/** Display-format descriptor used by `LuxonDateAdapter.format()`. */
export interface TwLuxonDateFormat {
  /** Luxon token string (e.g. `'yyyy LLL dd'`). Takes precedence over `dateTimeFormat`. */
  readonly luxonFormat?: string;
  /** `Intl.DateTimeFormatOptions` bag for localized display. Used when `luxonFormat` is absent. */
  readonly dateTimeFormat?: Intl.DateTimeFormatOptions;
}

/** `luxon`-driven `DateTime` adapter with full IANA timezone support (§20.2, §20.4). */
@Injectable()
export class LuxonDateAdapter extends DateAdapter<DateTime> {
  private _locale: string;
  /** IANA timezone injected via `TZ_OVERRIDE`, or `null` for local-time mode. */
  private readonly _timezone: string | null;

  constructor() {
    super();
    this._timezone = inject(TZ_OVERRIDE, { optional: true });
    this._locale = (typeof navigator !== 'undefined' ? navigator.language : null) ?? 'en-US';
  }

  // ---------------------------------------------------------------------------
  // Locale
  // ---------------------------------------------------------------------------

  setLocale(locale: string): void {
    this._locale = locale;
    Settings.defaultLocale = locale;
  }

  getLocale(): string {
    return this._locale;
  }

  // ---------------------------------------------------------------------------
  // Construction & cloning
  // ---------------------------------------------------------------------------

  today(): DateTime {
    const dt = this._timezone
      ? DateTime.now().setZone(this._timezone)
      : DateTime.now();
    return dt.startOf('day');
  }

  /**
   * Constructs a `DateTime`. **`month` is 1-based** — `create(2026, 1, 1)` yields
   * January 1, 2026.
   */
  create(year: number, month: number, day: number): DateTime {
    return DateTime.fromObject(
      { year, month, day },
      { zone: this._timezone ?? 'local' },
    );
  }

  clone(date: DateTime): DateTime {
    return date.valueOf() === date.valueOf() ? DateTime.fromMillis(date.valueOf(), { zone: date.zone }) : date;
  }

  // ---------------------------------------------------------------------------
  // Field getters
  // ---------------------------------------------------------------------------

  getYear(date: DateTime): number {
    return date.year;
  }

  /** Returns 0-based month index (0 = January, 11 = December). */
  getMonth(date: DateTime): number {
    return date.month - 1;
  }

  getDate(date: DateTime): number {
    return date.day;
  }

  /** Returns 0 = Sunday … 6 = Saturday (Luxon weekday 7 = Sunday → `weekday % 7`). */
  getDayOfWeek(date: DateTime): number {
    return date.weekday % 7;
  }

  getNumDaysInMonth(date: DateTime): number {
    return date.daysInMonth!;
  }

  getHours(date: DateTime): number {
    return date.hour;
  }

  getMinutes(date: DateTime): number {
    return date.minute;
  }

  getSeconds(date: DateTime): number {
    return date.second;
  }

  withTime(date: DateTime, hours: number, minutes: number, seconds: number): DateTime {
    return date.set({ hour: hours, minute: minutes, second: seconds, millisecond: 0 });
  }

  // ---------------------------------------------------------------------------
  // Locale-aware naming
  // ---------------------------------------------------------------------------

  /**
   * Returns 0-based first-day-of-week using `Info.getStartOfWeek` (Luxon ≥ 3.3).
   * ISO weekday 7 (Sunday) is remapped to 0; Monday–Saturday remain 1–6.
   */
  getFirstDayOfWeek(): number {
    const isoStart = Info.getStartOfWeek({ locale: this._locale });
    return isoStart === 7 ? 0 : isoStart;
  }

  getMonthNames(style: TwDateNameStyle): string[] {
    return Info.months(style, { locale: this._locale });
  }

  /** Returns day names starting at Sunday (0) through Saturday (6). */
  getDayOfWeekNames(style: TwDateNameStyle): string[] {
    // Luxon Info.weekdays returns [Mon, Tue, …, Sun] (index 0 = Monday, 6 = Sunday).
    // Rotate to [Sun, Mon, …, Sat] so index 0 matches getDayOfWeek() → 0 = Sunday.
    const names = Info.weekdays(style, { locale: this._locale });
    return [names[6]!, ...names.slice(0, 6)];
  }

  getYearName(date: DateTime): string {
    return date.setLocale(this._locale).toLocaleString({ year: 'numeric' });
  }

  // ---------------------------------------------------------------------------
  // Formatting
  // ---------------------------------------------------------------------------

  format(date: DateTime, displayFormat: unknown): string {
    if (!this.isValid(date)) return '';
    const fmt = displayFormat as TwLuxonDateFormat | string | undefined;
    const local = date.setLocale(this._locale);
    if (typeof fmt === 'string') return local.toFormat(fmt);
    if (fmt?.luxonFormat) return local.toFormat(fmt.luxonFormat);
    if (fmt?.dateTimeFormat) return local.toLocaleString(fmt.dateTimeFormat);
    return local.toLocaleString(DateTime.DATE_MED);
  }

  // ---------------------------------------------------------------------------
  // Date arithmetic
  // ---------------------------------------------------------------------------

  addYears(date: DateTime, years: number): DateTime {
    return date.plus({ years });
  }

  addMonths(date: DateTime, months: number): DateTime {
    return date.plus({ months });
  }

  addDays(date: DateTime, days: number): DateTime {
    return date.plus({ days });
  }

  override addHours(date: DateTime, hours: number): DateTime {
    return date.plus({ hours });
  }

  addMinutes(date: DateTime, minutes: number): DateTime {
    return date.plus({ minutes });
  }

  // ---------------------------------------------------------------------------
  // Comparison & equality
  // ---------------------------------------------------------------------------

  compare(first: DateTime, second: DateTime): number {
    return (
      first.year - second.year ||
      first.month - second.month ||
      first.day - second.day
    );
  }

  sameDate(first: DateTime | null | undefined, second: DateTime | null | undefined): boolean {
    if (first && second) {
      const f = this.isValid(first);
      const s = this.isValid(second);
      if (f && s) return this.compare(first, second) === 0;
      return f === s;
    }
    return first === second;
  }

  // ---------------------------------------------------------------------------
  // Validity
  // ---------------------------------------------------------------------------

  isValid(date: DateTime): boolean {
    return date instanceof DateTime && date.isValid;
  }

  invalid(): DateTime {
    return DateTime.invalid('explicit invalid');
  }

  // ---------------------------------------------------------------------------
  // Parsing & serialization
  // ---------------------------------------------------------------------------

  parse(value: unknown, parseFormat?: unknown): DateTime | null {
    if (value instanceof DateTime) return value.isValid ? value : null;
    if (typeof value === 'number') {
      const dt = DateTime.fromMillis(value, { zone: this._timezone ?? 'local' });
      return dt.isValid ? dt : null;
    }
    if (typeof value === 'string') {
      if (!value.trim()) return null;
      const zone = this._timezone ?? 'local';
      if (typeof parseFormat === 'string') {
        const dt = DateTime.fromFormat(value, parseFormat, { zone, locale: this._locale });
        if (dt.isValid) return dt;
      }
      const iso = DateTime.fromISO(value, { zone });
      return iso.isValid ? iso : null;
    }
    return null;
  }

  deserialize(value: unknown): DateTime | null {
    if (value == null || value === '') return null;
    if (value instanceof DateTime) return value.isValid ? value : this.invalid();
    const parsed = this.parse(value);
    return parsed && this.isValid(parsed) ? parsed : this.invalid();
  }

  toIso(date: DateTime): string {
    return date.toISODate() ?? '';
  }

  override fromIso(iso: string): DateTime | null {
    const dt = DateTime.fromISO(iso, { zone: this._timezone ?? 'local' });
    return dt.isValid ? dt : null;
  }

  // ---------------------------------------------------------------------------
  // Normalization
  // ---------------------------------------------------------------------------

  /**
   * Normalizes `date` to midnight in the adapter's timezone (or local time).
   * On DST spring-forward days where midnight is a skipped hour, Luxon advances
   * to the first valid instant (the transition gap is typically at 2 AM, not midnight).
   */
  startOfDay(date: DateTime): DateTime {
    return date.startOf('day');
  }

  // ---------------------------------------------------------------------------
  // TZ-aware overrides (§4.2, §20.2)
  // ---------------------------------------------------------------------------

  /** Returns the adapter's configured IANA timezone, or `null` when in local-time mode. */
  override getTimezone(): string | null {
    return this._timezone;
  }

  /** Returns `date` reinterpreted in `tz`, keeping the same UTC instant. */
  override withTimezone(date: DateTime, tz: string): DateTime {
    return date.setZone(tz);
  }

  /** Returns `true` when `date` falls inside a DST offset. */
  override isDST(date: DateTime): boolean {
    return date.isInDST;
  }

  /**
   * Resolves an ambiguous wall-clock time during a DST fall-back transition.
   *
   * Luxon 3 always picks the earlier UTC instant (still on DST) when constructing
   * a local time that maps to two UTC instants. This method detects the ambiguity
   * by checking whether the UTC instant 1 hour later also has the same local
   * clock time, and selects the correct candidate accordingly.
   */
  override resolveAmbiguous(date: DateTime, prefer: 'earlier' | 'later'): DateTime {
    const ms = date.valueOf();
    const zone = date.zone;
    const dtPlus1h = DateTime.fromMillis(ms + 3_600_000, { zone });
    if (dtPlus1h.hour === date.hour && dtPlus1h.minute === date.minute) {
      // `date` is the earlier occurrence; `dtPlus1h` is the later occurrence.
      return prefer === 'earlier' ? date : dtPlus1h;
    }
    const dtMinus1h = DateTime.fromMillis(ms - 3_600_000, { zone });
    if (dtMinus1h.hour === date.hour && dtMinus1h.minute === date.minute) {
      // `dtMinus1h` is the earlier occurrence; `date` is the later occurrence.
      return prefer === 'earlier' ? dtMinus1h : date;
    }
    return date;
  }
}

/** Provides the Luxon-backed date adapter. Requires `luxon ^3` to be installed. */
export function provideLuxonDateAdapter(extraProviders?: Provider[]): EnvironmentProviders {
  return makeEnvironmentProviders([
    LuxonDateAdapter,
    { provide: DATE_ADAPTER, useExisting: LuxonDateAdapter },
    ...(extraProviders ?? []),
  ]);
}
