import {
  Directive,
  afterEveryRender,
  computed,
  inject,
  input,
  output,
  signal,
  type InputSignal,
  type OutputEmitterRef,
  type Signal,
  type TemplateRef,
  type WritableSignal,
} from '@angular/core';
import type { CalendarCellComponent } from './calendar-cell';
import type {
  CalendarCell,
  CalendarViewState,
  DateClassFn,
  DateFilterFn,
  DateRange,
  DisabledDates,
} from './calendar.types';
import { type DateAdapter, DATE_ADAPTER } from './date-adapter';
import { isDateInRange } from './calendar.utils';

/**
 * Abstract base for the three calendar views. Holds shared inputs/outputs
 * (selection, preview, min/max, filters), cell-hit helpers, and roving-focus
 * machinery. Subclasses implement `cells`, `gridLabel`, `onKeyNav`, and
 * `getActiveCompareValue`.
 */
@Directive()
export abstract class CalendarViewBase<D> {
  protected readonly dateAdapter: DateAdapter<D> = inject<DateAdapter<D>>(DATE_ADAPTER);

  /** The date that anchors the grid being rendered. */
  readonly activeDate: InputSignal<D> = input.required<D>();

  /** Current selection — scalar, array (multi), or range. Defaults to `null` (nothing selected). */
  readonly selected: InputSignal<D | D[] | DateRange<D> | null> =
    input<D | D[] | DateRange<D> | null>(null);

  /** Minimum selectable date. Defaults to `null` (no lower bound). */
  readonly minDate: InputSignal<D | null> = input<D | null>(null);
  /** Maximum selectable date. Defaults to `null` (no upper bound). */
  readonly maxDate: InputSignal<D | null> = input<D | null>(null);

  /** Per-date predicate — return `false` to disable. Defaults to `null` (every date passes). */
  readonly dateFilter: InputSignal<DateFilterFn<D> | null> = input<DateFilterFn<D> | null>(null);

  /** Explicitly disabled dates — array (compared via `adapter.sameDate`) or predicate (returns `true` for disabled). Defaults to `null` (none). */
  readonly disabledDates: InputSignal<DisabledDates<D> | null> =
    input<DisabledDates<D> | null>(null);

  /** Days of the week to disable (0=Sun … 6=Sat). Defaults to `[]` — no day-of-week disabling. */
  readonly disabledDaysOfWeek: InputSignal<readonly number[]> = input<readonly number[]>([]);

  /** Per-cell class override — returns extra classes appended to the cell button. Defaults to `null` (no extra classes). */
  readonly dateClass: InputSignal<DateClassFn<D> | null> = input<DateClassFn<D> | null>(null);

  /** Hover-preview start (set while user is mid-range pick). Defaults to `null` (no preview). */
  readonly previewStart: InputSignal<D | null> = input<D | null>(null);
  /** Hover-preview end. Defaults to `null` (no preview). */
  readonly previewEnd: InputSignal<D | null> = input<D | null>(null);

  /** Phase 6 — date that briefly flashes as invalid (rejected commit). Cleared by the orchestrator. Defaults to `null` (no flash). */
  readonly invalidFlashDate: InputSignal<D | null> = input<D | null>(null);

  /** `true` when the parent calendar allows more than one cell to be selected at once. Drives `aria-multiselectable` on the grid host. Defaults to `false`. */
  readonly multiSelectable: InputSignal<boolean> = input<boolean>(false);

  /** `true` when the parent calendar is in read-only mode. Drives `aria-readonly` on the grid host. Defaults to `false`. */
  readonly readonlyGrid: InputSignal<boolean> = input<boolean>(false);

  /**
   * `true` when the parent calendar is disabled (the `disabled` input, or a
   * bound form control's `setDisabledState`). Every cell then reports
   * `aria-disabled` and refuses activation. Defaults to `false`.
   *
   * Distinct from `readonlyGrid`: read-only keeps cells *selectable-looking*
   * and only blocks the commit in the orchestrator, whereas disabled removes
   * the affordance itself. Both leave the grid focusable and arrow-navigable —
   * per WAI-ARIA APG, a focusable disabled element stays "operable to the
   * extent of allowing the user to read its state", and `rovingCellValue`
   * guarantees exactly one tabbable cell so the grid never drops out of the
   * tab order.
   */
  readonly disabledGrid: InputSignal<boolean> = input<boolean>(false);

