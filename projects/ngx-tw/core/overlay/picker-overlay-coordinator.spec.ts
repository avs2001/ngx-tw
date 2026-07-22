import { Component, type ElementRef, viewChild, ViewContainerRef, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  PickerOverlayCoordinator,
  PICKER_ENTER_DURATION,
  PICKER_LEAVE_DURATION,
} from './picker-overlay-coordinator';
import { Overlay } from '@angular/cdk/overlay';
import { buildSelectLikePositions } from './positions';
import { resolveSelectScrollStrategy } from './scroll-strategy';

@Component({
  selector: 'tw-test-overlay',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<span data-testid="overlay-content">overlay</span>`,
})
class TestOverlayComponent {}

@Component({
  selector: 'tw-test-host',
  template: `<button #trigger>open</button>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [PickerOverlayCoordinator],
})
class TestHostComponent {
  readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
}

function setup(): {
  fixture: ReturnType<typeof TestBed.createComponent<TestHostComponent>>;
  coordinator: PickerOverlayCoordinator;
  overlay: Overlay;
  openOnce: () => ReturnType<PickerOverlayCoordinator['open']>;
} {
  const fixture = TestBed.createComponent(TestHostComponent);
  fixture.detectChanges();
  // The coordinator is component-scoped (`providers: [PickerOverlayCoordinator]`
  // on TestHostComponent), so we must pull it from the fixture's injector
  // — NOT TestBed.inject, which only sees root providers.
  const coordinator = fixture.debugElement.injector.get(PickerOverlayCoordinator);
  const overlay = TestBed.inject(Overlay);
  const openOnce = () =>
    coordinator.open({
      origin: fixture.componentInstance.trigger(),
      portalComponent: TestOverlayComponent,
      viewContainerRef: fixture.debugElement.injector.get(ViewContainerRef),
      positions: buildSelectLikePositions(4),
      scrollStrategy: resolveSelectScrollStrategy('reposition', overlay),
      panelClass: 'tw-test-panel',
    });
  return { fixture, coordinator, overlay, openOnce };
}

