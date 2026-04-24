import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  EnvironmentInjector,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  input,
  linkedSignal,
  model,
  output,
  runInInjectionContext,
  signal,
  viewChildren,
  type InputSignal,
  type ModelSignal,
  type OutputEmitterRef,
  type Signal,
  type TemplateRef,
  type WritableSignal,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { tv } from 'tailwind-variants';
import { CalendarHeaderComponent } from './calendar-header';
import type {
  CalendarCell,
  CalendarView,
  DateClassFn,
  DateFilterFn,
  DateRange,
} from './calendar.types';
import { YEARS_PER_PAGE } from './calendar.types';
import { DateAdapter, DATE_ADAPTER } from './date-adapter';
import { MonthViewComponent } from './month-view';
import { YearViewComponent } from './year-view';
import { MultiYearViewComponent } from './multi-year-view';
import { getMultiYearStartingYear, isMonthDisabled, isYearDisabled } from './calendar.utils';
import {
  CalendarSelectionStrategy,
  CALENDAR_SELECTION_STRATEGY,
  MultiSelectionStrategy,
  RangeSelectionStrategy,
  SingleSelectionStrategy,
  WeekSelectionStrategy,
} from './selection';

/** Back-compat selection mode input — maps to an internal strategy. */
export type TwCalendarSelectionMode = 'single' | 'range' | 'multi' | 'week';

const calendarVariants = tv(
  {
    slots: {
      root: 'inline-block p-2 bg-surface text-fg',
      months: '',
      liveRegion: 'sr-only',
    },
    variants: {
      bordered: {
        true: { root: 'rounded-lg shadow-sm border border-border' },
        false: {},
      },
      columns: {
        1: { months: '' },
        2: { months: 'flex gap-4' },
      },
    },
    defaultVariants: { bordered: true, columns: 1 },
  },
  { twMerge: true },
);

/**
 * Main calendar orchestrator. Composes the header and view components
 * (month, year, multi-year) with view switching, navigation, and focus
 * management. Every date operation is delegated to a `DateAdapter` — call
 * `provideNativeDateAdapter()` in your app to bootstrap the default one.
 */
