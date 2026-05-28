import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  input,
  isDevMode,
  linkedSignal,
  LOCALE_ID,
  model,
  type OnInit,
  output,
  runInInjectionContext,
  signal,
  untracked,
  viewChildren,
  type InputSignal,
  type ModelSignal,
  type OutputEmitterRef,
  type Signal,
  type TemplateRef,
  type WritableSignal,
} from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  type AbstractControl,
  type ControlValueAccessor,
  FormResetEvent,
  NgControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  type ValidationErrors,
  type Validator,
} from '@angular/forms';
import { tv } from 'tailwind-variants';
import { CalendarHeaderComponent } from './calendar-header';
import { CalendarIntl } from './calendar-intl';
import type {
  CalendarCell,
  CalendarConstraints,
  CalendarMode,
  CalendarOverlayState,
  CalendarSelectionState,
  CalendarValue,
  CalendarViewState,
  DateClassFn,
  DateFilterFn,
  DateRange,
  DisabledDates,
  MaxSelectionBehavior,
  ModeChangeEvent,
  RangeClickBehavior,
  RangePreviewEvent,
  ResetBehavior,
  SelectionClearedEvent,
  SelectionCompleteEvent,
  ViewChangeEvent,
} from './calendar.types';
import { emptyCalendarValue, YEARS_PER_PAGE } from './calendar.types';
import type { RangeBehaviorConfig } from '@cdevhub/ngx-tw/core';
import {
  deriveSelectionStateFromValue,
  isEmptyCalendarValue,
  isPartialRangeValue,
  matchesModeShape,
} from './calendar-cva-utils';
import { calendarValidator } from './calendar-validators';
import { type DateAdapter, DATE_ADAPTER } from './date-adapter';
import { MonthViewComponent } from './month-view';
import { YearViewComponent } from './year-view';
import { YearsViewComponent } from './multi-year-view';
import {
  getMultiYearStartingYear,
  isMonthDisabled,
  isYearDisabled,
  rangeCrossesDisabled,
  rangeLengthDays,
} from './calendar.utils';
import {
  type CalendarSelectionStrategy,
  CALENDAR_SELECTION_STRATEGY,
  MultiSelectionStrategy,
  RangeSelectionStrategy,
  SingleSelectionStrategy,
} from './selection';

const calendarVariants = tv(
  {
    slots: {
      root: 'inline-block p-2 bg-surface text-fg',
      months: '',
    },
    variants: {
      bordered: {
        true: { root: 'rounded-lg shadow-sm border border-border' },
        false: {},
      },
      columns: {
        1: { months: '' },
        2: { months: 'flex gap-3' },
      },
    },
    defaultVariants: { bordered: true, columns: 1 },
  },
  { twMerge: true },
);

/**
 * Main calendar orchestrator. Composes the header and view components
 * (day, month, year) with view switching, navigation, focus management,
 * and the §8 internal state model. Every date operation is delegated to
 * an injected `DateAdapter` — call `provideNativeDateAdapter()` in your
 * app to bootstrap the default one.
 *
 * Generic parameters (§7.3):
 * - `M` — selection mode. Narrows `value` to the mode-specific shape.
 * - `D` — adapter date type.
 * - `TOut` — post-transformer form value type (Phase 14 wires it; until then
 *   it defaults to `CalendarValue<M, D>` so forms see raw adapter values).
 */
@Component({
  selector: 'tw-calendar',
  imports: [
    CalendarHeaderComponent,
    MonthViewComponent,
    YearViewComponent,
    YearsViewComponent,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CalendarComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => CalendarComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    '[attr.aria-disabled]': 'effectiveDisabled() || null',
    '[attr.aria-readonly]': 'effectiveReadonly() || null',
    '[attr.aria-describedby]': 'errorAriaDescribedBy() || null',
    '(focusout)': 'onBlur($event)',
  },
  template: `
    <div
      [class]="rootClasses()"
      role="group"
      [attr.aria-label]="effectiveIntl().calendarLabel"
    >
      <tw-calendar-header
        [periodLabel]="periodLabel()"
        [periodAriaLabel]="periodAriaLabel()"
        [prevAriaLabel]="prevAriaLabel()"
        [nextAriaLabel]="nextAriaLabel()"
        [prevDisabled]="prevDisabled()"
        [nextDisabled]="nextDisabled()"
        [canSwitchView]="viewState() !== 'year'"
        (prevClicked)="onPrevClicked()"
        (nextClicked)="onNextClicked()"
        (periodClicked)="onPeriodClicked()"
      />

      <ng-content select="[twCalendarPresets]" />

      @switch (viewState()) {
        @case ('day') {
          <div [class]="monthsClasses()">
            <tw-calendar-month-view
              [activeDate]="activeDate()!"
              [selected]="legacySelected()"
              [minDate]="resolvedMinDate()"
              [maxDate]="resolvedMaxDate()"
              [dateFilter]="resolvedDateFilter()"
              [disabledDates]="resolvedDisabledDates()"
              [disabledDaysOfWeek]="resolvedDisabledDaysOfWeek()"
              [dateClass]="dateClass()"
              [cellTemplate]="cellTemplate()"
              [firstDayOfWeek]="computedFirstDayOfWeek()"
              [previewStart]="previewRange()?.start ?? null"
              [previewEnd]="previewRange()?.end ?? null"
              [invalidFlashDate]="invalidFlashDate()"
              [gridIndex]="0"
              [multiSelectable]="multiSelectable()"
              [readonlyGrid]="effectiveReadonly()"
              (selectedChange)="onDateSelected($event)"
              (activeDateChange)="onActiveDateChange($event, 0)"
              (previewChange)="onPreviewChange($event)"
            />
            @if (effectiveMonthColumns() >= 2 && secondaryActiveDate()) {
              <tw-calendar-month-view
                [activeDate]="secondaryActiveDate()!"
                [selected]="legacySelected()"
                [minDate]="resolvedMinDate()"
                [maxDate]="resolvedMaxDate()"
                [dateFilter]="resolvedDateFilter()"
                [disabledDates]="resolvedDisabledDates()"
                [disabledDaysOfWeek]="resolvedDisabledDaysOfWeek()"
                [dateClass]="dateClass()"
                [cellTemplate]="cellTemplate()"
                [firstDayOfWeek]="computedFirstDayOfWeek()"
                [previewStart]="previewRange()?.start ?? null"
                [previewEnd]="previewRange()?.end ?? null"
                [invalidFlashDate]="invalidFlashDate()"
                [gridIndex]="1"
                [multiSelectable]="multiSelectable()"
                [readonlyGrid]="effectiveReadonly()"
                (selectedChange)="onDateSelected($event)"
                (activeDateChange)="onActiveDateChange($event, 1)"
                (previewChange)="onPreviewChange($event)"
              />
            }
          </div>
        }
        @case ('month') {
          <tw-calendar-year-view
            [activeDate]="activeDate()!"
            [selected]="legacySelected()"
            [minDate]="resolvedMinDate()"
            [maxDate]="resolvedMaxDate()"
            [dateClass]="dateClass()"
            [cellTemplate]="cellTemplate()"
            [previewStart]="previewRange()?.start ?? null"
            [previewEnd]="previewRange()?.end ?? null"
            [multiSelectable]="multiSelectable()"
            [readonlyGrid]="effectiveReadonly()"
            (selectedChange)="onMonthSelected($event)"
            (activeDateChange)="onActiveDateChange($event)"
            (previewChange)="onPreviewChange($event)"
          />
        }
        @case ('year') {
          <tw-calendar-years-view
            [activeDate]="activeDate()!"
            [selected]="legacySelected()"
            [minDate]="resolvedMinDate()"
            [maxDate]="resolvedMaxDate()"
            [dateClass]="dateClass()"
            [cellTemplate]="cellTemplate()"
            [previewStart]="previewRange()?.start ?? null"
            [previewEnd]="previewRange()?.end ?? null"
            [multiSelectable]="multiSelectable()"
            [readonlyGrid]="effectiveReadonly()"
            (selectedChange)="onYearSelected($event)"
            (activeDateChange)="onActiveDateChange($event)"
            (previewChange)="onPreviewChange($event)"
          />
        }
      }
    </div>
  `,
})
export class CalendarComponent<
  M extends CalendarMode = 'single',
  D = Date,
  // `TOut` is the post-transformer form value type (§7.6). Phase 14 wires a
  // `valueTransformer` input against it; until then the transformer is the
  // identity and `TOut` defaults to `CalendarValue<M, D>`.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TOut = CalendarValue<M, D>,
