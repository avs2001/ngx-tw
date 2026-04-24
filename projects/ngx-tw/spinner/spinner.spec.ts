import { Component, input } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { SpinnerComponent } from './spinner';
import type { SpinnerColor, SpinnerSize, SpinnerVariant } from './spinner';
import type { TwColor } from 'ngx-tw/core';

// ── Test host components ──────────────────────────────────────────

@Component({
  imports: [SpinnerComponent],
  template: `<tw-spinner />`,
})
class DefaultSpinnerHost {}

@Component({
  imports: [SpinnerComponent],
  template: `
    <tw-spinner
      [variant]="variant()"
      [color]="color()"
      [size]="size()"
      [track]="track()"
      [label]="label()"
    />
  `,
})
class ConfiguredSpinnerHost {
  readonly variant = input<SpinnerVariant>('circular');
  readonly color = input<SpinnerColor>('current');
  readonly size = input<SpinnerSize>('md');
  readonly track = input(true);
  readonly label = input('Loading');
}

@Component({
  imports: [SpinnerComponent],
  template: `<div class="text-info-600"><tw-spinner /></div>`,
})
class InheritColorHost {}

// ── Helpers ───────────────────────────────────────────────────────

function getSpinner(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('tw-spinner')!;
}

// ── Tests ─────────────────────────────────────────────────────────