  /** Optional cell-content override, rendered inside each cell button with `{ $implicit: CalendarCell<D> }`. Defaults to `null` (the cell renders its own display value). */
  readonly cellTemplate: InputSignal<TemplateRef<{ $implicit: CalendarCell<D> }> | null> =
    input<TemplateRef<{ $implicit: CalendarCell<D> }> | null>(null);

  /** Fires when the user activates an enabled cell (click, Enter, or Space). Payload is the activated cell's date. */
  readonly selectedChange: OutputEmitterRef<D> = output<D>();

  /** Fires when keyboard navigation or programmatic focus moves the roving cursor to a new cell. Payload is the new active date. */
  readonly activeDateChange: OutputEmitterRef<D> = output<D>();

  /** Fires on pointer hover with the hovered date, and again with `null` when the pointer leaves the grid. The parent orchestrator drives any range-preview state from this stream. */
  readonly previewChange: OutputEmitterRef<D | null> = output<D | null>();

  /** Subclass declares which view it represents. */
  protected abstract readonly view: CalendarViewState;

  /** Subclass exposes its cell components for focus management. */
  protected abstract readonly cellComponents: Signal<readonly CalendarCellComponent<D>[]>;

  /** Cell that should own the roving-tabindex cursor. `null` means "use `activeDate`". */
  protected readonly focusedCellValue: WritableSignal<number | null> = signal<number | null>(null);

  /** Pending focus target — drained after the next render. */
  protected readonly focusPending: WritableSignal<number | null> = signal<number | null>(null);

  constructor() {
    afterEveryRender(() => {
      const pending = this.focusPending();
      if (pending !== null) {
        const target = this.cellComponents().find((c) => c.cell().compareValue === pending);
        target?.focusButton();
        this.focusPending.set(null);
      }
    });
  }

  /** 2D grid of cells rendered by the subclass. */
  abstract readonly cells: Signal<CalendarCell<D>[][]>;

  /** Accessible label for the grid (e.g. "January 2026"). */
  abstract readonly gridLabel: Signal<string>;

  /** Today's date — memoized per view instance. */
  protected readonly today: Signal<D> = computed(() => this.dateAdapter.today());

  /** True when `date` is part of the committed selection. */
  protected isSelected(date: D): boolean {
    const sel = this.selected();
    if (!sel) return false;
    if (Array.isArray(sel)) {
      return sel.some((d) => this.dateAdapter.sameDate(date, d));
    }
    if (this.isDateRange(sel)) {
      const r = sel;
      if (r.start && this.dateAdapter.sameDate(date, r.start)) return true;
      if (r.end && this.dateAdapter.sameDate(date, r.end)) return true;
      return false;
    }
    return this.dateAdapter.sameDate(date, sel);
  }

  protected isRangeStart(date: D): boolean {
    const sel = this.selected();
    if (!sel || !this.isDateRange(sel)) return false;
    return sel.start !== null && this.dateAdapter.sameDate(date, sel.start);
  }

  protected isRangeEnd(date: D): boolean {
    const sel = this.selected();
    if (!sel || !this.isDateRange(sel)) return false;
    return sel.end !== null && this.dateAdapter.sameDate(date, sel.end);
  }

  protected isRangeMiddle(date: D): boolean {
    const sel = this.selected();
    if (!sel || !this.isDateRange(sel)) return false;
    if (!sel.start || !sel.end) return false;
    return (
      isDateInRange(date, sel.start, sel.end, this.dateAdapter) &&
      !this.isRangeStart(date) &&
      !this.isRangeEnd(date)
    );
  }

  protected isPreviewStart(date: D): boolean {
    const s = this.previewStart();
    return s !== null && this.dateAdapter.sameDate(date, s);
  }

