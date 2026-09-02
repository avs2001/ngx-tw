import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FlipCardComponent,
  type FlipCardDirection,
  type FlipCardTrigger,
  type FlipCardVariant,
} from './flip-card';

// ── Test host components ──

@Component({
  imports: [FlipCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-flip-card
      [variant]="variant()"
      [direction]="direction()"
      [trigger]="trigger()"
      [disabled]="disabled()"
      [(flipped)]="flipped"
      (flippedChange)="onFlippedChange($event)"
    >
      <div slot="front">Front</div>
      <div slot="back">Back</div>
    </tw-flip-card>
  `,
})
class TwoSidedHost {
  readonly variant = signal<FlipCardVariant>('outline');
  readonly direction = signal<FlipCardDirection>('horizontal');
  readonly trigger = signal<FlipCardTrigger>('both');
  readonly disabled = signal(false);
  readonly flipped = signal(false);
  readonly flippedChange = vi.fn<(value: boolean) => void>();
  onFlippedChange(value: boolean): void {
    this.flippedChange(value);
  }
}

@Component({
  imports: [FlipCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-flip-card>
      <div slot="front">Front only</div>
    </tw-flip-card>
  `,
})
class FrontOnlyHost {}

@Component({
  imports: [FlipCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-flip-card>
      <div slot="front">Front</div>
      @if (showBack()) {
        <div slot="back">Back</div>
      }
    </tw-flip-card>
  `,
})
class DynamicBackHost {
  readonly showBack = signal(false);
}

@Component({
  imports: [FlipCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-flip-card trigger="manual" [aria-label]="ariaLabel()">
      <div slot="front">Front</div>
      <div slot="back">Back</div>
    </tw-flip-card>
  `,
})
class ManualLabelHost {
  readonly ariaLabel = signal<string | undefined>(undefined);
}

// A consumer writing the plain `aria-label` attribute — the exact shape that
// used to be overwritten by the `'Flip card'` fallback because the input was
// not aliased. Driving the input directly (`setInput`) skips the attribute
// path and would have passed with the bug present, so this host uses the
// static attribute deliberately.
@Component({
  imports: [FlipCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-flip-card trigger="manual" aria-label="Invoice #00412 summary">
      <div slot="front">Front</div>
      <div slot="back">Back</div>
    </tw-flip-card>
  `,
})
class StaticAriaLabelHost {}

// ── Helpers ──

async function flushBack(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  // MutationObserver fires asynchronously; let microtasks drain.
  await Promise.resolve();
  fixture.detectChanges();
}

function host(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('tw-flip-card') as HTMLElement;
}

function faces(fixture: ComponentFixture<unknown>): NodeListOf<HTMLElement> {
  return fixture.nativeElement.querySelectorAll(
    'tw-flip-card > div > div',
  ) as NodeListOf<HTMLElement>;
}

// ── Tests ──

describe('FlipCardComponent', () => {
  describe('rendering', () => {
    it('mounts with no errors with both slots', async () => {
      await TestBed.configureTestingModule({ imports: [TwoSidedHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(TwoSidedHost);
      await flushBack(fixture);
      expect(host(fixture)).toBeTruthy();
    });

    it('mounts and renders front-only when back slot is missing', async () => {
      await TestBed.configureTestingModule({ imports: [FrontOnlyHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(FrontOnlyHost);
      await flushBack(fixture);
      const el = host(fixture);
      expect(el).toBeTruthy();
      expect(el.textContent).toContain('Front only');
    });

    it('applies outline variant classes by default', async () => {
      await TestBed.configureTestingModule({ imports: [TwoSidedHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(TwoSidedHost);
      await flushBack(fixture);
      const face = faces(fixture)[0];
      expect(face.className).toContain('bg-surface');
      expect(face.className).toContain('border');
    });

    it('applies elevated variant classes', async () => {
      await TestBed.configureTestingModule({ imports: [TwoSidedHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(TwoSidedHost);
      fixture.componentInstance.variant.set('elevated');
      await flushBack(fixture);
      const face = faces(fixture)[0];
      expect(face.className).toContain('bg-surface-raised');
      expect(face.className).toContain('shadow');
    });

    it('applies ghost variant classes', async () => {
      await TestBed.configureTestingModule({ imports: [TwoSidedHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(TwoSidedHost);
      fixture.componentInstance.variant.set('ghost');
      await flushBack(fixture);
      const face = faces(fixture)[0];
      expect(face.className).toContain('bg-transparent');
    });

    // ── Deprecated variant aliases ──
    //
    // `'outlined'` was renamed to `'outline'` (and was also the *default*, so
    // this rename moved the default spelling too). The old string must keep
    // rendering byte-identical classes: `tv()` returns base classes only for
    // an unrecognised variant value — no throw, no warning, just a silently
    // unstyled card. String equality is the literal encoding of that promise.
    //
    // Non-vacuous: delete the `outlined` entry from `VARIANT_ALIASES` and the
    // legacy string reaches `tv()` unrecognised, dropping
    // `bg-surface border border-border` from the face — the two strings
    // diverge and this fails.
    it('"outlined" resolves to exactly the same classes as "outline"', async () => {
      await TestBed.configureTestingModule({ imports: [TwoSidedHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(TwoSidedHost);
      fixture.componentInstance.variant.set('outline');
      await flushBack(fixture);
      const canonicalFace = faces(fixture)[0].className;
      const canonicalRoot = host(fixture).className;

      fixture.componentInstance.variant.set('outlined');
      fixture.detectChanges();
      expect(faces(fixture)[0].className).toBe(canonicalFace);
      expect(host(fixture).className).toBe(canonicalRoot);
      expect(faces(fixture)[0].className).toContain('bg-surface');
      expect(faces(fixture)[0].className).toContain('border-border');
    });

    it('switches axis classes when direction changes', async () => {
      await TestBed.configureTestingModule({ imports: [TwoSidedHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(TwoSidedHost);
      await flushBack(fixture);
      const inner = fixture.nativeElement.querySelector(
        'tw-flip-card > div',
      ) as HTMLElement;
      expect(inner.className).toContain('tw-flip-axis-y');

      fixture.componentInstance.direction.set('vertical');
      fixture.detectChanges();
      expect(inner.className).toContain('tw-flip-axis-x');
    });

    // `duration-300` is deliberately off the codified transition scale — see
    // the justification comment on the `inner` slot in flip-card.ts. This
    // guards the token against a well-meaning "fix" to `duration-200`, and
    // against an arbitrary `duration-[...]` value.
    it('uses the off-scale duration-300 flip token (no arbitrary durations)', async () => {
      await TestBed.configureTestingModule({ imports: [TwoSidedHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(TwoSidedHost);
      await flushBack(fixture);
      const inner = fixture.nativeElement.querySelector(
        'tw-flip-card > div',
      ) as HTMLElement;
      expect(inner.className).toContain('duration-300');
      expect(inner.className).not.toMatch(/duration-\[/);
    });
  });

  describe('inputs', () => {
    let fixture: ComponentFixture<TwoSidedHost>;
    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [TwoSidedHost] })
        .compileComponents();
      fixture = TestBed.createComponent(TwoSidedHost);
      await flushBack(fixture);
    });

    it('applies tw-flip-rotated on inner when flipped is true', () => {
      fixture.componentInstance.flipped.set(true);
      fixture.detectChanges();
      const inner = fixture.nativeElement.querySelector(
        'tw-flip-card > div',
      ) as HTMLElement;
      expect(inner.className).toContain('tw-flip-rotated');
    });

    it('applies disabled styling and removes tabindex', () => {
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      const el = host(fixture);
      expect(el.className).toContain('opacity-50');
      expect(el.className).toContain('cursor-not-allowed');
      expect(el.getAttribute('tabindex')).toBeNull();
      expect(el.getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('interactions', () => {
    let fixture: ComponentFixture<TwoSidedHost>;
    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [TwoSidedHost] })
        .compileComponents();
      fixture = TestBed.createComponent(TwoSidedHost);
      await flushBack(fixture);
    });

    it('click toggles flipped when trigger is click', () => {
      fixture.componentInstance.trigger.set('click');
      fixture.detectChanges();
      const el = host(fixture);
      el.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.flipped()).toBe(true);
      el.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.flipped()).toBe(false);
    });

    it('click toggles flipped when trigger is both', () => {
      const el = host(fixture);
      el.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.flipped()).toBe(true);
    });

    it('click does not toggle when trigger is manual', () => {
      fixture.componentInstance.trigger.set('manual');
      fixture.detectChanges();
      host(fixture).click();
      fixture.detectChanges();
      expect(fixture.componentInstance.flipped()).toBe(false);
    });

    it('mouseenter flips to true and mouseleave flips to false when trigger includes hover', () => {
      fixture.componentInstance.trigger.set('hover');
      fixture.detectChanges();
      const el = host(fixture);
      el.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();
      expect(fixture.componentInstance.flipped()).toBe(true);
      el.dispatchEvent(new MouseEvent('mouseleave'));
      fixture.detectChanges();
      expect(fixture.componentInstance.flipped()).toBe(false);
    });

    it('ignores hover when trigger is click', () => {
      fixture.componentInstance.trigger.set('click');
      fixture.detectChanges();
      host(fixture).dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();
      expect(fixture.componentInstance.flipped()).toBe(false);
    });

    it('Enter toggles flipped and calls preventDefault', () => {
      fixture.componentInstance.trigger.set('click');
      fixture.detectChanges();
      const ev = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
      host(fixture).dispatchEvent(ev);
      fixture.detectChanges();
      expect(fixture.componentInstance.flipped()).toBe(true);
      expect(ev.defaultPrevented).toBe(true);
    });

    it('Space toggles flipped and calls preventDefault', () => {
      fixture.componentInstance.trigger.set('click');
      fixture.detectChanges();
      const ev = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
      host(fixture).dispatchEvent(ev);
      fixture.detectChanges();
      expect(fixture.componentInstance.flipped()).toBe(true);
      expect(ev.defaultPrevented).toBe(true);
    });

    it('ignores other keys and does not call preventDefault', () => {
      fixture.componentInstance.trigger.set('click');
      fixture.detectChanges();
      const ev = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
      host(fixture).dispatchEvent(ev);
      fixture.detectChanges();
      expect(fixture.componentInstance.flipped()).toBe(false);
      expect(ev.defaultPrevented).toBe(false);
    });

    it('does not toggle when disabled', () => {
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      host(fixture).click();
      fixture.detectChanges();
      expect(fixture.componentInstance.flipped()).toBe(false);
    });
  });

  describe('outputs', () => {
    it('emits flippedChange with the new value on click', async () => {
      await TestBed.configureTestingModule({ imports: [TwoSidedHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(TwoSidedHost);
      await flushBack(fixture);
      fixture.componentInstance.trigger.set('click');
      fixture.detectChanges();
      host(fixture).click();
      fixture.detectChanges();
      expect(fixture.componentInstance.flippedChange).toHaveBeenCalledWith(true);
      host(fixture).click();
      fixture.detectChanges();
      expect(fixture.componentInstance.flippedChange).toHaveBeenCalledWith(false);
    });

    it('emits flippedChange exactly once per toggle (no double emission)', async () => {
      await TestBed.configureTestingModule({ imports: [TwoSidedHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(TwoSidedHost);
      await flushBack(fixture);
      fixture.componentInstance.trigger.set('click');
      fixture.detectChanges();
      const spy = fixture.componentInstance.flippedChange;
      spy.mockClear();
      host(fixture).click();
      fixture.detectChanges();
      expect(spy).toHaveBeenCalledTimes(1);
      host(fixture).click();
      fixture.detectChanges();
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('does not emit when click happens on front-only card', async () => {
      await TestBed.configureTestingModule({ imports: [FrontOnlyHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(FrontOnlyHost);
      await flushBack(fixture);
      host(fixture).click();
      fixture.detectChanges();
      // No observable effect on the host — implicitly, no errors and state
      // remains consistent. Explicit: host has no `aria-pressed`.
      expect(host(fixture).getAttribute('aria-pressed')).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('click/both/hover modes set role=button, tabindex=0, aria-pressed', async () => {
      await TestBed.configureTestingModule({ imports: [TwoSidedHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(TwoSidedHost);
      await flushBack(fixture);
      const el = host(fixture);
      expect(el.getAttribute('role')).toBe('button');
      expect(el.getAttribute('tabindex')).toBe('0');
      expect(el.getAttribute('aria-pressed')).toBe('false');

      fixture.componentInstance.flipped.set(true);
      fixture.detectChanges();
      expect(el.getAttribute('aria-pressed')).toBe('true');
    });

    it('manual mode sets role=region, no tabindex, no aria-pressed', async () => {
      await TestBed.configureTestingModule({ imports: [TwoSidedHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(TwoSidedHost);
      fixture.componentInstance.trigger.set('manual');
      await flushBack(fixture);
      const el = host(fixture);
      expect(el.getAttribute('role')).toBe('region');
      expect(el.getAttribute('tabindex')).toBeNull();
      expect(el.getAttribute('aria-pressed')).toBeNull();
    });

    it('manual mode applies a default aria-label so role=region has an accessible name', async () => {
      await TestBed.configureTestingModule({ imports: [ManualLabelHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(ManualLabelHost);
      await flushBack(fixture);
      expect(host(fixture).getAttribute('aria-label')).toBe('Flip card');
    });

    it('ariaLabel input overrides the default region label', async () => {
      await TestBed.configureTestingModule({ imports: [ManualLabelHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(ManualLabelHost);
      fixture.componentInstance.ariaLabel.set('Invoice summary');
      await flushBack(fixture);
      expect(host(fixture).getAttribute('aria-label')).toBe('Invoice summary');
    });

    it('a consumer-written aria-label attribute wins over the "Flip card" fallback', async () => {
      await TestBed.configureTestingModule({ imports: [StaticAriaLabelHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(StaticAriaLabelHost);
      await flushBack(fixture);
      expect(host(fixture).getAttribute('aria-label')).toBe('Invoice #00412 summary');
      expect(host(fixture).getAttribute('aria-label')).not.toBe('Flip card');
    });

    it('interactive modes leave aria-label unset by default (accessible name comes from visible face)', async () => {
      await TestBed.configureTestingModule({ imports: [TwoSidedHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(TwoSidedHost);
      await flushBack(fixture);
      expect(host(fixture).getAttribute('aria-label')).toBeNull();
    });

    it('front-only card has no tabindex (non-interactive)', async () => {
      await TestBed.configureTestingModule({ imports: [FrontOnlyHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(FrontOnlyHost);
      await flushBack(fixture);
      expect(host(fixture).getAttribute('tabindex')).toBeNull();
    });

    it('hides the back face from assistive tech when not flipped', async () => {
      await TestBed.configureTestingModule({ imports: [TwoSidedHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(TwoSidedHost);
      await flushBack(fixture);
      const [front, back] = Array.from(faces(fixture));
      expect(front.getAttribute('aria-hidden')).toBeNull();
      expect(back.getAttribute('aria-hidden')).toBe('true');
      expect(front.getAttribute('inert')).toBeNull();
      expect(back.getAttribute('inert')).toBe('');
    });

    it('flips aria-hidden and inert to the front face when flipped', async () => {
      await TestBed.configureTestingModule({ imports: [TwoSidedHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(TwoSidedHost);
      await flushBack(fixture);
      fixture.componentInstance.flipped.set(true);
      fixture.detectChanges();
      const [front, back] = Array.from(faces(fixture));
      expect(front.getAttribute('aria-hidden')).toBe('true');
      expect(back.getAttribute('aria-hidden')).toBeNull();
      expect(front.getAttribute('inert')).toBe('');
      expect(back.getAttribute('inert')).toBeNull();
    });
  });

  describe('content projection', () => {
    it('projects both slots into their face wrappers', async () => {
      await TestBed.configureTestingModule({ imports: [TwoSidedHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(TwoSidedHost);
      await flushBack(fixture);
      const list = faces(fixture);
      expect(list.length).toBe(2);
      expect(list[0].textContent).toContain('Front');
      expect(list[1].textContent).toContain('Back');
    });

    it('hides the back wrapper visually when no back content is projected', async () => {
      await TestBed.configureTestingModule({ imports: [FrontOnlyHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(FrontOnlyHost);
      await flushBack(fixture);
      const back = faces(fixture)[1];
      expect(back.className).toContain('hidden');
    });

    it('reacts when back content is dynamically projected later', async () => {
      await TestBed.configureTestingModule({ imports: [DynamicBackHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(DynamicBackHost);
      await flushBack(fixture);
      const el = host(fixture);
      expect(el.getAttribute('tabindex')).toBeNull();

      fixture.componentInstance.showBack.set(true);
      await flushBack(fixture);
      expect(el.getAttribute('tabindex')).toBe('0');
      expect(el.getAttribute('role')).toBe('button');
    });
  });

  describe('LiveAnnouncer (all interactive modes)', () => {
    // Regression guard for the double-announcement bug: manual mode used to
    // mark the host `aria-live="polite"` *and* call `LiveAnnouncer.announce`,
    // so a single flip reached the AT twice — once from the live region
    // observing the `aria-hidden` face swap, once from the announcer.
    // `LiveAnnouncer` is now the only channel, in every trigger mode.
    //
    // Non-vacuous against the old code: `aria-live` was bound to `ariaLive()`,
    // which returned `'polite'` for `trigger="manual"`, so the first
    // expectation below read `'polite'` and failed. The second half (exactly
    // one announce per flip) held before and after — it is here to prove the
    // surviving channel was not removed along with the region.
    it('manual mode announces through LiveAnnouncer only — no host aria-live region', async () => {
      const announce = vi.fn();
      const liveAnnouncerStub = { announce, clear: vi.fn() };
      await TestBed.configureTestingModule({
        imports: [TwoSidedHost],
        providers: [{ provide: LiveAnnouncer, useValue: liveAnnouncerStub }],
      }).compileComponents();
      const fixture = TestBed.createComponent(TwoSidedHost);
      fixture.componentInstance.trigger.set('manual');
      await flushBack(fixture);

      expect(host(fixture).getAttribute('aria-live')).toBeNull();

      fixture.componentInstance.flipped.set(true);
      fixture.detectChanges();
      expect(announce).toHaveBeenCalledTimes(1);
      expect(announce).toHaveBeenLastCalledWith('Back face visible');
    });

    it('no trigger mode puts an aria-live region on the host', async () => {
      await TestBed.configureTestingModule({ imports: [TwoSidedHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(TwoSidedHost);
      for (const mode of ['manual', 'click', 'hover', 'both'] as const) {
        fixture.componentInstance.trigger.set(mode);
        await flushBack(fixture);
        expect(host(fixture).getAttribute('aria-live')).toBeNull();
      }
    });

    it('announces face transitions in manual mode and skips first render', async () => {
      const announce = vi.fn();
      const liveAnnouncerStub = { announce, clear: vi.fn() };
      await TestBed.configureTestingModule({
        imports: [TwoSidedHost],
        providers: [{ provide: LiveAnnouncer, useValue: liveAnnouncerStub }],
      }).compileComponents();
      const fixture = TestBed.createComponent(TwoSidedHost);
      fixture.componentInstance.trigger.set('manual');
      await flushBack(fixture);
      expect(announce).not.toHaveBeenCalled();

      fixture.componentInstance.flipped.set(true);
      fixture.detectChanges();
      expect(announce).toHaveBeenLastCalledWith('Back face visible');

      fixture.componentInstance.flipped.set(false);
      fixture.detectChanges();
      expect(announce).toHaveBeenLastCalledWith('Front face visible');
      expect(announce).toHaveBeenCalledTimes(2);
    });

    it('announces face transitions in click mode', async () => {
      const announce = vi.fn();
      const liveAnnouncerStub = { announce, clear: vi.fn() };
      await TestBed.configureTestingModule({
        imports: [TwoSidedHost],
        providers: [{ provide: LiveAnnouncer, useValue: liveAnnouncerStub }],
      }).compileComponents();
      const fixture = TestBed.createComponent(TwoSidedHost);
      fixture.componentInstance.trigger.set('click');
      await flushBack(fixture);
      expect(announce).not.toHaveBeenCalled();

      host(fixture).click();
      fixture.detectChanges();
      expect(announce).toHaveBeenLastCalledWith('Back face visible');

      host(fixture).click();
      fixture.detectChanges();
      expect(announce).toHaveBeenLastCalledWith('Front face visible');
      expect(announce).toHaveBeenCalledTimes(2);
    });

    it('announces face transitions in hover mode', async () => {
      const announce = vi.fn();
      const liveAnnouncerStub = { announce, clear: vi.fn() };
      await TestBed.configureTestingModule({
        imports: [TwoSidedHost],
        providers: [{ provide: LiveAnnouncer, useValue: liveAnnouncerStub }],
      }).compileComponents();
      const fixture = TestBed.createComponent(TwoSidedHost);
      fixture.componentInstance.trigger.set('hover');
      await flushBack(fixture);
      expect(announce).not.toHaveBeenCalled();

      host(fixture).dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();
      expect(announce).toHaveBeenLastCalledWith('Back face visible');

      host(fixture).dispatchEvent(new MouseEvent('mouseleave'));
      fixture.detectChanges();
      expect(announce).toHaveBeenLastCalledWith('Front face visible');
      expect(announce).toHaveBeenCalledTimes(2);
    });

    it('does not announce when the card has no back face', async () => {
      const announce = vi.fn();
      const liveAnnouncerStub = { announce, clear: vi.fn() };
      await TestBed.configureTestingModule({
        imports: [FrontOnlyHost],
        providers: [{ provide: LiveAnnouncer, useValue: liveAnnouncerStub }],
      }).compileComponents();
      const fixture = TestBed.createComponent(FrontOnlyHost);
      await flushBack(fixture);
      // No back face — clicks don't flip and no announcement happens.
      host(fixture).click();
      fixture.detectChanges();
      expect(announce).not.toHaveBeenCalled();
    });
  });
});
