import { ApplicationRef, Component, type TemplateRef, inject, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OverlayModule } from '@angular/cdk/overlay';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { provideToast, ToastService } from './toast';
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
      expect(panel.className).toContain('bg-success-soft');
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
      expect(closeBtn.className).toContain('size-6');
      expect(closeBtn.className).not.toContain('size-5');
      const svg = closeBtn.querySelector('svg');
      expect(svg?.getAttribute('class')).toContain('size-4');
    });
  });

  describe('pause on interaction', () => {
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
      expect(getAllToasts()[0].className).toContain('my-custom-class');
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
      expect(panel.className).toContain('bg-success-soft');
    });
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
