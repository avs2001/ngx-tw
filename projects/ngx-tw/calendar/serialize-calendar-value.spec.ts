import { describe, it, expect, beforeEach } from 'vitest';
import { NativeDateAdapter } from './native-date-adapter';
import { serializeCalendarValue } from './serialize-calendar-value';

describe('serializeCalendarValue', () => {
  let adapter: NativeDateAdapter;

  beforeEach(() => {
    adapter = new NativeDateAdapter();
  });

  it('serializes a single Date value to an ISO YYYY-MM-DD string', () => {
    const date = adapter.create(2026, 4, 26);
    const result = serializeCalendarValue<Date>(date, adapter);
    expect(result).toBe('2026-04-26');
  });

  it('returns null when the single value is null', () => {
    const result = serializeCalendarValue<Date>(null, adapter);
    expect(result).toBeNull();
  });

  it('returns null when the input is undefined', () => {
    // The helper accepts any value-shaped input and treats undefined as null.
    const result = serializeCalendarValue(undefined as unknown as Date | null, adapter);
    expect(result).toBeNull();
  });

  it('serializes a multiple value to an array of ISO strings', () => {
    const dates = [
      adapter.create(2026, 1, 1),
      adapter.create(2026, 6, 15),
      adapter.create(2026, 12, 31),
    ];
    const result = serializeCalendarValue<Date>(dates, adapter);
    expect(result).toEqual(['2026-01-01', '2026-06-15', '2026-12-31']);
  });

  it('serializes an empty multiple value to an empty array', () => {
    const result = serializeCalendarValue<Date>([], adapter);
    expect(result).toEqual([]);
  });

  it('serializes a range value to { start, end } ISO strings', () => {
    const range = {
      start: adapter.create(2026, 4, 1),
      end: adapter.create(2026, 4, 30),
    };
    const result = serializeCalendarValue<Date>(range, adapter);
    expect(result).toEqual({ start: '2026-04-01', end: '2026-04-30' });
  });

  it('preserves null endpoints in a partial range', () => {
    const range = { start: adapter.create(2026, 4, 1), end: null };
    const result = serializeCalendarValue<Date>(range, adapter);
    expect(result).toEqual({ start: '2026-04-01', end: null });
  });

  it('returns null endpoints when both range endpoints are null', () => {
    const range = { start: null, end: null };
    const result = serializeCalendarValue<Date>(range, adapter);
    expect(result).toEqual({ start: null, end: null });
  });

  it('normalizes time-of-day to start-of-day before serializing', () => {
    // A date with a non-zero time should serialize to the same ISO day.
    const noon = new Date(2026, 3, 26, 12, 30, 45);
    const result = serializeCalendarValue<Date>(noon, adapter);
    expect(result).toBe('2026-04-26');
  });
});