> implements ControlValueAccessor, Validator, OnInit {
  private readonly dateAdapter: DateAdapter<D> = inject(DATE_ADAPTER) as DateAdapter<D>;
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  /**
   * Resolved lazily in `ngOnInit` — eager construction-time injection creates a
   * circular dependency (NG0200): the component registers itself as both
   * `NG_VALUE_ACCESSOR` and `NG_VALIDATORS`, and `FormControlName` resolves
   * those eagerly while constructing on the same element. Looking up
   * `NgControl` after construction breaks the cycle.
   */
  private ngControl: NgControl | null = null;

  /** Angular's `LOCALE_ID` — used as the fallback when no `locale` input is supplied (§19.1). */
  private readonly platformLocale: string = inject(LOCALE_ID);

  /**
   * DI-provided default `CalendarIntl`. New'd up locally when the consumer hasn't
   * supplied one — DI defaults are merged with the per-instance `intl` input
   * via `effectiveIntl()` (§19.4 per-field merge).
   */
  private readonly injectedIntl: CalendarIntl =
    inject(CalendarIntl, { optional: true }) ?? new CalendarIntl();

  private readonly injectedStrategy = inject(CALENDAR_SELECTION_STRATEGY, {
    optional: true,
  }) as CalendarSelectionStrategy<D, unknown> | null;

  private readonly monthViews = viewChildren<MonthViewComponent<D>>(MonthViewComponent);

  /**
   * Built-in strategies instantiated lazily in the host's injection context so
   * `inject(DATE_ADAPTER)` calls inside each strategy resolve. Range state will
   * migrate into the orchestrator in Phase 6; single / multiple stay here as
   * internals (not exported) via the spec's mode union.
   */
  private readonly localStrategies: Readonly<{
    single: SingleSelectionStrategy<D>;
    range: RangeSelectionStrategy<D>;
    multiple: MultiSelectionStrategy<D>;
  }> = runInInjectionContext(this.injector, () => ({
    single: new SingleSelectionStrategy<D>(),
    range: new RangeSelectionStrategy<D>(),
    multiple: new MultiSelectionStrategy<D>(),
  }));

  // ---------------------------------------------------------------------------
  // Public inputs (§33.1)
  // ---------------------------------------------------------------------------

  /** Selection mode (§5). Changing this at runtime clears the value and emits `modeChange`. */
  readonly mode: ModelSignal<CalendarMode> = model<CalendarMode>('single');

  /**
   * Consumer-bound value. Shape narrows by `M`: `D | null` for single,
   * `D[]` for multiple, `{ start; end }` for range.
   */
  readonly value: ModelSignal<CalendarValue<M, D>> = model<CalendarValue<M, D>>(
    null as CalendarValue<M, D>,
  );

  /** Anchor date for the displayed view. Defaults to today on mount. */
  readonly startAt: InputSignal<D | null> = input<D | null>(null);

  /** Minimum selectable date. */
  readonly minDate: InputSignal<D | null> = input<D | null>(null);

  /** Maximum selectable date. */
  readonly maxDate: InputSignal<D | null> = input<D | null>(null);

  /** Per-date predicate — return `false` to disable. */
  readonly dateFilter: InputSignal<DateFilterFn<D> | null> = input<DateFilterFn<D> | null>(null);

  /**
   * Explicitly disabled dates (§10.1). Either an array (each entry compared via
   * `adapter.sameDate`) or a predicate returning `true` for disabled dates.
   * OR-combined with `dateFilter`, `disabledDaysOfWeek`, and `[minDate, maxDate]`.
   */
  readonly disabledDates: InputSignal<DisabledDates<D> | null> =
    input<DisabledDates<D> | null>(null);

  /** Days of the week to disable (0=Sun … 6=Sat). Empty array = no day-of-week disabling. */
  readonly disabledDaysOfWeek: InputSignal<readonly number[]> = input<readonly number[]>([]);

  /**
   * Bundle of date constraints (§10.1). Lets a consumer pass `minDate`, `maxDate`,
   * `disabledDates`, `disabledDaysOfWeek`, and `dateFilter` as a single object —
   * useful for sharing a constraint preset across multiple calendars. Each field is
   * optional. Individual inputs (`minDate`, `maxDate`, `disabledDates`,
   * `disabledDaysOfWeek`, `dateFilter`) take precedence over fields here when both
   * are set non-null.
   */
  readonly constraints: InputSignal<CalendarConstraints<D> | null> =
    input<CalendarConstraints<D> | null>(null);

  /** Minimum range length in days, inclusive (`mode: 'range'` only). `null` = no minimum. */
  readonly minRangeLength: InputSignal<number | null> = input<number | null>(null);

  /** Maximum range length in days, inclusive (`mode: 'range'` only). `null` = no maximum. */
  readonly maxRangeLength: InputSignal<number | null> = input<number | null>(null);

  /** Maximum number of selections in `mode: 'multiple'`. `null` = unlimited. */
  readonly maxSelections: InputSignal<number | null> = input<number | null>(null);

  /**
   * What happens when the user tries to select past `maxSelections` (§10.1).
   * `'emit-limit-reached'` (default) emits `selectionLimitReached` and ignores
   * the click; `'replace-oldest'` drops the first entry; `'ignore'` is silent.
   */
  readonly maxSelectionBehavior: InputSignal<MaxSelectionBehavior> =
    input<MaxSelectionBehavior>('emit-limit-reached');

  /**
   * IDREF list for the form-error live region (§28.3). When set, the calendar
   * root carries `aria-describedby="<value>"` so screen readers read consumer-
   * rendered error messages alongside the focused cell announcement.
   */
  readonly errorAriaDescribedBy: InputSignal<string | null> = input<string | null>(null);

  /**
   * How `mode: 'range'` reacts to a click after a complete range (§21.2):
   * - `'restart'` (default): start a new range with the clicked cell, emit `selectionRestart`.
   * - `'nearest-edge'`: move the closer endpoint (start vs end) to the clicked date and re-commit (§21.3); emits `selectionComplete({reason: 'nearest-edge'})`.
   * - `'require-clear'`: ignore the click + flash the cell as invalid (`data-state-invalid-flash`); user must call `clear()` first.
   */
  readonly rangeClickBehavior: InputSignal<RangeClickBehavior> =
    input<RangeClickBehavior>('restart');

  /**
   * Range-mode behavior knobs. Accepts a partial object — unset fields use the
   * defaults documented on each property of `RangeBehaviorConfig`. Defaults:
   * `{ allowSingleDayRange: true, persistPartialRange: true, allowBackwardRange: false, disableRangesCrossingDisabledDates: false }`.
   */
  readonly rangeBehavior: InputSignal<Partial<RangeBehaviorConfig>> =
    input<Partial<RangeBehaviorConfig>>({});

  /** Function producing per-cell CSS classes. */
  readonly dateClass: InputSignal<DateClassFn<D> | null> = input<DateClassFn<D> | null>(null);

  /** When `true`, the calendar renders with a border and a soft shadow. */
  readonly bordered: InputSignal<boolean> = input<boolean>(true);

  /** Which view opens first. Defaults to `'day'`. Phase 8 will derive the default from `rangeGranularity`. */
  readonly startView: InputSignal<CalendarViewState> = input<CalendarViewState>('day');

  /** Override first day of week (0=Sun, 1=Mon). Falls back to the adapter's default. */
  readonly firstDayOfWeek: InputSignal<number | null> = input<number | null>(null);

  /**
   * Number of months to display side-by-side (1 or 2). Phase 9 replaces this with a
   * full `numberOfMonths: 1..12+` surface (§23).
   */
  readonly monthColumns: InputSignal<number> = input<number>(1);

  /** Disabled state. Merged with any `setDisabledState` call from a bound form control via `effectiveDisabled`. */
  readonly disabled: InputSignal<boolean> = input<boolean>(false);

  /** Read-only state (§33.1). When `true`, focus and keyboard navigation still work but selections cannot be committed. */
  readonly readonly: InputSignal<boolean> = input<boolean>(false);

  /** How a form reset restores internal state (§6.5). `'full'` (default) also restores view + active-date; `'value-only'` clears the draft but leaves navigation where the user left it. */
  readonly resetBehavior: InputSignal<ResetBehavior> = input<ResetBehavior>('full');

  /** Optional cell-content template. */
  readonly cellTemplate: InputSignal<TemplateRef<{ $implicit: CalendarCell<D> }> | null> =
    input<TemplateRef<{ $implicit: CalendarCell<D> }> | null>(null);

  /** Per-instance locale override. Falls back to Angular `LOCALE_ID` when `null` (§19.1). */
  readonly locale: InputSignal<string | null> = input<string | null>(null);

  /**
   * Per-instance `CalendarIntl` override (§19.4). Per-field merge — unspecified
   * fields inherit the DI-provided default. Pass a partial bag (e.g. one of the
   * shipped locale packs `de`, `fr`, `es`, `pt`, `ja`) or a full custom instance.
   */
  readonly intl: InputSignal<Partial<CalendarIntl> | null> =
    input<Partial<CalendarIntl> | null>(null);

  // ---------------------------------------------------------------------------
  // Public outputs (§33.2). Outputs reachable only in overlay mode (opened/closed)
  // or through constraint-aware preview (rangePreview `invalidPreview`) are declared
  // here but wired in later phases per the plan.
  // ---------------------------------------------------------------------------

  /** Fires whenever the committed value changes (cell click, keyboard select, preset, mode change, programmatic clear). Payload is the untransformed mode-shaped `CalendarValue<M, D>` — `D | null` for single, `D[]` for multiple, `{ start, end }` for range (§7.6). */
  readonly valueChange: OutputEmitterRef<CalendarValue<M, D>> =
    output<CalendarValue<M, D>>();

  /** Fires on the first click of a range selection (transitions selection state to SELECTING). Payload carries the chosen `start` date. */
  readonly selectionStart: OutputEmitterRef<{ start: D }> = output<{ start: D }>();

  /** Fires as the hover / keyboard cursor moves during range SELECTING. Payload carries the `tentativeRange` and an `invalidPreview` flag set when the range crosses a disabled date or violates `min`/`maxRangeLength`. */
  readonly rangePreview: OutputEmitterRef<RangePreviewEvent<D>> =
    output<RangePreviewEvent<D>>();

  /** Fires after `valueChange` once the selection commits. Payload carries the committed `value` and a `reason` flagging the commit path (`'commit' | 'auto-swap' | 'nearest-edge' | 'preset'`). */
  readonly selectionComplete: OutputEmitterRef<SelectionCompleteEvent<M, D>> =
    output<SelectionCompleteEvent<M, D>>();

  /** Fires when a range selection restarts after a complete range (e.g. third click with `rangeClickBehavior='restart'`). Payload carries the new draft `start` date. */
  readonly selectionRestart: OutputEmitterRef<{ start: D }> = output<{ start: D }>();

  /** Fires whenever the value clears. Payload carries a `reason` distinguishing user clear, programmatic, mode change, form reset, or a disabled flip. */
  readonly selectionCleared: OutputEmitterRef<SelectionClearedEvent> =
    output<SelectionClearedEvent>();

  /** Fires in `mode: 'multiple'` when the user attempts to select past `maxSelections` (only with `maxSelectionBehavior: 'emit-limit-reached'`). Payload carries the configured `limit` and the rejected `attempted` date. */
  readonly selectionLimitReached: OutputEmitterRef<{ limit: number; attempted: D }> =
    output<{ limit: number; attempted: D }>();

  /** Fires when the selected preset changes (user click on a preset chip, or programmatic clear). Payload is the new preset id, or `null` when no preset is active. Phase 12 wires it. */
  readonly presetChange: OutputEmitterRef<string | null> = output<string | null>();

  /** Fires on every view transition (day ↔ month ↔ year). Payload carries `from`, `to`, and a `reason` distinguishing drill-down, drill-up, user header click, and programmatic changes. */
  readonly viewChange: OutputEmitterRef<ViewChangeEvent> = output<ViewChangeEvent>();

  /** Fires when keyboard navigation, mouse hover, or programmatic action moves the focused (active) cell. Payload is the new active date. */
  readonly activeDateChange: OutputEmitterRef<D> = output<D>();

  /** Fires when the displayed primary month changes (page-nav, drill-up, or programmatic). Payload carries the new `year` and zero-based `month`. */
  readonly monthChange: OutputEmitterRef<{ year: number; month: number }> =
    output<{ year: number; month: number }>();

  /** Fires when the displayed year changes (month/year-view nav or year-page scroll). Payload carries the new `year`. */
  readonly yearChange: OutputEmitterRef<{ year: number }> = output<{ year: number }>();

  /** Fires on every pointer click of any cell, including disabled ones — analytics only. Payload carries the clicked `date` and the underlying `PointerEvent`. Does NOT indicate a selection; subscribe to `valueChange` for that. */
  readonly cellClick: OutputEmitterRef<{ date: D; event: PointerEvent }> =
    output<{ date: D; event: PointerEvent }>();

  /** Fires on every pointer hover of any cell — analytics only. Payload carries the hovered `date`. Does NOT indicate a preview; subscribe to `rangePreview` for range-mode hover state. */
  readonly cellHover: OutputEmitterRef<{ date: D }> = output<{ date: D }>();

  /** Fires when `mode` changes at runtime, in canonical order `selectionCleared` → `modeChange` → `valueChange` (§11.2). Payload carries `{ from, to }` modes. */
  readonly modeChange: OutputEmitterRef<ModeChangeEvent> = output<ModeChangeEvent>();

  // ---------------------------------------------------------------------------
  // Internal writable state (§8.1)
  // ---------------------------------------------------------------------------

  /** In-flight draft during range SELECTING. `null` in other states (§8.1). */
  private readonly internalDraftValue: WritableSignal<{ start: D } | null> = signal(null);

  /** Current selection lifecycle state. */
  private readonly _selectionState: WritableSignal<CalendarSelectionState> = signal('EMPTY');

  /** Current view (writable for drill). Tracks `startView` until the user drills. */
  private readonly _viewState: WritableSignal<CalendarViewState> = linkedSignal(() =>
    this.startView(),
  );

  /**
   * Active (focused) date. `linkedSignal` so changes to `startAt` at runtime update
   * the anchor, but internal navigation can still write it independently.
   */
  private readonly _activeDate: WritableSignal<D> = linkedSignal<D>(
    () => this.startAt() ?? this.dateAdapter.today(),
  );

  /** Pointer-hover date (desktop only). */
  private readonly _hoveredDate: WritableSignal<D | null> = signal<D | null>(null);

  /** Overlay state. Always `'closed'` in inline mode until Phase 10 wires the lifecycle. */
  private readonly _overlayState: WritableSignal<CalendarOverlayState> = signal('closed');

  /** Preset selection id. Phase 12 writes this. */
  private readonly _selectedPresetId: WritableSignal<string | null> = signal(null);

  /** Raw `TOut` retained when `fromForm` throws (§7.6, Phase 14). `null` otherwise. */
  private readonly _lastInvalidFormValue: WritableSignal<unknown> = signal(null);

  // ---------------------------------------------------------------------------
  // Public readonly signals (§33.3)
  // ---------------------------------------------------------------------------

  /** Overlay lifecycle. `null` until `interaction: 'overlay'` lands in Phase 10; until then the implementation signal is exposed as `'closed'`. */
  readonly overlayState: Signal<CalendarOverlayState | null> = computed(() =>
    this._overlayState(),
  );

  /** Selection lifecycle per §8. */
  readonly selectionState: Signal<CalendarSelectionState> = computed(() =>
    this._selectionState(),
  );

  /** Active (focused) cell. `null` when the overlay is closed and no inline focus is established; in inline mode this is always the current anchor. */
  readonly activeDate: Signal<D | null> = computed(() => this._activeDate());

  /** Currently selected preset id. */
  readonly selectedPresetId: Signal<string | null> = computed(() => this._selectedPresetId());

  /** Current view state (day / month / year). */
  readonly viewState: Signal<CalendarViewState> = computed(() => this._viewState());

  /** Months currently rendered. Phase 9 extends this to the full responsive count. */
  readonly displayedMonths: Signal<{ year: number; month: number }[]> = computed(() => {
    const active = this._activeDate();
    const primary = {
      year: this.dateAdapter.getYear(active),
      month: this.dateAdapter.getMonth(active),
    };
    if (this.effectiveMonthColumns() < 2) return [primary];
    const secondary = this.dateAdapter.addMonths(active, 1);
    return [
      primary,
      {
        year: this.dateAdapter.getYear(secondary),
        month: this.dateAdapter.getMonth(secondary),
      },
    ];
  });

  /** Raw form value rejected by the transformer's `fromForm` (§7.6, §33.3). */
  readonly lastInvalidFormValue: Signal<unknown> = computed(() => this._lastInvalidFormValue());

  // ---------------------------------------------------------------------------
  // ControlValueAccessor + Validator (Phase 3)
  // ---------------------------------------------------------------------------

  private cvaOnChange: (value: unknown) => void = () => {};
  private cvaOnTouched: () => void = () => {};
  private validatorOnChange: () => void = () => {};

  /**
   * @internal Disabled state set by `ControlValueAccessor.setDisabledState` and
   * by the Signal Forms mode directives. OR-merged with the public `disabled`
   * input into `effectiveDisabled`.
   */
  readonly cvaDisabled: WritableSignal<boolean> = signal(false);

  /**
   * @internal Read-only state set by the Signal Forms mode directives. OR-merged
   * with the public `readonly` input into `effectiveReadonly`.
   */
  readonly cvaReadonly: WritableSignal<boolean> = signal(false);

  /** Effective disabled state — public `disabled` input OR any form-bound disabled flip. Drives `aria-disabled`. */
  readonly effectiveDisabled: Signal<boolean> = computed(
    () => this.disabled() || this.cvaDisabled(),
  );

  /** Effective read-only state — public `readonly` input OR any form-bound readonly flip. Drives `aria-readonly`. */
  readonly effectiveReadonly: Signal<boolean> = computed(
    () => this.readonly() || this.cvaReadonly(),
  );

  /**
   * @internal Resolved range-behavior config. Merges the consumer-supplied
   * `Partial<RangeBehaviorConfig>` over the documented defaults so internal
   * call sites read each field directly without re-applying fallbacks.
   */
  private readonly _resolvedRangeBehavior: Signal<RangeBehaviorConfig> = computed(
    () => ({
      allowBackwardRange: false,
      allowSingleDayRange: true,
      persistPartialRange: true,
      disableRangesCrossingDisabledDates: false,
      ...this.rangeBehavior(),
    }),
  );

  /** @internal Dev-mode warning guard so each mismatched write warns only once per instance. */
  private _warnedShapeMismatch = false;

  /** @internal Set by `writeValue`; read by the `FormResetEvent` handler so it can emit `selectionCleared({reason: 'reset'})` only when a non-empty value was on the control before the reset cleared it. */
  private _hadValueBeforeLastWrite = false;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this._invalidFlashTimer !== null) {
        clearTimeout(this._invalidFlashTimer);
        this._invalidFlashTimer = null;
      }
    });
    // Runtime `mode` changes clear state and emit the canonical event order
    // per §11.2: selectionCleared({reason: 'mode-change'}) → modeChange → valueChange.
    // We read `mode()` via `linkedSignal` in a tracked effect so the prior value
    // can be observed via the captured closure.
    let previousMode: CalendarMode = untracked(() => this.mode());
    effect(() => {
      const current = this.mode();
      if (current === previousMode) return;
      const from = previousMode;
      previousMode = current;
      untracked(() => this.onModeChanged(from, current));
    });

    // Re-run validation whenever mode, constraints, or the rejected-write
    // marker changes so the §10.2 codes stay in sync. Constraint change
    // revalidation per §11.4.
    effect(() => {
      this.mode();
      this._lastInvalidFormValue();
      // `resolvedConstraints` transitively tracks `minDate`, `maxDate`, `dateFilter`,
      // `disabledDates`, `disabledDaysOfWeek`, and the shorthand `constraints` input.
      this.resolvedConstraints();
      this.minRangeLength();
      this.maxRangeLength();
      this.maxSelections();
      untracked(() => this.validatorOnChange());
    });

    // Push the resolved locale into the date adapter so `Intl.DateTimeFormat`
    // calls (month/weekday names, format()) align with `LOCALE_ID` or the
    // per-instance `locale` override (§19.1).
    effect(() => {
      const locale = this.effectiveLocale();
      untracked(() => this.dateAdapter.setLocale(locale));
    });

    // Phase 6 — keyboard-driven `rangePreview` emission. While SELECTING, any
    // change to `previewRange` (which now reacts to `activeDate` via
    // `previewCursor`) emits the same `rangePreview` payload as a hover (§21.1).
    // The hover path keeps emitting from `onPreviewChange` directly; this
    // effect covers arrow-key + Home/End/PageUp/PageDown navigation.
    let lastEmittedPreviewKey: string | null = null;
    effect(() => {
      // Skip when no draft is in-flight (only meaningful during SELECTING).
      if (this._selectionState() !== 'SELECTING') {
        lastEmittedPreviewKey = null;
        return;
      }
      const pr = this.previewRange();
      if (!pr?.start || !pr?.end) return;
      // Pointer-hover already emits via `onPreviewChange`; only fire here for
      // keyboard navigation (no hover anchor present).
      if (this._hoveredDate()) return;
      const key =
        this.dateAdapter.toIso(pr.start) + '|' + this.dateAdapter.toIso(pr.end);
      if (key === lastEmittedPreviewKey) return;
      lastEmittedPreviewKey = key;
      const start = pr.start as D;
      const end = pr.end as D;
      untracked(() =>
        this.rangePreview.emit({
          tentativeRange: { start, end },
          invalidPreview: this.isPreviewInvalid(start, end),
        }),
      );
    });
  }

  ngOnInit(): void {
    // Lazy NgControl lookup avoids the construction-time cycle (see field
    // declaration). By `ngOnInit` the host's `FormControlName`/`NgModel` is
    // fully constructed, so resolving it here is safe.
    this.ngControl = this.injector.get(NgControl, null, {
      self: true,
      optional: true,
    });

    // Reset detection per §6.5 — `FormControl.reset()` emits a dedicated
    // `FormResetEvent` on its events stream (and parent `FormGroup.reset()`
    // cascades via each child's `reset()`). Only Reactive / Template-driven
    // forms expose an `AbstractControl.events` Observable; Signal Forms'
    // `FormField` provides an `InteropNgControl` shim whose `.control`
    // re-points to itself and has no `events` stream, so we feature-detect
    // before subscribing. Signal Forms reset is handled via the field's
    // value-signal flow, not this event.
    const ctrl = this.ngControl?.control as AbstractControl | undefined;
    if (ctrl?.events) {
      ctrl.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
        if (event instanceof FormResetEvent) {
          this.handleFormReset();
        }
      });
    }
  }

  /** @internal `ControlValueAccessor` — writes a value from a reactive / template-driven form. Wrong-shape writes preserve the prior value per §7.2. Programmatic writes during SELECTING discard the draft per §11.1. */
  writeValue(incoming: unknown): void {
    this._hadValueBeforeLastWrite = !isEmptyCalendarValue(this.value());
    const mode = this.mode() as M;

    // Phase 6 — programmatic write during SELECTING discards the in-flight draft.
    // Detect BEFORE we touch state so we can fire `selectionCleared` exactly once
    // when the draft existed, regardless of which branch below handles the write.
    const wasSelecting =
      this._selectionState() === 'SELECTING' && this.internalDraftValue() !== null;

    if (incoming === null || incoming === undefined) {
      const empty = emptyCalendarValue<M, D>(mode);
      this.value.set(empty);
      this._selectionState.set('EMPTY');
      this.internalDraftValue.set(null);
      if (wasSelecting) this.selectionCleared.emit({ reason: 'programmatic' });
      if (this._lastInvalidFormValue() !== null) {
        this._lastInvalidFormValue.set(null);
        this.validatorOnChange();
      }
      return;
    }

    if (!matchesModeShape(mode, incoming)) {
      if (isDevMode() && !this._warnedShapeMismatch) {
        this._warnedShapeMismatch = true;
        console.warn(
          `[tw-calendar] writeValue received a value whose shape does not match mode="${mode}". ` +
            `Preserving the prior value; the form control will report calendarInvalidValue. ` +
            `Received:`,
          incoming,
        );
      }
      this._lastInvalidFormValue.set(incoming);
      this.validatorOnChange();
      return;
    }

    // Phase 6 — reject SELECTING-shaped programmatic writes (`{ start: D, end: null }`)
    // for `mode: 'range'`; only EMPTY or COMPLETE shapes are valid form values.
    if (mode === 'range' && isPartialRangeValue(incoming)) {
      if (isDevMode() && !this._warnedShapeMismatch) {
        this._warnedShapeMismatch = true;
        console.warn(
          '[tw-calendar] writeValue received a partial range `{start, end: null}` — only fully committed ranges are valid form values. Preserving the prior value; the form control will report calendarInvalidValue.',
          incoming,
        );
      }
      this._lastInvalidFormValue.set(incoming);
      this.validatorOnChange();
      return;
    }

    const normalized = incoming as CalendarValue<M, D>;
    this.value.set(normalized);
    this._selectionState.set(deriveSelectionStateFromValue<M, D>(normalized));
    this.internalDraftValue.set(null);
    if (wasSelecting) this.selectionCleared.emit({ reason: 'programmatic' });
    if (this._lastInvalidFormValue() !== null) {
      this._lastInvalidFormValue.set(null);
      this.validatorOnChange();
    }
  }

  /** @internal `ControlValueAccessor` — registers the on-change callback. */
  registerOnChange(fn: (value: unknown) => void): void {
    this.cvaOnChange = fn;
  }

  /** @internal `ControlValueAccessor` — registers the touched callback. */
  registerOnTouched(fn: () => void): void {
    this.cvaOnTouched = fn;
  }

  /** @internal `ControlValueAccessor` — reflects the form control's disabled state through `effectiveDisabled` / `aria-disabled`. */
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  /** @internal `Validator` — runs the §10.2 validator. Phase 3 codes (`calendarRequired`, `calendarInvalidValue`) plus Phase 4 constraint codes (`calendarMinDate`, `calendarMaxDate`, `calendarDisabledDate`, `calendarRangeTooShort`, `calendarRangeTooLong`, `calendarMaxSelections`, `calendarInvalidRange`). */
  validate(control: AbstractControl): ValidationErrors | null {
    const ctx = {
      mode: this.mode() as M,
      lastInvalidFormValue: this._lastInvalidFormValue(),
      constraints: this.resolvedConstraints(),
      adapter: this.dateAdapter,
      minRangeLength: this.minRangeLength(),
      maxRangeLength: this.maxRangeLength(),
      maxSelections: this.maxSelections(),
    };
    return calendarValidator<M, D>(ctx)(control);
  }

  /** @internal `Validator` — registers the change callback so the form re-runs validation when internal state changes. */
  registerOnValidatorChange(fn: () => void): void {
    this.validatorOnChange = fn;
  }

  /** @internal Host `(focusout)` handler — fires `onTouched` when focus leaves the component (§13.6 inline path). Overlay-mode wiring is Phase 10. */
  onBlur(event: FocusEvent): void {
    const host = this.elementRef.nativeElement;
    const related = event.relatedTarget as Node | null;
    // Only fire when focus actually leaves the component tree. Focus moves
    // between cells (roving tabindex) stay inside the host and must not mark
    // the control touched.
    if (related && host.contains(related)) return;
    this.cvaOnTouched();
  }

  // ---------------------------------------------------------------------------
  // Derived state (kept from the prior implementation; some refined per Phase 1)
  // ---------------------------------------------------------------------------

  /**
   * Effective `CalendarIntl` resolved per-field over the DI default (§19.4).
   * The injected default is the base; the `intl` input overrides individual
   * fields. Unspecified fields fall through to English defaults.
   */
  readonly effectiveIntl: Signal<CalendarIntl> = computed(() => {
    const override = this.intl();
    if (!override) return this.injectedIntl;
    // Prototype copy preserves bound methods; shallow per-field overlay matches
    // the spec's per-field merge semantics.
    const merged = Object.create(
      Object.getPrototypeOf(this.injectedIntl) as object,
    ) as CalendarIntl;
    Object.assign(merged, this.injectedIntl, override);
    return merged;
  });

  /** Effective locale — `locale` input wins, otherwise Angular `LOCALE_ID`. */
  readonly effectiveLocale: Signal<string> = computed(
    () => this.locale() ?? this.platformLocale,
  );

  /**
   * Active strategy for single/multiple/range. Injected strategies (custom) win.
   * Range state will migrate into this component in Phase 6; for now we reuse
   * the strategy for its `select` / `createPreview` / `isSelected` helpers.
   */
  readonly selectionStrategy: Signal<CalendarSelectionStrategy<D, unknown>> = computed(() => {
    if (this.injectedStrategy) return this.injectedStrategy;
    const m = this.mode();
    if (m === 'range') return this.localStrategies.range as CalendarSelectionStrategy<D, unknown>;
    if (m === 'multiple')
      return this.localStrategies.multiple as CalendarSelectionStrategy<D, unknown>;
    return this.localStrategies.single as CalendarSelectionStrategy<D, unknown>;
  });

  /** Computed first-day-of-week (input override wins over adapter default). */
  readonly computedFirstDayOfWeek: Signal<number> = computed(() => {
    const override = this.firstDayOfWeek();
    if (override !== null && override >= 0 && override <= 6) return override;
    return this.dateAdapter.getFirstDayOfWeek();
  });

  /** Resolves the configured `monthColumns` value. Range-mode consumers pass `2` explicitly. */
  readonly effectiveMonthColumns: Signal<number> = computed(() => this.monthColumns());

  /**
   * @internal Drives `aria-multiselectable` on every view grid. `true` when the
   * current `mode` allows more than one cell to be selected at a time
   * (`'multiple'` or `'range'`); `false` for `'single'`.
   */
  readonly multiSelectable: Signal<boolean> = computed(() => this.mode() !== 'single');

  /** Secondary anchor for the right-hand grid in multi-column mode. */
  readonly secondaryActiveDate: Signal<D | null> = computed(() => {
    if (this.effectiveMonthColumns() < 2) return null;
    return this.dateAdapter.addMonths(this._activeDate(), 1);
  });

  /**
   * Phase 6 — preview cursor. Pointer hover wins; falls back to `activeDate`
   * when SELECTING so keyboard arrow-key moves drive the same preview path
   * (§21.1, §16.1). `null` when no SELECTING draft is in-flight and pointer
   * is off-grid.
   */
  private readonly previewCursor: Signal<D | null> = computed(() => {
    const hovered = this._hoveredDate();
    if (hovered) return hovered;
    if (this._selectionState() === 'SELECTING') return this._activeDate();
    return null;
  });

  /**
   * Preview range. Driven by the strategy and the `previewCursor` (hover or
   * keyboard active-date during SELECTING).
   */
  readonly previewRange: Signal<DateRange<D> | null> = computed(() => {
    const strategy = this.selectionStrategy();
    const cursor = this.previewCursor();
    const source = this.strategySelection();
    return strategy.createPreview(cursor, source);
  });

  /**
   * Adapter-compatible view of the current selection.
   * For range: a `{ start, end }` view of either the committed value or the in-flight draft.
   * For single: the raw `D | null`.
   * For multiple: the raw `D[]`.
   *
   * Used internally to feed the legacy strategy surface while Phase 6 migrates range state.
   */
  private readonly strategySelection: Signal<unknown> = computed(() => {
    const m = this.mode();
    const v = this.value();
    if (m === 'range') {
      const draft = this.internalDraftValue();
      if (draft) return { start: draft.start, end: null };
      return v ?? null;
    }
    return v;
  });

  /** Adapter-compatible view exposed to the view components. */
  readonly legacySelected: Signal<D | D[] | DateRange<D> | null> = computed(
    () => this.strategySelection() as D | D[] | DateRange<D> | null,
  );

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
    const date = this._activeDate();
    const view = this._viewState();
    const year = this.dateAdapter.getYear(date);
    const month = this.dateAdapter.getMonth(date);

    switch (view) {
      case 'day': {
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
      case 'month':
        return `${year}`;
      case 'year': {
        const startYear = getMultiYearStartingYear(year, YEARS_PER_PAGE);
        return `${startYear} – ${startYear + YEARS_PER_PAGE - 1}`;
      }
    }
  });

  /** @internal */
  readonly periodAriaLabel: Signal<string> = computed(() => {
    const view = this._viewState();
    const label = this.periodLabel();
    const intl = this.effectiveIntl();
    switch (view) {
      case 'day':
        return intl.switchToMonthViewLabel(label);
      case 'month':
        return intl.switchToYearViewLabel(label);
      case 'year':
        return label;
    }
  });

  /** @internal */
  readonly prevAriaLabel: Signal<string> = computed(() => {
    const intl = this.effectiveIntl();
    switch (this._viewState()) {
      case 'day':
        return intl.previousMonthLabel;
      case 'month':
        return intl.previousYearLabel;
      case 'year':
        return intl.previousYearsLabel(YEARS_PER_PAGE);
    }
  });

  /** @internal */
  readonly nextAriaLabel: Signal<string> = computed(() => {
    const intl = this.effectiveIntl();
    switch (this._viewState()) {
      case 'day':
        return intl.nextMonthLabel;
      case 'month':
        return intl.nextYearLabel;
      case 'year':
        return intl.nextYearsLabel(YEARS_PER_PAGE);
    }
  });

  /** @internal */
  readonly prevDisabled: Signal<boolean> = computed(() => {
    const date = this._activeDate();
    const minDate = this.resolvedMinDate();
    if (!minDate) return false;
    const view = this._viewState();
    const year = this.dateAdapter.getYear(date);
    const month = this.dateAdapter.getMonth(date);
    switch (view) {
      case 'day': {
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        return isMonthDisabled(prevYear, prevMonth, minDate, null, this.dateAdapter);
      }
      case 'month':
        return isYearDisabled(year - 1, minDate, null, this.dateAdapter);
      case 'year': {
        const startYear = getMultiYearStartingYear(year, YEARS_PER_PAGE);
        return isYearDisabled(startYear - 1, minDate, null, this.dateAdapter);
      }
    }
  });

  /** @internal */
  readonly nextDisabled: Signal<boolean> = computed(() => {
    const date = this._activeDate();
    const maxDate = this.resolvedMaxDate();
    if (!maxDate) return false;
    const view = this._viewState();
    const year = this.dateAdapter.getYear(date);
    const month = this.dateAdapter.getMonth(date);
    switch (view) {
      case 'day': {
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        return isMonthDisabled(nextYear, nextMonth, null, maxDate, this.dateAdapter);
      }
      case 'month':
        return isYearDisabled(year + 1, null, maxDate, this.dateAdapter);
      case 'year': {
        const startYear = getMultiYearStartingYear(year, YEARS_PER_PAGE);
        return isYearDisabled(startYear + YEARS_PER_PAGE, null, maxDate, this.dateAdapter);
      }
    }
  });

  // ---------------------------------------------------------------------------
  // Public methods (§33.4)
  // ---------------------------------------------------------------------------

  /** Focuses `date` and optionally navigates the view to render it. */
  focusDate(date: D, opts?: { navigate?: boolean }): void {
    const clamped = this.dateAdapter.clampDate(date, this.resolvedMinDate(), this.resolvedMaxDate());
    if (opts?.navigate) this._activeDate.set(clamped);
    this.activeDateChange.emit(clamped);
    this.focusActiveCell();
  }

  /** Sets the current view state and emits a `viewChange` event. */
  setView(view: CalendarViewState): void {
    const from = this._viewState();
    if (from === view) return;
    this._viewState.set(view);
    this.viewChange.emit({ from, to: view, reason: 'programmatic' });
  }

  /** Navigates to a specific date (anchor). Does not emit a selection event. */
  goToDate(date: D): void {
    const clamped = this.dateAdapter.clampDate(date, this.resolvedMinDate(), this.resolvedMaxDate());
    this._activeDate.set(clamped);
    this.activeDateChange.emit(clamped);
  }

  /** Navigates to today. */
  goToToday(): void {
    this.goToDate(this.dateAdapter.today());
  }

  /** Clears the current selection. Alias: `clearSelection`. */
  clear(): void {
    if (this.effectiveReadonly()) return;
    const had = !isEmptyCalendarValue(this.value());
    const empty = emptyCalendarValue<M, D>(this.mode() as M);
    const hadPreset = this._selectedPresetId() !== null;
    this.value.set(empty);
    this.internalDraftValue.set(null);
    this._selectionState.set('EMPTY');
    if (had) this.selectionCleared.emit({ reason: 'user' });
    this.cvaOnChange(empty);
    this.valueChange.emit(empty);
    if (hadPreset) {
      this._selectedPresetId.set(null);
      this.presetChange.emit(null);
    }
  }

  /** Alias of `clear()` exported per §33.4 for discoverability. */
  clearSelection(): void {
    this.clear();
  }

  /** Resets to initial state — value + view + active date per `resetBehavior`. Phase 3 extends this with form-reset integration. */
  reset(): void {
    this.clear();
    this._viewState.set(this.startView());
    this._activeDate.set(this.startAt() ?? this.dateAdapter.today());
  }

  /** Revalidates constraints + cell filters (Phase 4 wires it). */
  revalidate(): void {
    // No-op until Phase 4 introduces the validator.
  }

  /** Opens the overlay. Phase 10 wires the CDK overlay; inline mode is a no-op. */
  open(): void {
    // Phase 10.
  }

  /** Closes the overlay. */
  close(): void {
    // Phase 10.
  }

  /** Toggles the overlay. */
  toggle(): void {
    // Phase 10.
  }

  /** Imperatively focuses the currently active cell. */
  focusActiveCell(): void {
    const views = this.monthViews();
    if (views.length > 0) {
      views[0].focusActiveCell();
      return;
    }
    const host = this.elementRef.nativeElement;
    (host.querySelector('button[tabindex="0"]') as HTMLButtonElement | null)?.focus();
  }

  // ---------------------------------------------------------------------------
  // Event handlers (day grid)
  // ---------------------------------------------------------------------------

  /** @internal */
  onPrevClicked(): void {
    const view = this._viewState();
    const date = this._activeDate();
    const previousYear = this.dateAdapter.getYear(date);
    const previousMonth = this.dateAdapter.getMonth(date);
    let next: D;
    switch (view) {
      case 'day':
        next = this.dateAdapter.addMonths(date, -1);
        break;
      case 'month':
        next = this.dateAdapter.addYears(date, -1);
        break;
      case 'year':
        next = this.dateAdapter.addYears(date, -YEARS_PER_PAGE);
        break;
    }
    this._activeDate.set(next);
    this.activeDateChange.emit(next);
    this.emitPeriodChange(previousYear, previousMonth, view);
    this.announceNavigation('previous');
  }

  /** @internal */
  onNextClicked(): void {
    const view = this._viewState();
    const date = this._activeDate();
    const previousYear = this.dateAdapter.getYear(date);
    const previousMonth = this.dateAdapter.getMonth(date);
    let next: D;
    switch (view) {
      case 'day':
        next = this.dateAdapter.addMonths(date, 1);
        break;
      case 'month':
        next = this.dateAdapter.addYears(date, 1);
        break;
      case 'year':
        next = this.dateAdapter.addYears(date, YEARS_PER_PAGE);
        break;
    }
    this._activeDate.set(next);
    this.activeDateChange.emit(next);
    this.emitPeriodChange(previousYear, previousMonth, view);
    this.announceNavigation('next');
  }

  /** @internal — period-button click: drill up (day → month → year). */
  onPeriodClicked(): void {
    const current = this._viewState();
    if (current === 'day') {
      this._viewState.set('month');
      this.viewChange.emit({ from: current, to: 'month', reason: 'drill-up' });
    } else if (current === 'month') {
      this._viewState.set('year');
      this.viewChange.emit({ from: current, to: 'year', reason: 'drill-up' });
    }
    this.announceViewChange();
  }

  /** @internal — day-grid cell activation. */
  onDateSelected(date: D): void {
    if (this.effectiveDisabled()) return;
    // Read-only: keep focus + navigation but skip every commit path.
    if (this.effectiveReadonly()) {
      this._activeDate.set(date);
      this.activeDateChange.emit(date);
      return;
    }
    this._activeDate.set(date);
    this.activeDateChange.emit(date);

    const mode = this.mode();
    if (mode === 'range') {
      this.commitRangeClick(date);
      return;
    }

    if (mode === 'multiple') {
      // Phase 4 — enforce maxSelections per maxSelectionBehavior (§10.1, §33.1).
      const limit = this.maxSelections();
      const currentArr = (this.value() as unknown as D[]) ?? [];
      const isAlreadySelected = currentArr.some((d) => this.dateAdapter.sameDate(d, date));
      if (limit !== null && !isAlreadySelected && currentArr.length >= limit) {
        const behavior = this.maxSelectionBehavior();
        if (behavior === 'emit-limit-reached') {
          this.selectionLimitReached.emit({ limit, attempted: date });
          return;
        }
        if (behavior === 'replace-oldest') {
          const next = [...currentArr.slice(1), date];
          this.commitValue(next as unknown as CalendarValue<M, D>, 'commit');
          return;
        }
        // 'ignore' — silently drop the click.
        return;
      }
    }

    const strategy = this.selectionStrategy();
    const current = mode === 'multiple' ? ((this.value() as unknown as D[]) ?? []) : this.value();
    const result = strategy.select(date, current);
    if (result.isComplete) {
      this.commitValue(result.selection as CalendarValue<M, D>, 'commit');
    }
  }

  /** @internal — preview sync from pointer hover. */
  onPreviewChange(date: D | null): void {
    this._hoveredDate.set(date);
    if (date) this.cellHover.emit({ date });
    const draft = this.internalDraftValue();
    const pr = this.previewRange();
    if (draft && pr?.start && pr.end) {
      this.rangePreview.emit({
        tentativeRange: { start: pr.start, end: pr.end },
        invalidPreview: this.isPreviewInvalid(pr.start, pr.end),
      });
    }
  }

  /**
   * Phase 4 — `true` when a tentative range hover would commit an invalid value.
   * Reasons: crosses a disabled date, or length violates `min`/`maxRangeLength`.
   * The flag is informational — does NOT block the commit on its own (§4 default
   * is permissive). Subscribe to `rangePreview.invalidPreview` together with the
   * `calendarRangeTooShort` / `calendarRangeTooLong` validator codes to react.
   */
  private isPreviewInvalid(start: D, end: D): boolean {
    const constraints = this.resolvedConstraints();
    // Endpoints already pass `enabled` check (you can't hover a disabled cell
    // and produce a preview), so we only need to look at the interior.
    if (rangeCrossesDisabled(start, end, constraints, this.dateAdapter, false)) return true;
    const length = rangeLengthDays(start, end, this.dateAdapter);
    const min = this.minRangeLength();
    if (min !== null && length < min) return true;
    const max = this.maxRangeLength();
    if (max !== null && length > max) return true;
    return false;
  }

  /**
   * Resolved `minDate` — individual `minDate` input wins, then `constraints.minDate`,
   * else `null`. Used by every internal min-date reader so the shorthand input is
   * transparent to the rest of the component.
   */
  readonly resolvedMinDate: Signal<D | null> = computed(
    () => this.minDate() ?? this.constraints()?.minDate ?? null,
  );

  /** Resolved `maxDate` — individual input wins, then `constraints.maxDate`, else `null`. */
  readonly resolvedMaxDate: Signal<D | null> = computed(
    () => this.maxDate() ?? this.constraints()?.maxDate ?? null,
  );

  /** Resolved `disabledDates` — individual input wins, then `constraints.disabledDates`, else `null`. */
  readonly resolvedDisabledDates: Signal<DisabledDates<D> | null> = computed(
    () => this.disabledDates() ?? this.constraints()?.disabledDates ?? null,
  );

  /** Resolved `disabledDaysOfWeek` — individual input wins (when non-empty), then `constraints.disabledDaysOfWeek`, else `[]`. */
  readonly resolvedDisabledDaysOfWeek: Signal<readonly number[]> = computed(() => {
    const own = this.disabledDaysOfWeek();
    if (own.length > 0) return own;
    return this.constraints()?.disabledDaysOfWeek ?? [];
  });

  /** Resolved `dateFilter` — individual input wins, then `constraints.dateFilter`, else `null`. */
  readonly resolvedDateFilter: Signal<DateFilterFn<D> | null> = computed(
    () => this.dateFilter() ?? this.constraints()?.dateFilter ?? null,
  );

  /** Aggregated, resolved constraint inputs — passed to the resolver and validator. */
  private readonly resolvedConstraints: Signal<CalendarConstraints<D>> = computed(() => ({
    minDate: this.resolvedMinDate(),
    maxDate: this.resolvedMaxDate(),
    disabledDates: this.resolvedDisabledDates(),
    disabledDaysOfWeek: this.resolvedDisabledDaysOfWeek(),
    dateFilter: this.resolvedDateFilter(),
  }));

  /** @internal — month-view cell activation (drill-down to day). */
  onMonthSelected(date: D): void {
    this._activeDate.set(date);
    const from = this._viewState();
    this._viewState.set('day');
    this.activeDateChange.emit(date);
    this.viewChange.emit({ from, to: 'day', reason: 'drill-down' });
    this.announceViewChange();
  }

  /** @internal — years-view cell activation (drill-down to month). */
  onYearSelected(date: D): void {
    this._activeDate.set(date);
    const from = this._viewState();
    this._viewState.set('month');
    this.activeDateChange.emit(date);
    this.viewChange.emit({ from, to: 'month', reason: 'drill-down' });
    this.announceViewChange();
  }

  /** @internal — keyboard / programmatic active-date change from a view. */
  onActiveDateChange(date: D, gridIndex?: number): void {
    const views = this.monthViews();

    if (this.effectiveMonthColumns() >= 2 && views.length === 2 && gridIndex !== undefined) {
      const primaryMonth = this.dateAdapter.getMonth(this._activeDate());
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

    this._activeDate.set(date);
    this.activeDateChange.emit(date);
  }

  // ---------------------------------------------------------------------------
  // Range state machine (§21) — orchestrator-owned. Click matrix:
  //   EMPTY    + click → SELECTING (selectionStart)
  //   SELECTING+ click → COMPLETE  (selectionComplete; auto-swap unless allowBackwardRange)
  //   COMPLETE + click → branches on rangeClickBehavior:
  //                       'restart'        → SELECTING (selectionRestart)
  //                       'nearest-edge'   → COMPLETE  (selectionComplete reason='nearest-edge')
  //                       'require-clear'  → no-op + invalid-flash on the clicked cell
  // ---------------------------------------------------------------------------

  /** @internal Last invalidly-clicked date, cleared after ~200ms — drives `data-state-invalid-flash`. */
  private readonly _invalidFlashDate: WritableSignal<D | null> = signal<D | null>(null);

  /** Public read of the transient invalid-flash anchor. Views consume this and tag the matching cell. */
  readonly invalidFlashDate: Signal<D | null> = computed(() => this._invalidFlashDate());

  private commitRangeClick(date: D): void {
    const draft = this.internalDraftValue();
    const state = this._selectionState();

    // ─── COMPLETE state branch — third click after a committed range. ────────
    if (state === 'COMPLETE') {
      const behavior = this.rangeClickBehavior();
      if (behavior === 'require-clear') {
        this.flashInvalid(date);
        return;
      }
      if (behavior === 'nearest-edge') {
        this.commitNearestEdge(date);
        return;
      }
      // 'restart' (default) → fall through to SELECTING entry.
      this.enterSelecting(date, /* fromComplete */ true);
      return;
    }

    // ─── EMPTY → SELECTING ──────────────────────────────────────────────────
    if (state !== 'SELECTING' || !draft) {
      this.enterSelecting(date, /* fromComplete */ false);
      return;
    }

    // ─── SELECTING → COMPLETE: commit the range. ────────────────────────────
    const start = draft.start;
    const cmp = this.dateAdapter.compare(date, start);
    const behavior = this._resolvedRangeBehavior();

    // `allowSingleDayRange = false` rejects clicking the same cell twice.
    if (cmp === 0 && !behavior.allowSingleDayRange) {
      this.flashInvalid(date);
      return;
    }

    let rangeStart: D;
    let rangeEnd: D;
    let reason: SelectionCompleteEvent<M, D>['reason'] = 'commit';
    if (cmp < 0) {
      if (behavior.allowBackwardRange) {
        // Preserve user-clicked order; do not normalize.
        rangeStart = start;
        rangeEnd = date;
      } else {
        // §21.5 silent auto-swap — DO NOT emit selectionRestart.
        rangeStart = date;
        rangeEnd = start;
        reason = 'auto-swap';
      }
    } else {
      rangeStart = start;
      rangeEnd = date;
    }

    // §21.4 disable-crossing guard: if any interior date is disabled, reject.
    if (
      behavior.disableRangesCrossingDisabledDates &&
      rangeCrossesDisabled(
        rangeStart,
        rangeEnd,
        this.resolvedConstraints(),
        this.dateAdapter,
        /* includeEndpoints */ false,
      )
    ) {
      this.flashInvalid(date);
      return;
    }

    const committed = { start: rangeStart, end: rangeEnd } as unknown as CalendarValue<M, D>;
    this.internalDraftValue.set(null);
    this.commitValue(committed, reason);
  }

  /** Enters SELECTING with `date` as draft.start. Emits selectionStart or selectionRestart. */
  private enterSelecting(date: D, fromComplete: boolean): void {
    this.internalDraftValue.set({ start: date });
    this._selectionState.set('SELECTING');
    if (fromComplete) {
      this.selectionRestart.emit({ start: date });
    } else {
      this.selectionStart.emit({ start: date });
    }
    this.announceRangeStart(date);
  }

  /**
   * `'nearest-edge'` move (§21.3) — drag the closer endpoint of the committed
   * range to `date`. Emits `selectionComplete({reason: 'nearest-edge'})`.
   */
  private commitNearestEdge(date: D): void {
    const current = this.value() as unknown as { start: D | null; end: D | null } | null;
    if (!current?.start || !current?.end) {
      // Defensive — shouldn't reach here in COMPLETE without both endpoints.
      this.enterSelecting(date, true);
      return;
    }
    const distStart = Math.abs(this.dateAdapter.compare(date, current.start));
    const distEnd = Math.abs(this.dateAdapter.compare(date, current.end));
    let nextStart: D;
    let nextEnd: D;
    if (distStart <= distEnd) {
      // Move start; if it crosses the existing end, swap.
      if (this.dateAdapter.compare(date, current.end) > 0) {
        nextStart = current.end;
        nextEnd = date;
      } else {
        nextStart = date;
        nextEnd = current.end;
      }
    } else {
      // Move end; if it crosses the existing start, swap.
      if (this.dateAdapter.compare(date, current.start) < 0) {
        nextStart = date;
        nextEnd = current.start;
      } else {
        nextStart = current.start;
        nextEnd = date;
      }
    }
    if (
      this._resolvedRangeBehavior().disableRangesCrossingDisabledDates &&
      rangeCrossesDisabled(
        nextStart,
        nextEnd,
        this.resolvedConstraints(),
        this.dateAdapter,
        /* includeEndpoints */ false,
      )
    ) {
      this.flashInvalid(date);
      return;
    }
    const committed = { start: nextStart, end: nextEnd } as unknown as CalendarValue<M, D>;
    this.commitValue(committed, 'nearest-edge');
  }

  /** Pending invalid-flash clear timer; tracked so we can cancel on destroy. */
  private _invalidFlashTimer: ReturnType<typeof setTimeout> | null = null;

  /** Sets the invalid-flash anchor and schedules a clear after 200ms. */
  private flashInvalid(date: D): void {
    this._invalidFlashDate.set(date);
    this.announceRejection();
    if (this._invalidFlashTimer !== null) clearTimeout(this._invalidFlashTimer);
    this._invalidFlashTimer = setTimeout(() => {
      this._invalidFlashTimer = null;
      // Only clear if we're still flashing this exact date (a new flash may have superseded).
      if (this._invalidFlashDate() === date) {
        this._invalidFlashDate.set(null);
      }
    }, 200);
  }

  /** Commits a value into the form + outputs with spec-ordered event emission. */
  private commitValue(
    newValue: CalendarValue<M, D>,
    reason: SelectionCompleteEvent<M, D>['reason'],
  ): void {
    this.value.set(newValue);
    this._selectionState.set('COMPLETE');
    // §8.5: at most one `valueChange` + one `selectionComplete` per user action.
    this.cvaOnChange(newValue);
    this.cvaOnTouched();
    this.valueChange.emit(newValue);
    this.selectionComplete.emit({ value: newValue, reason });
    this.announceSelectionComplete(newValue);
  }

  // ---------------------------------------------------------------------------
  // Form reset handling (§6.5)
  // ---------------------------------------------------------------------------

  /**
   * Handles a form-owned reset. Triggered when the bound `NgControl` flips
   * `pristine` back to `true` (via `FormControl.reset()` / `FormGroup.reset()`).
   * Per §6.5 the form owns the value write, so this path does NOT emit
   * `valueChange` and does NOT call `onTouched`. It emits `selectionCleared`
   * when a value was previously committed and restores UI state per
   * `resetBehavior`.
   */
  private handleFormReset(): void {
    // `writeValue` fires before `FormResetEvent`, so by the time we reach this
    // handler `this.value()` is already the reset value (typically empty).
    // `_hadValueBeforeLastWrite` is the snapshot captured at the start of
    // the preceding `writeValue` and is the correct signal for "was there
    // anything to clear?" per §6.5.
    const hadValue = this._hadValueBeforeLastWrite;
    this._hadValueBeforeLastWrite = false;
    const hadPreset = this._selectedPresetId() !== null;

    // Always clear draft / hovered / preset regardless of resetBehavior.
    this.internalDraftValue.set(null);
    this._hoveredDate.set(null);

    if (isEmptyCalendarValue(this.value())) {
      this._selectionState.set('EMPTY');
    }

    if (this.resetBehavior() === 'full') {
      this._viewState.set(this.startView());
      this._activeDate.set(this.startAt() ?? this.dateAdapter.today());
    }

    if (hadPreset) {
      this._selectedPresetId.set(null);
      this.presetChange.emit(null);
    }

    if (hadValue) {
      this.selectionCleared.emit({ reason: 'reset' });
    }
  }

  // ---------------------------------------------------------------------------
  // Mode change handling (§11.2)
  // ---------------------------------------------------------------------------

  private onModeChanged(from: CalendarMode, to: CalendarMode): void {
    const hadValue = !isEmptyCalendarValue(this.value());
    const hadPreset = this._selectedPresetId() !== null;

    // Canonical emit order per §11.2:
    // 1. selectionCleared({reason: 'mode-change'}) — only if a value was previously held
    // 2. presetChange(null) — only if a preset id was set
    // 3. modeChange
    // 4. valueChange (empty for new mode)
    this.internalDraftValue.set(null);
    this._selectionState.set('EMPTY');
    const empty = emptyCalendarValue<CalendarMode, D>(to) as unknown as CalendarValue<M, D>;
    this.value.set(empty);

    if (hadValue) {
      this.selectionCleared.emit({ reason: 'mode-change' });
    }
    if (hadPreset) {
      this._selectedPresetId.set(null);
      this.presetChange.emit(null);
    }
    this.modeChange.emit({ from, to });
    this.cvaOnChange(empty);
    this.valueChange.emit(empty);
  }

  // ---------------------------------------------------------------------------
  // Utility helpers
  // ---------------------------------------------------------------------------

  private computeCompareValue(date: D): number {
    return (
      this.dateAdapter.getYear(date) * 10000 +
      this.dateAdapter.getMonth(date) * 100 +
      this.dateAdapter.getDate(date)
    );
  }

  private emitPeriodChange(previousYear: number, previousMonth: number, view: CalendarViewState): void {
    const now = this._activeDate();
    const year = this.dateAdapter.getYear(now);
    const month = this.dateAdapter.getMonth(now);
    if (view === 'day' && (year !== previousYear || month !== previousMonth)) {
      this.monthChange.emit({ year, month });
    }
    if (year !== previousYear) this.yearChange.emit({ year });
  }

  private announceViewChange(): void {
    const intl = this.effectiveIntl();
    if (intl.skipAnnouncement) return;
    this.liveAnnouncer.announce(intl.viewSwitched(this._viewState(), this.periodLabel()), 'polite');
  }

  private announceNavigation(direction: 'previous' | 'next'): void {
    const intl = this.effectiveIntl();
    if (intl.skipAnnouncement) return;
    this.liveAnnouncer.announce(intl.navigatedTo(direction, this.periodLabel()), 'polite');
  }

  /** Announces a committed selection for AT users. Branches on mode so the message matches the §19.4 intl strings. */
  private announceSelectionComplete(value: CalendarValue<M, D>): void {
    const intl = this.effectiveIntl();
    if (intl.skipAnnouncement) return;
    const mode = this.mode();
    if (mode === 'single') {
      const single = value as D | null;
      if (!single) return;
      this.liveAnnouncer.announce(intl.selectedAnnouncement(this.formatDate(single)), 'polite');
      return;
    }
    if (mode === 'multiple') {
      const arr = (value as unknown as D[] | null) ?? [];
      this.liveAnnouncer.announce(intl.multipleSelectionAnnouncement(arr.length), 'polite');
      return;
    }
    const range = value as unknown as { start: D | null; end: D | null } | null;
    if (!range?.start || !range?.end) return;
    const length = rangeLengthDays(range.start, range.end, this.dateAdapter);
    this.liveAnnouncer.announce(
      intl.rangeUpdateAnnouncement(this.formatDate(range.start), this.formatDate(range.end), length),
      'polite',
    );
  }

  /** Announces the start of a range pick for AT users. */
  private announceRangeStart(date: D): void {
    const intl = this.effectiveIntl();
    if (intl.skipAnnouncement) return;
    this.liveAnnouncer.announce(intl.rangeStartAnnouncement(this.formatDate(date)), 'polite');
  }

  /** Announces that a click was rejected (require-clear, disable-cross commit, single-day disallowed). */
  private announceRejection(): void {
    const intl = this.effectiveIntl();
    if (intl.skipAnnouncement) return;
    this.liveAnnouncer.announce(intl.selectionRejectedAnnouncement, 'polite');
  }

  /** Locale-aware long-form date format used in announcements (e.g. "Wednesday, April 15, 2026"). */
  private formatDate(date: D): string {
    return this.dateAdapter.format(date, { dateTimeFormat: { dateStyle: 'full' } });
  }

}
