import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { CalendarCellComponent } from './calendar-cell';
import {
  createCalendarCell,
  type CalendarCell,
  type CalendarViewState,
} from './calendar.types';

// ── Test host ─────────────────────────────────────────────────────

@Component({
  imports: [CalendarCellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-calendar-cell
      [cell]="cell()"
      [outside]="outside()"
      [tabindex]="tabindex()"
      (selected)="onSelected($event)"
      (focused)="onFocused($event)"
      (previewed)="onPreviewed($event)"
    />
  `,
})
class CellHost {
  readonly cell = signal<CalendarCell<Date>>(buildCell({}));
  readonly outside = signal(false);
  readonly tabindex = signal<number>(-1);

  readonly selectedSpy = vi.fn();
  readonly focusedSpy = vi.fn();
  readonly previewedSpy = vi.fn();

  onSelected(c: CalendarCell<Date>): void {
    this.selectedSpy(c);
  }
  onFocused(c: CalendarCell<Date>): void {
    this.focusedSpy(c);
  }
  onPreviewed(c: CalendarCell<Date>): void {
    this.previewedSpy(c);
  }
}

// ── Helpers ───────────────────────────────────────────────────────

function buildCell(overrides: Partial<CalendarCell<Date>>): CalendarCell<Date> {
  const date = overrides.value ?? new Date(2026, 3, 26);
  const base = createCalendarCell<Date>({
    value: date,
    displayValue: '26',
    ariaLabel: 'Sunday, April 26, 2026',
    enabled: true,
    cssClasses: '',
    compareValue: 20260326,
  });
  return { ...base, ...overrides };
}

function getHost(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('tw-calendar-cell') as HTMLElement;
}

function getButton(fixture: ComponentFixture<unknown>): HTMLButtonElement {
  return fixture.nativeElement.querySelector('tw-calendar-cell button') as HTMLButtonElement;
}

// ── Tests ─────────────────────────────────────────────────────────

describe('CalendarCellComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  describe('rendering', () => {
    it('mounts and renders the cell display text', () => {
      const fixture = TestBed.createComponent(CellHost);
      fixture.detectChanges();
      const button = getButton(fixture);
      expect(button).toBeTruthy();
      expect(button.textContent?.trim()).toBe('26');
    });

    it('host element carries role="gridcell"', () => {
      const fixture = TestBed.createComponent(CellHost);
      fixture.detectChanges();
      expect(getHost(fixture).getAttribute('role')).toBe('gridcell');
    });

    it('renders the cell aria-label on the inner button', () => {
      const fixture = TestBed.createComponent(CellHost);
      fixture.detectChanges();
      expect(getButton(fixture).getAttribute('aria-label')).toBe('Sunday, April 26, 2026');
    });
  });

  describe('selected state', () => {
    it('sets aria-selected="true" on the inner button when cell.isSelected is true', () => {
      const fixture = TestBed.createComponent(CellHost);
      fixture.componentInstance.cell.set(buildCell({ isSelected: true }));
      fixture.detectChanges();
      expect(getButton(fixture).getAttribute('aria-selected')).toBe('true');
    });

    it('omits aria-selected when the cell is not selected', () => {
      const fixture = TestBed.createComponent(CellHost);
      fixture.componentInstance.cell.set(buildCell({ isSelected: false }));
      fixture.detectChanges();
      expect(getButton(fixture).getAttribute('aria-selected')).toBeNull();
    });
  });

  describe('disabled state', () => {
    it('sets aria-disabled="true" on the inner button when the cell is not enabled', () => {
      const fixture = TestBed.createComponent(CellHost);
      fixture.componentInstance.cell.set(buildCell({ enabled: false }));
      fixture.detectChanges();
      expect(getButton(fixture).getAttribute('aria-disabled')).toBe('true');
    });

    it('disables the inner button element when the cell is not enabled', () => {
      const fixture = TestBed.createComponent(CellHost);
      fixture.componentInstance.cell.set(buildCell({ enabled: false }));
      fixture.detectChanges();
      expect(getButton(fixture).disabled).toBe(true);
    });

    it('does not emit `selected` when a disabled cell is clicked', () => {
      const fixture = TestBed.createComponent(CellHost);
      const host = fixture.componentInstance;
      host.cell.set(buildCell({ enabled: false }));
      fixture.detectChanges();

      // Disabled buttons swallow click events natively, but explicitly call
      // the click handler regardless to assert the guard inside `onClick`.
      const button = getButton(fixture);
      button.click();
      fixture.detectChanges();

      expect(host.selectedSpy).not.toHaveBeenCalled();
    });
  });

  describe('today state', () => {
    it('sets aria-current="date" when cell.isToday is true', () => {
      const fixture = TestBed.createComponent(CellHost);
      fixture.componentInstance.cell.set(buildCell({ isToday: true }));
      fixture.detectChanges();
      expect(getButton(fixture).getAttribute('aria-current')).toBe('date');
    });

    it('omits aria-current when the cell is not today', () => {
      const fixture = TestBed.createComponent(CellHost);
      fixture.componentInstance.cell.set(buildCell({ isToday: false }));
      fixture.detectChanges();
      expect(getButton(fixture).getAttribute('aria-current')).toBeNull();
    });
  });

  describe('outside-month styling', () => {
    it('applies muted text styling for cells in adjacent months', () => {
      const fixture = TestBed.createComponent(CellHost);
      fixture.componentInstance.outside.set(true);
      fixture.detectChanges();
      // The outside variant adds `text-fg-muted` to the button's class list.
      expect(getButton(fixture).className).toContain('text-fg-muted');
    });

    it('does not apply the outside styling when outside is false', () => {
      const fixture = TestBed.createComponent(CellHost);
      fixture.componentInstance.outside.set(false);
      fixture.detectChanges();
      expect(getButton(fixture).className).not.toContain('text-fg-muted');
    });
  });

  describe('interaction', () => {
    it('emits `selected` with the cell payload on click', () => {
      const fixture = TestBed.createComponent(CellHost);
      const host = fixture.componentInstance;
      fixture.detectChanges();
      getButton(fixture).click();
      fixture.detectChanges();
      expect(host.selectedSpy).toHaveBeenCalledTimes(1);
      expect(host.selectedSpy.mock.calls[0]?.[0]?.displayValue).toBe('26');
    });

    it('emits `focused` when the inner button receives focus', () => {
      const fixture = TestBed.createComponent(CellHost);
      const host = fixture.componentInstance;
      fixture.detectChanges();
      getButton(fixture).dispatchEvent(new FocusEvent('focus'));
      fixture.detectChanges();
      expect(host.focusedSpy).toHaveBeenCalledTimes(1);
    });

    it('emits `previewed` on mouse enter', () => {
      const fixture = TestBed.createComponent(CellHost);
      const host = fixture.componentInstance;
      fixture.detectChanges();
      getButton(fixture).dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();
      expect(host.previewedSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('roving tabindex', () => {
    it('reflects tabindex=0 when set as the active cell', () => {
      const fixture = TestBed.createComponent(CellHost);
      fixture.componentInstance.tabindex.set(0);
      fixture.detectChanges();
      expect(getButton(fixture).getAttribute('tabindex')).toBe('0');
    });

    it('reflects tabindex=-1 by default', () => {
      const fixture = TestBed.createComponent(CellHost);
      fixture.detectChanges();
      expect(getButton(fixture).getAttribute('tabindex')).toBe('-1');
    });
  });
});

// ── View footprint ────────────────────────────────────────────────
//
// Switching day -> month -> year must not resize the calendar panel. The panel is
// `inline-block`, so its box is the intrinsic size of whichever view is mounted, and each
// view's intrinsic size is arithmetic on the cell geometry below plus the grid template in
// month-view.ts / year-view.ts / multi-year-view.ts.
//
// jsdom performs no layout, so these tests re-derive the footprint from the rendered cell
// classes rather than measuring it. The grid shapes are constants here because they live in
// the view templates, not the cell: the day grid is `grid-cols-7 gap-0`, and both the month
// and year grids are `grid-cols-4 gap-1`.
//
// This is what stops the two known regressions coming back: month and year cells were `h-10`
// against the day cell's `h-9` (panel grew 4px per row on a view switch) and were `w-16` /
// `w-14` against the day cell's `w-9` (panel measured 252 / 268 / 236 wide). Equalising has
// to happen here, in the cell, and not as a `min-w` on the shared view region — see the
// comment on that wrapper in calendar.ts.

@Component({
  imports: [CalendarCellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-calendar-cell [cell]="cell()" [view]="view()" />`,
})
class ViewHost {
  readonly cell = signal<CalendarCell<Date>>(buildCell({}));
  readonly view = signal<CalendarViewState>('day');
}

describe('CalendarCellComponent view footprint', () => {
  /** Tailwind's `--spacing`, in px — `w-9` is 9 x 4 = 36px. */
  const UNIT = 4;

  /** Columns and gap of the grid each view renders its cells into. */
  const GRIDS: Readonly<Record<CalendarViewState, { columns: number; gap: number }>> = {
    day: { columns: 7, gap: 0 },
    month: { columns: 4, gap: 1 },
    year: { columns: 4, gap: 1 },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  /** Reads the `w-N` / `h-N` step off the rendered button. */
  function step(fixture: ComponentFixture<unknown>, axis: 'w' | 'h'): number {
    const match = getButton(fixture)
      .className.split(/\s+/)
      .map(cls => new RegExp(`^${axis}-(\\d+)$`).exec(cls))
      .find(m => m !== null);

    expect(match, `no ${axis}-N utility on the cell button`).toBeTruthy();
    return Number(match![1]);
  }

  const views: readonly CalendarViewState[] = ['day', 'month', 'year'];

  /** Renders each view in turn on ONE fixture and maps it through `read`. */
  function forEachView(read: (fixture: ComponentFixture<ViewHost>) => number): number[] {
    const fixture = TestBed.createComponent(ViewHost);
    return views.map(view => {
      fixture.componentInstance.view.set(view);
      fixture.detectChanges();
      return read(fixture);
    });
  }

  it('renders every view at the same grid width, so the panel holds its box', () => {
    const widths = forEachView(fixture => {
      const { columns, gap } = GRIDS[fixture.componentInstance.view()];
      return (step(fixture, 'w') * columns + gap * (columns - 1)) * UNIT;
    });

    expect(new Set(widths).size, `view widths diverge: ${widths.join(' / ')}px`).toBe(1);
    expect(widths[0]).toBe(252);
  });

  it('renders every view at the same row height', () => {
    const heights = forEachView(fixture => step(fixture, 'h') * UNIT);

    expect(new Set(heights).size, `view row heights diverge: ${heights.join(' / ')}px`).toBe(1);
    expect(heights[0]).toBe(36);
  });
});
