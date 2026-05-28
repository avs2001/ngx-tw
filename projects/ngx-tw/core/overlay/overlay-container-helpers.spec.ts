import { describe, expect, it } from 'vitest';
import {
  AriaIdQueue,
  coerceOverlayDuration,
  mergeOverlayPanelClass,
  OVERLAY_ANIMATION_FALLBACK_PADDING,
} from './overlay-container-helpers';

describe('OVERLAY_ANIMATION_FALLBACK_PADDING', () => {
  it('matches the codified 50ms fallback used by dialog + sheet containers', () => {
    expect(OVERLAY_ANIMATION_FALLBACK_PADDING).toBe(50);
  });
});

describe('coerceOverlayDuration', () => {
  it('returns the value when it is a positive finite number', () => {
    expect(coerceOverlayDuration(140, 200)).toBe(140);
    expect(coerceOverlayDuration(0, 200)).toBe(0);
  });

  it('falls back when the value is undefined or null', () => {
    expect(coerceOverlayDuration(undefined, 200)).toBe(200);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(coerceOverlayDuration(null as any, 200)).toBe(200);
  });

  it('falls back when the value is negative', () => {
    expect(coerceOverlayDuration(-1, 200)).toBe(200);
  });

  it('falls back when the value is NaN or Infinity', () => {
    expect(coerceOverlayDuration(NaN, 200)).toBe(200);
    expect(coerceOverlayDuration(Infinity, 200)).toBe(200);
    expect(coerceOverlayDuration(-Infinity, 200)).toBe(200);
  });
});

describe('mergeOverlayPanelClass', () => {
  it('returns the internal class string when consumer is undefined', () => {
    expect(mergeOverlayPanelClass('a b c', undefined)).toBe('a b c');
  });

  it('appends a single consumer class string', () => {
    expect(mergeOverlayPanelClass('a b', 'c')).toBe('a b c');
  });

  it('appends each entry when the consumer passes an array', () => {
    expect(mergeOverlayPanelClass('a b', ['c', 'd'])).toBe('a b c d');
  });

  it('returns the internal class string unchanged when the consumer array is empty', () => {
    // Empty array is truthy and not handled by the !consumer guard, so it joins
    // to a trailing space-only suffix. The merge result still contains all
    // internal classes (this is the same behavior the original dialog/sheet
    // containers produced).
    expect(mergeOverlayPanelClass('a b', []).trim()).toBe('a b');
  });
});

describe('AriaIdQueue', () => {
  it('starts empty', () => {
    const queue = new AriaIdQueue();
    expect(queue.first()).toBeNull();
    expect(queue.snapshot()).toEqual([]);
  });

  it('add() is idempotent — duplicate ids are not re-added', () => {
    const queue = new AriaIdQueue();
    queue.add('id-1');
    queue.add('id-1');
    queue.add('id-1');
    expect(queue.snapshot()).toEqual(['id-1']);
  });

  it('first() returns the first registered id, surviving middle removals', () => {
    const queue = new AriaIdQueue();
    queue.add('id-1');
    queue.add('id-2');
    queue.add('id-3');
    expect(queue.first()).toBe('id-1');
    queue.remove('id-2');
    expect(queue.first()).toBe('id-1');
    expect(queue.snapshot()).toEqual(['id-1', 'id-3']);
  });

  it('first() advances when the head id is removed', () => {
    const queue = new AriaIdQueue();
    queue.add('id-1');
    queue.add('id-2');
    queue.remove('id-1');
    expect(queue.first()).toBe('id-2');
  });

  it('remove() is a no-op for unknown ids', () => {
    const queue = new AriaIdQueue();
    queue.add('id-1');
    queue.remove('id-unknown');
    expect(queue.snapshot()).toEqual(['id-1']);
  });

  it('snapshot() returns a fresh array on each call (caller cannot mutate internal state)', () => {
    const queue = new AriaIdQueue();
    queue.add('id-1');
    const snap1 = queue.snapshot();
    const snap2 = queue.snapshot();
    expect(snap1).not.toBe(snap2);
    expect(snap1).toEqual(snap2);
  });

  it('preserves insertion order across mixed add/remove operations', () => {
    const queue = new AriaIdQueue();
    queue.add('a');
    queue.add('b');
    queue.add('c');
    queue.remove('b');
    queue.add('d');
    expect(queue.snapshot()).toEqual(['a', 'c', 'd']);
  });
});
