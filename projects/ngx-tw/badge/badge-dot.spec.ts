import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';
import { BadgeDotDirective } from './badge-dot';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';

// ── Test host components ──────────────────────────────────────────

@Component({
  imports: [BadgeDotDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<span twBadgeDot [color]="color()" [size]="size()" [live]="live()"></span>`,
})
class DotHost {
  readonly color = input<TwColor>('neutral');
  readonly size = input<TwSize>('md');
  readonly live = input(false);
}

@Component({
  imports: [BadgeDotDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<span twBadgeDot></span>`,
})
class BasicDotHost {}

// ── Helpers ───────────────────────────────────────────────────────

function getDot(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('[twBadgeDot]')!;
}

// ── Tests ─────────────────────────────────────────────────────────

describe('BadgeDotDirective', () => {
  describe('rendering', () => {
    it('should apply base shape classes', () => {
      const fixture = TestBed.createComponent(BasicDotHost);
      fixture.detectChanges();
      const el = getDot(fixture);
      expect(el).toBeTruthy();
      expect(el.classList.contains('inline-block')).toBe(true);
      expect(el.classList.contains('rounded-full')).toBe(true);
      expect(el.classList.contains('shrink-0')).toBe(true);
    });

    it('should not render any child content', () => {
      const fixture = TestBed.createComponent(BasicDotHost);
      fixture.detectChanges();
      expect(getDot(fixture).childNodes.length).toBe(0);
    });
  });

  describe('color', () => {
    const colorMatrix: readonly { color: TwColor; expected: string }[] = [
      { color: 'primary', expected: 'bg-primary-500' },
      { color: 'secondary', expected: 'bg-secondary-500' },
      { color: 'accent', expected: 'bg-accent-500' },
      { color: 'neutral', expected: 'bg-fg-muted' },
      { color: 'info', expected: 'bg-info-500' },
      { color: 'success', expected: 'bg-success-500' },
      { color: 'warning', expected: 'bg-warning-500' },
      { color: 'error', expected: 'bg-error-500' },
    ];

    for (const { color, expected } of colorMatrix) {
      it(`should apply ${expected} for color="${color}"`, () => {
        const fixture = TestBed.createComponent(DotHost);
        fixture.componentRef.setInput('color', color);
        fixture.detectChanges();
        expect(getDot(fixture).className).toContain(expected);
      });
    }
  });

  describe('size', () => {
    // The dot has no text and no children, so its rendered diameter is the only thing the
    // size input controls and the only thing there is to assert. xs/sm/md are CLAUDE.md's
    // documented dot sub-scale; lg/xl continue its 2px cadence up to the 16px ceiling that
    // the "never size-5 for a dot indicator" rule imposes.
    const sizeMatrix: readonly { size: TwSize; expected: string }[] = [
      { size: 'xs', expected: 'size-2' },
      { size: 'sm', expected: 'size-2.5' },
      { size: 'md', expected: 'size-3' },
      { size: 'lg', expected: 'size-3.5' },
      { size: 'xl', expected: 'size-4' },
    ];

    for (const { size, expected } of sizeMatrix) {
      it(`should apply ${expected} for size="${size}"`, () => {
        const fixture = TestBed.createComponent(DotHost);
        fixture.componentRef.setInput('size', size);
        fixture.detectChanges();
        expect(getDot(fixture).className).toContain(expected);
      });
    }

    // Dead-step guard. The dot previously rendered 6/6/8/10/10px, so `xs` and `sm` were
    // indistinguishable and so were `lg` and `xl` — two of the five steps did nothing.
    // Do not collapse this into the matrix above: it asserts the property (five steps that
    // differ) rather than the values, and it is what fails if a future edit reintroduces a
    // duplicate.
    it('should render a different size for every step of the size axis', () => {
      const sizes: readonly TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
      const fixture = TestBed.createComponent(DotHost);
      const rendered = sizes.map(size => {
        fixture.componentRef.setInput('size', size);
        fixture.detectChanges();
        return getDot(fixture).className;
      });

      expect(new Set(rendered).size).toBe(sizes.length);
    });
  });

  describe('accessibility', () => {
    it('should not set role by default (decorative dot)', () => {
      const fixture = TestBed.createComponent(BasicDotHost);
      fixture.detectChanges();
      expect(getDot(fixture).getAttribute('role')).toBeNull();
    });

    it('should set role="status" when live is true', () => {
      const fixture = TestBed.createComponent(DotHost);
      fixture.componentRef.setInput('live', true);
      fixture.detectChanges();
      expect(getDot(fixture).getAttribute('role')).toBe('status');
    });

    it('should remove role when live flips back to false', () => {
      const fixture = TestBed.createComponent(DotHost);
      fixture.componentRef.setInput('live', true);
      fixture.detectChanges();
      expect(getDot(fixture).getAttribute('role')).toBe('status');
      fixture.componentRef.setInput('live', false);
      fixture.detectChanges();
      expect(getDot(fixture).getAttribute('role')).toBeNull();
    });
  });
});
