/**
 * Pure helpers shared by `tw-time-picker` and `tw-calendar`'s `withTime`
 * controls. No Angular / CDK imports — safe to drop into either package
 * without pulling a circular dependency.
 */

/** Supported time-picker formats. */
export type TimePickerFormat = '12h' | '24h';

/** Meridiem used by the 12h format. */
export type TimePickerMeridiem = 'AM' | 'PM';

/** Zero-pads a non-negative integer to exactly two digits. */
export function padTwo(value: number): string {
  return value < 10 ? `0${value}` : `${value}`;
}

/** Converts a 24h hour (0–23) to its 12h display value (1–12). */
export function to12h(hour24: number): number {
  const modded = hour24 % 12;
  return modded === 0 ? 12 : modded;
}

/** Builds a canonical 0–23 hour from a 12h display hour and meridiem. */
export function from12h(hour12: number, meridiem: TimePickerMeridiem): number {
  if (hour12 === 12) return meridiem === 'AM' ? 0 : 12;
  return meridiem === 'AM' ? hour12 : hour12 + 12;
}

/** Maximum allowed value for a field given the picker format. */
export function fieldMax(
  field: 'hour' | 'minute' | 'second',
  format: TimePickerFormat,
): number {
  if (field === 'hour') return format === '12h' ? 12 : 23;
  return 59;
}

/** Minimum allowed value for a field given the picker format. */
export function fieldMin(
  field: 'hour' | 'minute' | 'second',
  format: TimePickerFormat,
): number {
  return field === 'hour' && format === '12h' ? 1 : 0;
}

/**
 * Buffers a typed digit onto the current field text, matching the standard
 * two-digit time-field behaviour:
 *   - empty + 'x'       → 'x'
 *   - 'x' + 'y'         → 'xy' (if value stays in range)
 *   - 'xy' + 'z'        → 'z' (overflow → reset)
 *   - any combo that would exceed `max` resets to the new digit alone.
 */
export function appendDigit(current: string, digit: string, max: number): string {
  if (!/^\d$/.test(digit)) return current;
  if (current.length >= 2) return digit;
  const candidate = current + digit;
  const numeric = Number(candidate);
  if (numeric > max) return digit;
  return candidate;
}

/**
 * Reports whether `current` + `digit` unambiguously fills the field — either
 * because the buffer reaches two chars or because the first digit alone
 * already excludes a valid second digit (e.g., `'6'` for minutes, `'3'` for 24h
 * hour). Used to auto-advance focus to the next field.
 */
export function isTerminalDigit(current: string, digit: string, max: number): boolean {
  if (current.length === 1) return true;
  if (!/^\d$/.test(digit)) return false;
  const maxFirst = Math.floor(max / 10);
  return Number(digit) > maxFirst;
}

/**
 * Steps a numeric value by `step`, wrapping inside `[min, max]`. Works for
 * arbitrary step sizes; a step of 0 behaves as 1 to protect against mis-configs.
 */
export function stepWithWrap(
  value: number,
  step: number,
  direction: 1 | -1,
  min: number,
  max: number,
): number {
  const safeStep = Math.max(1, Math.abs(step));
  const range = max - min + 1;
  const delta = safeStep * direction;
  return ((((value - min + delta) % range) + range) % range) + min;
}

/** Clamps a number into `[min, max]` without wrapping. */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/** Parses a 1- or 2-digit text field; returns `null` if empty or non-numeric. */
export function parseField(text: string): number | null {
  if (!text) return null;
  if (!/^\d{1,2}$/.test(text)) return null;
  return Number(text);
}

/** Total seconds since midnight for a (h, m, s) tuple — useful for min/max compare. */
export function timeOfDaySeconds(hour: number, minute: number, second: number): number {
  return hour * 3600 + minute * 60 + second;
}
