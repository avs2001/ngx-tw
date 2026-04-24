import { Component, input } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProgressBarComponent } from './progress-bar';
import type {
  ProgressBarSize,
  ProgressBarValueFormatter,
  ProgressBarVariant,
} from './progress-bar';
import type { TwColor } from 'ngx-tw/core';

// ── Test host components ──────────────────────────────────────────

@Component({
  imports: [ProgressBarComponent],
  template: `<tw-progress-bar ariaLabel="test" />`,
})
class DefaultHost {}

@Component({
  imports: [ProgressBarComponent],
  template: `
    <tw-progress-bar
      [value]="value()"
      [min]="min()"
      [max]="max()"
      [variant]="variant()"
      [color]="color()"
      [size]="size()"
      [segments]="segments()"
      [label]="label()"
      [showValue]="showValue()"
      [valueFormatter]="valueFormatter()"
      [ariaLabel]="ariaLabel()"
      [ariaLabelledby]="ariaLabelledby()"
    />
  `,
})
class ConfiguredHost {
  readonly value = input<number | null | undefined>(null);
  readonly min = input(0);
  readonly max = input(100);
  readonly variant = input<ProgressBarVariant>('linear');
  readonly color = input<TwColor>('primary');
  readonly size = input<ProgressBarSize>('md');
  readonly segments = input(5);
  readonly label = input<string | undefined>('Test label');
  readonly showValue = input(false);
  readonly valueFormatter = input<ProgressBarValueFormatter | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly ariaLabelledby = input<string | undefined>(undefined);
}

// ── Helpers ───────────────────────────────────────────────────────

function getProgressEl(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('[role="progressbar"]')!;
}

function getFill(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('[role="progressbar"] > span')!;
}

// ── Tests ─────────────────────────────────────────────────────────

