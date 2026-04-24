import type { DateAdapter } from './date-adapter';
import type { CalendarMode, CalendarValue } from './calendar.types';

/**
 * Serializes a `CalendarValue<M, D>` to a JSON-friendly shape (spec §7.5, §33.4).
 * The output mirrors the mode: a scalar ISO string for single, an array for
 * multiple, and an endpoint-preserving object for range. `null` endpoints
 * round-trip unchanged.
 *
 * This is a consumer-facing helper — the component itself does NOT auto-
 * serialize. Apps emitting ISO strings at the form-submit boundary call
 * `serializeCalendarValue(control.value, adapter)` and assign the result to
 * their backend payload.
 *
 * Typing: TypeScript cannot narrow the return type by the mode-generic without
 * the caller passing `M` explicitly; the helper is declared with overloads that
 * cover all three modes plus a broad union fallback.
 */
export function serializeCalendarValue<D>(
  value: CalendarValue<'single', D>,
  adapter: DateAdapter<D>,
): string | null;
export function serializeCalendarValue<D>(
  value: CalendarValue<'multiple', D>,
  adapter: DateAdapter<D>,
): string[];
export function serializeCalendarValue<D>(
  value: CalendarValue<'range', D>,
  adapter: DateAdapter<D>,
): { start: string | null; end: string | null };
export function serializeCalendarValue<M extends CalendarMode, D>(
  value: CalendarValue<M, D>,
  adapter: DateAdapter<D>,
): string | null | string[] | { start: string | null; end: string | null };
export function serializeCalendarValue<D>(
  value: unknown,
  adapter: DateAdapter<D>,
): string | null | string[] | { start: string | null; end: string | null } {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    return value.map((d) => adapter.toIso(adapter.startOfDay(d as D)));
  }
  if (typeof value === 'object' && value !== null && 'start' in value && 'end' in value) {
    const r = value as { start: D | null; end: D | null };
    return {
      start: r.start ? adapter.toIso(adapter.startOfDay(r.start)) : null,
      end: r.end ? adapter.toIso(adapter.startOfDay(r.end)) : null,
    };
  }
  return adapter.toIso(adapter.startOfDay(value as D));
}