  protected isPreviewEnd(date: D): boolean {
    const e = this.previewEnd();
    return e !== null && this.dateAdapter.sameDate(date, e);
  }

  protected isPreviewMiddle(date: D): boolean {
    const s = this.previewStart();
    const e = this.previewEnd();
    if (!s || !e) return false;
    return (
      isDateInRange(date, s, e, this.dateAdapter) &&
      !this.isPreviewStart(date) &&
      !this.isPreviewEnd(date)
    );
  }

  protected isDateRange(value: D | D[] | DateRange<D>): value is DateRange<D> {
    return value !== null && typeof value === 'object' && 'start' in value && 'end' in value;
  }

  /** Routes a cell activation up to the parent. */
  onCellSelected(cell: CalendarCell<D>): void {
    if (cell.enabled) this.selectedChange.emit(cell.value);
  }

  /** Routes hover events up to the parent (parent drives preview state). */
  onCellPreviewed(cell: CalendarCell<D>): void {
    this.previewChange.emit(cell.value);
  }

  /** Clears the preview when the pointer leaves the grid. */
  onGridMouseLeave(): void {
    this.previewChange.emit(null);
  }

  /** Subclass implements view-specific keyboard navigation. */
  abstract onKeyNav(event: { direction: string; cell: CalendarCell<D> }): void;

  /**
   * `compareValue` of the cell that owns the roving tabindex, resolved against
   * the cells actually rendered right now.
   *
   * `focusedCellValue` is written only by `focusCell()` and nothing ever resets
   * it, so it goes stale the moment the displayed period changes by any route
   * that does not itself call `focusCell()` — the header's prev/next buttons,
   * a programmatic `activeDate` assignment, a view switch. A stale value
   * matches no rendered cell, `isActiveCell` then answered `false` for every
   * one of them, and the grid left the tab order entirely: zero cells with
   * `tabindex="0"`, nothing to Tab into, keyboard users locked out (SC 2.1.1).
   *
   * Resolving here rather than resetting the signal keeps this a pure read —
   * no effect, no write, no cycle — and the three fallbacks guarantee the
   * invariant the defect broke: a non-empty grid always has exactly one
   * tabbable cell.
   */
  protected readonly rovingCellValue: Signal<number | null> = computed(() => {
    const grid = this.cells();
    const focused = this.focusedCellValue();
    if (focused !== null && this.gridHasValue(grid, focused)) return focused;
    const active = this.getActiveCompareValue();
    if (this.gridHasValue(grid, active)) return active;
    // Neither anchor is on screen. Rather than strand the grid, hand the cursor
    // to the first selectable cell — or, if every cell is disabled, the first
    // cell, which is still focusable now that cells use `aria-disabled`.
    for (const row of grid) {
      const enabled = row.find((c) => c.enabled);
      if (enabled) return enabled.compareValue;
    }
    for (const row of grid) {
      if (row.length > 0) return row[0].compareValue;
    }
    return null;
  });

  private gridHasValue(grid: CalendarCell<D>[][], value: number): boolean {
    return grid.some((row) => row.some((c) => c.compareValue === value));
  }

  /** Returns `true` when the cell owns the roving cursor. */
  isActiveCell(cell: CalendarCell<D>): boolean {
    return cell.compareValue === this.rovingCellValue();
  }

  /** Compare value of the currently active date (subclass-specific). */
  protected abstract getActiveCompareValue(): number;

  /** Imperatively focuses the cell matching `compareValue` after the next render. */
  focusCell(compareValue: number): void {
    this.focusedCellValue.set(compareValue);
    this.focusPending.set(compareValue);
  }

  /** Focuses the cell that currently owns the roving cursor. */
  focusActiveCell(): void {
    // Read through `rovingCellValue` so a stale `focusedCellValue` cannot aim
    // focus at a cell that is no longer rendered — the same staleness that used
    // to empty the tab order also made this a silent no-op.
    const target = this.rovingCellValue();
    if (target === null) return;
    this.focusCell(target);
  }
}
