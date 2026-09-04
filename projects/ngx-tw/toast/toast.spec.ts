import { ApplicationRef, Component, type TemplateRef, inject, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OverlayModule } from '@angular/cdk/overlay';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { provideToast, ToastService } from './toast';
import { ToastActionDirective, ToastComponent } from './toast-component';
import { TW_TOAST_DATA, TW_TOAST_REF } from './toast-config';
import type { ToastTemplateContext } from './toast-config';
import type { ToastRef } from './toast-ref';

// ── Test host components ──

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <ng-template #tmpl let-data let-ref="ref">
      <span data-testid="tmpl-body">Template says {{ data?.value }}</span>
      <button data-testid="tmpl-close" (click)="ref.dismiss()">Close</button>
    </ng-template>
  `,
})
class TemplateHost {
  readonly tmpl = viewChild.required<TemplateRef<ToastTemplateContext>>('tmpl');
}

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div data-testid="component-body">Component from DI — {{ data?.value }}</div>
    <button data-testid="component-dismiss" (click)="ref.dismiss()">X</button>
  `,
})
class ComponentHost {
  readonly data = inject<{ value: string } | null>(TW_TOAST_DATA);
  readonly ref = inject<ToastRef>(TW_TOAST_REF);
}

// ── Helpers ──

const ANIM_MS = 200; // 150ms animation + 50ms fallback padding

function advance(ms: number): void {
  vi.advanceTimersByTime(ms);
}

function flushLeave(): void {
  advance(ANIM_MS);
}

function getAllToasts(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('tw-toast'));
}

function getOverlayFor(position: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`.tw-toast-overlay-${position}`);
}

/** Dispatch a pointer event on the toast wrapper the swipe handlers listen on. */
function dispatchPointer(
  target: EventTarget,
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  clientX: number,
): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY: 10,
      button: 0,
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
    }),
  );
}

// ── Tests ──

