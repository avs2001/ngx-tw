import { Component, input } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';
import { AspectRatioDirective } from './aspect-ratio';

// ── Test host components ──────────────────────────────────────────

@Component({
  imports: [AspectRatioDirective],
  template: `<div [twAspectRatio]="ratio()"></div>`,
})
class RatioHost {
  readonly ratio = input<number | string>('1/1');
}

@Component({
  imports: [AspectRatioDirective],
  template: `<div twAspectRatio></div>`,
})
class BareHost {}

@Component({
  imports: [AspectRatioDirective],
  template: `<img twAspectRatio="16/9" alt="Preview" />`,
})
class ImageHost {}

// ── Helpers ───────────────────────────────────────────────────────

// The directive is applied via property binding on bound hosts, so it leaves no
// literal `twAspectRatio` attribute to query — grab the rendered host element
// directly.
function getHost(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.firstElementChild as HTMLElement;
}

/**
 * Reads the applied `aspect-ratio` via `getPropertyValue` rather than the
 * camelCase `.aspectRatio` accessor — jsdom's CSSOM does not reliably define
 * the named accessor, but the generic property store is always populated.
 */
function appliedRatio(fixture: ComponentFixture<unknown>): string {
  return getHost(fixture).style.getPropertyValue('aspect-ratio');
}

function mount(ratio: number | string): ComponentFixture<RatioHost> {
  const fixture = TestBed.createComponent(RatioHost);
  fixture.componentRef.setInput('ratio', ratio);
  fixture.detectChanges();
  return fixture;
}

// ── Tests ─────────────────────────────────────────────────────────

describe('AspectRatioDirective', () => {
  // Smoke-test the jsdom style read first: if this returns '', every other
  // assertion would fail for an environment reason, not a logic error.
  describe('default / zero-config', () => {
    it('should apply the default 1/1 ratio for a bare attribute', () => {
      const fixture = TestBed.createComponent(BareHost);
      fixture.detectChanges();
      expect(appliedRatio(fixture)).toBe('1 / 1');
    });
  });

  describe('valid inputs', () => {
    it('should normalize a positive number to w / 1 form', () => {
      expect(appliedRatio(mount(1.7777))).toBe('1.7777 / 1');
    });

    it('should normalize a slash ratio string', () => {
      expect(appliedRatio(mount('16/9'))).toBe('16 / 9');
    });

    it('should normalize a colon ratio string to slash form', () => {
      expect(appliedRatio(mount('16:9'))).toBe('16 / 9');
    });

    it('should normalize a plain numeric string to w / 1 form', () => {
      expect(appliedRatio(mount('1.5'))).toBe('1.5 / 1');
    });

    it('should trim whitespace around a ratio string', () => {
      expect(appliedRatio(mount(' 16 / 9 '))).toBe('16 / 9');
    });

    it('should accept a bound numeric expression result', () => {
      // 4 / 3 evaluates to a number before reaching the directive.
      expect(appliedRatio(mount(4 / 3))).toBe(`${4 / 3} / 1`);
    });
  });

  describe('invalid inputs fall back to 1/1', () => {
    const invalid: readonly (number | string)[] = [
      '',
      '   ',
      'abc',
      '0',
      '-2',
      '16/0',
      '0/1',
      '-16/9',
      '16px/9',
      '16/9/2',
      '16:9:2',
      NaN,
      0,
      -1,
    ];

    for (const value of invalid) {
      it(`should fall back for ${JSON.stringify(value)}`, () => {
        expect(appliedRatio(mount(value))).toBe('1 / 1');
      });
    }
  });

  describe('reactivity', () => {
    it('should update the applied ratio when the input changes', () => {
      const fixture = mount('16/9');
      expect(appliedRatio(fixture)).toBe('16 / 9');
      fixture.componentRef.setInput('ratio', '4:3');
      fixture.detectChanges();
      expect(appliedRatio(fixture)).toBe('4 / 3');
    });

    it('should fall back when a valid value is replaced by an invalid one', () => {
      const fixture = mount('21/9');
      expect(appliedRatio(fixture)).toBe('21 / 9');
      fixture.componentRef.setInput('ratio', 'nonsense');
      fixture.detectChanges();
      expect(appliedRatio(fixture)).toBe('1 / 1');
    });
  });

  describe('non-interference', () => {
    it('should add no role or aria-* attributes', () => {
      const fixture = mount('16/9');
      const el = getHost(fixture);
      expect(el.getAttribute('role')).toBeNull();
      expect(el.getAttributeNames().some((n) => n.startsWith('aria-'))).toBe(false);
    });

    it('should leave host media accessibility intact', () => {
      const fixture = TestBed.createComponent(ImageHost);
      fixture.detectChanges();
      const img = getHost(fixture);
      expect(img.getAttribute('alt')).toBe('Preview');
      expect(appliedRatio(fixture)).toBe('16 / 9');
    });
  });
});
