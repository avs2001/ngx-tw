import { Component, input, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Directionality } from '@angular/cdk/bidi';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  TimelineComponent,
  TimelineItemComponent,
  TimelineMarkerDirective,
  TimelineTimestampDirective,
  TimelineOppositeDirective,
  provideTwTimelineScrollLabels,
} from './timeline';
import type {
  TimelineAlign,
  TimelineLineStyle,
  TimelineMarker,
  TimelineScrollControls,
  TimelineState,
} from './timeline';
import type { TwColor, TwOrientation, TwSize } from 'ngx-tw/core';

// ── Test host components ──────────────────────────────────────────

@Component({
  imports: [TimelineComponent, TimelineItemComponent],
  template: `
    <tw-timeline
      [orientation]="orientation()"
      [align]="align()"
      [size]="size()"
      [lineStyle]="lineStyle()"
    >
      @for (item of items(); track item.id) {
        <tw-timeline-item
          [color]="item.color"
          [marker]="item.marker"
          [state]="item.state"
          [timestamp]="item.timestamp ?? null"
          [dateTime]="item.dateTime ?? null"
        >
          <p>{{ item.label }}</p>
        </tw-timeline-item>
      }
    </tw-timeline>
  `,
})
class BasicTimelineHost {
  readonly orientation = input<TwOrientation>('vertical');
  readonly align = input<TimelineAlign>('left');
  readonly size = input<TwSize>('md');
  readonly lineStyle = input<TimelineLineStyle>('solid');
  readonly items = signal<
    Array<{
      id: number;
      color: TwColor;
      marker: TimelineMarker;
      state: TimelineState;
      timestamp?: string | Date | null;
      dateTime?: string | null;
      label: string;
    }>
  >([
    { id: 1, color: 'primary', marker: 'dot', state: 'reached', label: 'A' },
    { id: 2, color: 'primary', marker: 'dot', state: 'current', label: 'B' },
    { id: 3, color: 'primary', marker: 'dot', state: 'pending', label: 'C' },
  ]);
}

@Component({
  imports: [TimelineComponent, TimelineItemComponent],
  template: `
    <tw-timeline>
      <tw-timeline-item
        [color]="color()"
        [marker]="marker()"
        [state]="state()"
        [timestamp]="timestamp()"
        [dateTime]="dateTime()"
      >
        <p>Body</p>
      </tw-timeline-item>
    </tw-timeline>
  `,
})
class SingleItemHost {
  readonly color = input<TwColor>('primary');
  readonly marker = input<TimelineMarker>('dot');
  readonly state = input<TimelineState>('reached');
  readonly timestamp = input<string | Date | null>(null);
  readonly dateTime = input<string | null>(null);
}

@Component({
  imports: [
    TimelineComponent,
    TimelineItemComponent,
    TimelineMarkerDirective,
    TimelineTimestampDirective,
    TimelineOppositeDirective,
  ],
  template: `
    <tw-timeline [align]="align()" [orientation]="orientation()">
      <tw-timeline-item
        [marker]="marker()"
        [color]="color()"
        [state]="state()"
        [timestamp]="timestamp()"
        [dateTime]="dateTime()"
      >
        @if (projectMarker()) {
          <span twTimelineMarker data-testid="marker-slot">M</span>
        }
        @if (projectTimestamp()) {
          <span twTimelineTimestamp data-testid="ts-slot">2h ago</span>
        }
        @if (projectOpposite()) {
          <span twTimelineOpposite data-testid="opp-slot">opp</span>
        }
        <p data-testid="body">Body</p>
      </tw-timeline-item>
    </tw-timeline>
  `,
})
class SlotProjectionHost {
  readonly align = input<TimelineAlign>('left');
  readonly orientation = input<TwOrientation>('vertical');
  readonly marker = input<TimelineMarker>('circle');
  readonly color = input<TwColor>('primary');
  readonly state = input<TimelineState>('reached');
  readonly timestamp = input<string | Date | null>(null);
  readonly dateTime = input<string | null>(null);
  readonly projectMarker = input(false);
  readonly projectTimestamp = input(false);
  readonly projectOpposite = input(false);
}

@Component({
  imports: [TimelineComponent, TimelineItemComponent],
  template: `
    <tw-timeline>
      @for (id of ids(); track id) {
        <tw-timeline-item marker="circle">
          <p>Item {{ id }}</p>
        </tw-timeline-item>
      }
    </tw-timeline>
  `,
})
class DynamicItemsHost {
  readonly ids = signal<number[]>([1, 2, 3]);
}

@Component({
  imports: [TimelineComponent, TimelineItemComponent],
  template: `
    <tw-timeline>
      <tw-timeline-item color="primary" state="reached"><p>Solo</p></tw-timeline-item>
    </tw-timeline>
  `,
})
class SoloItemHost {}

@Component({
  imports: [TimelineComponent],
  template: `<tw-timeline></tw-timeline>`,
})
class EmptyTimelineHost {}

@Component({
  imports: [TimelineComponent, TimelineItemComponent],
  template: `
    <tw-timeline
      orientation="horizontal"
      [size]="size()"
      [scrollControls]="scrollControls()"
    >
      @for (id of ids(); track id) {
        <tw-timeline-item color="primary" state="reached" marker="dot">
          <p class="text-xs">Item {{ id }}</p>
        </tw-timeline-item>
      }
    </tw-timeline>
  `,
})
class HorizontalScrollHost {
  readonly size = input<TwSize>('md');
  readonly scrollControls = input<TimelineScrollControls>('auto');
  readonly ids = signal<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
}

