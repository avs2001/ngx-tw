import { Injectable, type EnvironmentProviders, type Provider, makeEnvironmentProviders } from '@angular/core';
import { DateAdapter, DATE_ADAPTER, type TwDateNameStyle } from './date-adapter';

/** Display-format descriptor used by `NativeDateAdapter.format()`. */
export interface TwNativeDateFormat {
  /** Any option bag accepted by `Intl.DateTimeFormat`. */
  readonly dateTimeFormat?: Intl.DateTimeFormatOptions;
}

/** `Intl`-driven `Date` adapter. Zero runtime dependencies. */
@Injectable()
export class NativeDateAdapter extends DateAdapter<Date> {
  private locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';

  today(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  createDate(year: number, month: number, day: number): Date {
    const d = new Date(year, month, day);
    if (year >= 0 && year < 100) {
      d.setFullYear(year);
    }
    return d;
  }

  clone(date: Date): Date {
    return new Date(date.getTime());
  }

  setLocale(locale: string): void {
    this.locale = locale;
  }

  getLocale(): string {
    return this.locale;
  }

  getYear(date: Date): number {
    return date.getFullYear();
  }

  getMonth(date: Date): number {
    return date.getMonth();
  }

  getDate(date: Date): number {
    return date.getDate();
  }

  getDayOfWeek(date: Date): number {
    return date.getDay();
  }

  getNumDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  getHours(date: Date): number {
    return date.getHours();
  }

  getMinutes(date: Date): number {
    return date.getMinutes();
  }

  getSeconds(date: Date): number {
    return date.getSeconds();
  }

  withTime(date: Date, hours: number, minutes: number, seconds: number): Date {
    const d = new Date(date.getTime());
    d.setHours(hours, minutes, seconds, 0);
    return d;
  }

  getFirstDayOfWeek(): number {
    return 0;
  }

  getMonthNames(style: TwDateNameStyle): string[] {
    const fmt = new Intl.DateTimeFormat(this.locale, { month: style, timeZone: 'UTC' });
    return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(Date.UTC(2017, i, 1))));
  }

  getDayOfWeekNames(style: TwDateNameStyle): string[] {
    const fmt = new Intl.DateTimeFormat(this.locale, { weekday: style, timeZone: 'UTC' });
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(Date.UTC(2017, 0, i + 1))));
  }

  getYearName(date: Date): string {
    return new Intl.DateTimeFormat(this.locale, { year: 'numeric', timeZone: 'UTC' }).format(
      new Date(Date.UTC(date.getFullYear(), 0, 1)),
    );
  }

  format(date: Date, displayFormat: unknown): string {
    if (!this.isValid(date)) return '';
    const fmt = (displayFormat as TwNativeDateFormat | undefined)?.dateTimeFormat ?? {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return new Intl.DateTimeFormat(this.locale, fmt).format(date);
  }

  addCalendarYears(date: Date, years: number): Date {
    return this.addCalendarMonths(date, years * 12);
  }

  addCalendarMonths(date: Date, months: number): Date {
    const d = new Date(date.getFullYear(), date.getMonth() + months, 1);
    const targetDay = Math.min(date.getDate(), new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate());
    return new Date(d.getFullYear(), d.getMonth(), targetDay);
  }

  addCalendarDays(date: Date, days: number): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  }

  compareDate(first: Date, second: Date): number {
    return (
      this.getYear(first) - this.getYear(second) ||
      this.getMonth(first) - this.getMonth(second) ||
      this.getDate(first) - this.getDate(second)
    );
  }

  sameDate(first: Date | null | undefined, second: Date | null | undefined): boolean {
    if (first && second) {
      const f = this.isValid(first);
      const s = this.isValid(second);
      if (f && s) return this.compareDate(first, second) === 0;
      return f === s;
    }
    return first === second;
  }

  isValid(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  invalid(): Date {
    return new Date(NaN);
  }

  parse(value: unknown): Date | null {
    if (typeof value === 'number') return new Date(value);
    if (value instanceof Date) return this.clone(value);
    if (typeof value === 'string') {
      if (!value.trim()) return null;
      const parsed = new Date(value);
      return this.isValid(parsed) ? parsed : null;
    }
    return null;
  }

  deserialize(value: unknown): Date | null {
    if (value == null || value === '') return null;
    if (value instanceof Date) return this.isValid(value) ? this.clone(value) : this.invalid();
    const parsed = this.parse(value);
    if (parsed && this.isValid(parsed)) return parsed;
    return this.invalid();
  }

  toIso8601(date: Date): string {
    return [
      String(date.getFullYear()).padStart(4, '0'),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }
}

/** Provides the default `Date`-based adapter. */
export function provideNativeDateAdapter(): EnvironmentProviders {
  return makeEnvironmentProviders([
    NativeDateAdapter,
    { provide: DATE_ADAPTER, useExisting: NativeDateAdapter },
  ]);
}

/** Provides a custom `DateAdapter` implementation. */
export function provideTwCalendar<D>(config: {
  adapter: new (...args: never[]) => DateAdapter<D>;
  extraProviders?: Provider[];
}): EnvironmentProviders {
  return makeEnvironmentProviders([
    config.adapter as unknown as Provider,
    { provide: DATE_ADAPTER, useExisting: config.adapter },
    ...(config.extraProviders ?? []),
  ]);
}