describe('SpinnerComponent', () => {
  describe('rendering', () => {
    it('renders without inputs', () => {
      const fixture = TestBed.createComponent(DefaultSpinnerHost);
      fixture.detectChanges();
      expect(getSpinner(fixture)).toBeTruthy();
    });

    it('renders role="status" and aria-live="polite" on the host', () => {
      const fixture = TestBed.createComponent(DefaultSpinnerHost);
      fixture.detectChanges();
      const el = getSpinner(fixture);
      expect(el.getAttribute('role')).toBe('status');
      expect(el.getAttribute('aria-live')).toBe('polite');
    });

    it('renders a visually-hidden label with default text "Loading"', () => {
      const fixture = TestBed.createComponent(DefaultSpinnerHost);
      fixture.detectChanges();
      const sr = getSpinner(fixture).querySelector('.sr-only');
      expect(sr).toBeTruthy();
      expect(sr!.textContent?.trim()).toBe('Loading');
    });

    it('renders the circular SVG by default', () => {
      const fixture = TestBed.createComponent(DefaultSpinnerHost);
      fixture.detectChanges();
      const svg = getSpinner(fixture).querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg!.getAttribute('aria-hidden')).toBe('true');
      expect(svg!.querySelectorAll('circle').length).toBe(2);
    });

    it('does not render a tabindex (non-interactive)', () => {
      const fixture = TestBed.createComponent(DefaultSpinnerHost);
      fixture.detectChanges();
      expect(getSpinner(fixture).hasAttribute('tabindex')).toBe(false);
    });
  });

  describe('variants', () => {
    const variants: SpinnerVariant[] = ['circular', 'dots', 'bars'];
    for (const variant of variants) {
      it(`renders variant="${variant}" without errors`, () => {
        const fixture = TestBed.createComponent(ConfiguredSpinnerHost);
        fixture.componentRef.setInput('variant', variant);
        fixture.detectChanges();
        expect(getSpinner(fixture)).toBeTruthy();
      });
    }

    it('renders an SVG for variant="circular"', () => {
      const fixture = TestBed.createComponent(ConfiguredSpinnerHost);
      fixture.componentRef.setInput('variant', 'circular');
      fixture.detectChanges();
      expect(getSpinner(fixture).querySelector('svg')).toBeTruthy();
    });

    it('renders three dots for variant="dots"', () => {
      const fixture = TestBed.createComponent(ConfiguredSpinnerHost);
      fixture.componentRef.setInput('variant', 'dots');
      fixture.detectChanges();
      const dots = getSpinner(fixture).querySelectorAll('.tw-spinner-dot');
      expect(dots.length).toBe(3);
      expect(getSpinner(fixture).querySelector('svg')).toBeNull();
    });

    it('renders three bars for variant="bars"', () => {
      const fixture = TestBed.createComponent(ConfiguredSpinnerHost);
      fixture.componentRef.setInput('variant', 'bars');
      fixture.detectChanges();
      const bars = getSpinner(fixture).querySelectorAll('.tw-spinner-bar');
      expect(bars.length).toBe(3);
      expect(getSpinner(fixture).querySelector('svg')).toBeNull();
    });
  });

  describe('colors', () => {
    const colors: TwColor[] = [
      'primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error',
    ];

    for (const color of colors) {
      it(`applies the text-${color}-500 class when color="${color}"`, () => {
        const fixture = TestBed.createComponent(ConfiguredSpinnerHost);
        fixture.componentRef.setInput('color', color);
        fixture.detectChanges();
        const expected = color === 'neutral' ? 'text-fg-muted' : `text-${color}-500`;
        expect(getSpinner(fixture).className).toContain(expected);
      });
    }

    it('applies no explicit color class when color="current"', () => {
      const fixture = TestBed.createComponent(ConfiguredSpinnerHost);
      fixture.componentRef.setInput('color', 'current');
      fixture.detectChanges();
      const cls = getSpinner(fixture).className;
      expect(cls).not.toMatch(/text-(primary|secondary|accent|info|success|warning|error)-500/);
      expect(cls).not.toContain('text-fg-muted');
    });

    it('inherits currentColor when hosted under a colored parent', () => {
      const fixture = TestBed.createComponent(InheritColorHost);
      fixture.detectChanges();
      const spinner = getSpinner(fixture);
      expect(spinner.className).not.toMatch(/text-(primary|secondary|accent|info|success|warning|error)-500/);
    });
  });

  describe('sizes', () => {
    const sizeCases: [SpinnerSize, string][] = [
      ['xs', 'size-3'],
      ['sm', 'size-4'],
      ['md', 'size-5'],
      ['lg', 'size-6'],
      ['xl', 'size-8'],
      ['inherit', 'size-[1em]'],
    ];

    for (const [size, expected] of sizeCases) {
      it(`applies ${expected} when size="${size}"`, () => {
        const fixture = TestBed.createComponent(ConfiguredSpinnerHost);
        fixture.componentRef.setInput('size', size);
        fixture.detectChanges();
        expect(getSpinner(fixture).className).toContain(expected);
      });
    }
  });

  describe('track', () => {
    it('renders two circles when track=true (default)', () => {
      const fixture = TestBed.createComponent(ConfiguredSpinnerHost);
      fixture.componentRef.setInput('variant', 'circular');
      fixture.detectChanges();
      expect(getSpinner(fixture).querySelectorAll('svg circle').length).toBe(2);
    });

    it('renders only the stroke circle when track=false', () => {
      const fixture = TestBed.createComponent(ConfiguredSpinnerHost);
      fixture.componentRef.setInput('variant', 'circular');
      fixture.componentRef.setInput('track', false);
      fixture.detectChanges();
      expect(getSpinner(fixture).querySelectorAll('svg circle').length).toBe(1);
    });
  });

  describe('label', () => {
    it('updates the sr-only label text', () => {
      const fixture = TestBed.createComponent(ConfiguredSpinnerHost);
      fixture.componentRef.setInput('label', 'Uploading file');
      fixture.detectChanges();
      expect(getSpinner(fixture).querySelector('.sr-only')!.textContent?.trim()).toBe(
        'Uploading file',
      );
    });

    it('does not set aria-label on the host (label is owned by the sr-only child)', () => {
      const fixture = TestBed.createComponent(ConfiguredSpinnerHost);
      fixture.componentRef.setInput('label', 'Syncing');
      fixture.detectChanges();
      expect(getSpinner(fixture).hasAttribute('aria-label')).toBe(false);
    });
  });

  describe('reduced motion', () => {
    it('applies motion-reduce:animate-none to the circular SVG', () => {
      const fixture = TestBed.createComponent(ConfiguredSpinnerHost);
      fixture.componentRef.setInput('variant', 'circular');
      fixture.detectChanges();
      const svg = getSpinner(fixture).querySelector('svg')!;
      expect(svg.getAttribute('class')).toContain('motion-reduce:animate-none');
    });

    it('applies animate-spin to the circular SVG', () => {
      const fixture = TestBed.createComponent(ConfiguredSpinnerHost);
      fixture.componentRef.setInput('variant', 'circular');
      fixture.detectChanges();
      const svg = getSpinner(fixture).querySelector('svg')!;
      expect(svg.getAttribute('class')).toContain('animate-spin');
    });
  });
});
