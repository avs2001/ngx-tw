import type { DateRange } from './calendar.types';

/**
 * Convenience class that satisfies the `DateRange<D>` interface and carries
 * `complete` / `empty` getters. Interchangeable with a plain
 * `{ start, end }` object anywhere a `DateRange<D>` is expected.
 */
export class TwDateRange<D> implements DateRange<D> {
  constructor(
    public readonly start: D | null,
    public readonly end: D | null,
  ) {}

  /** True when both endpoints are set. */
  get complete(): boolean {
    return this.start !== null && this.end !== null;
  }

  /** True when neither endpoint is set. */
  get empty(): boolean {
    return this.start === null && this.end === null;
  }
}

/** Shape accepted when writing a range value — either a `TwDateRange` or a plain object. */
export type TwDateRangeInput<D> =
  | TwDateRange<D>
  | { readonly start: D | null; readonly end: D | null }
  | null;

/** @internal Normalises any range-shaped value into a `TwDateRange` instance. */
export function toTwDateRange<D>(value: TwDateRangeInput<D>): TwDateRange<D> | null {
  if (value === null || value === undefined) return null;
  if (value instanceof TwDateRange) return value;
  return new TwDateRange<D>(value.start ?? null, value.end ?? null);
}
