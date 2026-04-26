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
import { DateAdapter, DATE_ADAPTER } from './date-adapter';
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

  /** Current selection — scalar, array (multi), or range. */
  readonly selected: InputSignal<D | D[] | DateRange<D> | null> =
    input<D | D[] | DateRange<D> | null>(null);

  /** Minimum selectable date. */
  readonly minDate: InputSignal<D | null> = input<D | null>(null);
  /** Maximum selectable date. */
  readonly maxDate: InputSignal<D | null> = input<D | null>(null);

  /** Per-date predicate — return `false` to disable. */
  readonly dateFilter: InputSignal<DateFilterFn<D> | null> = input<DateFilterFn<D> | null>(null);

  /** Explicitly disabled dates — array (compared via `adapter.sameDate`) or predicate (returns `true` for disabled). */
  readonly disabledDates: InputSignal<DisabledDates<D> | null> =
    input<DisabledDates<D> | null>(null);

  /** Days of the week to disable (0=Sun … 6=Sat). Empty array = no day-of-week disabling. */
  readonly disabledDaysOfWeek: InputSignal<readonly number[]> = input<readonly number[]>([]);

  /** Per-cell class override. */
  readonly dateClass: InputSignal<DateClassFn<D> | null> = input<DateClassFn<D> | null>(null);

  /** Hover-preview start (set while user is mid-range pick). */
  readonly previewStart: InputSignal<D | null> = input<D | null>(null);
  /** Hover-preview end. */
  readonly previewEnd: InputSignal<D | null> = input<D | null>(null);

  /** Phase 6 — date that briefly flashes as invalid (rejected commit). Cleared by the orchestrator. */
  readonly invalidFlashDate: InputSignal<D | null> = input<D | null>(null);

  /** Optional cell-content override. */
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

  /** Returns `true` when the cell owns the roving cursor. */
  isActiveCell(cell: CalendarCell<D>): boolean {
    const focused = this.focusedCellValue();
    if (focused !== null) return cell.compareValue === focused;
    return this.getActiveCompareValue() === cell.compareValue;
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
    const target = this.focusedCellValue() ?? this.getActiveCompareValue();
    this.focusCell(target);
  }
}