describe('ProgressBarComponent', () => {
  describe('rendering', () => {
    it('renders a progressbar element', () => {
      const fixture = TestBed.createComponent(DefaultHost);
      fixture.detectChanges();
      expect(getProgressEl(fixture)).toBeTruthy();
    });

    it('defaults to indeterminate when value is not set', () => {
      const fixture = TestBed.createComponent(DefaultHost);
      fixture.detectChanges();
      const el = getProgressEl(fixture);
      expect(el.hasAttribute('aria-valuenow')).toBe(false);
      expect(el.getAttribute('aria-busy')).toBe('true');
    });

    it('sets aria-valuemin and aria-valuemax from defaults', () => {
      const fixture = TestBed.createComponent(DefaultHost);
      fixture.detectChanges();
      const el = getProgressEl(fixture);
      expect(el.getAttribute('aria-valuemin')).toBe('0');
      expect(el.getAttribute('aria-valuemax')).toBe('100');
    });
  });

  describe('determinate mode', () => {
    it('sets aria-valuenow when value is provided', () => {
      const fixture = TestBed.createComponent(ConfiguredHost);
      fixture.componentRef.setInput('value', 50);
      fixture.detectChanges();
      const el = getProgressEl(fixture);
      expect(el.getAttribute('aria-valuenow')).toBe('50');
      expect(el.getAttribute('aria-valuetext')).toBe('50%');
      expect(el.hasAttribute('aria-busy')).toBe(false);
    });

    it('renders fill at 50% width for value=50', () => {
      const fixture = TestBed.createComponent(ConfiguredHost);
      fixture.componentRef.setInput('value', 50);
      fixture.detectChanges();
      const fill = getFill(fixture);
      expect(fill.style.width).toBe('50%');
    });

    it('renders fill at 0% for value=0', () => {
      const fixture = TestBed.createComponent(ConfiguredHost);
      fixture.componentRef.setInput('value', 0);
      fixture.detectChanges();
      expect(getFill(fixture).style.width).toBe('0%');
      expect(getProgressEl(fixture).getAttribute('aria-valuenow')).toBe('0');
    });

    it('renders fill at 100% for value=100', () => {
      const fixture = TestBed.createComponent(ConfiguredHost);
      fixture.componentRef.setInput('value', 100);
      fixture.detectChanges();
      expect(getFill(fixture).style.width).toBe('100%');
      expect(getProgressEl(fixture).getAttribute('aria-valuenow')).toBe('100');
    });

    it('clamps values below min to min', () => {
      const fixture = TestBed.createComponent(ConfiguredHost);
      fixture.componentRef.setInput('value', -10);
      fixture.detectChanges();
      expect(getProgressEl(fixture).getAttribute('aria-valuenow')).toBe('0');
      expect(getFill(fixture).style.width).toBe('0%');
    });

    it('clamps values above max to max', () => {
      const fixture = TestBed.createComponent(ConfiguredHost);
      fixture.componentRef.setInput('value', 150);
      fixture.detectChanges();
      expect(getProgressEl(fixture).getAttribute('aria-valuenow')).toBe('100');
      expect(getFill(fixture).style.width).toBe('100%');
    });

    it('supports custom min/max', () => {
      const fixture = TestBed.createComponent(ConfiguredHost);
      fixture.componentRef.setInput('min', 10);
      fixture.componentRef.setInput('max', 20);
      fixture.componentRef.setInput('value', 15);
      fixture.detectChanges();
      const el = getProgressEl(fixture);
      expect(el.getAttribute('aria-valuemin')).toBe('10');
      expect(el.getAttribute('aria-valuemax')).toBe('20');
      expect(el.getAttribute('aria-valuenow')).toBe('15');
      expect(getFill(fixture).style.width).toBe('50%');
    });
  });

  describe('indeterminate mode', () => {
    it('omits aria-valuenow and sets aria-busy when value is null', () => {
      const fixture = TestBed.createComponent(ConfiguredHost);
      fixture.componentRef.setInput('value', null);
      fixture.detectChanges();
      const el = getProgressEl(fixture);
      expect(el.hasAttribute('aria-valuenow')).toBe(false);
      expect(el.getAttribute('aria-busy')).toBe('true');
    });

    it('omits aria-valuenow when value is undefined', () => {
      const fixture = TestBed.createComponent(ConfiguredHost);
      fixture.componentRef.setInput('value', undefined);
      fixture.detectChanges();
      expect(getProgressEl(fixture).hasAttribute('aria-valuenow')).toBe(false);
    });

    it('applies the animate-progress-bar-indeterminate class to the fill', () => {
      const fixture = TestBed.createComponent(ConfiguredHost);
      fixture.componentRef.setInput('value', null);
      fixture.detectChanges();
      expect(getFill(fixture).className).toContain('animate-progress-bar-indeterminate');
    });

    it('switches from indeterminate to determinate when value becomes a number', () => {
      const fixture = TestBed.createComponent(ConfiguredHost);
      fixture.detectChanges();
      let el = getProgressEl(fixture);
      expect(el.getAttribute('aria-busy')).toBe('true');

      fixture.componentRef.setInput('value', 42);
      fixture.detectChanges();
      el = getProgressEl(fixture);
      expect(el.hasAttribute('aria-busy')).toBe(false);
      expect(el.getAttribute('aria-valuenow')).toBe('42');
      expect(getFill(fixture).className).not.toContain('animate-progress-bar-indeterminate');
    });
  });

  describe('variants', () => {
    const variants: ProgressBarVariant[] = ['linear', 'segmented'];
    for (const variant of variants) {
      it(`renders variant="${variant}" without errors`, () => {
        const fixture = TestBed.createComponent(ConfiguredHost);
        fixture.componentRef.setInput('variant', variant);
        fixture.componentRef.setInput('value', 40);
        fixture.detectChanges();
        expect(getProgressEl(fixture)).toBeTruthy();
      });
    }

    it('renders N segment children when variant="segmented"', () => {
      const fixture = TestBed.createComponent(ConfiguredHost);
      fixture.componentRef.setInput('variant', 'segmented');
      fixture.componentRef.setInput('segments', 5);
      fixture.componentRef.setInput('value', 40);
      fixture.detectChanges();
      const cells = getProgressEl(fixture).querySelectorAll('span');
      expect(cells.length).toBe(5);
    });

    it('segmented: with 5 segments and value=40 (max=100), exactly 2 cells are filled', () => {
      const fixture = TestBed.createComponent(ConfiguredHost);
      fixture.componentRef.setInput('variant', 'segmented');
      fixture.componentRef.setInput('segments', 5);
      fixture.componentRef.setInput('value', 40);
      fixture.componentRef.setInput('color', 'primary');
      fixture.detectChanges();
      const cells = Array.from(getProgressEl(fixture).querySelectorAll('span'));
      const filled = cells.filter((c) => c.className.includes('bg-primary-500'));
      expect(filled.length).toBe(2);
    });

    it('segmented: all 5 cells filled when value=100', () => {
      const fixture = TestBed.createComponent(ConfiguredHost);
      fixture.componentRef.setInput('variant', 'segmented');
      fixture.componentRef.setInput('segments', 5);
      fixture.componentRef.setInput('value', 100);
      fixture.componentRef.setInput('color', 'primary');
      fixture.detectChanges();
      const cells = Array.from(getProgressEl(fixture).querySelectorAll('span'));
      const filled = cells.filter((c) => c.className.includes('bg-primary-500'));
      expect(filled.length).toBe(5);
    });

    it('segmented: no cells filled when value=0', () => {
      const fixture = TestBed.createComponent(ConfiguredHost);
      fixture.componentRef.setInput('variant', 'segmented');
      fixture.componentRef.setInput('segments', 5);
      fixture.componentRef.setInput('value', 0);
      fixture.componentRef.setInput('color', 'primary');
      fixture.detectChanges();
      const cells = Array.from(getProgressEl(fixture).querySelectorAll('span'));
      const filled = cells.filter((c) => c.className.includes('bg-primary-500'));
      expect(filled.length).toBe(0);
    });
  });

  describe('colors', () => {
    const colors: TwColor[] = [
      'primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error',
    ];
    for (const color of colors) {
      it(`renders color="${color}" without errors`, () => {
        const fixture = TestBed.createComponent(ConfiguredHost);
        fixture.componentRef.setInput('color', color);
        fixture.componentRef.setInput('value', 50);
        fixture.detectChanges();
        expect(getProgressEl(fixture)).toBeTruthy();
      });
    }

    it('applies the fill-color class for each color', () => {
      const fixture = TestBed.createComponent(ConfiguredHost);
      fixture.componentRef.setInput('color', 'success');
      fixture.componentRef.setInput('value', 50);
      fixture.detectChanges();
      expect(getFill(fixture).className).toContain('bg-success-500');
    });
  });

  describe('sizes', () => {
    const sizeCases: [ProgressBarSize, string][] = [
      ['sm', 'h-1'],
      ['md', 'h-2'],
      ['lg', 'h-3'],
    ];
    for (const [size, expected] of sizeCases) {
      it(`applies ${expected} when size="${size}"`, () => {
        const fixture = TestBed.createComponent(ConfiguredHost);
        fixture.componentRef.setInput('size', size);
        fixture.componentRef.setInput('value', 50);
        fixture.detectChanges();
        expect(getProgressEl(fixture).className).toContain(expected);
      });
    }
  });

  describe('showValue', () => {
    it('renders the formatted value when showValue=true', () => {
      const fixture = TestBed.createComponent(ConfiguredHost);
      fixture.componentRef.setInput('value', 37);
      fixture.componentRef.setInput('showValue', true);
      fixture.detectChanges();
      const text = fixture.nativeElement.querySelector('tw-progress-bar')!.textContent;
      expect(text).toContain('37%');
    });

    it('hides the visible value when showValue=false but keeps aria-valuetext', () => {
      const fixture = TestBed.createComponent(ConfiguredHost);
      fixture.componentRef.setInput('value', 37);
      fixture.componentRef.setInput('showValue', false);
      fixture.detectChanges();
      // The component only shows the label (no value caption), so textContent excludes "37%"
      const valueSpan = fixture.nativeElement.querySelector('.tabular-nums');
      expect(valueSpan).toBeNull();
      expect(getProgressEl(fixture).getAttribute('aria-valuetext')).toBe('37%');
    });

    it('updates visible text when value changes', () => {
      const fixture = TestBed.createComponent(ConfiguredHost);
      fixture.componentRef.setInput('value', 10);
      fixture.componentRef.setInput('showValue', true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.tabular-nums')!.textContent?.trim()).toBe('10%');

      fixture.componentRef.setInput('value', 75);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.tabular-nums')!.textContent?.trim()).toBe('75%');
    });
  });

  describe('valueFormatter', () => {
    it('uses the custom formatter for visible text and aria-valuetext', () => {
      const fixture = TestBed.createComponent(ConfiguredHost);
      const fmt: ProgressBarValueFormatter = (v, mx) => `${v}/${mx}`;
      fixture.componentRef.setInput('value', 3);
      fixture.componentRef.setInput('max', 10);
      fixture.componentRef.setInput('showValue', true);
      fixture.componentRef.setInput('valueFormatter', fmt);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.tabular-nums')!.textContent?.trim()).toBe('3/10');
      expect(getProgressEl(fixture).getAttribute('aria-valuetext')).toBe('3/10');
    });
  });

  describe('accessible name', () => {
    it('label input renders a span referenced by aria-labelledby', () => {
      const fixture = TestBed.createComponent(ConfiguredHost);
      fixture.componentRef.setInput('label', 'Upload progress');
      fixture.componentRef.setInput('value', 20);
      fixture.detectChanges();
      const labelSpan = fixture.nativeElement.querySelector('span[id^="tw-progress-bar-"]');
      expect(labelSpan).toBeTruthy();
      expect(labelSpan!.textContent?.trim()).toBe('Upload progress');
      const el = getProgressEl(fixture);
      expect(el.getAttribute('aria-labelledby')).toBe(labelSpan!.id);
    });

    it('ariaLabel input mirrors to aria-label when no label is set', () => {
      const fixture = TestBed.createComponent(ConfiguredHost);
      fixture.componentRef.setInput('label', undefined);
      fixture.componentRef.setInput('ariaLabel', 'Task progress');
      fixture.componentRef.setInput('value', 20);
      fixture.detectChanges();
      const el = getProgressEl(fixture);
      expect(el.getAttribute('aria-label')).toBe('Task progress');
      expect(el.hasAttribute('aria-labelledby')).toBe(false);
    });

    it('ariaLabelledby input mirrors to aria-labelledby when no label is set', () => {
      const fixture = TestBed.createComponent(ConfiguredHost);
      fixture.componentRef.setInput('label', undefined);
      fixture.componentRef.setInput('ariaLabelledby', 'external-label-id');
      fixture.componentRef.setInput('value', 20);
      fixture.detectChanges();
      expect(getProgressEl(fixture).getAttribute('aria-labelledby')).toBe('external-label-id');
    });

    it('warns in dev mode when no accessible name is provided', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const fixture = TestBed.createComponent(ConfiguredHost);
      fixture.componentRef.setInput('label', undefined);
      fixture.componentRef.setInput('ariaLabel', undefined);
      fixture.componentRef.setInput('ariaLabelledby', undefined);
      fixture.detectChanges();
      expect(warn).toHaveBeenCalledTimes(1);
      warn.mockRestore();
    });

    it('does not warn when label is provided', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const fixture = TestBed.createComponent(ConfiguredHost);
      fixture.componentRef.setInput('label', 'Has label');
      fixture.detectChanges();
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });

    it('does not warn when ariaLabel is provided', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const fixture = TestBed.createComponent(ConfiguredHost);
      fixture.componentRef.setInput('label', undefined);
      fixture.componentRef.setInput('ariaLabel', 'Has aria-label');
      fixture.detectChanges();
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });
  });
});