// ── Helpers ──────────────────────────────────────────

function timelineEl(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('tw-timeline')!;
}

function items(fixture: ComponentFixture<unknown>): HTMLElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('tw-timeline-item'));
}

function markerOf(item: HTMLElement): HTMLElement {
  // The marker bubble is the only direct child of the marker side wrapper
  // that has rounded-full + a border (or border-2 in pending). We can pick it
  // out by class signature.
  const candidates = item.querySelectorAll('div.rounded-full');
  return candidates[0] as HTMLElement;
}

function markerSide(item: HTMLElement): HTMLElement {
  // The first child div of the item (before the body wrapper).
  return item.querySelector('div.flex.shrink-0') as HTMLElement;
}

function connectorSpans(item: HTMLElement): HTMLElement[] {
  return Array.from(
    item.querySelectorAll('span[aria-hidden="true"]'),
  ) as HTMLElement[];
}

// ── Specs ──────────────────────────────────────────────────────────

describe('TimelineComponent', () => {
  describe('Container rendering', () => {
    it('renders with role="list" and no items', () => {
      const fixture = TestBed.createComponent(EmptyTimelineHost);
      fixture.detectChanges();
      const host = timelineEl(fixture);
      expect(host.getAttribute('role')).toBe('list');
      expect(host.querySelectorAll('tw-timeline-item').length).toBe(0);
    });

    it('applies aria-orientation="horizontal" only in horizontal orientation', () => {
      const fixture = TestBed.createComponent(BasicTimelineHost);
      fixture.detectChanges();
      let host = timelineEl(fixture);
      expect(host.getAttribute('aria-orientation')).toBeNull();

      fixture.componentRef.setInput('orientation', 'horizontal');
      fixture.detectChanges();
      host = timelineEl(fixture);
      expect(host.getAttribute('aria-orientation')).toBe('horizontal');
    });

    it('renders each align value in vertical orientation', () => {
      const fixture = TestBed.createComponent(BasicTimelineHost);
      for (const align of ['left', 'right', 'alternate', 'split'] as const) {
        fixture.componentRef.setInput('align', align);
        fixture.detectChanges();
        expect(items(fixture).length).toBe(3);
      }
    });

    it('applies the expected size gap class', () => {
      const fixture = TestBed.createComponent(BasicTimelineHost);
      const gapMap: Record<TwSize, string> = {
        xs: 'gap-3',
        sm: 'gap-4',
        md: 'gap-5',
        lg: 'gap-6',
        xl: 'gap-8',
      };
      for (const size of ['xs', 'sm', 'md', 'lg', 'xl'] as const) {
        fixture.componentRef.setInput('size', size);
        fixture.detectChanges();
        const itemClasses = items(fixture)[0].className;
        expect(itemClasses).toContain(gapMap[size]);
      }
    });

    it('renders solid vs dashed connectors with the right primitive class', () => {
      const fixture = TestBed.createComponent(BasicTimelineHost);
      fixture.detectChanges();
      // Vertical orientation emits only the trailing connector per item — the
      // marker sits at the top of the body so a leading segment would push it
      // out of alignment with the title's first line.
      let middle = items(fixture)[1];
      let conns = connectorSpans(middle);
      expect(conns.length).toBe(1);
      expect(conns[0].className).toMatch(/(^|\s)bg-/);
      expect(conns[0].className).not.toContain('border-dashed');

      fixture.componentRef.setInput('lineStyle', 'dashed');
      fixture.detectChanges();
      middle = items(fixture)[1];
      conns = connectorSpans(middle);
      expect(conns[0].className).toContain('border-dashed');
      expect(conns[0].className).toContain('border-l');
    });
  });

  describe('Item rendering', () => {
    it('renders default item with role="listitem", no aria-current, dot marker, no timestamp', () => {
      const fixture = TestBed.createComponent(SingleItemHost);
      fixture.detectChanges();
      const item = items(fixture)[0];
      expect(item.getAttribute('role')).toBe('listitem');
      expect(item.getAttribute('aria-current')).toBeNull();
      expect(item.querySelector('time')).toBeNull();
    });

    it('applies the correct dot diameter per size', () => {
      const fixture = TestBed.createComponent(BasicTimelineHost);
      const dotSizeMap: Record<TwSize, string> = {
        xs: 'size-2',
        sm: 'size-2.5',
        md: 'size-3',
        lg: 'size-3',
        xl: 'size-3',
      };
      for (const size of ['xs', 'sm', 'md', 'lg', 'xl'] as const) {
        fixture.componentRef.setInput('size', size);
        fixture.detectChanges();
        const marker = markerOf(items(fixture)[0]);
        expect(marker.className).toContain(dotSizeMap[size]);
      }
    });

    it('applies the correct circle diameter per size', () => {
      const fixture = TestBed.createComponent(SingleItemHost);
      fixture.componentRef.setInput('marker', 'circle');
      const circleSizeMap: Record<TwSize, string> = {
        xs: 'size-6',
        sm: 'size-7',
        md: 'size-8',
        lg: 'size-10',
        xl: 'size-12',
      };
      // Re-host via BasicTimelineHost so we can swap size easily.
      const fx2 = TestBed.createComponent(BasicTimelineHost);
      fx2.componentRef.setInput('size', 'md');
      fx2.componentInstance.items.set([
        { id: 1, color: 'primary', marker: 'circle', state: 'reached', label: 'A' },
      ]);
      fx2.detectChanges();
      expect(markerOf(items(fx2)[0]).className).toContain(circleSizeMap.md);

      for (const size of ['xs', 'sm', 'md', 'lg', 'xl'] as const) {
        fx2.componentRef.setInput('size', size);
        fx2.detectChanges();
        expect(markerOf(items(fx2)[0]).className).toContain(circleSizeMap[size]);
      }
    });

    it('applies aria-current="step" only for state="current"', () => {
      const fixture = TestBed.createComponent(SingleItemHost);
      fixture.detectChanges();
      let item = items(fixture)[0];
      expect(item.getAttribute('aria-current')).toBeNull();

      fixture.componentRef.setInput('state', 'current');
      fixture.detectChanges();
      item = items(fixture)[0];
      expect(item.getAttribute('aria-current')).toBe('step');

      fixture.componentRef.setInput('state', 'error');
      fixture.detectChanges();
      item = items(fixture)[0];
      expect(item.getAttribute('aria-current')).toBeNull();
    });

    it('emits visually-hidden state labels for non-reached states', () => {
      const fixture = TestBed.createComponent(SingleItemHost);
      const cases: Array<[TimelineState, string | null]> = [
        ['reached', null],
        ['pending', 'Pending: '],
        ['current', 'Current: '],
        ['error', 'Error: '],
      ];
      for (const [state, expected] of cases) {
        fixture.componentRef.setInput('state', state);
        fixture.detectChanges();
        const item = items(fixture)[0];
        const sr = item.querySelector('span.sr-only');
        if (expected === null) {
          expect(sr).toBeNull();
        } else {
          expect(sr).not.toBeNull();
          expect(sr!.textContent).toBe(expected);
        }
      }
    });

    it('marker fill reflects color × state combinations', () => {
      const fixture = TestBed.createComponent(SingleItemHost);
      fixture.componentRef.setInput('marker', 'circle');

      // reached + success → success-solid fill
      fixture.componentRef.setInput('color', 'success');
      fixture.componentRef.setInput('state', 'reached');
      fixture.detectChanges();
      let marker = markerOf(items(fixture)[0]);
      expect(marker.className).toContain('bg-success-solid');

      // current + primary → primary-solid + primary-soft ring
      fixture.componentRef.setInput('color', 'primary');
      fixture.componentRef.setInput('state', 'current');
      fixture.detectChanges();
      marker = markerOf(items(fixture)[0]);
      expect(marker.className).toContain('bg-primary-solid');
      expect(marker.className).toContain('ring-primary-soft');

      // pending → neutral surface fill regardless of color
      fixture.componentRef.setInput('color', 'success');
      fixture.componentRef.setInput('state', 'pending');
      fixture.detectChanges();
      marker = markerOf(items(fixture)[0]);
      expect(marker.className).toContain('bg-surface');
      expect(marker.className).toContain('border-border');

      // error → error palette regardless of color input
      fixture.componentRef.setInput('color', 'success');
      fixture.componentRef.setInput('state', 'error');
      fixture.detectChanges();
      marker = markerOf(items(fixture)[0]);
      expect(marker.className).toContain('bg-error-solid');
    });

    it('renders <time datetime="…"> for a Date timestamp', () => {
      const fixture = TestBed.createComponent(SingleItemHost);
      const date = new Date('2026-03-14T09:02:00Z');
      fixture.componentRef.setInput('timestamp', date);
      fixture.detectChanges();
      const time = items(fixture)[0].querySelector('time')!;
      expect(time).not.toBeNull();
      expect(time.getAttribute('datetime')).toBe(date.toISOString());
      expect(time.textContent?.length).toBeGreaterThan(0);
    });

    it('renders a <span> (not <time>) when timestamp is a string and dateTime is null', () => {
      const fixture = TestBed.createComponent(SingleItemHost);
      fixture.componentRef.setInput('timestamp', '2 hours ago');
      fixture.detectChanges();
      const item = items(fixture)[0];
      expect(item.querySelector('time')).toBeNull();
      const span = Array.from(item.querySelectorAll('span')).find((s) =>
        s.className.includes('text-fg-muted'),
      );
      expect(span?.textContent).toContain('2 hours ago');
    });

    it('renders <time> when timestamp is a string and dateTime is provided', () => {
      const fixture = TestBed.createComponent(SingleItemHost);
      fixture.componentRef.setInput('timestamp', 'March 14');
      fixture.componentRef.setInput('dateTime', '2026-03-14');
      fixture.detectChanges();
      const time = items(fixture)[0].querySelector('time')!;
      expect(time).not.toBeNull();
      expect(time.getAttribute('datetime')).toBe('2026-03-14');
      expect(time.textContent).toBe('March 14');
    });

    it('renders no timestamp element when timestamp is null', () => {
      const fixture = TestBed.createComponent(SingleItemHost);
      fixture.detectChanges();
      const item = items(fixture)[0];
      expect(item.querySelector('time')).toBeNull();
      const muted = Array.from(item.querySelectorAll('span')).filter((s) =>
        s.className.includes('text-fg-muted'),
      );
      expect(muted.length).toBe(0);
    });

    it('computes the enter animation class per orientation', () => {
      // `animate.enter` is a compiler-level host binding in Angular v21+ and
      // does not surface as a queryable DOM attribute, so we inspect the
      // computed signal on the item instance directly.
      const fixture = TestBed.createComponent(BasicTimelineHost);
      fixture.detectChanges();
      const itemInstance = fixture.debugElement.query(
        By.directive(TimelineItemComponent),
      ).componentInstance as TimelineItemComponent;
      expect(itemInstance.enterAnimationClass()).toBe('timeline-item-enter');

      fixture.componentRef.setInput('orientation', 'horizontal');
      fixture.detectChanges();
      expect(itemInstance.enterAnimationClass()).toBe(
        'timeline-item-enter-horizontal',
      );
    });
  });

  describe('Content projection', () => {
    it('renders projected marker content inside a circle marker', () => {
      const fixture = TestBed.createComponent(SlotProjectionHost);
      fixture.componentRef.setInput('marker', 'circle');
      fixture.componentRef.setInput('projectMarker', true);
      fixture.detectChanges();
      const marker = markerOf(items(fixture)[0]);
      expect(marker.querySelector('[data-testid="marker-slot"]')).not.toBeNull();
      // Auto-number must not be rendered when the slot is filled.
      expect(marker.querySelector('span.font-semibold')).toBeNull();
    });

    it('switches marker fill to SOFT when a marker slot is projected (reached state)', () => {
      const fixture = TestBed.createComponent(SlotProjectionHost);
      fixture.componentRef.setInput('marker', 'circle');
      fixture.componentRef.setInput('color', 'primary');
      fixture.componentRef.setInput('state', 'reached');
      fixture.componentRef.setInput('projectMarker', true);
      fixture.detectChanges();
      const marker = markerOf(items(fixture)[0]);
      expect(marker.className).toContain('bg-primary-soft');
      expect(marker.className).not.toContain('bg-primary-solid');
    });

    it('warns and ignores marker slot when marker="dot"', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const fixture = TestBed.createComponent(SlotProjectionHost);
      fixture.componentRef.setInput('marker', 'dot');
      fixture.componentRef.setInput('projectMarker', true);
      fixture.detectChanges();
      const marker = markerOf(items(fixture)[0]);
      expect(marker.querySelector('[data-testid="marker-slot"]')).toBeNull();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toMatch(/twTimelineMarker.+marker="dot"/);
      warn.mockRestore();
    });

    it('uses projected [twTimelineTimestamp] content in place of the timestamp input', () => {
      const fixture = TestBed.createComponent(SlotProjectionHost);
      fixture.componentRef.setInput('timestamp', new Date('2026-03-14T09:00:00Z'));
      fixture.componentRef.setInput('projectTimestamp', true);
      fixture.detectChanges();
      const item = items(fixture)[0];
      expect(item.querySelector('[data-testid="ts-slot"]')).not.toBeNull();
      // Native <time> is suppressed by the slot.
      expect(item.querySelector('time')).toBeNull();
    });

    it('renders [twTimelineOpposite] content only in alternate/split alignments', () => {
      const fixture = TestBed.createComponent(SlotProjectionHost);
      fixture.componentRef.setInput('projectOpposite', true);

      fixture.componentRef.setInput('align', 'left');
      fixture.detectChanges();
      expect(items(fixture)[0].querySelector('[data-testid="opp-slot"]')).toBeNull();

      fixture.componentRef.setInput('align', 'alternate');
      fixture.detectChanges();
      expect(
        items(fixture)[0].querySelector('[data-testid="opp-slot"]'),
      ).not.toBeNull();

      fixture.componentRef.setInput('align', 'split');
      fixture.detectChanges();
      expect(
        items(fixture)[0].querySelector('[data-testid="opp-slot"]'),
      ).not.toBeNull();

      // Horizontal: ignored.
      fixture.componentRef.setInput('orientation', 'horizontal');
      fixture.detectChanges();
      expect(items(fixture)[0].querySelector('[data-testid="opp-slot"]')).toBeNull();
    });

    it('renders default-slot content inside the body wrapper', () => {
      const fixture = TestBed.createComponent(SlotProjectionHost);
      fixture.detectChanges();
      const body = items(fixture)[0].querySelector('[data-testid="body"]');
      expect(body).not.toBeNull();
    });
  });

  describe('Auto-numbering', () => {
    it('renders 1-based indices for circle markers without projected content', () => {
      const fixture = TestBed.createComponent(DynamicItemsHost);
      fixture.detectChanges();
      const numbers = Array.from(
        fixture.nativeElement.querySelectorAll('tw-timeline-item div.rounded-full span.font-semibold'),
      ).map((s) => (s as HTMLElement).textContent);
      expect(numbers).toEqual(['1', '2', '3']);
    });

    it('updates numbering when an item is appended', () => {
      const fixture = TestBed.createComponent(DynamicItemsHost);
      fixture.detectChanges();
      fixture.componentInstance.ids.update((arr) => [...arr, 4]);
      fixture.detectChanges();
      const numbers = Array.from(
        fixture.nativeElement.querySelectorAll('tw-timeline-item div.rounded-full span.font-semibold'),
      ).map((s) => (s as HTMLElement).textContent);
      expect(numbers).toEqual(['1', '2', '3', '4']);
    });

    it('re-numbers when a middle item is removed', () => {
      const fixture = TestBed.createComponent(DynamicItemsHost);
      fixture.detectChanges();
      fixture.componentInstance.ids.update((arr) => arr.filter((id) => id !== 2));
      fixture.detectChanges();
      const numbers = Array.from(
        fixture.nativeElement.querySelectorAll('tw-timeline-item div.rounded-full span.font-semibold'),
      ).map((s) => (s as HTMLElement).textContent);
      expect(numbers).toEqual(['1', '2']);
    });
  });

  describe('Connectors', () => {
    it('vertical first item has only its trailing connector', () => {
      const fixture = TestBed.createComponent(BasicTimelineHost);
      fixture.detectChanges();
      const conns = connectorSpans(items(fixture)[0]);
      expect(conns.length).toBe(1);
    });

    it('vertical last item has no connector (last + no leading in vertical)', () => {
      const fixture = TestBed.createComponent(BasicTimelineHost);
      fixture.detectChanges();
      const conns = connectorSpans(items(fixture)[2]);
      expect(conns.length).toBe(0);
    });

    it('vertical middle item has its trailing connector only', () => {
      const fixture = TestBed.createComponent(BasicTimelineHost);
      fixture.detectChanges();
      // Vertical layout pins the marker to the top of the body — no leading
      // connector is rendered. The trailing connector alone spans the gap to
      // the next item through the body's bottom padding.
      const conns = connectorSpans(items(fixture)[1]);
      expect(conns.length).toBe(1);
    });

    it('horizontal middle item has both leading and trailing connectors', () => {
      const fixture = TestBed.createComponent(BasicTimelineHost);
      fixture.componentRef.setInput('orientation', 'horizontal');
      fixture.detectChanges();
      const conns = connectorSpans(items(fixture)[1]);
      expect(conns.length).toBe(2);
    });

    it('horizontal first item renders an invisible leading spacer plus a coloured trailing connector', () => {
      const fixture = TestBed.createComponent(BasicTimelineHost);
      fixture.componentInstance.items.set([
        { id: 1, color: 'success', marker: 'dot', state: 'reached', label: 'A' },
        { id: 2, color: 'primary', marker: 'dot', state: 'pending', label: 'B' },
        { id: 3, color: 'primary', marker: 'dot', state: 'pending', label: 'C' },
      ]);
      fixture.componentRef.setInput('orientation', 'horizontal');
      fixture.detectChanges();
      const conns = connectorSpans(items(fixture)[0]);
      // Two spans: the leading spacer (no colour) and the coloured trailing line.
      expect(conns.length).toBe(2);
      // First span is the leading spacer — geometry only, no bg-* / border-* colour token.
      expect(conns[0].className).not.toMatch(/bg-\w+-border-strong|border-\w+-border-strong/);
      // Second span is the coloured trailing line.
      expect(conns[1].className).toContain('bg-success-border-strong');
    });

    it('horizontal last item renders a coloured leading connector plus an invisible trailing spacer', () => {
      const fixture = TestBed.createComponent(BasicTimelineHost);
      fixture.componentInstance.items.set([
        { id: 1, color: 'success', marker: 'dot', state: 'reached', label: 'A' },
        { id: 2, color: 'success', marker: 'dot', state: 'reached', label: 'B' },
        { id: 3, color: 'primary', marker: 'dot', state: 'pending', label: 'C' },
      ]);
      fixture.componentRef.setInput('orientation', 'horizontal');
      fixture.detectChanges();
      const conns = connectorSpans(items(fixture)[2]);
      expect(conns.length).toBe(2);
      // First span: leading — coloured. Previous item was reached + success.
      expect(conns[0].className).toContain('bg-success-border-strong');
      // Last span: trailing spacer — no colour token.
      expect(conns[1].className).not.toMatch(/bg-\w+-border-strong|border-\w+-border-strong/);
    });

    it('single-item timeline emits zero connector spans (first AND last)', () => {
      const fixture = TestBed.createComponent(SoloItemHost);
      fixture.detectChanges();
      const conns = connectorSpans(items(fixture)[0]);
      expect(conns.length).toBe(0);
    });

    it('trailing connector after a reached item carries the color token', () => {
      const fixture = TestBed.createComponent(BasicTimelineHost);
      fixture.componentInstance.items.set([
        { id: 1, color: 'success', marker: 'dot', state: 'reached', label: 'A' },
        { id: 2, color: 'primary', marker: 'dot', state: 'pending', label: 'B' },
      ]);
      fixture.detectChanges();
      const firstConns = connectorSpans(items(fixture)[0]);
      // First item only has trailing connector.
      expect(firstConns[0].className).toContain('bg-success-border-strong');
    });

    it('trailing connector after a current item is neutral', () => {
      const fixture = TestBed.createComponent(BasicTimelineHost);
      fixture.componentInstance.items.set([
        { id: 1, color: 'primary', marker: 'dot', state: 'current', label: 'A' },
        { id: 2, color: 'primary', marker: 'dot', state: 'pending', label: 'B' },
      ]);
      fixture.detectChanges();
      const firstConns = connectorSpans(items(fixture)[0]);
      expect(firstConns[0].className).toContain('bg-border');
      expect(firstConns[0].className).not.toContain('bg-primary-border-strong');
    });

    it('trailing connector after an error item carries the error token', () => {
      const fixture = TestBed.createComponent(BasicTimelineHost);
      fixture.componentInstance.items.set([
        { id: 1, color: 'primary', marker: 'dot', state: 'error', label: 'A' },
        { id: 2, color: 'primary', marker: 'dot', state: 'pending', label: 'B' },
      ]);
      fixture.detectChanges();
      const firstConns = connectorSpans(items(fixture)[0]);
      expect(firstConns[0].className).toContain('bg-error-border-strong');
    });

    it('dashed connectors use border-* utilities, not bg-*', () => {
      const fixture = TestBed.createComponent(BasicTimelineHost);
      fixture.componentRef.setInput('lineStyle', 'dashed');
      fixture.componentInstance.items.set([
        { id: 1, color: 'success', marker: 'dot', state: 'reached', label: 'A' },
        { id: 2, color: 'primary', marker: 'dot', state: 'pending', label: 'B' },
      ]);
      fixture.detectChanges();
      const conn = connectorSpans(items(fixture)[0])[0];
      expect(conn.className).toContain('border-dashed');
      expect(conn.className).toContain('border-success-border-strong');
      expect(conn.className).not.toContain('bg-success-border-strong');
    });
  });

  describe('Accessibility', () => {
    it('container has no tabindex', () => {
      const fixture = TestBed.createComponent(BasicTimelineHost);
      fixture.detectChanges();
      expect(timelineEl(fixture).getAttribute('tabindex')).toBeNull();
    });

    it('item host has no tabindex', () => {
      const fixture = TestBed.createComponent(BasicTimelineHost);
      fixture.detectChanges();
      for (const item of items(fixture)) {
        expect(item.getAttribute('tabindex')).toBeNull();
      }
    });

    it('marker bubble carries aria-hidden="true"', () => {
      const fixture = TestBed.createComponent(BasicTimelineHost);
      fixture.detectChanges();
      const marker = markerOf(items(fixture)[0]);
      expect(marker.getAttribute('aria-hidden')).toBe('true');
    });

    it('visually-hidden state label uses sr-only class', () => {
      const fixture = TestBed.createComponent(SingleItemHost);
      fixture.componentRef.setInput('state', 'pending');
      fixture.detectChanges();
      const sr = items(fixture)[0].querySelector('span.sr-only');
      expect(sr).not.toBeNull();
      expect(sr!.classList.contains('sr-only')).toBe(true);
    });
  });

  describe('Horizontal overflow', () => {
    function viewport(fixture: ComponentFixture<unknown>): HTMLDivElement | null {
      return fixture.nativeElement.querySelector('tw-timeline div.overflow-x-auto');
    }
    function chevrons(fixture: ComponentFixture<unknown>): HTMLButtonElement[] {
      return Array.from(
        fixture.nativeElement.querySelectorAll('tw-timeline > button'),
      ) as HTMLButtonElement[];
    }
    function setScrollMetrics(
      el: HTMLElement,
      m: { scrollLeft: number; clientWidth: number; scrollWidth: number },
    ): void {
      Object.defineProperty(el, 'scrollWidth', { value: m.scrollWidth, configurable: true });
      Object.defineProperty(el, 'clientWidth', { value: m.clientWidth, configurable: true });
      Object.defineProperty(el, 'scrollLeft', {
        value: m.scrollLeft,
        configurable: true,
        writable: true,
      });
    }

    it('horizontal items use a per-density min-w floor, not flex-1 basis-0', () => {
      const fixture = TestBed.createComponent(BasicTimelineHost);
      fixture.componentRef.setInput('orientation', 'horizontal');
      fixture.componentRef.setInput('size', 'md');
      fixture.detectChanges();
      const first = items(fixture)[0];
      expect(first.className).toContain('min-w-40');
      expect(first.className).not.toContain('flex-1');
      expect(first.className).not.toContain('basis-0');
    });

    it('renders an inner scroll wrapper only in horizontal orientation', () => {
      const fixture = TestBed.createComponent(BasicTimelineHost);
      fixture.detectChanges();
      expect(viewport(fixture)).toBeNull();

      fixture.componentRef.setInput('orientation', 'horizontal');
      fixture.detectChanges();
      const vp = viewport(fixture);
      expect(vp).not.toBeNull();
      expect(vp!.className).toContain('overflow-x-auto');
      expect(vp!.className).toContain('tw-scrollbar-none');
      expect(vp!.className).toContain('scroll-smooth');
      expect(vp!.className).toContain('motion-reduce:scroll-auto');
    });

    it('renders prev/next chevron buttons in horizontal orientation', () => {
      const fixture = TestBed.createComponent(HorizontalScrollHost);
      fixture.detectChanges();
      const btns = chevrons(fixture);
      expect(btns.length).toBe(2);
      expect(btns[0].getAttribute('aria-label')).toBe('Scroll to previous events');
      expect(btns[1].getAttribute('aria-label')).toBe('Scroll to next events');
      expect(btns[0].getAttribute('type')).toBe('button');
      expect(btns[1].getAttribute('type')).toBe('button');
    });

    it('does not render chevron buttons in vertical orientation', () => {
      const fixture = TestBed.createComponent(BasicTimelineHost);
      fixture.detectChanges();
      expect(chevrons(fixture).length).toBe(0);
    });

    it('uses labels from TW_TIMELINE_SCROLL_LABELS when provided', () => {
      TestBed.configureTestingModule({
        providers: [
          provideTwTimelineScrollLabels({
            scrollPrevious: 'Vorherige',
            scrollNext: 'Nächste',
          }),
        ],
      });
      const fixture = TestBed.createComponent(HorizontalScrollHost);
      fixture.detectChanges();
      const btns = chevrons(fixture);
      expect(btns[0].getAttribute('aria-label')).toBe('Vorherige');
      expect(btns[1].getAttribute('aria-label')).toBe('Nächste');
    });

    it('falls back to English defaults for missing label keys', () => {
      TestBed.configureTestingModule({
        providers: [provideTwTimelineScrollLabels({ scrollPrevious: 'Voriger' })],
      });
      const fixture = TestBed.createComponent(HorizontalScrollHost);
      fixture.detectChanges();
      const btns = chevrons(fixture);
      expect(btns[0].getAttribute('aria-label')).toBe('Voriger');
      expect(btns[1].getAttribute('aria-label')).toBe('Scroll to next events');
    });

    it('reflects scrollControls="never" by hiding both chevrons', () => {
      const fixture = TestBed.createComponent(HorizontalScrollHost);
      fixture.componentRef.setInput('scrollControls', 'never');
      fixture.detectChanges();
      const btns = chevrons(fixture);
      expect(btns.length).toBe(2);
      for (const b of btns) {
        expect(b.className).toContain('hidden');
        expect(b.getAttribute('aria-hidden')).toBe('true');
      }
    });

    it('reflects scrollControls="always" by rendering both chevrons regardless of scroll state', () => {
      const fixture = TestBed.createComponent(HorizontalScrollHost);
      fixture.componentRef.setInput('scrollControls', 'always');
      fixture.detectChanges();
      const btns = chevrons(fixture);
      expect(btns.length).toBe(2);
      for (const b of btns) {
        expect(b.getAttribute('aria-hidden')).toBeNull();
        expect(b.className).not.toContain('hidden');
        expect(b.className).not.toContain('invisible');
      }
      // Without scroll possible, both buttons are disabled.
      expect(btns[0].disabled).toBe(true);
      expect(btns[1].disabled).toBe(true);
    });

    it('updates prev/next visibility when the viewport scrolls', () => {
      const fixture = TestBed.createComponent(HorizontalScrollHost);
      fixture.detectChanges();
      const vp = viewport(fixture)!;
      const btns = chevrons(fixture);

      setScrollMetrics(vp, { scrollLeft: 0, clientWidth: 400, scrollWidth: 1000 });
      vp.dispatchEvent(new Event('scroll'));
      fixture.detectChanges();
      // scrollLeft=0 → prev auto-hidden; next visible.
      expect(btns[0].getAttribute('aria-hidden')).toBe('true');
      expect(btns[1].getAttribute('aria-hidden')).toBeNull();

      setScrollMetrics(vp, { scrollLeft: 300, clientWidth: 400, scrollWidth: 1000 });
      vp.dispatchEvent(new Event('scroll'));
      fixture.detectChanges();
      // Mid-scroll: both visible.
      expect(btns[0].getAttribute('aria-hidden')).toBeNull();
      expect(btns[1].getAttribute('aria-hidden')).toBeNull();

      // 600 + 400 = 1000 = scrollWidth → no more next.
      setScrollMetrics(vp, { scrollLeft: 600, clientWidth: 400, scrollWidth: 1000 });
      vp.dispatchEvent(new Event('scroll'));
      fixture.detectChanges();
      expect(btns[0].getAttribute('aria-hidden')).toBeNull();
      expect(btns[1].getAttribute('aria-hidden')).toBe('true');
    });

    it('clicking the next chevron calls scrollBy with a positive delta in LTR', () => {
      const fixture = TestBed.createComponent(HorizontalScrollHost);
      fixture.detectChanges();
      const vp = viewport(fixture)!;
      setScrollMetrics(vp, { scrollLeft: 0, clientWidth: 400, scrollWidth: 1000 });
      vp.dispatchEvent(new Event('scroll'));
      fixture.detectChanges();

      // JSDOM does not implement `Element.scrollBy`; stub it before triggering
      // the click so the timeline's `_scrollNext` has a function to call.
      const scrollByMock = vi.fn();
      (vp as unknown as { scrollBy: typeof scrollByMock }).scrollBy = scrollByMock;
      chevrons(fixture)[1].click();
      // 75% of clientWidth = 300, floored.
      expect(scrollByMock).toHaveBeenCalledWith({ left: 300, behavior: 'smooth' });
    });

    it('clicking the prev chevron calls scrollBy with a negative delta in LTR', () => {
      const fixture = TestBed.createComponent(HorizontalScrollHost);
      fixture.detectChanges();
      const vp = viewport(fixture)!;
      setScrollMetrics(vp, { scrollLeft: 300, clientWidth: 400, scrollWidth: 1000 });
      vp.dispatchEvent(new Event('scroll'));
      fixture.detectChanges();
      const scrollByMock = vi.fn();
      (vp as unknown as { scrollBy: typeof scrollByMock }).scrollBy = scrollByMock;
      chevrons(fixture)[0].click();
      expect(scrollByMock).toHaveBeenCalledWith({ left: -300, behavior: 'smooth' });
    });

    it('flips scroll-delta sign under RTL', () => {
      TestBed.configureTestingModule({
        providers: [
          {
            provide: Directionality,
            useValue: {
              value: 'rtl',
              change: { subscribe: () => ({ unsubscribe: () => {} }) },
            },
          },
        ],
      });
      const fixture = TestBed.createComponent(HorizontalScrollHost);
      fixture.detectChanges();
      const vp = viewport(fixture)!;
      setScrollMetrics(vp, { scrollLeft: 300, clientWidth: 400, scrollWidth: 1000 });
      vp.dispatchEvent(new Event('scroll'));
      fixture.detectChanges();
      const scrollByMock = vi.fn();
      (vp as unknown as { scrollBy: typeof scrollByMock }).scrollBy = scrollByMock;
      // First DOM-order button is the "previous" semantic; under RTL its
      // scroll delta is positive (toward larger scrollLeft).
      chevrons(fixture)[0].click();
      expect(scrollByMock).toHaveBeenCalledWith({ left: 300, behavior: 'smooth' });
    });

    it('chevron buttons carry the canonical focus-ring classes', () => {
      const fixture = TestBed.createComponent(HorizontalScrollHost);
      fixture.detectChanges();
      for (const b of chevrons(fixture)) {
        expect(b.className).toContain('focus-visible:outline-2');
        expect(b.className).toContain('focus-visible:outline-offset-2');
        expect(b.className).toContain('focus-visible:outline-primary-500');
      }
    });
  });

  describe('Horizontal layout — marker baseline', () => {
    // These specs verify the *class bindings* that drive the CSS subgrid layout
    // that keeps every horizontal item's marker bubble on a shared baseline.
    // We do NOT assert on getBoundingClientRect() values — JSDOM (Vitest's DOM)
    // returns 0 for every rect coordinate; a pixel comparison would be vacuously
    // true. Pixel-perfect visual regression coverage lives in the e2e/ suite.

    it('viewport uses grid + subgrid + auto-cols-max for shared marker baseline', () => {
      const fixture = TestBed.createComponent(BasicTimelineHost);
      fixture.componentRef.setInput('orientation', 'horizontal');
      fixture.detectChanges();

      const vp = fixture.nativeElement.querySelector(
        'tw-timeline div.overflow-x-auto',
      ) as HTMLElement;
      expect(vp.className).toContain('grid');
      expect(vp.className).toContain('grid-flow-col');
      expect(vp.className).toContain('auto-cols-max');
      expect(vp.className).toMatch(/\[grid-template-rows:minmax\(0,1fr\)_auto\]/);
      // The old flex layout is gone:
      expect(vp.className).not.toContain('flex-row');
    });

    it('horizontal items participate as subgrid rows (row-span-2 + items-center)', () => {
      const fixture = TestBed.createComponent(BasicTimelineHost);
      fixture.componentRef.setInput('orientation', 'horizontal');
      fixture.detectChanges();

      const itemEls = items(fixture);
      expect(itemEls.length).toBeGreaterThan(0);
      for (const el of itemEls) {
        expect(el.className).toContain('grid');
        expect(el.className).toContain('grid-rows-subgrid');
        expect(el.className).toContain('row-span-2');
        // Flex-order classes are no longer emitted in horizontal:
        expect(el.className).not.toMatch(/\border-1\b/);
        expect(el.className).not.toMatch(/\border-2\b/);
      }
    });

    it('horizontal body lands on row 1 with self-end; marker-side lands on row 2', () => {
      const fixture = TestBed.createComponent(BasicTimelineHost);
      fixture.componentRef.setInput('orientation', 'horizontal');
      fixture.detectChanges();

      const firstItem = items(fixture)[0];
      // Item template emits marker-side first, body second.
      const markerSideEl = firstItem.children[0] as HTMLElement;
      const bodyEl = firstItem.children[1] as HTMLElement;

      expect(bodyEl.className).toContain('row-start-1');
      expect(bodyEl.className).toContain('self-end');
      expect(markerSideEl.className).toContain('row-start-2');
    });

    it('vertical orientation does NOT carry the subgrid classes (regression guard)', () => {
      const fixture = TestBed.createComponent(BasicTimelineHost);
      fixture.componentRef.setInput('orientation', 'vertical');
      fixture.detectChanges();

      const itemEls = items(fixture);
      for (const el of itemEls) {
        expect(el.className).not.toContain('grid-rows-subgrid');
        expect(el.className).not.toContain('row-span-2');
      }
    });

    it('horizontal dot markers do NOT carry mt-* (would offset them below the connector row)', () => {
      const fixture = TestBed.createComponent(BasicTimelineHost);
      fixture.componentRef.setInput('orientation', 'horizontal');
      for (const size of ['xs', 'sm', 'md', 'lg', 'xl'] as const) {
        fixture.componentRef.setInput('size', size);
        fixture.detectChanges();
        const marker = markerOf(items(fixture)[0]);
        expect(marker.className).not.toMatch(/\bmt-1\.5\b/);
        expect(marker.className).not.toMatch(/\bmt-2\b/);
      }
    });

    it('vertical dot markers still carry mt-* (alignment with title first line preserved)', () => {
      const fixture = TestBed.createComponent(BasicTimelineHost);
      fixture.componentRef.setInput('orientation', 'vertical');
      const verticalDotNudge: Record<TwSize, string> = {
        xs: 'mt-1.5',
        sm: 'mt-1.5',
        md: 'mt-1.5',
        lg: 'mt-2',
        xl: 'mt-2',
      };
      for (const size of ['xs', 'sm', 'md', 'lg', 'xl'] as const) {
        fixture.componentRef.setInput('size', size);
        fixture.detectChanges();
        const marker = markerOf(items(fixture)[0]);
        expect(marker.className).toContain(verticalDotNudge[size]);
      }
    });
  });
});
