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
  CalendarMode,
  CalendarOverlayState,
  CalendarSelectionState,
  CalendarValue,
  CalendarViewState,
  DateClassFn,
  DateFilterFn,
  DateRange,
  ModeChangeEvent,
  RangePreviewEvent,
  ResetBehavior,
  SelectionClearedEvent,
  SelectionCompleteEvent,
  ViewChangeEvent,
} from './calendar.types';
import { emptyCalendarValue, YEARS_PER_PAGE } from './calendar.types';
import { calendarValidator } from './calendar-validators';
import { DateAdapter, DATE_ADAPTER } from './date-adapter';
import { MonthViewComponent } from './month-view';
import { YearViewComponent } from './year-view';
import { YearsViewComponent } from './multi-year-view';
import { getMultiYearStartingYear, isMonthDisabled, isYearDisabled } from './calendar.utils';
import {
  CalendarSelectionStrategy,
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
    '(focusout)': 'onBlur($event)',
  },
  template: `
    <div
      [class]="rootClasses()"
      role="application"
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

      <div class="sr-only" aria-live="polite" aria-atomic="true">
        {{ liveAnnouncement() }}
      </div>

      @switch (viewState()) {
        @case ('day') {
          <div [class]="monthsClasses()">
            <tw-calendar-month-view
              [activeDate]="activeDate()!"
              [selected]="legacySelected()"
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
                [selected]="legacySelected()"
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
        @case ('month') {
          <tw-calendar-year-view
            [activeDate]="activeDate()!"
            [selected]="legacySelected()"
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
        @case ('year') {
          <tw-calendar-years-view
            [activeDate]="activeDate()!"
            [selected]="legacySelected()"
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
  private readonly ngControl = inject(NgControl, { self: true, optional: true });

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

  /** Fires when the committed value changes. Emits the untransformed `CalendarValue<M, D>` (§7.6). */
  readonly valueChange: OutputEmitterRef<CalendarValue<M, D>> =
    output<CalendarValue<M, D>>();

  /** Fires on the first click of a range selection (enters SELECTING). */
  readonly selectionStart: OutputEmitterRef<{ start: D }> = output<{ start: D }>();

  /** Fires as the hover / keyboard cursor moves during range SELECTING. */
  readonly rangePreview: OutputEmitterRef<RangePreviewEvent<D>> =
    output<RangePreviewEvent<D>>();

  /** Fires when a selection commits (click, auto-swap, nearest-edge, or preset). */
  readonly selectionComplete: OutputEmitterRef<SelectionCompleteEvent<M, D>> =
    output<SelectionCompleteEvent<M, D>>();

  /** Fires when a range selection restarts (e.g., third click with `rangeClickBehavior='restart'`). */
  readonly selectionRestart: OutputEmitterRef<{ start: D }> = output<{ start: D }>();

  /** Fires when the value clears — user, programmatic, mode change, reset, or disabled flip. */
  readonly selectionCleared: OutputEmitterRef<SelectionClearedEvent> =
    output<SelectionClearedEvent>();

  /** Fires when `maxSelections` is reached. Phase 4 wires the payload; declared now for API stability. */
  readonly selectionLimitReached: OutputEmitterRef<{ limit: number; attempted: D }> =
    output<{ limit: number; attempted: D }>();

  /** Fires whenever `selectedPresetId` changes. Phase 12 wires it. */
  readonly presetChange: OutputEmitterRef<string | null> = output<string | null>();

  /** Fires on view transitions. `reason` distinguishes drill-down / drill-up / user button / programmatic. */
  readonly viewChange: OutputEmitterRef<ViewChangeEvent> = output<ViewChangeEvent>();

  /** Fires when keyboard or programmatic navigation moves the active cell. */
  readonly activeDateChange: OutputEmitterRef<D> = output<D>();

  /** Fires when the displayed month changes. */
  readonly monthChange: OutputEmitterRef<{ year: number; month: number }> =
    output<{ year: number; month: number }>();

  /** Fires when the displayed year changes (month/year-view navigation, year-page scroll). */
  readonly yearChange: OutputEmitterRef<{ year: number }> = output<{ year: number }>();

  /** Fires when the overlay opens (Phase 10). */
  readonly opened: OutputEmitterRef<void> = output<void>();

  /** Fires when the overlay closes (Phase 10). */
  readonly closed: OutputEmitterRef<void> = output<void>();

  /** Analytics-only cell click event. Does NOT indicate a selection — subscribe to `valueChange` for that. */
  readonly cellClick: OutputEmitterRef<{ date: D; event: PointerEvent }> =
    output<{ date: D; event: PointerEvent }>();

  /** Analytics-only cell hover event. */
  readonly cellHover: OutputEmitterRef<{ date: D }> = output<{ date: D }>();

  /** Fires when the responsive pane count resolves to a new value (Phase 9). */
  readonly renderedMonthsCount: OutputEmitterRef<number> = output<number>();

  /** Fires when `mode` changes at runtime — after `selectionCleared` and before `valueChange` (§11.2). */
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

  /** Screen-reader live region text. */
  readonly liveAnnouncement: WritableSignal<string> = signal('');

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

  /** @internal Dev-mode warning guard so each mismatched write warns only once per instance. */
  private _warnedShapeMismatch = false;

  /** @internal Set by `writeValue`; read by the `FormResetEvent` handler so it can emit `selectionCleared({reason: 'reset'})` only when a non-empty value was on the control before the reset cleared it. */
  private _hadValueBeforeLastWrite = false;

  constructor() {
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

    // Re-run validation whenever mode or the rejected-write marker changes so
    // the `calendarRequired` / `calendarInvalidValue` codes stay in sync.
    effect(() => {
      this.mode();
      this._lastInvalidFormValue();
      untracked(() => this.validatorOnChange());
    });

    // Push the resolved locale into the date adapter so `Intl.DateTimeFormat`
    // calls (month/weekday names, format()) align with `LOCALE_ID` or the
    // per-instance `locale` override (§19.1).
    effect(() => {
      const locale = this.effectiveLocale();
      untracked(() => this.dateAdapter.setLocale(locale));
    });
  }

  ngOnInit(): void {
    // Reset detection per §6.5 — `FormControl.reset()` emits a dedicated
    // `FormResetEvent` on its events stream (and parent `FormGroup.reset()`
    // cascades via each child's `reset()`). Subscribing here is stable across
    // Reactive, Template-driven, and Signal Forms since they all flow through
    // the same `NgControl` wrapper.
    const ctrl = this.ngControl?.control;
    if (ctrl) {
      ctrl.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
        if (event instanceof FormResetEvent) {
          this.handleFormReset();
        }
      });
    }
  }

  /** @internal `ControlValueAccessor` — writes a value from a reactive / template-driven form. Wrong-shape writes preserve the prior value per §7.2. */
  writeValue(incoming: unknown): void {
    this._hadValueBeforeLastWrite = !this.isEmpty(this.value());
    const mode = this.mode() as M;

    if (incoming === null || incoming === undefined) {
      const empty = emptyCalendarValue<M, D>(mode);
      this.value.set(empty);
      this._selectionState.set('EMPTY');
      this.internalDraftValue.set(null);
      if (this._lastInvalidFormValue() !== null) {
        this._lastInvalidFormValue.set(null);
        this.validatorOnChange();
      }
      return;
    }

    if (!this.matchesModeShape(mode, incoming)) {
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

    const normalized = incoming as CalendarValue<M, D>;
    this.value.set(normalized);
    this._selectionState.set(this.deriveSelectionState(normalized));
    this.internalDraftValue.set(null);
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

  /** @internal `Validator` — runs the Phase 3 validator (§10.2 codes: `calendarRequired`, `calendarInvalidValue`). Phase 4 extends with constraint codes. */
  validate(control: AbstractControl): ValidationErrors | null {
    const ctx = {
      mode: this.mode() as M,
      lastInvalidFormValue: this._lastInvalidFormValue(),
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

  /** `true` when `value` matches the shape expected for `mode`. `null` / `undefined` is handled upstream. */
  private matchesModeShape(mode: CalendarMode, value: unknown): boolean {
    if (mode === 'single') {
      if (Array.isArray(value)) return false;
      if (typeof value === 'object' && value !== null) {
        const r = value as Record<string, unknown>;
        if ('start' in r && 'end' in r) return false;
      }
      return true;
    }
    if (mode === 'multiple') {
      return Array.isArray(value);
    }
    // range
    if (typeof value !== 'object' || value === null) return false;
    if (Array.isArray(value)) return false;
    const range = value as Record<string, unknown>;
    return 'start' in range && 'end' in range;
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

  /** Auto-defaults to 2 when mode is `'range'`. */
  readonly effectiveMonthColumns: Signal<number> = computed(() => {
    const explicit = this.monthColumns();
    if (explicit !== 1) return explicit;
    if (this.mode() === 'range') return 2;
    return 1;
  });

  /** Secondary anchor for the right-hand grid in multi-column mode. */
  readonly secondaryActiveDate: Signal<D | null> = computed(() => {
    if (this.effectiveMonthColumns() < 2) return null;
    return this.dateAdapter.addMonths(this._activeDate(), 1);
  });

  /**
   * Preview range. Driven by the strategy and either the pointer hover or the in-flight draft.
   * Phase 4 will extend this with the `invalidPreview` flag.
   */
  readonly previewRange: Signal<DateRange<D> | null> = computed(() => {
    const strategy = this.selectionStrategy();
    const hovered = this._hoveredDate();
    const source = this.strategySelection();
    return strategy.createPreview(hovered, source);
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
    const minDate = this.minDate();
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
    const maxDate = this.maxDate();
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
    const clamped = this.dateAdapter.clampDate(date, this.minDate(), this.maxDate());
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
    const clamped = this.dateAdapter.clampDate(date, this.minDate(), this.maxDate());
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
    const had = !this.isEmpty(this.value());
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
        invalidPreview: false, // Phase 4 will set this from disabled-crossing / length rules.
      });
    }
  }

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
  // Range state machine (orchestrator-owned; Phase 6 refines the full §21 matrix)
  // ---------------------------------------------------------------------------

  private commitRangeClick(date: D): void {
    const draft = this.internalDraftValue();
    const state = this._selectionState();

    // 1st click in EMPTY or after a COMPLETE (the restart case — default rangeClickBehavior='restart').
    if (state !== 'SELECTING' || !draft) {
      this.internalDraftValue.set({ start: date });
      this._selectionState.set('SELECTING');
      if (state === 'COMPLETE') {
        // §8.3 COMPLETE → SELECTING 'restart' row.
        this.selectionRestart.emit({ start: date });
      } else {
        this.selectionStart.emit({ start: date });
      }
      return;
    }

    // 2nd click (SELECTING + draft): commit the range. Auto-swap on backward.
    const start = draft.start;
    const cmp = this.dateAdapter.compare(date, start);
    let rangeStart: D;
    let rangeEnd: D;
    let reason: SelectionCompleteEvent<M, D>['reason'] = 'commit';
    if (cmp < 0) {
      rangeStart = date;
      rangeEnd = start;
      reason = 'auto-swap';
    } else {
      rangeStart = start;
      rangeEnd = date;
    }
    const committed = { start: rangeStart, end: rangeEnd } as unknown as CalendarValue<M, D>;
    this.internalDraftValue.set(null);
    this.commitValue(committed, reason);
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

    if (this.isEmpty(this.value())) {
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
    const hadValue = !this.isEmpty(this.value());
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
    this.liveAnnouncement.set(intl.viewSwitched(this._viewState(), this.periodLabel()));
  }

  private announceNavigation(direction: 'previous' | 'next'): void {
    const intl = this.effectiveIntl();
    if (intl.skipAnnouncement) return;
    this.liveAnnouncement.set(intl.navigatedTo(direction, this.periodLabel()));
  }

  /** Derives selection state from a value shape. Used by `writeValue` to reconcile. */
  private deriveSelectionState(value: CalendarValue<M, D>): CalendarSelectionState {
    if (this.isEmpty(value)) return 'EMPTY';
    return 'COMPLETE';
  }

  /** `true` when `value` is the mode-specific empty. */
  private isEmpty(value: unknown): boolean {
    if (value == null) return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object' && 'start' in (value as object) && 'end' in (value as object)) {
      const r = value as { start: unknown; end: unknown };
      return r.start == null && r.end == null;
    }
    return false;
  }
}
