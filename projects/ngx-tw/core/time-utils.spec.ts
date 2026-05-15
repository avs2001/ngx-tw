import { describe, it, expect } from 'vitest';
import {
  padTwo,
  to12h,
  from12h,
  fieldMax,
  fieldMin,
  appendDigit,
  isTerminalDigit,
  stepWithWrap,
  clamp,
  parseField,
  timeOfDaySeconds,
} from './time-utils';

describe('time-utils', () => {
  describe('padTwo', () => {
    it('pads single digits with a leading zero', () => {
      expect(padTwo(0)).toBe('00');
      expect(padTwo(7)).toBe('07');
    });

    it('leaves two-digit values unchanged', () => {
      expect(padTwo(10)).toBe('10');
      expect(padTwo(23)).toBe('23');
      expect(padTwo(59)).toBe('59');
    });
  });

  describe('to12h / from12h', () => {
    it('round-trips every 24h hour through the 12h representation', () => {
      for (let h = 0; h < 24; h++) {
        const meridiem = h < 12 ? 'AM' : 'PM';
        const display = to12h(h);
        expect(from12h(display, meridiem)).toBe(h);
      }
    });

    it('maps midnight and noon to 12 in the 12h display', () => {
      expect(to12h(0)).toBe(12);
      expect(to12h(12)).toBe(12);
    });

    it('from12h(12, AM) is 0 and from12h(12, PM) is 12', () => {
      expect(from12h(12, 'AM')).toBe(0);
      expect(from12h(12, 'PM')).toBe(12);
    });
  });

  describe('fieldMax / fieldMin', () => {
    it('hour max depends on format', () => {
      expect(fieldMax('hour', '12h')).toBe(12);
      expect(fieldMax('hour', '24h')).toBe(23);
    });

    it('minute and second cap at 59 regardless of format', () => {
      expect(fieldMax('minute', '12h')).toBe(59);
      expect(fieldMax('minute', '24h')).toBe(59);
      expect(fieldMax('second', '12h')).toBe(59);
      expect(fieldMax('second', '24h')).toBe(59);
    });

    it('hour min is 1 in 12h, 0 in 24h', () => {
      expect(fieldMin('hour', '12h')).toBe(1);
      expect(fieldMin('hour', '24h')).toBe(0);
    });

    it('minute and second min is always 0', () => {
      expect(fieldMin('minute', '12h')).toBe(0);
      expect(fieldMin('second', '24h')).toBe(0);
    });
  });

  describe('appendDigit', () => {
    it('starts a new buffer from empty', () => {
      expect(appendDigit('', '4', 59)).toBe('4');
    });

    it('appends a second digit when within range', () => {
      expect(appendDigit('1', '2', 23)).toBe('12');
    });

    it('resets to the new digit when a third digit is typed', () => {
      expect(appendDigit('12', '3', 23)).toBe('3');
    });

    it('resets when the combined value would exceed max', () => {
      expect(appendDigit('6', '5', 59)).toBe('5');
      expect(appendDigit('2', '5', 23)).toBe('5');
    });

    it('ignores non-digit input', () => {
      expect(appendDigit('1', 'a', 59)).toBe('1');
      expect(appendDigit('', '-', 59)).toBe('');
    });
  });

  describe('isTerminalDigit', () => {
    it('is true once the buffer already has one digit', () => {
      expect(isTerminalDigit('1', '2', 23)).toBe(true);
    });

    it('is true when a first digit alone excludes any valid second digit', () => {
      expect(isTerminalDigit('', '6', 59)).toBe(true);
      expect(isTerminalDigit('', '3', 23)).toBe(true);
    });

    it('is false when a second digit is still possible', () => {
      expect(isTerminalDigit('', '1', 23)).toBe(false);
      expect(isTerminalDigit('', '5', 59)).toBe(false);
    });

    it('is false for non-digit input on an empty buffer', () => {
      expect(isTerminalDigit('', 'x', 59)).toBe(false);
    });
  });

  describe('stepWithWrap', () => {
    it('steps forward within range', () => {
      expect(stepWithWrap(5, 1, 1, 0, 9)).toBe(6);
    });

    it('steps backward within range', () => {
      expect(stepWithWrap(5, 1, -1, 0, 9)).toBe(4);
    });

    it('wraps past the max', () => {
      expect(stepWithWrap(9, 1, 1, 0, 9)).toBe(0);
    });

    it('wraps past the min', () => {
      expect(stepWithWrap(0, 1, -1, 0, 9)).toBe(9);
    });

    it('respects arbitrary step sizes', () => {
      expect(stepWithWrap(55, 5, 1, 0, 59)).toBe(0);
      expect(stepWithWrap(0, 5, -1, 0, 59)).toBe(55);
    });

    it('treats step <= 0 as 1 (using the absolute value)', () => {
      expect(stepWithWrap(5, 0, 1, 0, 9)).toBe(6); // 0 collapses to 1
      expect(stepWithWrap(5, -3, 1, 0, 9)).toBe(8); // abs(-3) = 3
    });
  });

  describe('clamp', () => {
    it('returns min when value is below', () => {
      expect(clamp(-5, 0, 9)).toBe(0);
    });

    it('returns max when value is above', () => {
      expect(clamp(12, 0, 9)).toBe(9);
    });

    it('returns the value when inside the range', () => {
      expect(clamp(4, 0, 9)).toBe(4);
    });
  });

  describe('parseField', () => {
    it('returns null for empty input', () => {
      expect(parseField('')).toBeNull();
    });

    it('returns null for non-numeric input', () => {
      expect(parseField('ab')).toBeNull();
      expect(parseField('1a')).toBeNull();
    });

    it('returns null for more than 2 digits', () => {
      expect(parseField('123')).toBeNull();
    });

    it('parses 1- and 2-digit values', () => {
      expect(parseField('3')).toBe(3);
      expect(parseField('42')).toBe(42);
      expect(parseField('00')).toBe(0);
    });
  });

  describe('timeOfDaySeconds', () => {
    it('computes seconds since midnight', () => {
      expect(timeOfDaySeconds(0, 0, 0)).toBe(0);
      expect(timeOfDaySeconds(1, 0, 0)).toBe(3600);
      expect(timeOfDaySeconds(0, 1, 0)).toBe(60);
      expect(timeOfDaySeconds(0, 0, 1)).toBe(1);
      expect(timeOfDaySeconds(23, 59, 59)).toBe(86399);
    });
  });
});
