import { describe, expect, it, vi } from 'vitest';

import { resolveSelectScrollStrategy } from './scroll-strategy';

function makeFakeOverlay() {
  const reposition = { kind: 'reposition' };
  const close = { kind: 'close' };
  const block = { kind: 'block' };
  return {
    overlay: {
      scrollStrategies: {
        reposition: vi.fn(() => reposition),
        close: vi.fn(() => close),
        block: vi.fn(() => block),
      },
    } as unknown as import('@angular/cdk/overlay').Overlay,
    reposition,
    close,
    block,
  };
}

describe('resolveSelectScrollStrategy', () => {
  it('returns the close strategy when name is "close"', () => {
    const { overlay, close } = makeFakeOverlay();
    expect(resolveSelectScrollStrategy('close', overlay)).toBe(close);
  });

  it('returns the block strategy when name is "block"', () => {
    const { overlay, block } = makeFakeOverlay();
    expect(resolveSelectScrollStrategy('block', overlay)).toBe(block);
  });

  it('returns the reposition strategy when name is "reposition"', () => {
    const { overlay, reposition } = makeFakeOverlay();
    expect(resolveSelectScrollStrategy('reposition', overlay)).toBe(reposition);
  });
});
