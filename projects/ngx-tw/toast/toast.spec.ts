import { Component, type TemplateRef, inject, viewChild } from '@angular/core';
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

function flushEnter(): void {
  advance(ANIM_MS);
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
    it('should mount a tw-toast when show() is called with a string', () => {
      toast.show('hello world');
      flushEnter();
      const panels = getAllToasts();
      expect(panels.length).toBe(1);
      expect(panels[0].textContent).toContain('hello world');
    });

    it('should create a region container with aria-label Notifications by default', () => {
      toast.show('hi');
      flushEnter();
      const container = document.querySelector<HTMLElement>('tw-toast-container');
      expect(container?.getAttribute('role')).toBe('region');
      expect(container?.getAttribute('aria-label')).toBe('Notifications');
    });

    it('should apply severity-specific classes', () => {
      toast.success('done');
      flushEnter();
      const panel = getAllToasts()[0];
      expect(panel.className).toContain('bg-success-50');
      expect(panel.getAttribute('role')).toBe('status');
    });

    it('error() should use role=alert and aria-live=assertive', () => {
      toast.error('boom');
      flushEnter();
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
      flushEnter();
      const spy = vi.fn();
      ref.afterDismissed().subscribe(spy);
      ref.dismiss();
      flushLeave();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].reason).toBe('programmatic');
    });

    it('should auto-dismiss after the configured duration', () => {
      const ref = toast.show('auto', { duration: 1000 });
      flushEnter();
      expect(ref.state()).toBe('visible');
      advance(1000);
      expect(ref.state()).toBe('dismissing');
      flushLeave();
      expect(ref.state()).toBe('dismissed');
    });

    it('should never auto-dismiss when duration is 0', () => {
      const ref = toast.show('sticky', { duration: 0 });
      flushEnter();
      advance(60_000);
      expect(ref.state()).toBe('visible');
    });

    it('should not fire the close button when dismissible=false', () => {
      toast.show('nodismiss', { dismissible: false });
      flushEnter();
      const closeBtn = document.querySelector('button[aria-label="Dismiss"]');
      expect(closeBtn).toBeNull();
    });

    it('click on close button should dismiss with reason=manual', async () => {
      const ref = toast.show('click', { duration: 0 });
      flushEnter();
      const spy = vi.fn();
      ref.afterDismissed().subscribe(spy);
      const closeBtn = document.querySelector('button[aria-label="Dismiss"]') as HTMLElement;
      closeBtn.click();
      flushLeave();
      expect(spy.mock.calls[0][0].reason).toBe('manual');
    });
  });

  describe('pause on interaction', () => {
    it('pause/resume from pointer enter/leave gates the auto-dismiss timer', () => {
      const ref = toast.show('hover', { duration: 1000 });
      flushEnter();
      advance(500);
      ref._setHovered(true);
      advance(2000);
      expect(ref.state()).toBe('paused');
      ref._setHovered(false);
      advance(600);
      expect(ref.state()).toBe('dismissing');
    });

    it('pauseOnInteraction=false disables pause', () => {
      const ref = toast.show('no-pause', {
        duration: 1000,
        pauseOnInteraction: false,
      });
      flushEnter();
      ref._setHovered(true);
      advance(1000);
      expect(ref.state()).toBe('dismissing');
    });
  });

  describe('actions', () => {
    it('renders action button and fires handler(ref) without auto-dismissing', () => {
      const handler = vi.fn();
      const ref = toast.show('act', {
        duration: 0,
        action: { label: 'Undo', handler },
      });
      flushEnter();
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
      flushEnter();
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
    it('renders a template and provides $implicit + ref', () => {
      const host = TestBed.createComponent(TemplateHost);
      host.detectChanges();
      toast.show(host.componentInstance.tmpl(), {
        data: { value: 42 },
        duration: 0,
      });
      flushEnter();
      const body = document.querySelector<HTMLElement>('[data-testid="tmpl-body"]');
      expect(body?.textContent).toContain('Template says 42');
    });

    it('ref.dismiss() from the template closes the toast', () => {
      const host = TestBed.createComponent(TemplateHost);
      host.detectChanges();
      const ref = toast.show(host.componentInstance.tmpl(), { duration: 0 });
      flushEnter();
      const close = document.querySelector<HTMLElement>('[data-testid="tmpl-close"]');
      close!.click();
      flushLeave();
      expect(ref.state()).toBe('dismissed');
    });
  });

  describe('Component content', () => {
    it('injects TW_TOAST_DATA and TW_TOAST_REF', () => {
      const ref = toast.show(ComponentHost, { data: { value: 'hi' }, duration: 0 });
      flushEnter();
      const body = document.querySelector<HTMLElement>('[data-testid="component-body"]');
      expect(body?.textContent).toContain('Component from DI — hi');
      expect(ref.componentInstance).toBeTruthy();
    });

    it('calling ref.dismiss() from the component content works', () => {
      const ref = toast.show(ComponentHost, { data: { value: 'x' }, duration: 0 });
      flushEnter();
      (document.querySelector<HTMLElement>('[data-testid="component-dismiss"]'))!.click();
      flushLeave();
      expect(ref.state()).toBe('dismissed');
    });
  });

  describe('stacking + maxVisible', () => {
    it('stacks multiple toasts at the same position', () => {
      toast.show('a', { duration: 0 });
      toast.show('b', { duration: 0 });
      toast.show('c', { duration: 0 });
      flushEnter();
      expect(getAllToasts().length).toBe(3);
    });

    it('dismisses the oldest when maxVisible is exceeded', () => {
      const a = toast.show('a', { duration: 0, maxVisible: 2 });
      const b = toast.show('b', { duration: 0, maxVisible: 2 });
      flushEnter();
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

    it('creates a dedicated overlay per position and reuses it', () => {
      for (const p of positions) {
        toast.show(`at-${p}`, { position: p, duration: 0 });
      }
      flushEnter();
      for (const p of positions) {
        expect(getOverlayFor(p)).toBeTruthy();
      }
      expect(getAllToasts().length).toBe(positions.length);
    });
  });

  describe('dismissAll + afterAllDismissed', () => {
    it('dismissAll closes every active toast', () => {
      toast.show('a', { duration: 0 });
      toast.show('b', { duration: 0, position: 'top-left' });
      flushEnter();
      expect(toast.activeToasts().length).toBe(2);
      toast.dismissAll();
      flushLeave();
      expect(toast.activeToasts().length).toBe(0);
    });

    it('afterAllDismissed emits when last toast dismisses', () => {
      const ref = toast.show('only', { duration: 0 });
      flushEnter();
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
      flushEnter();
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
      flushEnter();
      rejectFn(new Error('nope'));
      await vi.advanceTimersByTimeAsync(0);
      expect(ref.severity()).toBe('error');
      expect(document.body.textContent).toContain('Boom: nope');
    });
  });

  describe('accessibility', () => {
    it('LiveAnnouncer.announce is called with the message text', () => {
      const announcer = TestBed.inject(LiveAnnouncer);
      const spy = vi.spyOn(announcer, 'announce');
      toast.show('accessible hi');
      flushEnter();
      expect(spy).toHaveBeenCalled();
      const call = spy.mock.calls[0];
      expect(call[0]).toContain('accessible hi');
      expect(call[1]).toBe('polite');
    });

    it('LiveAnnouncer is skipped when politeness=off', () => {
      const announcer = TestBed.inject(LiveAnnouncer);
      const spy = vi.spyOn(announcer, 'announce');
      toast.show('silent', { politeness: 'off' });
      flushEnter();
      expect(spy).not.toHaveBeenCalled();
    });

    it('error() toasts have aria-atomic=true', () => {
      toast.error('alert!');
      flushEnter();
      expect(getAllToasts()[0].getAttribute('aria-atomic')).toBe('true');
    });
  });

  describe('panelClass', () => {
    it('merges extra classes onto the tw-toast root', () => {
      toast.show('styled', { panelClass: ['my-custom-class'], duration: 0 });
      flushEnter();
      expect(getAllToasts()[0].className).toContain('my-custom-class');
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