@Component({
  selector: 'tw-calendar',
  imports: [
    CalendarHeaderComponent,
    MonthViewComponent,
    YearViewComponent,
    MultiYearViewComponent,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CalendarComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      [class]="rootClasses()"
      role="application"
      aria-label="Calendar"
    >
      @if (!headerless()) {
        <tw-calendar-header
          [periodLabel]="periodLabel()"
          [periodAriaLabel]="periodAriaLabel()"
          [prevAriaLabel]="prevAriaLabel()"
          [nextAriaLabel]="nextAriaLabel()"
          [prevDisabled]="prevDisabled()"
          [nextDisabled]="nextDisabled()"
          [canSwitchView]="currentView() !== 'multi-year'"
          (prevClicked)="onPrevClicked()"
          (nextClicked)="onNextClicked()"
          (periodClicked)="onPeriodClicked()"
        />
      }

      <ng-content select="[twCalendarPresets]" />

      <div class="sr-only" aria-live="polite" aria-atomic="true">
        {{ liveAnnouncement() }}
      </div>

      @switch (currentView()) {
        @case ('month') {
          <div [class]="monthsClasses()">
            <tw-calendar-month-view
              [activeDate]="internalActiveDate()"
              [selected]="selected()"
              [minDate]="minDate()"
              [maxDate]="maxDate()"
              [dateFilter]="dateFilter()"
              [dateClass]="dateClass()"
              [cellTemplate]="cellTemplate()"
              [firstDayOfWeek]="computedFirstDayOfWeek()"
              [previewStart]="previewRange()?.start ?? null"
              [previewEnd]="previewRange()?.end ?? null"
              [gridIndex]="0"
              (selectedChange)="onDateSelected($event)"
              (activeDateChange)="onActiveDateChange($event, 0)"
              (previewChange)="onPreviewChange($event)"
            />
            @if (effectiveMonthColumns() >= 2 && secondaryActiveDate()) {
              <tw-calendar-month-view
                [activeDate]="secondaryActiveDate()!"
                [selected]="selected()"
                [minDate]="minDate()"
                [maxDate]="maxDate()"
                [dateFilter]="dateFilter()"
                [dateClass]="dateClass()"
                [cellTemplate]="cellTemplate()"
                [firstDayOfWeek]="computedFirstDayOfWeek()"
                [previewStart]="previewRange()?.start ?? null"
                [previewEnd]="previewRange()?.end ?? null"
                [gridIndex]="1"
                (selectedChange)="onDateSelected($event)"
                (activeDateChange)="onActiveDateChange($event, 1)"
                (previewChange)="onPreviewChange($event)"
              />
            }
          </div>
        }
        @case ('year') {
          <tw-calendar-year-view
            [activeDate]="internalActiveDate()"
            [selected]="selected()"
            [minDate]="minDate()"
            [maxDate]="maxDate()"
            [dateClass]="dateClass()"
            [cellTemplate]="cellTemplate()"
            [previewStart]="previewRange()?.start ?? null"
            [previewEnd]="previewRange()?.end ?? null"
            (selectedChange)="onMonthSelected($event)"
            (activeDateChange)="onActiveDateChange($event)"
            (previewChange)="onPreviewChange($event)"
          />
        }
        @case ('multi-year') {
          <tw-calendar-multi-year-view
            [activeDate]="internalActiveDate()"
            [selected]="selected()"
            [minDate]="minDate()"
            [maxDate]="maxDate()"
            [dateClass]="dateClass()"
            [cellTemplate]="cellTemplate()"
            [previewStart]="previewRange()?.start ?? null"
            [previewEnd]="previewRange()?.end ?? null"
            (selectedChange)="onYearSelected($event)"
            (activeDateChange)="onActiveDateChange($event)"
            (previewChange)="onPreviewChange($event)"
          />
        }
      }
    </div>
  `,
})
export class CalendarComponent<D = unknown> implements ControlValueAccessor {
  private readonly dateAdapter: DateAdapter<D> = inject(DATE_ADAPTER) as DateAdapter<D>;
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  private readonly injectedStrategy = inject(CALENDAR_SELECTION_STRATEGY, {
    optional: true,
  }) as CalendarSelectionStrategy<D, unknown> | null;

  private readonly injector = inject(Injector);

  private readonly monthViews = viewChildren<MonthViewComponent<D>>(MonthViewComponent);

  /**
   * Built-in strategies, instantiated lazily inside the host's injection
   * context so `inject(DATE_ADAPTER)` calls inside each strategy resolve.
   */
  private readonly localStrategies: Readonly<{
    single: SingleSelectionStrategy<D>;
    range: RangeSelectionStrategy<D>;
    multi: MultiSelectionStrategy<D>;
    week: WeekSelectionStrategy<D>;
  }> = runInInjectionContext(this.injector, () => ({
    single: new SingleSelectionStrategy<D>(),
    range: new RangeSelectionStrategy<D>(),
    multi: new MultiSelectionStrategy<D>(),
    week: new WeekSelectionStrategy<D>(),
  }));

  /** Anchor date for the displayed view. */
  readonly activeDate: InputSignal<D | undefined> = input<D>();

  /**
   * Two-way bound selection. Shape depends on the active strategy:
   * scalar for single, `DateRange<D>` for range/week, `D[]` for multi.
   */
  readonly selected: ModelSignal<D | D[] | DateRange<D> | null> = model<
    D | D[] | DateRange<D> | null
  >(null);

  /**
   * Alias of `selected` named `value` — signal-forms' `[formField]` directive
   * looks for a `value` model. Staying in sync via effects below.
   */
  readonly value: ModelSignal<D | D[] | DateRange<D> | null> = model<
    D | D[] | DateRange<D> | null
  >(null);

  /** Minimum selectable date. */
  readonly minDate: InputSignal<D | null> = input<D | null>(null);
  /** Maximum selectable date. */
  readonly maxDate: InputSignal<D | null> = input<D | null>(null);
  /** Per-date predicate — return `false` to disable. */
  readonly dateFilter: InputSignal<DateFilterFn<D> | null> = input<DateFilterFn<D> | null>(null);
  /** Function producing per-cell CSS classes. */
  readonly dateClass: InputSignal<DateClassFn<D> | null> = input<DateClassFn<D> | null>(null);
  /** When `true`, the calendar renders with a border and a soft shadow. Default `true`. */
  readonly bordered: InputSignal<boolean> = input<boolean>(true);
  /** Which view opens first. */
  readonly startView: InputSignal<CalendarView> = input<CalendarView>('month');
  /** Override first day of week (0=Sun, 1=Mon). Falls back to the adapter's default. */
  readonly firstDayOfWeek: InputSignal<number | null> = input<number | null>(null);
  /** Number of months to display side-by-side (1 or 2). Defaults to 2 when a range strategy is injected. */
  readonly monthColumns: InputSignal<number> = input<number>(1);

  /** Back-compat alias of `monthColumns`. */
  readonly numberOfMonths: InputSignal<number | null> = input<number | null>(null);

  /**
   * Back-compat: selection mode ("single" | "range" | "multi" | "week"). When
   * set, this drives the internal strategy unless one has been provided via DI.
   */
  readonly selectionMode: InputSignal<TwCalendarSelectionMode | null> =
    input<TwCalendarSelectionMode | null>(null);

  /** Back-compat: hides the header when `true`. */
  readonly headerless: InputSignal<boolean> = input<boolean>(false);

  /** Back-compat: initial active date. Forwarded to `activeDate`. */
  readonly startAt: InputSignal<D | null> = input<D | null>(null);

  /** Back-compat: semantic color. Accepted for API stability — not currently themed. */
  readonly color: InputSignal<string> = input<string>('primary');

  /** Back-compat: size density. Accepted for API stability — not currently themed. */
  readonly size: InputSignal<string> = input<string>('md');

  /** Back-compat: when true, reserves space for an external time editor. No-op in the new calendar — wrap with your own time input. */
  readonly withTime: InputSignal<boolean> = input<boolean>(false);

  /** Back-compat: time format for the embedded time editor — accepted but unused. */
  readonly timeFormat: InputSignal<string> = input<string>('24h');

  /** Back-compat: whether the time editor shows seconds — accepted but unused. */
  readonly showSeconds: InputSignal<boolean> = input<boolean>(false);

  /** Back-compat: hour step for the time editor — accepted but unused. */
  readonly hourStep: InputSignal<number> = input<number>(1);

  /** Back-compat: minute step for the time editor — accepted but unused. */
  readonly minuteStep: InputSignal<number> = input<number>(1);

  /** Back-compat: second step for the time editor — accepted but unused. */
  readonly secondStep: InputSignal<number> = input<number>(1);

  /** Back-compat: minimum time-of-day — accepted but unused. */
  readonly minTime: InputSignal<D | null> = input<D | null>(null);

  /** Back-compat: maximum time-of-day — accepted but unused. */
  readonly maxTime: InputSignal<D | null> = input<D | null>(null);

  /** Back-compat: disabled state. */
  readonly disabled: InputSignal<boolean> = input<boolean>(false);
  /** Optional cell-content template. */
  readonly cellTemplate: InputSignal<TemplateRef<{ $implicit: CalendarCell<D> }> | null> =
    input<TemplateRef<{ $implicit: CalendarCell<D> }> | null>(null);

  /** Fires when the user commits a selection. Payload shape matches the active strategy. */
  readonly selectedChange: OutputEmitterRef<D | D[] | DateRange<D> | null> = output<
    D | D[] | DateRange<D> | null
  >();

  /** Fires when the view changes. */
  readonly viewChanged: OutputEmitterRef<CalendarView> = output<CalendarView>();

  /** Fires when the anchor date changes (navigation / keyboard). */
  readonly activeDateChange: OutputEmitterRef<D> = output<D>();

  /** Back-compat: emitted alongside `selectedChange`. */
  readonly userSelection: OutputEmitterRef<{ value: D | null; source: 'user' }> = output<{
    value: D | null;
    source: 'user';
  }>();

  /** @internal — active selection strategy (injected wins over `selectionMode`, which wins over single default). */
  readonly selectionStrategy: Signal<CalendarSelectionStrategy<D, unknown>> = computed(() => {
    if (this.injectedStrategy) return this.injectedStrategy;
    const mode = this.selectionMode();
    if (mode === 'range') return this.localStrategies.range as CalendarSelectionStrategy<D, unknown>;
    if (mode === 'multi') return this.localStrategies.multi as CalendarSelectionStrategy<D, unknown>;
    if (mode === 'week') return this.localStrategies.week as CalendarSelectionStrategy<D, unknown>;
    return this.localStrategies.single as CalendarSelectionStrategy<D, unknown>;
  });

  /** @internal — writable mirror of `activeDate` for internal navigation. */
  readonly internalActiveDate: WritableSignal<D> = linkedSignal<D>(
    () => this.activeDate() ?? this.startAt() ?? this.dateAdapter.today(),
  );

  /** @internal — current view, writable for view switching. */
  readonly currentView: WritableSignal<CalendarView> = linkedSignal(() => this.startView());

  /** @internal — text announced on navigation for screen readers. */
  readonly liveAnnouncement: WritableSignal<string> = signal('');

  /** @internal — internal selection mirror that feeds the preview computation. */
  readonly internalSelection: WritableSignal<unknown> = linkedSignal(() =>
    this.selected() ?? this.value(),
  );

  private cvaOnChange: (value: unknown) => void = () => {};
  private cvaOnTouched: () => void = () => {};

  constructor() {
    // Two-way sync: parent writes `[value]` → update `selected`; parent writes
    // `[selected]` → update `value`. The picker-driven commit path writes both.
    effect(() => {
      const v = this.value();
      if (v !== this.selected()) this.selected.set(v);
    });
    effect(() => {
      const s = this.selected();
      if (s !== this.value()) this.value.set(s);
    });
  }

  /** @internal `ControlValueAccessor` — writes a value from a reactive / template-driven form. */
  writeValue(value: D | D[] | DateRange<D> | null): void {
    this.selected.set(value);
    this.value.set(value);
  }

  /** @internal `ControlValueAccessor` — registers the on-change callback. */
  registerOnChange(fn: (value: unknown) => void): void {
    this.cvaOnChange = fn;
  }

  /** @internal `ControlValueAccessor` — registers the touched callback. */
  registerOnTouched(fn: () => void): void {
    this.cvaOnTouched = fn;
  }

  /** @internal — currently hovered date. */
  readonly previewDate: WritableSignal<D | null> = signal<D | null>(null);

  /** @internal — computed first-day-of-week (input override wins over adapter default). */
  readonly computedFirstDayOfWeek: Signal<number> = computed(() => {
    const override = this.firstDayOfWeek();
    if (override !== null && override >= 0 && override <= 6) return override;
    return this.dateAdapter.getFirstDayOfWeek();
  });

  /** @internal — auto-defaults to 2 when a `RangeSelectionStrategy` is active. */
  readonly effectiveMonthColumns: Signal<number> = computed(() => {
    const alias = this.numberOfMonths();
    if (alias !== null && alias > 0) return alias;
    const explicit = this.monthColumns();
    if (explicit !== 1) return explicit;
    if (this.selectionStrategy() instanceof RangeSelectionStrategy) return 2;
    return 1;
  });

  /** @internal — secondary anchor for the right-hand grid in multi-column mode. */
  readonly secondaryActiveDate: Signal<D | null> = computed(() => {
    if (this.effectiveMonthColumns() < 2) return null;
    return this.dateAdapter.addCalendarMonths(this.internalActiveDate(), 1);
  });

  /** @internal — preview range driven by the strategy and the hovered date. */
  readonly previewRange: Signal<DateRange<D> | null> = computed(() => {
    return this.selectionStrategy().createPreview(this.previewDate(), this.internalSelection());
  });

  private readonly variantResult = computed(() =>
    calendarVariants({
      bordered: this.bordered(),
      columns: (this.effectiveMonthColumns() >= 2 ? 2 : 1) as 1 | 2,
    }),
  );

  /** @internal */
  readonly rootClasses: Signal<string> = computed(() => this.variantResult().root());

  /** @internal */
  readonly monthsClasses: Signal<string> = computed(() => this.variantResult().months());

  private readonly monthNames: Signal<string[]> = computed(() =>
    this.dateAdapter.getMonthNames('long'),
  );

  /** @internal */
  readonly periodLabel: Signal<string> = computed(() => {
    const date = this.internalActiveDate();
    const view = this.currentView();
    const year = this.dateAdapter.getYear(date);
    const month = this.dateAdapter.getMonth(date);

    switch (view) {
      case 'month': {
        const name = this.monthNames()[month];
        if (this.effectiveMonthColumns() >= 2) {
          const secondDate = this.secondaryActiveDate()!;
          const secondMonth = this.dateAdapter.getMonth(secondDate);
          const secondYear = this.dateAdapter.getYear(secondDate);
          const secondName = this.monthNames()[secondMonth];
          if (year === secondYear) return `${name} – ${secondName} ${year}`;
          return `${name} ${year} – ${secondName} ${secondYear}`;
        }
        return `${name} ${year}`;
      }
      case 'year':
        return `${year}`;
      case 'multi-year': {
        const startYear = getMultiYearStartingYear(year, YEARS_PER_PAGE);
        return `${startYear} – ${startYear + YEARS_PER_PAGE - 1}`;
      }
    }
  });

  /** @internal */
  readonly periodAriaLabel: Signal<string> = computed(() => {
    const view = this.currentView();
    const label = this.periodLabel();
    switch (view) {
      case 'month':
        return `${label}, click to switch to year view`;
      case 'year':
        return `${label}, click to switch to multi-year view`;
      case 'multi-year':
        return label;
    }
  });

  /** @internal */
  readonly prevAriaLabel: Signal<string> = computed(() => {
    switch (this.currentView()) {
      case 'month':
        return 'Previous month';
      case 'year':
        return 'Previous year';
      case 'multi-year':
        return `Previous ${YEARS_PER_PAGE} years`;
    }
  });

  /** @internal */
  readonly nextAriaLabel: Signal<string> = computed(() => {
    switch (this.currentView()) {
      case 'month':
        return 'Next month';
      case 'year':
        return 'Next year';
      case 'multi-year':
        return `Next ${YEARS_PER_PAGE} years`;
    }
  });

  /** @internal */
  readonly prevDisabled: Signal<boolean> = computed(() => {
    const date = this.internalActiveDate();
    const minDate = this.minDate();
    if (!minDate) return false;
    const view = this.currentView();
    const year = this.dateAdapter.getYear(date);
    const month = this.dateAdapter.getMonth(date);
    switch (view) {
      case 'month': {
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        return isMonthDisabled(prevYear, prevMonth, minDate, null, this.dateAdapter);
      }
      case 'year':
        return isYearDisabled(year - 1, minDate, null, this.dateAdapter);
      case 'multi-year': {
        const startYear = getMultiYearStartingYear(year, YEARS_PER_PAGE);
        return isYearDisabled(startYear - 1, minDate, null, this.dateAdapter);
      }
    }
  });

  /** @internal */
  readonly nextDisabled: Signal<boolean> = computed(() => {
    const date = this.internalActiveDate();
    const maxDate = this.maxDate();
    if (!maxDate) return false;
    const view = this.currentView();
    const year = this.dateAdapter.getYear(date);
    const month = this.dateAdapter.getMonth(date);
    switch (view) {
      case 'month': {
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        return isMonthDisabled(nextYear, nextMonth, null, maxDate, this.dateAdapter);
      }
      case 'year':
        return isYearDisabled(year + 1, null, maxDate, this.dateAdapter);
      case 'multi-year': {
        const startYear = getMultiYearStartingYear(year, YEARS_PER_PAGE);
        return isYearDisabled(startYear + YEARS_PER_PAGE, null, maxDate, this.dateAdapter);
      }
    }
  });

  /** Navigates to a specific date, optionally switching view. */
  goTo(date: D, view?: CalendarView): void {
    this.internalActiveDate.set(this.dateAdapter.clampDate(date, this.minDate(), this.maxDate()));
    if (view) this.setView(view);
  }

  /** Sets the current view and emits `viewChanged`. */
  setView(view: CalendarView): void {
    if (this.currentView() === view) return;
    this.currentView.set(view);
    this.viewChanged.emit(view);
  }

  /** Focuses the currently active cell. */
  focusActiveCell(): void {
    const views = this.monthViews();
    if (views.length > 0) {
      views[0].focusActiveCell();
      return;
    }
    const host = this.elementRef.nativeElement;
    (host.querySelector('button[tabindex="0"]') as HTMLButtonElement | null)?.focus();
  }

  /** @internal */
  onPrevClicked(): void {
    const view = this.currentView();
    const date = this.internalActiveDate();
    let next: D;
    switch (view) {
      case 'month':
        next = this.dateAdapter.addCalendarMonths(date, -1);
        break;
      case 'year':
        next = this.dateAdapter.addCalendarYears(date, -1);
        break;
      case 'multi-year':
        next = this.dateAdapter.addCalendarYears(date, -YEARS_PER_PAGE);
        break;
    }
    this.internalActiveDate.set(next);
    this.activeDateChange.emit(next);
    this.announceNavigation('previous');
  }

  /** @internal */
  onNextClicked(): void {
    const view = this.currentView();
    const date = this.internalActiveDate();
    let next: D;
    switch (view) {
      case 'month':
        next = this.dateAdapter.addCalendarMonths(date, 1);
        break;
      case 'year':
        next = this.dateAdapter.addCalendarYears(date, 1);
        break;
      case 'multi-year':
        next = this.dateAdapter.addCalendarYears(date, YEARS_PER_PAGE);
        break;
    }
    this.internalActiveDate.set(next);
    this.activeDateChange.emit(next);
    this.announceNavigation('next');
  }

  /** @internal */
  onPeriodClicked(): void {
    const current = this.currentView();
    if (current === 'month') this.setView('year');
    else if (current === 'year') this.setView('multi-year');
    this.announceViewChange();
  }

  /** @internal */
  onDateSelected(date: D): void {
    const strategy = this.selectionStrategy();
    const result = strategy.select(date, this.internalSelection());
    this.internalSelection.set(result.selection);
    if (result.isComplete) {
      const committed = result.selection as D | D[] | DateRange<D> | null;
      this.selected.set(committed);
      this.value.set(committed);
      this.cvaOnChange(committed);
      this.cvaOnTouched();
      this.selectedChange.emit(committed);
      this.userSelection.emit({ value: committed as D, source: 'user' });
    }
  }

  /** @internal */
  onPreviewChange(date: D | null): void {
    this.previewDate.set(date);
  }

  /** @internal */
  onMonthSelected(date: D): void {
    this.internalActiveDate.set(date);
    this.setView('month');
    this.activeDateChange.emit(date);
    this.announceViewChange();
  }

  /** @internal */
  onYearSelected(date: D): void {
    this.internalActiveDate.set(date);
    this.setView('year');
    this.activeDateChange.emit(date);
    this.announceViewChange();
  }

  /** @internal */
  onActiveDateChange(date: D, gridIndex?: number): void {
    const views = this.monthViews();

    if (this.effectiveMonthColumns() >= 2 && views.length === 2 && gridIndex !== undefined) {
      const primaryMonth = this.dateAdapter.getMonth(this.internalActiveDate());
      const secondaryMonth = this.dateAdapter.getMonth(this.secondaryActiveDate()!);
      const targetMonth = this.dateAdapter.getMonth(date);
      if (gridIndex === 0 && targetMonth === secondaryMonth) {
        const rightView = views[1];
        if (rightView) {
          rightView.focusCell(this.computeCompareValue(date));
          return;
        }
      }
      if (gridIndex === 1 && targetMonth === primaryMonth) {
        const leftView = views[0];
        if (leftView) {
          leftView.focusCell(this.computeCompareValue(date));
          return;
        }
      }
    }

    this.internalActiveDate.set(date);
    this.activeDateChange.emit(date);
  }

  private computeCompareValue(date: D): number {
    return (
      this.dateAdapter.getYear(date) * 10000 +
      this.dateAdapter.getMonth(date) * 100 +
      this.dateAdapter.getDate(date)
    );
  }

  private announceViewChange(): void {
    const view = this.currentView();
    const label = this.periodLabel();
    const viewLabel = view === 'multi-year' ? 'multi-year' : view;
    this.liveAnnouncement.set(`${viewLabel} view, ${label}`);
  }

  private announceNavigation(direction: 'previous' | 'next'): void {
    this.liveAnnouncement.set(`Navigated to ${direction} ${this.periodLabel()}`);
  }
}
