import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { IconComponent } from './icon';
import { provideTwIcons } from './icon.providers';
import type { TwIconData, TwIconColor } from './icon.types';
import type { TwSize } from 'ngx-tw/core';

const STAR_ICON: TwIconData = [
  ['polygon', { points: '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' }],
];

const CHECK_ICON: TwIconData = [
  ['polyline', { points: '20 6 9 17 4 12' }],
];

const TEST_ICONS = { Star: STAR_ICON, Check: CHECK_ICON };

describe('IconComponent', () => {
  let component: IconComponent;
  let fixture: ComponentFixture<IconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconComponent],
      providers: [provideTwIcons(TEST_ICONS)],
    }).compileComponents();
    fixture = TestBed.createComponent(IconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // === Rendering ===

  describe('Rendering', () => {
    it('should create without errors', () => {
      expect(component).toBeTruthy();
    });

    it('should not render an SVG when no name or img is provided', () => {
      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg).toBeNull();
    });

    it('should render an SVG when name is provided', () => {
      fixture.componentRef.setInput('name', 'star');
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg.querySelector('polygon')).not.toBeNull();
    });

    it('should render an SVG when img is provided', () => {
      fixture.componentRef.setInput('img', CHECK_ICON);
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg.querySelector('polyline')).not.toBeNull();
    });

    it('should give img priority over name', () => {
      fixture.componentRef.setInput('name', 'star');
      fixture.componentRef.setInput('img', CHECK_ICON);
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg.querySelector('polyline')).not.toBeNull();
      expect(svg.querySelector('polygon')).toBeNull();
    });

    it('should rebuild SVG when name toggles from a value to undefined and back', () => {
      fixture.componentRef.setInput('name', 'star');
      fixture.detectChanges();
      const svgBefore = fixture.nativeElement.querySelector('svg');
      expect(svgBefore).not.toBeNull();

      fixture.componentRef.setInput('name', undefined);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('svg')).toBeNull();

      fixture.componentRef.setInput('name', 'check');
      fixture.detectChanges();
      const svgAfter = fixture.nativeElement.querySelector('svg');
      expect(svgAfter).not.toBeNull();
      expect(svgAfter).not.toBe(svgBefore);
      expect(svgAfter.querySelector('polyline')).not.toBeNull();
    });
  });

  // === Color variants ===

  describe('Color variants', () => {
    const colors: TwIconColor[] = [
      'current', 'primary', 'secondary', 'accent', 'neutral',
      'info', 'success', 'warning', 'error',
    ];

    for (const color of colors) {
      it(`should render with color "${color}" without errors`, () => {
        fixture.componentRef.setInput('name', 'star');
        fixture.componentRef.setInput('color', color);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('svg')).not.toBeNull();
      });
    }
  });

  // === Size variants ===

  describe('Size variants', () => {
    const sizes: { size: TwSize; px: number }[] = [
      { size: 'xs', px: 12 },
      { size: 'sm', px: 16 },
      { size: 'md', px: 20 },
      { size: 'lg', px: 24 },
      { size: 'xl', px: 32 },
    ];

    for (const { size, px } of sizes) {
      it(`should render at size "${size}" (${px}px)`, () => {
        fixture.componentRef.setInput('name', 'star');
        fixture.componentRef.setInput('size', size);
        fixture.detectChanges();

        const svg = fixture.nativeElement.querySelector('svg');
        expect(svg.getAttribute('width')).toBe(String(px));
        expect(svg.getAttribute('height')).toBe(String(px));
      });
    }
  });

  // === SVG config ===

  describe('SVG config', () => {
    it('should default strokeWidth to 2 when svg config is unset', () => {
      fixture.componentRef.setInput('name', 'star');
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg.getAttribute('stroke-width')).toBe('2');
    });

    it('should apply svg.strokeWidth to the SVG', () => {
      fixture.componentRef.setInput('name', 'star');
      fixture.componentRef.setInput('svg', { strokeWidth: 3 });
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg.getAttribute('stroke-width')).toBe('3');
    });

    it('should scale stroke width inversely with size when svg.absoluteStrokeWidth is true', () => {
      fixture.componentRef.setInput('name', 'star');
      fixture.componentRef.setInput('svg', { strokeWidth: 2, absoluteStrokeWidth: true });
      fixture.componentRef.setInput('size', 'xl');
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector('svg');
      // Formula: 2 * 24 / 32 = 1.5
      expect(svg.getAttribute('stroke-width')).toBe('1.5');
    });

    it('should not scale stroke width when svg.absoluteStrokeWidth is false', () => {
      fixture.componentRef.setInput('name', 'star');
      fixture.componentRef.setInput('svg', { strokeWidth: 2, absoluteStrokeWidth: false });
      fixture.componentRef.setInput('size', 'xl');
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg.getAttribute('stroke-width')).toBe('2');
    });

    it('should use default viewBox "0 0 24 24" when svg config is unset', () => {
      fixture.componentRef.setInput('name', 'star');
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    });

    it('should apply custom svg.viewBox', () => {
      fixture.componentRef.setInput('img', CHECK_ICON);
      fixture.componentRef.setInput('svg', { viewBox: '0 0 16 16' });
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg.getAttribute('viewBox')).toBe('0 0 16 16');
    });

    it('should merge partial svg config with defaults for unset fields', () => {
      fixture.componentRef.setInput('name', 'star');
      fixture.componentRef.setInput('svg', { strokeWidth: 1.5 });
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg.getAttribute('stroke-width')).toBe('1.5');
      expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    });
  });

  // === Accessibility ===

  describe('Accessibility', () => {
    it('should set aria-hidden="true" when no ariaLabel is provided', () => {
      fixture.componentRef.setInput('name', 'star');
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg.getAttribute('aria-hidden')).toBe('true');
      expect(svg.getAttribute('aria-label')).toBeNull();
      expect(svg.getAttribute('role')).toBeNull();
    });

    it('should set aria-label and role="img" when ariaLabel is provided', () => {
      fixture.componentRef.setInput('name', 'star');
      fixture.componentRef.setInput('ariaLabel', 'Favorite');
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg.getAttribute('aria-label')).toBe('Favorite');
      expect(svg.getAttribute('role')).toBe('img');
      expect(svg.getAttribute('aria-hidden')).toBeNull();
    });
  });

  // === Dev-mode warnings ===

  describe('Dev-mode warnings', () => {
    it('should warn when icon name is not found in registry', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      fixture.componentRef.setInput('name', 'nonexistent-icon');
      fixture.detectChanges();

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('nonexistent-icon'),
      );

      warnSpy.mockRestore();
    });

    it('should not warn for registered icons', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      fixture.componentRef.setInput('name', 'star');
      fixture.detectChanges();

      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });

  // === SVG caching ===

  describe('SVG caching', () => {
    it('should not rebuild SVG when only color changes', () => {
      fixture.componentRef.setInput('name', 'star');
      fixture.detectChanges();

      const svgBefore = fixture.nativeElement.querySelector('svg');

      fixture.componentRef.setInput('color', 'success');
      fixture.detectChanges();

      const svgAfter = fixture.nativeElement.querySelector('svg');
      expect(svgAfter).toBe(svgBefore);
    });

    it('should not rebuild SVG when only size changes', () => {
      fixture.componentRef.setInput('name', 'star');
      fixture.detectChanges();

      const svgBefore = fixture.nativeElement.querySelector('svg');

      fixture.componentRef.setInput('size', 'lg');
      fixture.detectChanges();

      const svgAfter = fixture.nativeElement.querySelector('svg');
      expect(svgAfter).toBe(svgBefore);
    });

    it('should rebuild SVG when svg.strokeWidth changes', () => {
      fixture.componentRef.setInput('name', 'star');
      fixture.detectChanges();

      const svgBefore = fixture.nativeElement.querySelector('svg');

      fixture.componentRef.setInput('svg', { strokeWidth: 3 });
      fixture.detectChanges();

      const svgAfter = fixture.nativeElement.querySelector('svg');
      expect(svgAfter).not.toBe(svgBefore);
    });

    it('should rebuild SVG when svg.viewBox changes', () => {
      fixture.componentRef.setInput('name', 'star');
      fixture.detectChanges();

      const svgBefore = fixture.nativeElement.querySelector('svg');

      fixture.componentRef.setInput('svg', { viewBox: '0 0 16 16' });
      fixture.detectChanges();

      const svgAfter = fixture.nativeElement.querySelector('svg');
      expect(svgAfter).not.toBe(svgBefore);
    });

    it('should rebuild SVG when icon data changes', () => {
      fixture.componentRef.setInput('img', STAR_ICON);
      fixture.detectChanges();

      const svgBefore = fixture.nativeElement.querySelector('svg');

      fixture.componentRef.setInput('img', CHECK_ICON);
      fixture.detectChanges();

      const svgAfter = fixture.nativeElement.querySelector('svg');
      expect(svgAfter).not.toBe(svgBefore);
    });

    it('should clear SVG when img is removed', () => {
      fixture.componentRef.setInput('img', STAR_ICON);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('svg')).not.toBeNull();

      fixture.componentRef.setInput('img', undefined);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('svg')).toBeNull();
    });
  });

  // === SVG attributes ===

  describe('SVG attributes', () => {
    it('should set standard SVG attributes', () => {
      fixture.componentRef.setInput('name', 'star');
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg.getAttribute('fill')).toBe('none');
      expect(svg.getAttribute('stroke')).toBe('currentColor');
      expect(svg.getAttribute('stroke-linecap')).toBe('round');
      expect(svg.getAttribute('stroke-linejoin')).toBe('round');
    });

    it('should render SVG children with correct attributes', () => {
      fixture.componentRef.setInput('name', 'star');
      fixture.detectChanges();

      const polygon = fixture.nativeElement.querySelector('polygon');
      expect(polygon).not.toBeNull();
      expect(polygon.getAttribute('points')).toBe(
        '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2',
      );
    });
  });
});
