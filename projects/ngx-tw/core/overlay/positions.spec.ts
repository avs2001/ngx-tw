import { describe, expect, it } from 'vitest';

import { buildSelectLikePositions } from './positions';

describe('buildSelectLikePositions', () => {
  it('returns four fallback positions', () => {
    const positions = buildSelectLikePositions();
    expect(positions).toHaveLength(4);
  });

  it('orders positions below-start, below-end, above-start, above-end', () => {
    const [belowStart, belowEnd, aboveStart, aboveEnd] = buildSelectLikePositions();

    expect(belowStart).toMatchObject({
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
    });
    expect(belowEnd).toMatchObject({
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
    });
    expect(aboveStart).toMatchObject({
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
    });
    expect(aboveEnd).toMatchObject({
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
    });
  });

  it('defaults the offset to zero when omitted', () => {
    const positions = buildSelectLikePositions();
    expect(positions[0].offsetY).toBe(0);
    expect(positions[2].offsetY).toBe(-0);
  });

  it('applies +offset below, -offset above', () => {
    const positions = buildSelectLikePositions(8);
    expect(positions[0].offsetY).toBe(8);
    expect(positions[1].offsetY).toBe(8);
    expect(positions[2].offsetY).toBe(-8);
    expect(positions[3].offsetY).toBe(-8);
  });

  it('returns a fresh array each call (no shared mutable reference)', () => {
    const a = buildSelectLikePositions(4);
    const b = buildSelectLikePositions(4);
    expect(a).not.toBe(b);
    expect(a[0]).not.toBe(b[0]);
  });
});