describe('PickerOverlayCoordinator', () => {
  it('creates and attaches an overlay on open()', () => {
    const { coordinator, openOnce } = setup();
    const result = openOnce();
    expect(result).not.toBeNull();
    expect(result!.overlayRef.hasAttached()).toBe(true);
    expect(result!.panelId).toMatch(/^tw-picker-overlay-/);
    expect(coordinator.attached()).toBe(true);
    expect(coordinator.opened()).toBe(false);
  });

  it('returns null when open() is called while already open', () => {
    const { openOnce } = setup();
    const first = openOnce();
    const second = openOnce();
    expect(first).not.toBeNull();
    expect(second).toBeNull();
  });

  it('emits opened$ after PICKER_ENTER_DURATION', async () => {
    vi.useFakeTimers();
    try {
      const { coordinator, openOnce } = setup();
      openOnce();
      const emissionPromise = firstValueFrom(coordinator.opened$().pipe(take(1)));
      // Should not have emitted yet.
      expect(coordinator.opened()).toBe(false);
      vi.advanceTimersByTime(PICKER_ENTER_DURATION + 5);
      await emissionPromise;
      expect(coordinator.opened()).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('close() detaches and disposes after PICKER_LEAVE_DURATION', async () => {
    vi.useFakeTimers();
    try {
      const { coordinator, openOnce } = setup();
      const result = openOnce();
      expect(result!.overlayRef.hasAttached()).toBe(true);
      const afterCloseSpy = vi.fn();
      coordinator.close(afterCloseSpy);
      // Immediately after close(): overlay still attached, timer pending.
      expect(coordinator.attached()).toBe(true);
      expect(afterCloseSpy).not.toHaveBeenCalled();
      vi.advanceTimersByTime(PICKER_LEAVE_DURATION + 5);
      await Promise.resolve();
      expect(afterCloseSpy).toHaveBeenCalledTimes(1);
      expect(coordinator.attached()).toBe(false);
      expect(coordinator.ref()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('allows re-opening after a full close cycle', async () => {
    vi.useFakeTimers();
    try {
      const { coordinator, openOnce } = setup();
      const first = openOnce();
      expect(first).not.toBeNull();
      coordinator.close();
      vi.advanceTimersByTime(PICKER_LEAVE_DURATION + 5);
      await Promise.resolve();
      const second = openOnce();
      expect(second).not.toBeNull();
      // OverlayRef must be a fresh instance — the prior one was disposed.
      expect(second!.overlayRef).not.toBe(first!.overlayRef);
      expect(second!.overlayRef.hasAttached()).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('backdropClick$ stream completes when the overlay closes', async () => {
    vi.useFakeTimers();
    try {
      const { coordinator, openOnce } = setup();
      openOnce();
      let completed = false;
      coordinator.backdropClick$().subscribe({ complete: () => (completed = true) });
      coordinator.close();
      vi.advanceTimersByTime(PICKER_LEAVE_DURATION + 5);
      await Promise.resolve();
      expect(completed).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('escape$ completes when the overlay closes', async () => {
    // The filter behaviour itself is trivial (rxjs `filter(e.key === 'Escape')`);
    // what's worth asserting is the lifecycle wiring — the stream must complete
    // when the coordinator closes so consumers don't accumulate subscriptions
    // across open/close cycles. End-to-end keystroke dispatch lives in the
    // picker integration specs where the full CDK overlay host is wired.
    vi.useFakeTimers();
    try {
      const { coordinator, openOnce } = setup();
      openOnce();
      let completed = false;
      coordinator.escape$().subscribe({ complete: () => (completed = true) });
      coordinator.close();
      vi.advanceTimersByTime(PICKER_LEAVE_DURATION + 5);
      await Promise.resolve();
      expect(completed).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('disposes the overlay immediately on DestroyRef.onDestroy when still open', () => {
    const { fixture, coordinator, openOnce } = setup();
    const result = openOnce();
    expect(result!.overlayRef.hasAttached()).toBe(true);
    fixture.destroy();
    expect(coordinator.attached()).toBe(false);
    expect(coordinator.ref()).toBeNull();
  });

  it('panelId is stable for the open lifecycle and resets on close', async () => {
    vi.useFakeTimers();
    try {
      const { coordinator, openOnce } = setup();
      const result = openOnce();
      const id = coordinator.panelId();
      expect(id).toBe(result!.panelId);
      coordinator.close();
      vi.advanceTimersByTime(PICKER_LEAVE_DURATION + 5);
      await Promise.resolve();
      expect(coordinator.panelId()).toBeNull();
      const second = openOnce();
      // Fresh id on the next open.
      expect(second!.panelId).not.toBe(id);
    } finally {
      vi.useRealTimers();
    }
  });

  it('close() during the leave timer is a no-op (idempotent)', async () => {
    vi.useFakeTimers();
    try {
      const { coordinator, openOnce } = setup();
      openOnce();
      const afterCloseSpy = vi.fn();
      coordinator.close(afterCloseSpy);
      // A second close before the timer fires must NOT enqueue a duplicate.
      coordinator.close(afterCloseSpy);
      vi.advanceTimersByTime(PICKER_LEAVE_DURATION + 5);
      await Promise.resolve();
      expect(afterCloseSpy).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('exposes the live OverlayRef via ref()', () => {
    const { coordinator, openOnce } = setup();
    const result = openOnce();
    expect(coordinator.ref()).toBe(result!.overlayRef);
  });

  it('throws when streams are accessed before open()', () => {
    const { coordinator } = setup();
    expect(() => coordinator.backdropClick$()).toThrowError(/before open/);
    expect(() => coordinator.overlayKeydown$()).toThrowError(/before open/);
    expect(() => coordinator.escape$()).toThrowError(/before open/);
    expect(() => coordinator.opened$()).toThrowError(/before open/);
  });
});
