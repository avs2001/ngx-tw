import { Component, input } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';
import { BadgeDotDirective } from './badge-dot';
import type { TwColor, TwSize } from 'ngx-tw/core';

// ── Test host components ──────────────────────────────────────────

@Component({
  imports: [BadgeDotDirective],
  template: `<span twBadgeDot [color]="color()" [size]="size()" [live]="live()"></span>`,
})
class DotHost {
  readonly color = input<TwColor>('neutral');
  readonly size = input<TwSize>('md');
  readonly live = input(false);
}

@Component({
  imports: [BadgeDotDirective],
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
      expect(el.className).toContain('inline-block');
      expect(el.className).toContain('rounded-full');
      expect(el.className).toContain('shrink-0');
    });

    it('should not render any child content', () => {
      const fixture = TestBed.createComponent(BasicDotHost);
      fixture.detectChanges();
      expect(getDot(fixture).childNodes.length).toBe(0);
    });
  });

  describe('color', () => {
    const colorMatrix: ReadonlyArray<{ color: TwColor; expected: string }> = [
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
    const sizeMatrix: ReadonlyArray<{ size: TwSize; expected: string }> = [
      { size: 'xs', expected: 'size-1.5' },
      { size: 'sm', expected: 'size-1.5' },
      { size: 'md', expected: 'size-2' },
      { size: 'lg', expected: 'size-2.5' },
      { size: 'xl', expected: 'size-2.5' },
    ];

    for (const { size, expected } of sizeMatrix) {
      it(`should apply ${expected} for size="${size}"`, () => {
        const fixture = TestBed.createComponent(DotHost);
        fixture.componentRef.setInput('size', size);
        fixture.detectChanges();
        expect(getDot(fixture).className).toContain(expected);
      });
    }
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