describe('ToastService', () => {
  let toast: ToastService;

  /**
   * Await the lazily-imported renderer, then run the enter animation.
   *
   * The renderer arrives via a real dynamic `import()`, which settles on the
   * microtask queue — unaffected by `vi.useFakeTimers()`, so plain `await`
   * works. Change detection is ticked explicitly rather than via
   * `whenStable()`, which can hang under fake timers.
   */
  async function flushEnter(): Promise<void> {
    await toast._whenRendered();
    TestBed.inject(ApplicationRef).tick();
    advance(ANIM_MS);
    TestBed.inject(ApplicationRef).tick();
  }

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      imports: [OverlayModule],
      providers: [provideToast()],
    });
    toast = TestBed.inject(ToastService);
  });

  afterEach(() => {
    try {
      toast.dismissAll();
      flushLeave();
    } catch {
      /* ignore teardown noise */
    }
    vi.useRealTimers();
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => (el.innerHTML = ''));
  });

  describe('basic open', () => {
    it('should mount a tw-toast when show() is called with a string', async () => {
      toast.show('hello world');
      await flushEnter();
      const panels = getAllToasts();
      expect(panels.length).toBe(1);
      expect(panels[0].textContent).toContain('hello world');
    });

    it('should create a region container with aria-label Notifications by default', async () => {
      toast.show('hi');
      await flushEnter();
      const container = document.querySelector<HTMLElement>('tw-toast-container');
      expect(container?.getAttribute('role')).toBe('region');
      expect(container?.getAttribute('aria-label')).toBe('Notifications');
    });

    it('should apply severity-specific classes', async () => {
      toast.success('done');
      await flushEnter();
      const panel = getAllToasts()[0];
      expect(panel.classList.contains('bg-success-soft')).toBe(true);
      expect(panel.getAttribute('role')).toBe('status');
    });

    it('error() should use role=alert and aria-live=assertive', async () => {
      toast.error('boom');
      await flushEnter();
      const panel = getAllToasts()[0];
      expect(panel.getAttribute('role')).toBe('alert');
      expect(panel.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('ToastRef contract', () => {
    it('should return a ref with a unique id', () => {
      const a = toast.show('one');
      const b = toast.show('two');
      expect(a.id).not.toBe(b.id);
    });

    it('programmatic dismiss() should emit afterDismissed with reason=programmatic', async () => {
      const ref = toast.show('x');
      await flushEnter();
      const spy = vi.fn();
      ref.afterDismissed().subscribe(spy);
      ref.dismiss();
      flushLeave();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].reason).toBe('programmatic');
    });

    it('should auto-dismiss after the configured duration', async () => {
      const ref = toast.show('auto', { duration: 1000 });
      await flushEnter();
      expect(ref.state()).toBe('visible');
      advance(1000);
      expect(ref.state()).toBe('dismissing');
      flushLeave();
      expect(ref.state()).toBe('dismissed');
    });

    it('should never auto-dismiss when duration is 0', async () => {
      const ref = toast.show('sticky', { duration: 0 });
      await flushEnter();
      advance(60_000);
      expect(ref.state()).toBe('visible');
    });

    it('should not fire the close button when dismissible=false', async () => {
      toast.show('nodismiss', { dismissible: false });
      await flushEnter();
      const closeBtn = document.querySelector('button[aria-label="Dismiss"]');
      expect(closeBtn).toBeNull();
    });

    it('click on close button should dismiss with reason=manual', async () => {
      const ref = toast.show('click', { duration: 0 });
      await flushEnter();
      const spy = vi.fn();
      ref.afterDismissed().subscribe(spy);
      const closeBtn = document.querySelector('button[aria-label="Dismiss"]') as HTMLElement;
      closeBtn.click();
      flushLeave();
      expect(spy.mock.calls[0][0].reason).toBe('manual');
    });

    it('dismiss button uses the xs square-interactive target (size-6) with an inner glyph (size-4)', async () => {
      toast.show('sizing', { duration: 0 });
      await flushEnter();
      const closeBtn = document.querySelector('button[aria-label="Dismiss"]') as HTMLElement;
      expect(closeBtn).not.toBeNull();
      expect(closeBtn.classList.contains('size-6')).toBe(true);
      expect(closeBtn.classList.contains('size-5')).toBe(false);
      const svg = closeBtn.querySelector('svg');
      expect(svg?.getAttribute('class')).toContain('size-4');
    });
  });

  describe('pause on interaction', () => {
    /** The entry wrapper the container binds its pointer / focus handlers to. */
    function wrapperFor(ref: { readonly id: string }): HTMLElement {
      const el = document.querySelector<HTMLElement>(`[data-toast-id="${ref.id}"]`);
      expect(el).not.toBeNull();
      return el!;
    }

    function tick(): void {
      TestBed.inject(ApplicationRef).tick();
    }

    // ── SC 2.2.1 (Timing Adjustable) ──
    // The 5000ms default is only conformant because the user can stop the
    // clock. These drive real DOM events rather than `ref._setHovered(...)`,
    // so a broken template binding fails them.

    it('a real pointerenter holds the toast past its duration; pointerleave releases it', async () => {
      const ref = toast.show('hover me'); // default duration: 5000
      await flushEnter();
      const wrapper = wrapperFor(ref);

      advance(1000);
      wrapper.dispatchEvent(new PointerEvent('pointerenter'));
      advance(30_000);
      tick();
      expect(getAllToasts().length).toBe(1);

      const dismissed = vi.fn();
      ref.afterDismissed().subscribe(dismissed);
      wrapper.dispatchEvent(new PointerEvent('pointerleave'));
      // Only the 4000ms that had not yet elapsed remain.
      advance(3900);
      expect(dismissed).not.toHaveBeenCalled();
      advance(100);
      flushLeave();
      expect(dismissed.mock.calls[0][0].reason).toBe('timeout');
    });

    it('keyboard focus anywhere inside the toast holds it; blurring away releases it', async () => {
      const ref = toast.show('focus me');
      await flushEnter();
      const wrapper = wrapperFor(ref);
      const closeBtn = wrapper.querySelector<HTMLElement>('button[aria-label="Dismiss"]');
      expect(closeBtn).not.toBeNull();

      closeBtn!.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      advance(30_000);
      tick();
      expect(getAllToasts().length).toBe(1);

      const dismissed = vi.fn();
      ref.afterDismissed().subscribe(dismissed);
      closeBtn!.dispatchEvent(
        new FocusEvent('focusout', { bubbles: true, relatedTarget: null }),
      );
      advance(5000);
      flushLeave();
      expect(dismissed.mock.calls[0][0].reason).toBe('timeout');
    });

    it('moving focus between controls inside the toast does not resume the timer', async () => {
      const ref = toast.show('two controls', {
        action: { label: 'Undo', handler: () => {} },
      });
      await flushEnter();
      const wrapper = wrapperFor(ref);
      const closeBtn = wrapper.querySelector<HTMLElement>('button[aria-label="Dismiss"]')!;
      const actionBtn = wrapper.querySelector<HTMLElement>('[twToastAction]')!;

      closeBtn.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      // focusout whose relatedTarget is still inside the toast is not a blur.
      closeBtn.dispatchEvent(
        new FocusEvent('focusout', { bubbles: true, relatedTarget: actionBtn }),
      );
      actionBtn.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

      advance(30_000);
      tick();
      expect(getAllToasts().length).toBe(1);
    });

    it('is a tab stop itself, so a toast with no buttons can still be paused', async () => {
      // dismissible:false with no action leaves nothing focusable inside — the
      // wrapper's own tabindex is the only way a keyboard user reaches it.
      const ref = toast.show('ambient', { dismissible: false });
      await flushEnter();
      const wrapper = wrapperFor(ref);

      expect(wrapper.getAttribute('tabindex')).toBe('0');
      expect(
        wrapper.querySelectorAll(
          'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ).length,
      ).toBe(0);
      expect(wrapper.classList.contains('focus-visible:outline-2')).toBe(true);

      wrapper.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      advance(30_000);
      tick();
      expect(getAllToasts().length).toBe(1);
    });

    it('pause/resume from pointer enter/leave gates the auto-dismiss timer', async () => {
      const ref = toast.show('hover', { duration: 1000 });
      await flushEnter();
      advance(500);
      ref._setHovered(true);
      advance(2000);
      expect(ref.state()).toBe('paused');
      ref._setHovered(false);
      advance(600);
      expect(ref.state()).toBe('dismissing');
    });

    it('pauseOnInteraction=false disables pause', async () => {
      const ref = toast.show('no-pause', {
        duration: 1000,
        pauseOnInteraction: false,
      });
      await flushEnter();
      ref._setHovered(true);
      advance(1000);
      expect(ref.state()).toBe('dismissing');
    });
  });

  // ── Escape-to-dismiss (SC 2.1.1 Keyboard) ──
  //
  // `toast-container.ts:125` binds `(keydown.escape)="onEscape(entry.ref, $event)"`.
  // `entry.ref` is template-context glue: with several toasts stacked, a binding
  // that resolved to the first entry rather than the one the key landed on would
  // dismiss the wrong toast and nothing would notice. Every toast is a tab stop
  // precisely so a keyboard user can reach and dismiss it, so the identity half
  // of these assertions is the point — not merely "something closed".
  describe('escape to dismiss', () => {
    function wrapperFor(ref: { readonly id: string }): HTMLElement {
      const el = document.querySelector<HTMLElement>(`[data-toast-id="${ref.id}"]`);
      expect(el).not.toBeNull();
      return el!;
    }

    function pressEscape(el: HTMLElement): void {
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      TestBed.inject(ApplicationRef).tick();
    }

    it('dismisses the toast the key landed on and leaves the others alone', async () => {
      // duration 0 on both, so a timeout can never be what removed either one.
      const first = toast.show('first toast', { duration: 0 });
      const second = toast.show('second toast', { duration: 0 });
      await flushEnter();
      expect(getAllToasts().length).toBe(2);

      const dismissed = vi.fn();
      second.afterDismissed().subscribe(dismissed);

      pressEscape(wrapperFor(second));
      flushLeave();

      expect(dismissed).toHaveBeenCalledTimes(1);
      expect(dismissed.mock.calls[0][0].reason).toBe('manual');
      expect(second.state()).toBe('dismissed');
      expect(first.state()).toBe('visible');
      const remaining = getAllToasts();
      expect(remaining.length).toBe(1);
      expect(remaining[0].textContent).toContain('first toast');
    });

    it('Escape on the first of two stacked toasts dismisses that one, not the last', async () => {
      // The mirror case. Together these two pin the binding to the entry the
      // event fired on: a hard-coded index passes exactly one of them.
      const first = toast.show('first toast', { duration: 0 });
      const second = toast.show('second toast', { duration: 0 });
      await flushEnter();

      pressEscape(wrapperFor(first));
      flushLeave();

      expect(first.state()).toBe('dismissed');
      expect(second.state()).toBe('visible');
      const remaining = getAllToasts();
      expect(remaining.length).toBe(1);
      expect(remaining[0].textContent).toContain('second toast');
    });

    it('Escape does not escape the toast — the event is stopped at the wrapper', async () => {
      const ref = toast.show('contained', { duration: 0 });
      await flushEnter();
      const outer = vi.fn();
      document.addEventListener('keydown', outer);
      try {
        pressEscape(wrapperFor(ref));
        // `onEscape` calls stopPropagation, so a document-level Escape handler
        // (a dialog behind the toast, say) must not also fire.
        expect(outer).not.toHaveBeenCalled();
      } finally {
        document.removeEventListener('keydown', outer);
        flushLeave();
      }
    });
  });

  // ── Swipe to dismiss ──
  //
  // `onSwipeEnd` (`toast-container.ts:381`) decides dismiss-vs-snap-back against
  // `width * SWIPE_DISMISS_FRACTION`. jsdom reports `getBoundingClientRect()` as
  // all-zero, which makes that threshold 0 and every swipe — however short —
  // "past" it. A test written without stubbing the rect therefore passes against
  // a completely broken threshold, so the stub below is load-bearing, not
  // convenience: with width 400 the threshold is a real 160px and the
  // above/below pair is falsifiable.
  //
  // (This corrects the standing assumption that the swipe path is unreachable
  // from jsdom. `setPointerCapture` / `releasePointerCapture` are both guarded,
  // and `PointerEvent` constructs here — only the geometry was missing.)
  describe('swipe to dismiss', () => {
    const WIDTH = 400; // threshold = 400 * 0.4 = 160px

    function wrapperFor(ref: { readonly id: string }): HTMLElement {
      const el = document.querySelector<HTMLElement>(`[data-toast-id="${ref.id}"]`);
      expect(el).not.toBeNull();
      // Give the wrapper a real width so the dismiss threshold is non-zero.
      vi.spyOn(el!, 'getBoundingClientRect').mockReturnValue({
        x: 0,
        y: 0,
        width: WIDTH,
        height: 60,
        top: 0,
        left: 0,
        right: WIDTH,
        bottom: 60,
        toJSON: () => ({}),
      } as DOMRect);
      return el!;
    }

    /** Full gesture: press, drag past the 6px engage gate, release at `dx`. */
    function swipe(el: HTMLElement, dx: number): void {
      dispatchPointer(el, 'pointerdown', 0);
      dispatchPointer(el, 'pointermove', Math.sign(dx) * 20);
      dispatchPointer(el, 'pointermove', dx);
      dispatchPointer(el, 'pointerup', dx);
      TestBed.inject(ApplicationRef).tick();
    }

    it('a drag past the threshold dismisses with reason "swipe"', async () => {
      const ref = toast.show('drag me', { duration: 0 });
      await flushEnter();
      const dismissed = vi.fn();
      ref.afterDismissed().subscribe(dismissed);

      swipe(wrapperFor(ref), 200); // 200 >= 160
      flushLeave();

      expect(dismissed).toHaveBeenCalledTimes(1);
      expect(dismissed.mock.calls[0][0].reason).toBe('swipe');
      expect(getAllToasts().length).toBe(0);
    });

    it('a drag short of the threshold snaps back and keeps the toast', async () => {
      const ref = toast.show('nearly', { duration: 0 });
      await flushEnter();
      const wrapper = wrapperFor(ref);

      dispatchPointer(wrapper, 'pointerdown', 0);
      dispatchPointer(wrapper, 'pointermove', 40);
      // Precondition asserted on its own so a failure names its own cause:
      // the swipe engaged and is tracking.
      expect(ref.swipeTransform()).toBe('translate3d(40px, 0, 0)');

      dispatchPointer(wrapper, 'pointerup', 40); // 40 < 160
      TestBed.inject(ApplicationRef).tick();

      expect(ref.state()).toBe('visible');
      // Snap-back clears the inline transform / opacity the drag applied.
      expect(ref.swipeTransform()).toBeNull();
      expect(ref.swipeOpacity()).toBeNull();
      expect(getAllToasts().length).toBe(1);
    });

    it('a drag against the stacking edge never dismisses, however far', async () => {
      // Default position is bottom-right, so only a rightward (positive) drag
      // may dismiss. A sign error in `swipeDirectionAllowed` shows up here.
      const ref = toast.show('wrong way', { duration: 0 });
      await flushEnter();

      swipe(wrapperFor(ref), -320); // twice the threshold, wrong direction
      TestBed.inject(ApplicationRef).tick();

      expect(ref.state()).toBe('visible');
      expect(ref.swipeTransform()).toBeNull();
      expect(getAllToasts().length).toBe(1);
    });

    it('swipeToDismiss=false never engages the gesture', async () => {
      const ref = toast.show('locked', { duration: 0, swipeToDismiss: false });
      await flushEnter();

      swipe(wrapperFor(ref), 320);

      expect(ref.state()).toBe('visible');
      expect(ref.swipeTransform()).toBeNull();
      expect(getAllToasts().length).toBe(1);
    });

    it('a press that starts on an interactive child is not a swipe', async () => {
      // Pressing the dismiss button must not begin a drag, or the button would
      // be unusable by pointer.
      const ref = toast.show('has a button', { duration: 0 });
      await flushEnter();
      const wrapper = wrapperFor(ref);
      const closeBtn = wrapper.querySelector<HTMLElement>('button[aria-label="Dismiss"]');
      expect(closeBtn).not.toBeNull();

      dispatchPointer(closeBtn!, 'pointerdown', 0);
      dispatchPointer(wrapper, 'pointermove', 200);
      expect(ref.swipeTransform()).toBeNull();
    });
  });

  describe('actions', () => {
    it('renders action button and fires handler(ref) without auto-dismissing', async () => {
      const handler = vi.fn();
      const ref = toast.show('act', {
        duration: 0,
        action: { label: 'Undo', handler },
      });
      await flushEnter();
      const btn = Array.from(document.querySelectorAll<HTMLElement>('button')).find(
        (el) => el.textContent?.trim() === 'Undo',
      );
      expect(btn).toBeTruthy();
      btn!.click();
      expect(handler).toHaveBeenCalledWith(ref);
      expect(ref.state()).not.toBe('dismissing');
    });

    it('no-handler action dismisses with reason=action', async () => {
      const ref = toast.show('act2', {
        duration: 0,
        action: { label: 'Go' },
      });
      await flushEnter();
      const spy = vi.fn();
      ref.afterDismissed().subscribe(spy);
      const btn = Array.from(document.querySelectorAll<HTMLElement>('button')).find(
        (el) => el.textContent?.trim() === 'Go',
      );
      btn!.click();
      flushLeave();
      expect(spy.mock.calls[0][0].reason).toBe('action');
    });
  });

  describe('TemplateRef content', () => {
    it('renders a template and provides $implicit + ref', async () => {
      const host = TestBed.createComponent(TemplateHost);
      host.detectChanges();
      toast.show(host.componentInstance.tmpl(), {
        data: { value: 42 },
        duration: 0,
      });
      await flushEnter();
      const body = document.querySelector<HTMLElement>('[data-testid="tmpl-body"]');
      expect(body?.textContent).toContain('Template says 42');
    });

    it('ref.dismiss() from the template closes the toast', async () => {
      const host = TestBed.createComponent(TemplateHost);
      host.detectChanges();
      const ref = toast.show(host.componentInstance.tmpl(), { duration: 0 });
      await flushEnter();
      const close = document.querySelector<HTMLElement>('[data-testid="tmpl-close"]');
      close!.click();
      flushLeave();
      expect(ref.state()).toBe('dismissed');
    });
  });

  describe('Component content', () => {
    it('injects TW_TOAST_DATA and TW_TOAST_REF', async () => {
      const ref = toast.show(ComponentHost, { data: { value: 'hi' }, duration: 0 });
      await flushEnter();
      const body = document.querySelector<HTMLElement>('[data-testid="component-body"]');
      expect(body?.textContent).toContain('Component from DI — hi');
      expect(ref.componentInstance).toBeTruthy();
    });

    it('calling ref.dismiss() from the component content works', async () => {
      const ref = toast.show(ComponentHost, { data: { value: 'x' }, duration: 0 });
      await flushEnter();
      (document.querySelector<HTMLElement>('[data-testid="component-dismiss"]'))!.click();
      flushLeave();
      expect(ref.state()).toBe('dismissed');
    });
  });

  describe('stacking + maxVisible', () => {
    it('stacks multiple toasts at the same position', async () => {
      toast.show('a', { duration: 0 });
      toast.show('b', { duration: 0 });
      toast.show('c', { duration: 0 });
      await flushEnter();
      expect(getAllToasts().length).toBe(3);
    });

    it('dismisses the oldest when maxVisible is exceeded', async () => {
      const a = toast.show('a', { duration: 0, maxVisible: 2 });
      const b = toast.show('b', { duration: 0, maxVisible: 2 });
      await flushEnter();
      const dismissalSpy = vi.fn();
      a.afterDismissed().subscribe(dismissalSpy);
      toast.show('c', { duration: 0, maxVisible: 2 });
      flushLeave();
      expect(dismissalSpy).toHaveBeenCalledTimes(1);
      expect(dismissalSpy.mock.calls[0][0].reason).toBe('max-exceeded');
      // b and c remain
      expect(toast.activeToasts().map((r) => r.id)).toContain(b.id);
    });
  });

  describe('positions', () => {
    const positions = [
      'top-left',
      'top-center',
      'top-right',
      'bottom-left',
      'bottom-center',
      'bottom-right',
    ] as const;

    it('creates a dedicated overlay per position and reuses it', async () => {
      for (const p of positions) {
        toast.show(`at-${p}`, { position: p, duration: 0 });
      }
      await flushEnter();
      for (const p of positions) {
        expect(getOverlayFor(p)).toBeTruthy();
      }
      expect(getAllToasts().length).toBe(positions.length);
    });
  });

  describe('dismissAll + afterAllDismissed', () => {
    it('dismissAll closes every active toast', async () => {
      toast.show('a', { duration: 0 });
      toast.show('b', { duration: 0, position: 'top-left' });
      await flushEnter();
      expect(toast.activeToasts().length).toBe(2);
      toast.dismissAll();
      flushLeave();
      expect(toast.activeToasts().length).toBe(0);
    });

    it('afterAllDismissed emits when last toast dismisses', async () => {
      const ref = toast.show('only', { duration: 0 });
      await flushEnter();
      const spy = vi.fn();
      toast.afterAllDismissed.subscribe(spy);
      ref.dismiss();
      flushLeave();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('promise()', () => {
    it('swaps severity on resolve', async () => {
      let resolveFn: (v: string) => void = () => {};
      const p = new Promise<string>((resolve) => (resolveFn = resolve));
      const ref = toast.promise(p, {
        loading: 'Loading…',
        success: (v) => `Saved ${v}`,
        error: 'Oops',
      });
      await flushEnter();
      expect(ref.severity()).toBe('neutral');

      resolveFn('foo');
      await vi.advanceTimersByTimeAsync(0);
      expect(ref.severity()).toBe('success');
      expect(document.body.textContent).toContain('Saved foo');
    });

    it('swaps severity on reject', async () => {
      let rejectFn: (e: unknown) => void = () => {};
      const p = new Promise<string>((_, reject) => (rejectFn = reject));
      const ref = toast.promise(p, {
        loading: 'Working…',
        success: 'OK',
        error: (e) => `Boom: ${(e as Error).message}`,
      });
      await flushEnter();
      rejectFn(new Error('nope'));
      await vi.advanceTimersByTimeAsync(0);
      expect(ref.severity()).toBe('error');
      expect(document.body.textContent).toContain('Boom: nope');
    });
  });

  describe('accessibility', () => {
    it('LiveAnnouncer.announce is called with the message text', async () => {
      const announcer = TestBed.inject(LiveAnnouncer);
      const spy = vi.spyOn(announcer, 'announce');
      toast.show('accessible hi');
      await flushEnter();
      expect(spy).toHaveBeenCalled();
      const call = spy.mock.calls[0];
      expect(call[0]).toContain('accessible hi');
      expect(call[1]).toBe('polite');
    });

    it('LiveAnnouncer is skipped when politeness=off', async () => {
      const announcer = TestBed.inject(LiveAnnouncer);
      const spy = vi.spyOn(announcer, 'announce');
      toast.show('silent', { politeness: 'off' });
      await flushEnter();
      expect(spy).not.toHaveBeenCalled();
    });

    it('error() toasts have aria-atomic=true', async () => {
      toast.error('alert!');
      await flushEnter();
      expect(getAllToasts()[0].getAttribute('aria-atomic')).toBe('true');
    });
  });

  describe('panelClass', () => {
    it('merges extra classes onto the tw-toast root', async () => {
      toast.show('styled', { panelClass: ['my-custom-class'], duration: 0 });
      await flushEnter();
      expect(getAllToasts()[0].classList.contains('my-custom-class')).toBe(true);
    });
  });

  // The rendering layer arrives through a dynamic import(), so a ref exists —
  // and is fully usable — before anything is on screen. These cover that gap.
  describe('deferred renderer', () => {
    it('does not start the auto-dismiss clock until the toast is attached', async () => {
      const ref = toast.show('slow-chunk', { duration: 1000 });

      // Stand in for a slow renderer chunk: burn far more than the toast's own
      // duration before it is ever attached. Regression guard — when the enter
      // timer was started from the ToastRef constructor this toast had already
      // expired by now, and would have flashed or never appeared at all.
      advance(5000);
      expect(ref.state()).toBe('entering');

      await flushEnter();
      expect(ref.state()).toBe('visible');
      expect(getAllToasts().length).toBe(1);

      // Full duration still ahead of it.
      advance(999);
      expect(ref.state()).toBe('visible');
      advance(2);
      expect(ref.state()).toBe('dismissing');
    });

    it('a toast dismissed before the renderer lands never reaches the DOM', async () => {
      const ref = toast.show('cancelled', { duration: 0 });
      ref.dismiss();

      await flushEnter();

      expect(getAllToasts().length).toBe(0);
      expect(ref.state()).toBe('dismissed');
      expect(toast.activeToasts().length).toBe(0);
    });

    it('update() before attach renders the updated content, not the original', async () => {
      const ref = toast.show('loading…', { duration: 0 });
      ref.update({ content: 'done!', severity: 'success' });

      await flushEnter();

      const panel = getAllToasts()[0];
      expect(panel.textContent).toContain('done!');
      expect(panel.textContent).not.toContain('loading…');
      expect(panel.classList.contains('bg-success-soft')).toBe(true);
    });
  });
});

// ── ToastComponent outputs, bound the way a consumer binds them ──
//
// `ToastComponent` is exported for consumers composing their own toast body
// inside a TemplateRef / component passed to `show()`. Those consumers bind
// `(actionClicked)` and `(dismissed)` themselves, so both must fire from the
// right control and only from that control — the plausible regression is the
// two adjacent click handlers being crossed or collapsed into one.

@Component({
  imports: [ToastComponent, ToastActionDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-toast severity="info" (actionClicked)="actionSpy()" (dismissed)="dismissSpy()">
      Saved
      <button twToastAction data-testid="action">Undo</button>
    </tw-toast>
  `,
})
class ToastOutputsHost {
  readonly actionSpy = vi.fn();
  readonly dismissSpy = vi.fn();
}

describe('ToastComponent outputs', () => {
  it('emits actionClicked — and not dismissed — when a [twToastAction] button is clicked', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [ToastOutputsHost] });
    const fixture = TestBed.createComponent(ToastOutputsHost);
    fixture.detectChanges();

    const action = fixture.nativeElement.querySelector(
      'tw-toast [data-testid="action"]',
    ) as HTMLButtonElement | null;
    expect(action).not.toBeNull();
    expect(action!.textContent?.trim()).toBe('Undo');

    action!.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.actionSpy).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.dismissSpy).not.toHaveBeenCalled();
  });

  it('emits dismissed — and not actionClicked — when the built-in close button is clicked', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [ToastOutputsHost] });
    const fixture = TestBed.createComponent(ToastOutputsHost);
    fixture.detectChanges();

    const close = fixture.nativeElement.querySelector(
      'tw-toast button[aria-label="Dismiss"]',
    ) as HTMLButtonElement | null;
    expect(close).not.toBeNull();

    close!.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.dismissSpy).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.actionSpy).not.toHaveBeenCalled();
  });
});

// ── Consumer-supplied aria-label ──
//
// The host binds `[attr.aria-label]` to the `ariaLabel` input. Unless that
// input is aliased to `aria-label`, a consumer writing the plain attribute
// never reaches it and the binding then REMOVES the attribute they wrote,
// leaving the toast unnamed. The static-attribute form below is the exact
// case that regressed; driving the input directly (`setInput`) reaches it
// without going through the attribute and would have passed with the bug
// present, so it must not be used here.

@Component({
  imports: [ToastComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-toast severity="info" aria-label="Upload finished">Saved</tw-toast>`,
})
class ToastAriaLabelHost {}

describe('ToastComponent consumer aria-label', () => {
  it('keeps a consumer-written aria-label attribute on the rendered host', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [ToastAriaLabelHost] });
    const fixture = TestBed.createComponent(ToastAriaLabelHost);
    fixture.detectChanges();

    const toast = fixture.nativeElement.querySelector('tw-toast') as HTMLElement;
    expect(toast.getAttribute('aria-label')).toBe('Upload finished');
  });
});

// ── Swipe teardown ──
//
// A swipe can be interrupted by the toast auto-dismissing or by the whole
// layer going away, in which case `pointerup` never reaches `onSwipeEnd` and
// nothing removes the move listener or releases pointer capture. The container
// carries a DestroyRef hook for exactly that case. Asserted through observable
// behaviour — after destroy a further `pointermove` must not move the toast —
// rather than by reading the teardown set.

describe('ToastContainer swipe teardown', () => {
  it('stops tracking an in-flight swipe once the toast layer is destroyed', async () => {
    TestBed.resetTestingModule();
    vi.useFakeTimers();
    try {
      TestBed.configureTestingModule({
        imports: [OverlayModule],
        providers: [provideToast()],
      });
      const svc = TestBed.inject(ToastService);
      const ref = svc.show('swipe me', { duration: 0 });
      await svc._whenRendered();
      TestBed.inject(ApplicationRef).tick();
      advance(ANIM_MS);
      TestBed.inject(ApplicationRef).tick();

      const wrapper = document.querySelector<HTMLElement>(`[data-toast-id="${ref.id}"]`);
      expect(wrapper).not.toBeNull();

      dispatchPointer(wrapper!, 'pointerdown', 0);
      // Past the 6px engage threshold.
      dispatchPointer(wrapper!, 'pointermove', 40);
      // Precondition, asserted on its own so a failure names its own cause:
      // the swipe engaged and is tracking.
      expect(ref.swipeTransform()).toBe('translate3d(40px, 0, 0)');

      // Tear the layer down mid-swipe. `pointerup` is deliberately never
      // dispatched — that is the whole scenario.
      TestBed.resetTestingModule();

      const atDestroy = ref.swipeTransform();
      dispatchPointer(wrapper!, 'pointermove', 160);
      expect(ref.swipeTransform()).toBe(atDestroy);
    } finally {
      vi.useRealTimers();
      document.querySelectorAll('.cdk-overlay-container').forEach((el) => (el.innerHTML = ''));
    }
  });
});

describe('provideToast with defaults', () => {
  it('applies default options to every call', () => {
    TestBed.resetTestingModule();
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      imports: [OverlayModule],
      providers: [provideToast({ position: 'top-left', duration: 100 })],
    });
    const svc = TestBed.inject(ToastService);
    const ref = svc.show('with-defaults');
    expect(ref.config.position).toBe('top-left');
    expect(ref.config.duration).toBe(100);
    vi.useRealTimers();
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => (el.innerHTML = ''));
  });
});
