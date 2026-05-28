import type { OverlayRef } from '@angular/cdk/overlay';
import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { consumeOverlayEscape } from './escape';

function makeFakeOverlay() {
  const keydown$ = new Subject<KeyboardEvent>();
  const overlayRef = {
    keydownEvents: () => keydown$.asObservable(),
  } as unknown as OverlayRef;
  return { overlayRef, keydown$ };
}

describe('consumeOverlayEscape', () => {
  it('invokes the handler when an Escape keydown fires', () => {
    const { overlayRef, keydown$ } = makeFakeOverlay();
    const handler = vi.fn();

    consumeOverlayEscape(overlayRef, handler);
    keydown$.next(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
    expect(handler.mock.calls[0][0].key).toBe('Escape');
  });

  it('does not invoke the handler for non-Escape keys', () => {
    const { overlayRef, keydown$ } = makeFakeOverlay();
    const handler = vi.fn();

    consumeOverlayEscape(overlayRef, handler);
    keydown$.next(new KeyboardEvent('keydown', { key: 'Enter' }));
    keydown$.next(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    keydown$.next(new KeyboardEvent('keydown', { key: 'Tab' }));

    expect(handler).not.toHaveBeenCalled();
  });

  it('stops invoking the handler after teardown is called', () => {
    const { overlayRef, keydown$ } = makeFakeOverlay();
    const handler = vi.fn();

    const teardown = consumeOverlayEscape(overlayRef, handler);
    keydown$.next(new KeyboardEvent('keydown', { key: 'Escape' }));
    teardown();
    keydown$.next(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
