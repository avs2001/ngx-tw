import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { SkeletonComponent } from './skeleton';
import type { SkeletonAnimation, SkeletonShape } from './skeleton';

// ── Test host components ──────────────────────────────────────────

@Component({
  imports: [SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<tw-skeleton />`,
})
class DefaultSkeletonHost {}

@Component({
  imports: [SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <tw-skeleton
      [shape]="shape()"
      [animation]="animation()"
      [width]="width()"
      [height]="height()"
      [lines]="lines()"
      [announce]="announce()"
    />
  `,
})
class ConfiguredSkeletonHost {
  readonly shape = input<SkeletonShape>('text');
  readonly animation = input<SkeletonAnimation>('pulse');
  readonly width = input<string | number | undefined>(undefined);
  readonly height = input<string | number | undefined>(undefined);
  readonly lines = input<number>(1);
  readonly announce = input<boolean>(false);
}

// ── Helpers ───────────────────────────────────────────────────────

function getSkeleton(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('tw-skeleton')!;
}

function getRows(fixture: ComponentFixture<unknown>): HTMLElement[] {
  // Direct child spans of the host (excludes the sr-only label which is also a span)
  return Array.from(getSkeleton(fixture).querySelectorAll(':scope > span:not(.sr-only)'));
}

// ── Tests ─────────────────────────────────────────────────────────

describe('SkeletonComponent', () => {
  describe('rendering', () => {
    it('renders without inputs', () => {
      const fixture = TestBed.createComponent(DefaultSkeletonHost);
      fixture.detectChanges();
      expect(getSkeleton(fixture)).toBeTruthy();
    });

    it('applies default shape and pulse animation classes', () => {
      const fixture = TestBed.createComponent(DefaultSkeletonHost);
      fixture.detectChanges();
      const cls = getSkeleton(fixture).className;
      expect(cls).toContain('bg-surface-muted');
      expect(cls).toContain('skeleton-pulse');
      expect(cls).toContain('rounded-md');
      expect(cls).toContain('h-4');
    });

    it('marks the host with aria-hidden="true" by default', () => {
      const fixture = TestBed.createComponent(DefaultSkeletonHost);
      fixture.detectChanges();
      const el = getSkeleton(fixture);
      expect(el.getAttribute('aria-hidden')).toBe('true');
      expect(el.hasAttribute('role')).toBe(false);
      expect(el.hasAttribute('tabindex')).toBe(false);
    });

    it('does not render an sr-only label by default', () => {
      const fixture = TestBed.createComponent(DefaultSkeletonHost);
      fixture.detectChanges();
      expect(getSkeleton(fixture).querySelector('.sr-only')).toBeNull();
    });
  });

  describe('shape', () => {
    it('renders text shape with rounded-md and text-line height', () => {
      const fixture = TestBed.createComponent(ConfiguredSkeletonHost);
      fixture.componentRef.setInput('shape', 'text');
      fixture.detectChanges();
      const cls = getSkeleton(fixture).className;
      expect(cls).toContain('rounded-md');
      expect(cls).toContain('h-4');
    });

    it('renders rectangle shape with rounded-md', () => {
      const fixture = TestBed.createComponent(ConfiguredSkeletonHost);
      fixture.componentRef.setInput('shape', 'rectangle');
      fixture.detectChanges();
      expect(getSkeleton(fixture).className).toContain('rounded-md');
    });

    it('renders circle shape with rounded-full and aspect-square', () => {
      const fixture = TestBed.createComponent(ConfiguredSkeletonHost);
      fixture.componentRef.setInput('shape', 'circle');
      fixture.detectChanges();
      const cls = getSkeleton(fixture).className;
      expect(cls).toContain('rounded-full');
      expect(cls).toContain('aspect-square');
    });
  });

  describe('animation', () => {
    it('applies skeleton-pulse for animation="pulse"', () => {
      const fixture = TestBed.createComponent(ConfiguredSkeletonHost);
      fixture.componentRef.setInput('animation', 'pulse');
      fixture.detectChanges();
      expect(getSkeleton(fixture).className).toContain('skeleton-pulse');
    });

    it('applies skeleton-wave for animation="wave"', () => {
      const fixture = TestBed.createComponent(ConfiguredSkeletonHost);
      fixture.componentRef.setInput('animation', 'wave');
      fixture.detectChanges();
      const cls = getSkeleton(fixture).className;
      expect(cls).toContain('skeleton-wave');
      expect(cls).not.toContain('skeleton-pulse');
    });

    it('applies neither animation class for animation="none"', () => {
      const fixture = TestBed.createComponent(ConfiguredSkeletonHost);
      fixture.componentRef.setInput('animation', 'none');
      fixture.detectChanges();
      const cls = getSkeleton(fixture).className;
      expect(cls).not.toContain('skeleton-pulse');
      expect(cls).not.toContain('skeleton-wave');
    });
  });

  describe('width and height', () => {
    it('treats numeric width/height as pixels', () => {
      const fixture = TestBed.createComponent(ConfiguredSkeletonHost);
      fixture.componentRef.setInput('shape', 'rectangle');
      fixture.componentRef.setInput('width', 200);
      fixture.componentRef.setInput('height', 80);
      fixture.detectChanges();
      const style = getSkeleton(fixture).getAttribute('style') ?? '';
      expect(style).toContain('width: 200px');
      expect(style).toContain('height: 80px');
    });

    it('passes string width/height through verbatim', () => {
      const fixture = TestBed.createComponent(ConfiguredSkeletonHost);
      fixture.componentRef.setInput('shape', 'rectangle');
      fixture.componentRef.setInput('width', '50%');
      fixture.componentRef.setInput('height', '12rem');
      fixture.detectChanges();
      const style = getSkeleton(fixture).getAttribute('style') ?? '';
      expect(style).toContain('width: 50%');
      expect(style).toContain('height: 12rem');
    });

    it('omits inline dimensions when undefined', () => {
      const fixture = TestBed.createComponent(ConfiguredSkeletonHost);
      fixture.componentRef.setInput('shape', 'rectangle');
      fixture.detectChanges();
      const style = getSkeleton(fixture).getAttribute('style') ?? '';
      expect(style).not.toContain('width:');
      expect(style).not.toContain('height:');
    });
  });

  describe('lines', () => {
    it('renders the host as a single shape when lines=1', () => {
      const fixture = TestBed.createComponent(ConfiguredSkeletonHost);
      fixture.componentRef.setInput('lines', 1);
      fixture.detectChanges();
      expect(getRows(fixture).length).toBe(0);
      expect(getSkeleton(fixture).className).toContain('skeleton-pulse');
    });

    it('renders N row spans when lines=3 and shape="text"', () => {
      const fixture = TestBed.createComponent(ConfiguredSkeletonHost);
      fixture.componentRef.setInput('shape', 'text');
      fixture.componentRef.setInput('lines', 3);
      fixture.detectChanges();
      const rows = getRows(fixture);
      expect(rows.length).toBe(3);
    });

    it('switches the host to a flex column container in multi-line mode', () => {
      const fixture = TestBed.createComponent(ConfiguredSkeletonHost);
      fixture.componentRef.setInput('shape', 'text');
      fixture.componentRef.setInput('lines', 3);
      fixture.detectChanges();
      const cls = getSkeleton(fixture).className;
      expect(cls).toContain('flex');
      expect(cls).toContain('flex-col');
      expect(cls).toContain('gap-2');
      expect(cls).not.toContain('skeleton-pulse');
      expect(cls).not.toContain('rounded-md');
    });

    it('shortens only the last row to w-3/5', () => {
      const fixture = TestBed.createComponent(ConfiguredSkeletonHost);
      fixture.componentRef.setInput('shape', 'text');
      fixture.componentRef.setInput('lines', 3);
      fixture.detectChanges();
      const rows = getRows(fixture);
      expect(rows[0].className).not.toContain('w-3/5');
      expect(rows[1].className).not.toContain('w-3/5');
      expect(rows[2].className).toContain('w-3/5');
    });

    it('applies the animation class to each row', () => {
      const fixture = TestBed.createComponent(ConfiguredSkeletonHost);
      fixture.componentRef.setInput('shape', 'text');
      fixture.componentRef.setInput('lines', 2);
      fixture.componentRef.setInput('animation', 'wave');
      fixture.detectChanges();
      const rows = getRows(fixture);
      for (const row of rows) {
        expect(row.className).toContain('skeleton-wave');
      }
    });

    it('ignores lines when shape="rectangle"', () => {
      const fixture = TestBed.createComponent(ConfiguredSkeletonHost);
      fixture.componentRef.setInput('shape', 'rectangle');
      fixture.componentRef.setInput('lines', 4);
      fixture.detectChanges();
      expect(getRows(fixture).length).toBe(0);
      expect(getSkeleton(fixture).className).toContain('rounded-md');
    });

    it('ignores lines when shape="circle"', () => {
      const fixture = TestBed.createComponent(ConfiguredSkeletonHost);
      fixture.componentRef.setInput('shape', 'circle');
      fixture.componentRef.setInput('lines', 4);
      fixture.detectChanges();
      expect(getRows(fixture).length).toBe(0);
      expect(getSkeleton(fixture).className).toContain('rounded-full');
    });

    it('applies width to non-last rows in multi-line mode', () => {
      const fixture = TestBed.createComponent(ConfiguredSkeletonHost);
      fixture.componentRef.setInput('shape', 'text');
      fixture.componentRef.setInput('lines', 3);
      fixture.componentRef.setInput('width', '80%');
      fixture.detectChanges();
      const rows = getRows(fixture);
      expect(rows[0].getAttribute('style') ?? '').toContain('width: 80%');
      expect(rows[1].getAttribute('style') ?? '').toContain('width: 80%');
      expect(rows[2].getAttribute('style') ?? '').not.toContain('width:');
    });
  });

  describe('announce', () => {
    it('exposes role="status" / aria-busy / aria-live when announce=true', () => {
      const fixture = TestBed.createComponent(ConfiguredSkeletonHost);
      fixture.componentRef.setInput('announce', true);
      fixture.detectChanges();
      const el = getSkeleton(fixture);
      expect(el.getAttribute('role')).toBe('status');
      expect(el.getAttribute('aria-busy')).toBe('true');
      expect(el.getAttribute('aria-live')).toBe('polite');
      expect(el.hasAttribute('aria-hidden')).toBe(false);
    });

    it('renders an sr-only "Loading" label when announce=true', () => {
      const fixture = TestBed.createComponent(ConfiguredSkeletonHost);
      fixture.componentRef.setInput('announce', true);
      fixture.detectChanges();
      const sr = getSkeleton(fixture).querySelector('.sr-only');
      expect(sr).toBeTruthy();
      expect(sr!.textContent?.trim()).toBe('Loading');
    });

    it('toggles back to aria-hidden when announce changes from true to false', () => {
      const fixture = TestBed.createComponent(ConfiguredSkeletonHost);
      fixture.componentRef.setInput('announce', true);
      fixture.detectChanges();
      fixture.componentRef.setInput('announce', false);
      fixture.detectChanges();
      const el = getSkeleton(fixture);
      expect(el.getAttribute('aria-hidden')).toBe('true');
      expect(el.hasAttribute('role')).toBe(false);
      expect(el.querySelector('.sr-only')).toBeNull();
    });
  });

  describe('non-interactive', () => {
    it('does not render a tabindex attribute', () => {
      const fixture = TestBed.createComponent(DefaultSkeletonHost);
      fixture.detectChanges();
      expect(getSkeleton(fixture).hasAttribute('tabindex')).toBe(false);
    });
  });
});
