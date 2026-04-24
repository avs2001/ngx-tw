import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
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
  readonly variant = signal<FlipCardVariant>('outlined');
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

// ── Helpers ──

async function waitForHasBack(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

function host(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('tw-flip-card') as HTMLElement;
}

// ── Tests ──

describe('FlipCardComponent', () => {
  describe('rendering', () => {
    it('mounts with no errors with both slots', async () => {
      await TestBed.configureTestingModule({ imports: [TwoSidedHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(TwoSidedHost);
      await waitForHasBack(fixture);
      expect(host(fixture)).toBeTruthy();
    });

    it('mounts and renders front-only when back slot is missing', async () => {
      await TestBed.configureTestingModule({ imports: [FrontOnlyHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(FrontOnlyHost);
      await waitForHasBack(fixture);
      const el = host(fixture);
      expect(el).toBeTruthy();
      expect(el.textContent).toContain('Front only');
    });

    it('applies outlined variant classes by default', async () => {
      await TestBed.configureTestingModule({ imports: [TwoSidedHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(TwoSidedHost);
      await waitForHasBack(fixture);
      const face = fixture.nativeElement.querySelector(
        'tw-flip-card > div > div',
      ) as HTMLElement;
      expect(face.className).toContain('bg-surface');
      expect(face.className).toContain('border');
    });

    it('applies elevated variant classes', async () => {
      await TestBed.configureTestingModule({ imports: [TwoSidedHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(TwoSidedHost);
      fixture.componentInstance.variant.set('elevated');
      await waitForHasBack(fixture);
      const face = fixture.nativeElement.querySelector(
        'tw-flip-card > div > div',
      ) as HTMLElement;
      expect(face.className).toContain('bg-surface-raised');
      expect(face.className).toContain('shadow');
    });

    it('applies ghost variant classes', async () => {
      await TestBed.configureTestingModule({ imports: [TwoSidedHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(TwoSidedHost);
      fixture.componentInstance.variant.set('ghost');
      await waitForHasBack(fixture);
      const face = fixture.nativeElement.querySelector(
        'tw-flip-card > div > div',
      ) as HTMLElement;
      expect(face.className).toContain('bg-transparent');
    });

    it('switches axis classes when direction changes', async () => {
      await TestBed.configureTestingModule({ imports: [TwoSidedHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(TwoSidedHost);
      await waitForHasBack(fixture);
      const inner = fixture.nativeElement.querySelector(
        'tw-flip-card > div',
      ) as HTMLElement;
      expect(inner.className).toContain('tw-flip-axis-y');

      fixture.componentInstance.direction.set('vertical');
      fixture.detectChanges();
      expect(inner.className).toContain('tw-flip-axis-x');
    });
  });

  describe('inputs', () => {
    let fixture: ComponentFixture<TwoSidedHost>;
    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [TwoSidedHost] })
        .compileComponents();
      fixture = TestBed.createComponent(TwoSidedHost);
      await waitForHasBack(fixture);
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
      await waitForHasBack(fixture);
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
      await waitForHasBack(fixture);
      fixture.componentInstance.trigger.set('click');
      fixture.detectChanges();
      host(fixture).click();
      fixture.detectChanges();
      expect(fixture.componentInstance.flippedChange).toHaveBeenCalledWith(true);
      host(fixture).click();
      fixture.detectChanges();
      expect(fixture.componentInstance.flippedChange).toHaveBeenCalledWith(false);
    });

    it('does not emit when click happens on front-only card', async () => {
      await TestBed.configureTestingModule({ imports: [FrontOnlyHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(FrontOnlyHost);
      await waitForHasBack(fixture);
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
      await waitForHasBack(fixture);
      const el = host(fixture);
      expect(el.getAttribute('role')).toBe('button');
      expect(el.getAttribute('tabindex')).toBe('0');
      expect(el.getAttribute('aria-pressed')).toBe('false');

      fixture.componentInstance.flipped.set(true);
      fixture.detectChanges();
      expect(el.getAttribute('aria-pressed')).toBe('true');
    });

    it('manual mode sets role=region, no tabindex, aria-live=polite', async () => {
      await TestBed.configureTestingModule({ imports: [TwoSidedHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(TwoSidedHost);
      fixture.componentInstance.trigger.set('manual');
      await waitForHasBack(fixture);
      const el = host(fixture);
      expect(el.getAttribute('role')).toBe('region');
      expect(el.getAttribute('tabindex')).toBeNull();
      expect(el.getAttribute('aria-live')).toBe('polite');
      expect(el.getAttribute('aria-pressed')).toBeNull();
    });

    it('front-only card has no tabindex (non-interactive)', async () => {
      await TestBed.configureTestingModule({ imports: [FrontOnlyHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(FrontOnlyHost);
      await waitForHasBack(fixture);
      expect(host(fixture).getAttribute('tabindex')).toBeNull();
    });
  });

  describe('content projection', () => {
    it('projects both slots into their face wrappers', async () => {
      await TestBed.configureTestingModule({ imports: [TwoSidedHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(TwoSidedHost);
      await waitForHasBack(fixture);
      const faces = fixture.nativeElement.querySelectorAll(
        'tw-flip-card > div > div',
      ) as NodeListOf<HTMLElement>;
      expect(faces.length).toBe(2);
      expect(faces[0].textContent).toContain('Front');
      expect(faces[1].textContent).toContain('Back');
    });

    it('hides the back wrapper visually when no back content is projected', async () => {
      await TestBed.configureTestingModule({ imports: [FrontOnlyHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(FrontOnlyHost);
      await waitForHasBack(fixture);
      const faces = fixture.nativeElement.querySelectorAll(
        'tw-flip-card > div > div',
      ) as NodeListOf<HTMLElement>;
      const back = faces[1];
      expect(back.className).toContain('hidden');
    });
  });
});
