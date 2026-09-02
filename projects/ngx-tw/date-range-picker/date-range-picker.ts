import {
  afterNextRender,
  booleanAttribute,
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
  model,
  type OnInit,
  output,
  signal,
  type Signal,
  type TemplateRef,
  untracked,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import {
  type AbstractControl,
  type ControlValueAccessor,
  FormGroupDirective,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  NgControl,
  NgForm,
  type ValidationErrors,
  type Validator,
  Validators,
} from '@angular/forms';
import { Overlay } from '@angular/cdk/overlay';
import { FocusMonitor, LiveAnnouncer } from '@angular/cdk/a11y';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import { tv } from 'tailwind-variants';
import {
  buildSelectLikePositions,
  type ErrorStateMatcher,
  PickerOverlayCoordinator,
  type RangeBehaviorConfig,
  resolveSelectScrollStrategy,
  type TimePickerFormat,
  TW_ERROR_STATE_MATCHER,
  type TwColor,
  type TwFormSubmitted,
  type TwSize,
} from '@cdevhub/ngx-tw/core';
import {
  FormFieldControl,
  TW_FORM_FIELD,
  TW_FORM_FIELD_CONTROL,
} from '@cdevhub/ngx-tw/form-field';
import {
  calendarValidator,
  type CalendarCell,
  type CalendarValidationErrors,
  type DateClassFn,
  DATE_ADAPTER,
  type DateAdapter,
  type CalendarViewState,
  type DateFilterFn,
  type RangeClickBehavior,
  type TwDateRangeInput,
  TwDateRange,
} from '@cdevhub/ngx-tw/calendar';
import { DateRangePickerOverlayComponent } from './date-range-picker-overlay';

// ── Public types ──────────────────────────────────────────────────

/** Visual style of the date-range-picker trigger. */
export type DateRangePickerVariant = 'default' | 'naked';

/** How many months the overlay displays side-by-side. */
export type DateRangePickerMonths = 1 | 2;

/** Origin of a value change, used to distinguish user input from programmatic writes. */
export type DateRangePickerChangeSource =
  | 'calendar'
  | 'preset'
  | 'time'
  | 'apply'
  | 'clear'
  | 'programmatic';

/** Reason the overlay closed. */
export type DateRangePickerCloseReason =
  | 'select'
  | 'apply'
  | 'cancel'
  | 'escape'
  | 'backdrop'
  | 'programmatic';

/** Emitted by `rangeChange` after a committed value update. */
export interface DateRangePickerChangeEvent<D> {
  /** The committed range (`null` when cleared). */
  readonly value: TwDateRange<D> | null;
  /** The range before this change. */
  readonly previousValue: TwDateRange<D> | null;
  /** What triggered the change. */
  readonly source: DateRangePickerChangeSource;
}

/** Emitted by `opened`. */
export interface DateRangePickerOpenedEvent {
  /** The trigger element. */
  readonly trigger: HTMLElement;
}

/** A quick-select preset rendered in the overlay's preset list. */
export interface DateRangePreset<D = Date> {
  /** Label shown on the preset button. */
  readonly label: string;
  /** Factory returning the range to apply when this preset is chosen. Called fresh each click so "today"-relative presets stay current. */
  readonly range: () => TwDateRange<D>;
  /** Optional identifier — surfaced in `presetSelected` and used to detect the active preset for visual state. */
  readonly id?: string;
}

// ── Constants ─────────────────────────────────────────────────────

const DEFAULT_DISPLAY_FORMAT = {
  dateTimeFormat: { year: 'numeric', month: 'short', day: 'numeric' } as Intl.DateTimeFormatOptions,
};

// ── Helpers ───────────────────────────────────────────────────────

function rangesEqual<D>(
  a: TwDateRange<D> | null,
  b: TwDateRange<D> | null,
  adapter: DateAdapter<D>,
): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  const startEq =
    (a.start === null && b.start === null) ||
    (a.start !== null && b.start !== null && adapter.sameDate(a.start, b.start));
  const endEq =
    (a.end === null && b.end === null) ||
    (a.end !== null && b.end !== null && adapter.sameDate(a.end, b.end));
  return startEq && endEq;
}

// ── tv() config ───────────────────────────────────────────────────

const dateRangePickerVariants = tv(
  {
    slots: {
      root: 'relative inline-flex items-center w-full text-fg transition-[color,border-color,box-shadow] duration-normal motion-reduce:transition-none',
      // `self-stretch` so the trigger — the component's only interactive surface —
      // fills the pinned control height. Without it the button is exactly its line
      // box tall and everything above/below it inside the shell is dead click area
      // (up to 22px at xl).
      trigger:
        'flex-1 inline-flex items-center gap-2 min-w-0 self-stretch bg-transparent text-left text-fg outline-none border-0 p-0 m-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:cursor-not-allowed',
      startText: 'truncate',
      separator: 'shrink-0 text-fg-subtle',
      endText: 'truncate',
      placeholderText: 'text-fg-subtle truncate flex-1',
      triggerIconWrapper: 'inline-flex items-center justify-center shrink-0 text-fg-muted',
      triggerIcon:
        'shrink-0 text-fg-muted transition-colors duration-normal motion-reduce:transition-none',
      // size-6 (24×24 CSS px) is the WCAG AA minimum interactive target — bumping past size-5 keeps the affordance hittable without growing the inline row.
      // Held flat across every size. It fits the 30/34/42/46px content boxes at sm..xl. At xs the
      // pinned root is h-6 (24px border-box) so its content box is only 22px: the button is kept at
      // 24×24 anyway — docs/vertical-rhythm.md calls 24px a hard floor — and therefore coincides with
      // the root's *border*-box, overlapping the 1px border row top and bottom. The root's height is
      // unaffected (h-6 is a definite height); only the hover fill meets the border at that density.
      clearButton:
        'inline-flex items-center justify-center shrink-0 rounded-md text-fg-muted hover:text-fg hover:bg-surface-muted transition-colors duration-normal motion-reduce:transition-none size-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
    },
    variants: {
      size: {
        xs: {
          root: 'gap-1 text-xs',
          // size-3.5 (14px) is a permitted half-step decorative chevron for xs
          // density where neither size-3 nor size-4 lines up with adjacent text.
          triggerIcon: 'size-3.5',
        },
        sm: {
          root: 'gap-1.5 text-sm',
          triggerIcon: 'size-4',
        },
        md: {
          root: 'gap-2 text-sm',
          triggerIcon: 'size-4',
        },
        lg: {
          root: 'gap-2 text-base',
          triggerIcon: 'size-5',
        },
        xl: {
          root: 'gap-2 text-base',
          triggerIcon: 'size-5',
        },
      },
      variant: {
        default: {
          // No `py-*`: the height is pinned per size in compoundVariants below.
          // See docs/vertical-rhythm.md §3 — padding and a pinned height fight,
          // and under border-box the taller one silently wins.
          root: 'rounded-md border border-border bg-surface px-3 hover:border-border-strong',
        },
        naked: {
          root: 'bg-transparent border-0 rounded-none p-0 focus-within:outline-none',
        },
      },
      open: { true: { triggerIcon: 'text-fg' }, false: {} },
      disabled: {
        true: { root: 'opacity-50 pointer-events-none cursor-not-allowed' },
        false: {},
      },
      focused: { true: {}, false: {} },
      errorState: { true: {}, false: {} },
      color: {
        primary: {},
        secondary: {},
        accent: {},
        neutral: {},
        info: {},
        success: {},
        warning: {},
        error: {},
      },
    },
    compoundVariants: [
      // ── Pinned control height (docs/vertical-rhythm.md §1) ──
      // Only the `default` variant carries a height. `naked` means somebody else
      // owns the box — `<tw-form-field>` auto-nakeds this picker and supplies its
      // own bordered, padded controlWrapper, so pinning naked would stack 36px on
      // top of the form-field's `py-2` and inflate a wrapped picker at every size.
      { variant: 'default', size: 'xs', class: { root: 'h-6' } },
      { variant: 'default', size: 'sm', class: { root: 'h-8' } },
      { variant: 'default', size: 'md', class: { root: 'h-9' } },
      { variant: 'default', size: 'lg', class: { root: 'h-11' } },
      { variant: 'default', size: 'xl', class: { root: 'h-12' } },

      { variant: 'default', focused: true, color: 'primary', class: { root: 'border-primary-500' } },
      { variant: 'default', focused: true, color: 'secondary', class: { root: 'border-secondary-500' } },
      { variant: 'default', focused: true, color: 'accent', class: { root: 'border-accent-500' } },
      { variant: 'default', focused: true, color: 'neutral', class: { root: 'border-border-strong' } },
      { variant: 'default', focused: true, color: 'info', class: { root: 'border-info-500' } },
      { variant: 'default', focused: true, color: 'success', class: { root: 'border-success-500' } },
      { variant: 'default', focused: true, color: 'warning', class: { root: 'border-warning-500' } },
      { variant: 'default', focused: true, color: 'error', class: { root: 'border-error-500' } },
      { variant: 'default', errorState: true, class: { root: 'border-error-500' } },
    ],
    defaultVariants: {
      size: 'md',
      variant: 'default',
      open: false,
      disabled: false,
      errorState: false,
      focused: false,
      color: 'primary',
    },
  },
  { twMerge: true },
);

// ── ID generator ──────────────────────────────────────────────────

let nextDateRangePickerId = 0;

/**
 * ARIA date-picker dialog for two-endpoint date ranges. Composes `tw-calendar`
 * in `selectionMode="range"` inside a CDK overlay. Supports optional time
 * selection via embedded `tw-time-picker`s and optional quick-select presets.
 *
 * All three Angular forms strategies (reactive, template-driven, signal-forms)
 * are supported via `ControlValueAccessor`, and the component integrates with
 * `<tw-form-field>` by implementing `FormFieldControl`.
 *
 * All date operations go through the injected `DateAdapter<D>`; call
 * `provideNativeDateAdapter()` in your app providers to bootstrap the default.
 */
@Component({
  selector: 'tw-date-range-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TW_FORM_FIELD_CONTROL,
      useExisting: forwardRef(() => DateRangePickerComponent),
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DateRangePickerComponent),
      multi: true,
    },
    // Angular v22 routes a CVA component's own NG_VALIDATORS through the
    // value-accessor channel. The runtime `ngControl.valueAccessor = this`
    // assignment below happens too late for that wiring, so `validate()` is
    // never invoked and every calendar error code silently disappears. The
    // static provider is what registers this component on the channel in time.
    // Mirrors `calendar.ts`, which has always provided both tokens.
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateRangePickerComponent),
      multi: true,
    },
    PickerOverlayCoordinator,
  ],
  template: `
    <button
      #trigger
      type="button"
      [id]="hostId"
      [class]="triggerClasses()"
      [attr.role]="'combobox'"
      [attr.aria-haspopup]="'dialog'"
      [attr.aria-expanded]="open() ? 'true' : 'false'"
      [attr.aria-controls]="dialogId"
      [attr.aria-label]="triggerAccessibleName() || null"
      [attr.aria-labelledby]="ariaLabelledby() || null"
      [attr.aria-describedby]="describedBy() || null"
      [attr.aria-required]="requiredInput() || null"
      [attr.aria-invalid]="errorState() || null"
      [attr.aria-disabled]="isDisabled() || null"
      [attr.data-variant]="resolvedVariant()"
      [disabled]="isDisabled()"
      (click)="onTriggerClick()"
      (keydown)="onTriggerKeydown($event)"
    >
      <span class="flex-1 inline-flex items-center gap-2 min-w-0">
        @if (internalValue() !== null) {
          <span [class]="startTextClasses()">{{ startDisplay() }}</span>
          <span [class]="separatorClasses()">{{ rangeSeparator() }}</span>
          <span [class]="endTextClasses()">{{ endDisplay() }}</span>
        } @else {
          <span [class]="placeholderClasses()">{{ placeholderDisplay() }}</span>
        }
      </span>

      <span [class]="triggerIconWrapperClasses()">
        <ng-content select="[slot=trigger-icon]">
          <svg
            [class]="triggerIconClasses()"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </ng-content>
      </span>
    </button>

    @if (showClear() && !isEmpty() && !isDisabled()) {
      <button
        type="button"
        tabindex="-1"
        [class]="clearButtonClasses()"
        [attr.aria-label]="clearAriaLabel()"
        (click)="onClearClick($event)"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="size-3">
          <path
            fill-rule="evenodd"
            d="M10 8.586 4.707 3.293a1 1 0 0 0-1.414 1.414L8.586 10l-5.293 5.293a1 1 0 1 0 1.414 1.414L10 11.414l5.293 5.293a1 1 0 0 0 1.414-1.414L11.414 10l5.293-5.293a1 1 0 0 0-1.414-1.414L10 8.586Z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    }
  `,
  host: {
    '[class]': 'rootClasses()',
  },
})
export class DateRangePickerComponent<D = Date>
  extends FormFieldControl<TwDateRange<D>>
  implements ControlValueAccessor, Validator, OnInit
{
  // ── Inputs ──

  /** Id on the trigger element. Auto-generated when not provided. Used by the form-field's `<label for>` attribute. */
  readonly idInput = input<string | undefined>(undefined, { alias: 'id' });

  /** Earliest selectable date for either endpoint. Presets and calendar cells earlier than this are rejected or disabled. Defaults to `null`. */
  readonly minDate = input<D | null>(null);

  /** Latest selectable date for either endpoint. Presets and calendar cells later than this are rejected or disabled. Defaults to `null`. */
  readonly maxDate = input<D | null>(null);

  /** Per-date predicate — return `false` to disable. Applied in both calendars. Presets that fall on a filtered date are skipped. Defaults to `null`. */
  readonly dateFilter = input<DateFilterFn<D> | null>(null);

  /** Which calendar view opens first — `'day'`, `'month'`, or `'year'`. Defaults to `'day'`. */
  readonly startView = input<CalendarViewState>('day');

  /** Date the left calendar focuses on when opened with no value. Falls back to today. Ignored when a value is already set. Defaults to `null`. */
  readonly startAt = input<D | null>(null);

  /** Display format for each endpoint, passed to `DateAdapter.format()`. When `showTime` is true and this is left at the default, hour/minute (and optional seconds) are folded in automatically. */
  readonly format = input<unknown>(DEFAULT_DISPLAY_FORMAT);

  /** Separator rendered between the two formatted endpoints in the trigger. Defaults to `" – "`. */
  readonly rangeSeparator = input<string>(' – ');

  /** Placeholder text shown in the trigger for an empty `start` endpoint. Defaults to `'Start date'`. */
  readonly emptyStartLabel = input<string>('Start date');

  /** Placeholder text shown in the trigger for an empty `end` endpoint. Defaults to `'End date'`. */
  readonly emptyEndLabel = input<string>('End date');

  /** When set, overrides the composed `${emptyStartLabel}${rangeSeparator}${emptyEndLabel}` placeholder with a single string. Defaults to `undefined`. */
  readonly placeholder = input<string | undefined>(undefined);

  /** When true, the trigger cannot open the overlay and `aria-disabled="true"` is set. Defaults to `false`. */
  readonly disabledInput = input<boolean, unknown>(false, {
    alias: 'disabled',
    transform: booleanAttribute,
  });

  /** When true, exposes `aria-required="true"`. `Validators.required` on a bound `NgControl` is also honoured. Defaults to `false`. */
  readonly requiredInput = input<boolean, unknown>(false, {
    alias: 'required',
    transform: booleanAttribute,
  });

  /** Trigger padding, font size, and calendar cell density. Uses the shared `TwSize` scale. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** Semantic color for focused border, calendar range fill, and preset active state. Defaults to `'primary'`. */
  readonly color = input<TwColor>('primary');

  /** Visual style of the trigger. `'default'` draws its own border; `'naked'` strips chrome so a parent (e.g. `tw-form-field`) owns it. Auto-resolves to `'naked'` when inside a form-field; otherwise `'default'`. */
  readonly variant = input<DateRangePickerVariant | undefined>(undefined);

  /** How many months the overlay shows side-by-side. `2` is the standard range-picker layout; use `1` for compact contexts. Defaults to `2`. */
  readonly numberOfMonths = input<DateRangePickerMonths>(2);

  /** Optional quick-select presets rendered as a vertical list before the calendars. Each preset provides a label and a factory returning a `TwDateRange<D>`. An empty array hides the preset panel. Defaults to an empty array. */
  readonly presets = input<readonly DateRangePreset<D>[]>([]);

  /** Whether to show a clear-button affordance inside the trigger when a value is set. Defaults to `true`. */
  // TRUE-default: a picker without a clear affordance forces consumers to wire one — most form pickers expect the inline clear, matching `<tw-input>`'s clear button.
  readonly showClear = input<boolean>(true);

  /** Minimum range length in days, inclusive. Commits shorter than this are rejected and surface `calendarRangeTooShort` on the bound `NgControl`. `null` = no minimum. Defaults to `null`. */
  readonly minRangeLength = input<number | null>(null);

  /** Maximum range length in days, inclusive. Commits longer than this are rejected and surface `calendarRangeTooLong` on the bound `NgControl`. `null` = no maximum. Defaults to `null`. */
  readonly maxRangeLength = input<number | null>(null);

  /**
   * Range-mode behavior knobs forwarded to the embedded calendar. Accepts a
   * partial config — unset fields use the documented defaults on
   * `RangeBehaviorConfig`. Defaults: `{ allowSingleDayRange: true, persistPartialRange: true, allowBackwardRange: false, disableRangesCrossingDisabledDates: false }`.
   */
  readonly rangeBehavior = input<Partial<RangeBehaviorConfig>>({});

  /** How the embedded calendar reacts to a click after a complete range. `'restart'` (default) starts a fresh draft; `'nearest-edge'` moves the nearer endpoint; `'require-clear'` blocks until cleared. */
  readonly rangeClickBehavior = input<RangeClickBehavior>('restart');

  /** Override first day of week (0=Sun, 1=Mon) on the embedded calendar. Falls back to the adapter's default. */
  readonly firstDayOfWeek = input<number | null>(null);

  /** Per-instance locale override. Forwarded to the embedded calendar and the underlying `DateAdapter` so the trigger display tracks the picker's locale. Falls back to Angular `LOCALE_ID` when `null`. Defaults to `null`. */
  readonly locale = input<string | null>(null);

  /** Function producing per-cell CSS classes on the embedded calendar. Defaults to `null`. */
  readonly dateClass = input<DateClassFn<D> | null>(null);

  /** Optional cell-content template, forwarded to the embedded calendar. Use to customize cell visuals beyond `dateClass`. Defaults to `null`. */
  readonly cellTemplate = input<TemplateRef<{ $implicit: CalendarCell<D> }> | null>(null);

  /** When true, renders a `Today / Clear / Cancel / Apply` action bar at the bottom of the overlay. The calendar commits on the second click by default — turn this on for touch-heavy contexts. Defaults to `false`. */
  readonly showActions = input<boolean>(false);

  /** When true, the overlay renders two `<tw-time-picker>` instances so users can pick times for the start and end of the range. Defaults to `false`. */
  readonly showTime = input<boolean>(false);

  /** Format of the embedded time-pickers. `'24h'` renders 00–23; `'12h'` adds an AM/PM toggle. Defaults to `'24h'`. */
  readonly timeFormat = input<TimePickerFormat>('24h');

  /** Whether the embedded time-pickers expose a seconds field. Defaults to `false`. */
  readonly showSeconds = input<boolean>(false);

  /** Step for the embedded time-pickers' hour fields. Defaults to `1`. */
  readonly hourStep = input<number>(1);

  /** Step for the embedded time-pickers' minute fields. Defaults to `1`. */
  readonly minuteStep = input<number>(1);

  /** Step for the embedded time-pickers' second fields. Defaults to `1`. */
  readonly secondStep = input<number>(1);

  /** Label for the `Today` action in the overlay's action bar. Defaults to `'Today'`. */
  readonly todayLabel = input<string>('Today');

  /** Label for the `Clear` action in the overlay's action bar. Defaults to `'Clear'`. */
  readonly clearLabel = input<string>('Clear');

  /** Label for the `Cancel` action in the overlay's action bar. Defaults to `'Cancel'`. */
  readonly cancelLabel = input<string>('Cancel');

  /** Label for the `Apply` action in the overlay's action bar. Defaults to `'Apply'`. */
  readonly applyLabel = input<string>('Apply');

  /** Extra class(es) applied to the overlay panel element. `twMerge` resolves conflicts with internal classes. Defaults to an empty string. */
  readonly panelClass = input<string | readonly string[]>('');

  /** CDK scroll strategy for the overlay. Defaults to `'reposition'`. */
  readonly scrollStrategy = input<'reposition' | 'close' | 'block'>('reposition');

  /** Pixel distance between trigger and overlay. Defaults to `4`. */
  readonly offset = input<number>(4);

  /** Accessible label for the clear button. Defaults to `'Clear date range'`. */
  readonly clearAriaLabel = input<string>('Clear date range');

  /** Per-instance override of the `ErrorStateMatcher`. When omitted, uses the injected `TW_ERROR_STATE_MATCHER`. Defaults to `undefined`. */
  readonly errorStateMatcher = input<ErrorStateMatcher | undefined>(undefined);

  /** Accessible name for the trigger. Required when no visible label is supplied via `tw-form-field` or an external `aria-labelledby`. Alias: `aria-label`. Defaults to `undefined`. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  /** ID of an external element that labels the trigger. Alias: `aria-labelledby`. Defaults to `undefined`. */
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  /** Consumer-supplied `aria-describedby` ids. The form-field preserves these when merging hint/error ids. Alias: `aria-describedby`. Defaults to `undefined`. */
  readonly userAriaDescribedByInput = input<string | undefined>(undefined, {
    alias: 'aria-describedby',
  });

  // ── Models (two-way) ──

  /** Two-way bound selected range. `null` when no selection. Setting programmatically updates the trigger display and the calendar selection; it does NOT trigger `onChange`. Defaults to `null`. */
  readonly value = model<TwDateRange<D> | null>(null);

  /** Two-way bound open state of the overlay. Setting to `true` opens; setting to `false` closes. Defaults to `false`. */
  readonly open = model(false);

  // ── Outputs ──

  /** Fires after the overlay's enter animation completes. Payload is the trigger element. */
  readonly opened = output<DateRangePickerOpenedEvent>();

  /** Fires after the overlay's leave animation completes. Payload is the reason it closed. */
  readonly closed = output<DateRangePickerCloseReason>();

  /** Fires after a commit — either from completing a range in the calendar, picking a preset, or applying via the action bar. */
  readonly rangeChange = output<DateRangePickerChangeEvent<D>>();

  /** Fires when the user picks a preset from the list. Payload is the preset descriptor. Fires in addition to `rangeChange`. */
  readonly presetSelected = output<DateRangePreset<D>>();

  // ── Injected deps ──

  private readonly adapter = inject<DateAdapter<D>>(DATE_ADAPTER);
  private readonly overlayService = inject(Overlay);
  private readonly focusMonitor = inject(FocusMonitor);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly coordinator = inject(PickerOverlayCoordinator);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formField = inject(TW_FORM_FIELD, { optional: true });
  // Lazy NgControl lookup avoids the construction-time cycle with NG_VALIDATORS
  // (the host registers itself as a validator via `useExisting`, and NgModel's
  // constructor pulls the validator set — eager `inject(NgControl, {self})`
  // would resolve to this component while it is still being created).
  private ngControl: NgControl | null = null;
  private readonly parentForm = inject(NgForm, { optional: true });
  private readonly parentFormGroup = inject(FormGroupDirective, { optional: true });
  private readonly defaultMatcher = inject(TW_ERROR_STATE_MATCHER);

  // ── View refs ──

  private readonly triggerRef = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  // ── Identity ──

  private readonly uid = nextDateRangePickerId++;
  /** @internal */
  readonly hostId = `tw-date-range-picker-${this.uid}`;
  /** @internal */
  readonly dialogId = `${this.hostId}-dialog`;

  // ── Internal state ──

  /** @internal Decouples programmatic writes from user commits. */
  readonly internalValue = linkedSignal<TwDateRange<D> | null>(() => this.value());
  /** @internal */
  readonly parseError = signal(false);
  /** @internal */
  readonly rangeError = signal(false);
  /** @internal */
  readonly focusedSignal = signal(false);

  private readonly cvaDisabled = signal(false);
  private readonly describedByIdsSignal = signal<readonly string[]>([]);
  private readonly lastValueBeforeOpen = signal<TwDateRange<D> | null>(null);
  private readonly pendingRange = signal<TwDateRange<D> | null>(null);
  private readonly currentView = signal<CalendarViewState>('day');
  private readonly _ngControlRev = signal(0);
  private readonly _formSubmitRev = signal(0);

  private onChange: (value: TwDateRange<D> | null) => void = () => {};
  private onTouched: () => void = () => {};

  // Overlay lifecycle bookkeeping. Both are PLAIN FIELDS, not signals, and that
  // is load-bearing: the lifecycle effect in the constructor both reads and
  // writes them, so as signals they would form a read → write → re-trigger
  // cycle of exactly the shape CLAUDE.md forbids. Demoting them is the fix
  // `popover.ts` and `command-palette.ts` already use — see the comment on that
  // effect. Do not promote either back to `signal()`.
  private overlayInstance: DateRangePickerOverlayComponent<D> | null = null;
  private closing = false;

  // The one piece of overlay state that must stay a signal: it is the *only*
  // dependency that re-runs the overlay state-push effect when the panel
  // attaches. Written in openOverlay / closeOverlay, never read by the
  // lifecycle effect, so it cannot cycle. Mirrors `command-palette.ts`.
  private readonly isAttached = signal(false);

  // ── Derived state ──

  /** @internal */
  readonly isDisabled = computed(() => {
    this._ngControlRev();
    return this.disabledInput() || this.cvaDisabled() || !!this.ngControl?.disabled;
  });

  /** @internal Effective variant — auto-naked when wrapped in tw-form-field. */
  readonly resolvedVariant = computed<DateRangePickerVariant>(
    () => this.variant() ?? (this.formField ? 'naked' : 'default'),
  );

  /** @internal */
  readonly isEmpty = computed(() => {
    const v = this.internalValue();
    return v === null || (v.start === null && v.end === null);
  });

  /** @internal Effective display format — folds hour/minute (and optional seconds) into the default when `showTime` is on and the user hasn't overridden `format`. */
  readonly effectiveFormat = computed<unknown>(() => {
    const fmt = this.format();
    if (!this.showTime() || fmt !== DEFAULT_DISPLAY_FORMAT) return fmt;
    const hour12 = this.timeFormat() === '12h';
    const base: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12,
    };
    if (this.showSeconds()) base.second = '2-digit';
    return { dateTimeFormat: base };
  });

  /** @internal */
  readonly startDisplay = computed(() => {
    const v = this.internalValue();
    if (v === null) return '';
    return v.start !== null
      ? this.adapter.format(v.start, this.effectiveFormat())
      : this.emptyStartLabel();
  });

  /** @internal */
  readonly endDisplay = computed(() => {
    const v = this.internalValue();
    if (v === null) return '';
    return v.end !== null
      ? this.adapter.format(v.end, this.effectiveFormat())
      : this.emptyEndLabel();
  });

  /** @internal */
  readonly placeholderDisplay = computed(() => {
    const custom = this.placeholder();
    if (custom) return custom;
    return `${this.emptyStartLabel()}${this.rangeSeparator()}${this.emptyEndLabel()}`;
  });

  /** @internal Accessible name composed from explicit aria-label plus the current range. */
  readonly triggerAccessibleName = computed<string | undefined>(() => {
    const label = this.ariaLabel();
    if (this.ariaLabelledby()) return undefined;
    const v = this.internalValue();
    if (label && v !== null && v.start !== null && v.end !== null) {
      const start = this.adapter.format(v.start, this.effectiveFormat());
      const end = this.adapter.format(v.end, this.effectiveFormat());
      return `${label}. Current range: ${start} to ${end}.`;
    }
    if (label) return label;
    return undefined;
  });

  /** @internal */
  readonly activePresetId = computed<string | undefined>(() => {
    const v = this.internalValue();
    if (v === null) return undefined;
    for (const preset of this.presets()) {
      if (!preset.id) continue;
      let candidate: TwDateRange<D>;
      try {
        candidate = preset.range();
      } catch {
        continue;
      }
      if (rangesEqual(candidate, v, this.adapter)) return preset.id;
    }
    return undefined;
  });

  /** @internal */
  readonly describedBy = computed(() => {
    const extra = this.describedByIdsSignal();
    const user = this.userAriaDescribedByInput();
    const merged = [...extra];
    if (user) {
      for (const id of user.split(/\s+/)) {
        if (id) merged.push(id);
      }
    }
    return merged.length ? merged.join(' ') : '';
  });

  // ── tv() output ──

  private readonly variantResult = computed(() =>
    dateRangePickerVariants({
      size: this.size(),
      variant: this.resolvedVariant(),
      open: this.open(),
      disabled: this.isDisabled(),
      errorState: this.errorState(),
      focused: this.focusedSignal(),
      color: this.color(),
    }),
  );

  /** @internal */
  readonly rootClasses = computed(() => this.variantResult().root());
  /** @internal */
  readonly triggerClasses = computed(() => this.variantResult().trigger());
  /** @internal */
  readonly startTextClasses = computed(() => this.variantResult().startText());
  /** @internal */
  readonly separatorClasses = computed(() => this.variantResult().separator());
  /** @internal */
  readonly endTextClasses = computed(() => this.variantResult().endText());
  /** @internal */
  readonly placeholderClasses = computed(() => this.variantResult().placeholderText());
  /** @internal */
  readonly triggerIconClasses = computed(() => this.variantResult().triggerIcon());
  /** @internal */
  readonly triggerIconWrapperClasses = computed(() => this.variantResult().triggerIconWrapper());
  /** @internal */
  readonly clearButtonClasses = computed(() => this.variantResult().clearButton());

  // ── FormFieldControl impl ──

  /** @internal */
  readonly id: Signal<string> = computed(() => this.idInput() ?? this.hostId);
  /** @internal */
  readonly focused: Signal<boolean> = this.focusedSignal.asReadonly();
  /** @internal */
  readonly empty: Signal<boolean> = this.isEmpty;
  /** @internal */
  readonly disabled: Signal<boolean> = this.isDisabled;
  /** @internal */
  readonly required: Signal<boolean> = computed(() => {
    this._ngControlRev();
    if (this.requiredInput()) return true;
    return !!this.ngControl?.control?.hasValidator(Validators.required);
  });

  /** @internal */
  readonly errorState: Signal<boolean> = computed(() => {
    this._ngControlRev();
    this._formSubmitRev();
    this.focusedSignal();
    if (this.parseError() || this.rangeError()) return true;
    const matcher = this.errorStateMatcher() ?? this.defaultMatcher;
    const form: TwFormSubmitted | null =
      (this.parentFormGroup as TwFormSubmitted | null) ??
      (this.parentForm as TwFormSubmitted | null);
    return matcher.isErrorState(this.ngControl?.control ?? null, form);
  });

  /** @internal */
  readonly controlType = 'date-range-picker';
  /** @internal */
  readonly userAriaDescribedBy: Signal<string | undefined> = computed(() =>
    this.userAriaDescribedByInput(),
  );

  // ── Constructor ──

  constructor() {
    super();

    // Mirror the `open` model into the overlay lifecycle.
    //
    // The only tracked reads here are `open()` and `isDisabled()`. Everything
    // this effect *writes* — `overlayInstance`, `closing` — is a plain field,
    // never a signal, so opening or closing cannot re-trigger the effect that
    // ordered it. That is the whole reason those two are declared as fields
    // (see their declaration); promoting either back to `signal()` recreates
    // the read → write → re-trigger cycle CLAUDE.md forbids.
    //
    // `openOverlay()` / `closeOverlay()` do write `isAttached`, but this effect
    // never reads it, so that write is a one-way hand-off to the state-push
    // effect below and terminates there.
    //
    // The body is wrapped in `untracked()` because demoting the two fields is
    // NOT sufficient on its own. `openOverlay()` reads roughly twenty-five
    // inputs while pushing them into the freshly attached panel, and it writes
    // two signals it then reads straight back. Called from the tracked phase,
    // every one of those reads becomes a dependency of THIS effect, which both
    // recreates the forbidden write-then-read-back shape and re-runs the whole
    // lifecycle on any of those twenty-five inputs changing. Tracked reads are
    // now exactly `open()` and `isDisabled()`, which is what the paragraph
    // above claims — and only now true.
    effect(() => {
      const shouldOpen = this.open();
      const disabled = this.isDisabled();
      untracked(() => {
        if (disabled && this.overlayInstance) {
          this.closeOverlay('programmatic');
          return;
        }
        if (shouldOpen && !this.overlayInstance && !disabled && !this.closing) {
          this.openOverlay();
        } else if (!shouldOpen && this.overlayInstance && !this.closing) {
          this.closeOverlay('programmatic');
        }
      });
    });

    // Push config into the overlay whenever anything relevant changes.
    // Reads happen in the tracked phase; writes to the overlay instance are
    // wrapped in `untracked()` so they never feed back into this effect.
    //
    // `isAttached()` MUST be read first and unconditionally: it is this
    // effect's only dependency on the overlay's existence, so it is what makes
    // the initial push happen when the panel attaches (`overlayInstance` is a
    // plain field and is invisible to the signal graph). Do not reorder it
    // behind the null check — the effect would then never re-run on open.
    effect(() => {
      this.isAttached();
      const instance = this.overlayInstance;
      if (!instance) return;
      const size = this.size();
      const color = this.color();
      const minDate = this.minDate();
      const maxDate = this.maxDate();
      const dateFilter = this.dateFilter();
      const startView = this.startView();
      const numberOfMonths = this.numberOfMonths();
      const pendingRange = this.pendingRange();
      const currentView = this.currentView();
      const presets = this.presets();
      const activePresetId = this.activePresetId();
      const showActions = this.showActions();
      const showTime = this.showTime();
      const timeFormat = this.timeFormat();
      const showSeconds = this.showSeconds();
      const hourStep = this.hourStep();
      const minuteStep = this.minuteStep();
      const secondStep = this.secondStep();
      const todayLabel = this.todayLabel();
      const clearLabel = this.clearLabel();
      const cancelLabel = this.cancelLabel();
      const applyLabel = this.applyLabel();
      const rangeSeparator = this.rangeSeparator();
      const dialogAriaLabel = this.resolveDialogAriaLabel();
      const panelClassValue = this.resolvePanelClass();
      const minRangeLength = this.minRangeLength();
      const maxRangeLength = this.maxRangeLength();
      const rangeBehavior = this.rangeBehavior();
      const rangeClickBehavior = this.rangeClickBehavior();
      const firstDayOfWeek = this.firstDayOfWeek();
      const locale = this.locale();
      const dateClass = this.dateClass();
      const cellTemplate = this.cellTemplate();
      untracked(() => {
        instance.size.set(size);
        instance.color.set(color);
        instance.minDate.set(minDate);
        instance.maxDate.set(maxDate);
        instance.dateFilter.set(dateFilter);
        instance.startView.set(startView);
        instance.numberOfMonths.set(numberOfMonths);
        instance.pendingRange.set(pendingRange);
        instance.currentView.set(currentView);
        instance.presets.set(presets);
        instance.activePresetId.set(activePresetId);
        instance.showActions.set(showActions);
        instance.showTime.set(showTime);
        instance.timeFormat.set(timeFormat);
        instance.showSeconds.set(showSeconds);
        instance.hourStep.set(hourStep);
        instance.minuteStep.set(minuteStep);
        instance.secondStep.set(secondStep);
        instance.todayLabel.set(todayLabel);
        instance.clearLabel.set(clearLabel);
        instance.cancelLabel.set(cancelLabel);
        instance.applyLabel.set(applyLabel);
        instance.rangeSeparator.set(rangeSeparator);
        instance.dialogId.set(this.dialogId);
        instance.dialogAriaLabel.set(dialogAriaLabel);
        instance.panelClassValue.set(panelClassValue);
        instance.minRangeLength.set(minRangeLength);
        instance.maxRangeLength.set(maxRangeLength);
        instance.rangeBehavior.set(rangeBehavior);
        instance.rangeClickBehavior.set(rangeClickBehavior);
        instance.firstDayOfWeek.set(firstDayOfWeek);
        instance.locale.set(locale);
        instance.dateClass.set(dateClass);
        instance.cellTemplate.set(cellTemplate);
      });
    });

    // Push locale into the adapter so the trigger display tracks the picker's
    // locale; the calendar runs its own setLocale internally for its grid.
    effect(() => {
      const locale = this.locale();
      if (locale === null) return;
      untracked(() => this.adapter.setLocale(locale));
    });

    // Re-run validation whenever a constraint input changes so consumer
    // statusChanges fires (mirrors the calendar's pattern).
    effect(() => {
      this.minDate();
      this.maxDate();
      this.dateFilter();
      this.minRangeLength();
      this.maxRangeLength();
      untracked(() => this.validatorOnChange());
    });

    // Dev-mode accessible-name warning.
    afterNextRender(() => {
      if (!isDevMode()) return;
      const hasLabel =
        !!this.ariaLabel() ||
        !!this.ariaLabelledby() ||
        !!this.formField?.hasLabel();
      if (!hasLabel) {
        console.warn(
          '[tw-date-range-picker] The date-range-picker has no accessible name. Set aria-label, aria-labelledby, or wrap the component in a <tw-form-field> with a <label twLabel>.',
        );
      }
    });

    // Monitor focus on the host (descendants-aware so the overlay counts while open).
    const monitorSub = this.focusMonitor
      .monitor(this.elementRef, true)
      .subscribe((origin) => {
        const wasFocused = this.focusedSignal();
        this.focusedSignal.set(!!origin);
        if (wasFocused && !origin) {
          this.onTouched();
          this._ngControlRev.update((n) => n + 1);
        }
      });

    this.destroyRef.onDestroy(() => {
      monitorSub.unsubscribe();
      this.focusMonitor.stopMonitoring(this.elementRef);
      // The coordinator's own DestroyRef.onDestroy disposes the overlay and
      // clears its timers; we only need to drop the local instance reference.
      this.overlayInstance = null;
      this.isAttached.set(false);
    });
  }

  ngOnInit(): void {
    // Resolve the bound NgControl lazily (see field declaration). By the time
    // ngOnInit runs the host's FormControlName / NgModel is fully constructed.
    this.ngControl = this.injector.get(NgControl, null, {
      self: true,
      optional: true,
    });
    // Wire this component as the NgControl's value accessor.
    //
    // NOTE: this assignment is a belt-and-braces no-op in practice — the static
    // NG_VALUE_ACCESSOR provider above has already registered this component on
    // the value-accessor channel, which is what makes `validate()` run at all.
    // Do NOT read this as evidence the static provider is unnecessary and
    // remove it: dropping it silently disables every calendar error code, with
    // no test failure outside the guard spec. See the provider's own comment.
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
    const ctrl = this.ngControl?.control;
    if (ctrl) {
      const streams = [ctrl.statusChanges, ctrl.valueChanges].filter(
        (s): s is NonNullable<typeof s> => !!s,
      );
      if (streams.length) {
        merge(...streams)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this._ngControlRev.update((n) => n + 1));
      }
    }

    const submit = this.parentFormGroup?.ngSubmit ?? this.parentForm?.ngSubmit;
    if (submit) {
      submit
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this._formSubmitRev.update((n) => n + 1));
    }
  }

  // ── Public imperative API ──

  /** Opens the overlay. No-op when disabled or already open. */
  openPicker(): void {
    if (this.isDisabled() || this.open()) return;
    this.open.set(true);
  }

  /** Closes the overlay. No-op when already closed. */
  closePicker(): void {
    if (!this.open()) return;
    this.open.set(false);
  }

  /** Toggles the overlay's open state. */
  toggle(): void {
    if (this.open()) this.closePicker();
    else this.openPicker();
  }

  /** Clears the current range and emits `rangeChange` with `source: 'clear'`. */
  clear(): void {
    this.commit(null, 'clear');
  }

  // ── Trigger interactions ──

  /** @internal */
  onTriggerClick(): void {
    if (this.isDisabled()) return;
    this.toggle();
  }

  /** @internal */
  onTriggerKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    if (event.altKey && event.key === 'ArrowDown') {
      event.preventDefault();
      this.openPicker();
      return;
    }
    if (event.altKey && event.key === 'ArrowUp') {
      if (this.open()) {
        event.preventDefault();
        this.closeOverlay('cancel', /* restore */ true);
      }
      return;
    }
    if (event.key === 'Escape' && this.open()) {
      event.preventDefault();
      this.closeOverlay('escape', /* restore */ true);
    }
  }

  /** @internal */
  onClearClick(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.clear();
  }

  // ── Commit ──

  private commit(next: TwDateRange<D> | null, source: DateRangePickerChangeSource): void {
    const normalised = this.normalizeRange(next);
    const previous = this.internalValue();
    if (rangesEqual(normalised, previous, this.adapter) && source !== 'programmatic') {
      // No change from a user action — still mark as touched for CVA parity,
      // but skip onChange and the rangeChange emission.
      this.onTouched();
      return;
    }
    this.internalValue.set(normalised);
    this.value.set(normalised);
    this.parseError.set(false);
    this.rangeError.set(false);

    if (source !== 'programmatic') {
      this.onChange(normalised);
      this.onTouched();
      this.announce(normalised);
    }
    this.rangeChange.emit({ value: normalised, previousValue: previous, source });
  }

  private announce(value: TwDateRange<D> | null): void {
    if (value === null) {
      this.liveAnnouncer.announce('Date range cleared', 'polite');
      return;
    }
    const fmt = this.effectiveFormat();
    if (value.start !== null && value.end !== null) {
      const start = this.adapter.format(value.start, fmt);
      const end = this.adapter.format(value.end, fmt);
      this.liveAnnouncer.announce(`${start} to ${end} selected`, 'polite');
    } else if (value.start !== null) {
      const start = this.adapter.format(value.start, fmt);
      this.liveAnnouncer.announce(`${start} selected. Pick end date.`, 'polite');
    }
  }

  private normalizeRange(v: TwDateRange<D> | null): TwDateRange<D> | null {
    if (v === null) return null;
    if (v.start === null && v.end === null) return null;
    return v;
  }

  private clampRange(range: TwDateRange<D>): TwDateRange<D> {
    const min = this.minDate();
    const max = this.maxDate();
    const start = range.start !== null ? this.adapter.clampDate(range.start, min, max) : null;
    const end = range.end !== null ? this.adapter.clampDate(range.end, min, max) : null;
    return new TwDateRange<D>(start, end);
  }

  private isRangeValid(range: TwDateRange<D>): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    const filter = this.dateFilter();
    const endpoints = [range.start, range.end].filter((d): d is D => d !== null);
    for (const d of endpoints) {
      if (!this.adapter.isValid(d)) return false;
      if (min && this.adapter.compare(d, min) < 0) return false;
      if (max && this.adapter.compare(d, max) > 0) return false;
      if (filter && !filter(d)) return false;
    }
    // Same-day ranges with time mode: end time must not be earlier than start time.
    if (
      this.showTime() &&
      range.start !== null &&
      range.end !== null &&
      this.adapter.sameDate(range.start, range.end) &&
      this.adapter.compare(range.start, range.end) > 0
    ) {
      return false;
    }
    // Range-length constraints (Phase 4 codes).
    if (range.start !== null && range.end !== null) {
      const minLen = this.minRangeLength();
      const maxLen = this.maxRangeLength();
      if (minLen !== null || maxLen !== null) {
        const length = this.rangeLengthInDays(range.start, range.end);
        if (minLen !== null && length < minLen) return false;
        if (maxLen !== null && length > maxLen) return false;
      }
    }
    return true;
  }

  private rangeLengthInDays(start: D, end: D): number {
    // Inclusive day count (start + 1 day = length 2). Mirrors
    // `rangeLengthDays` in calendar.utils so picker-level validation matches
    // the calendar's commit-time validation.
    const [lo, hi] =
      this.adapter.compare(start, end) <= 0 ? [start, end] : [end, start];
    const a = this.adapter.startOfDay(lo);
    const b = this.adapter.startOfDay(hi);
    let count = 1;
    let cursor = a;
    while (this.adapter.compare(cursor, b) < 0) {
      cursor = this.adapter.addDays(cursor, 1);
      count++;
    }
    return count;
  }

  // ── Overlay lifecycle ──

  private openOverlay(): void {
    const current = this.internalValue();
    this.lastValueBeforeOpen.set(current);
    this.pendingRange.set(current);
    this.currentView.set(this.startView());

    const result = this.coordinator.open<DateRangePickerOverlayComponent<D>>({
      origin: this.elementRef,
      portalComponent: DateRangePickerOverlayComponent as unknown as new (
        ...args: unknown[]
      ) => DateRangePickerOverlayComponent<D>,
      viewContainerRef: this.viewContainerRef,
      injector: this.injector,
      positions: buildSelectLikePositions(this.offset()),
      scrollStrategy: resolveSelectScrollStrategy(this.scrollStrategy(), this.overlayService),
      panelClass: 'tw-date-range-picker-panel',
    });
    if (!result) return;

    const instance = result.instance;
    instance.onCalendarSelect.set((range) => this.onCalendarSelection(range));
    instance.onPresetSelect.set((preset) => this.onPresetClick(preset));
    instance.onStartTimeChange.set((date) => this.onStartTimeChange(date));
    instance.onEndTimeChange.set((date) => this.onEndTimeChange(date));
    instance.onViewChange.set((view) => this.onViewChanged(view));
    instance.onToday.set(() => this.onTodayClicked());
    instance.onClear.set(() => this.onClearAction());
    instance.onCancel.set(() => this.onCancelAction());
    instance.onApply.set(() => this.onApplyAction());
    // Push the initial config synchronously so the first render reflects the
    // current inputs; the effect in the constructor keeps things in sync afterwards.
    instance.size.set(this.size());
    instance.color.set(this.color());
    instance.minDate.set(this.minDate());
    instance.maxDate.set(this.maxDate());
    instance.dateFilter.set(this.dateFilter());
    instance.startView.set(this.startView());
    instance.numberOfMonths.set(this.numberOfMonths());
    instance.pendingRange.set(this.pendingRange());
    instance.currentView.set(this.currentView());
    instance.presets.set(this.presets());
    instance.activePresetId.set(this.activePresetId());
    instance.showActions.set(this.showActions());
    instance.showTime.set(this.showTime());
    instance.timeFormat.set(this.timeFormat());
    instance.showSeconds.set(this.showSeconds());
    instance.hourStep.set(this.hourStep());
    instance.minuteStep.set(this.minuteStep());
    instance.secondStep.set(this.secondStep());
    instance.todayLabel.set(this.todayLabel());
    instance.clearLabel.set(this.clearLabel());
    instance.cancelLabel.set(this.cancelLabel());
    instance.applyLabel.set(this.applyLabel());
    instance.rangeSeparator.set(this.rangeSeparator());
    instance.minRangeLength.set(this.minRangeLength());
    instance.maxRangeLength.set(this.maxRangeLength());
    instance.rangeBehavior.set(this.rangeBehavior());
    instance.rangeClickBehavior.set(this.rangeClickBehavior());
    instance.firstDayOfWeek.set(this.firstDayOfWeek());
    instance.locale.set(this.locale());
    instance.dateClass.set(this.dateClass());
    instance.cellTemplate.set(this.cellTemplate());
    this.overlayInstance = instance;
    // Must follow the assignment above: this is what wakes the state-push
    // effect, and it reads `overlayInstance` as a plain field.
    this.isAttached.set(true);
    // Flush the initial config into the overlay's first render so view children
    // (calendar, time pickers, action bar) observe the picker's current inputs.
    result.componentRef.changeDetectorRef.detectChanges();

    // Per-open streams from the coordinator complete on close, so no
    // takeUntilDestroyed is needed.
    this.coordinator.backdropClick$().subscribe(() => {
      // When an action bar is present, backdrop click acts as cancel.
      if (this.showActions()) {
        this.closeOverlay('backdrop', /* restore */ true);
      } else {
        this.closeOverlay('backdrop');
      }
    });

    this.coordinator.escape$().subscribe((event) => {
      event.preventDefault();
      this.closeOverlay('escape', /* restore */ true);
    });

    // Defer `opened` emission until after the enter animation completes — was
    // previously fired synchronously on open() (mirrors the date-picker fix).
    this.coordinator
      .opened$()
      .subscribe(() => this.opened.emit({ trigger: this.elementRef.nativeElement }));

    queueMicrotask(() => {
      this.overlayInstance?.focusCalendar();
    });
  }

  private closeOverlay(reason: DateRangePickerCloseReason, restore = false): void {
    if (this.closing || !this.overlayInstance) return;
    this.closing = true;
    this.overlayInstance.leaving.set(true);

    if (restore) {
      const previous = this.lastValueBeforeOpen();
      if (!rangesEqual(previous, this.internalValue(), this.adapter)) {
        // Silent restore — no emit of rangeChange.
        this.internalValue.set(previous);
        this.value.set(previous);
        this.parseError.set(false);
        this.rangeError.set(false);
      }
    }

    this.triggerRef().nativeElement.focus();

    this.coordinator.close(() => {
      this.overlayInstance = null;
      this.isAttached.set(false);
      this.pendingRange.set(null);
      untracked(() => this.open.set(false));
      this.closing = false;
      this.closed.emit(reason);
    });
  }

  // ── Overlay callbacks ──

  /** @internal */
  private onCalendarSelection(range: TwDateRange<D>): void {
    this.pendingRange.set(range);
    if (!range.complete) return;
    if (this.showActions() || this.showTime()) return;
    if (!this.isRangeValid(range)) {
      this.rangeError.set(true);
      return;
    }
    this.commit(range, 'calendar');
    this.closeOverlay('select');
  }

  private onPresetClick(preset: DateRangePreset<D>): void {
    let raw: TwDateRange<D>;
    try {
      raw = preset.range();
    } catch {
      this.liveAnnouncer.announce(`${preset.label} could not be applied.`, 'polite');
      return;
    }
    const clamped = this.clampRange(raw);
    if (!this.isRangeValid(clamped) || !clamped.complete) {
      this.liveAnnouncer.announce(
        `${preset.label} is not available in the current filter.`,
        'polite',
      );
      return;
    }
    this.pendingRange.set(clamped);
    this.presetSelected.emit(preset);
    if (this.showActions() || this.showTime()) return;
    this.commit(clamped, 'preset');
    this.closeOverlay('select');
  }

  private onStartTimeChange(date: D | null): void {
    const pending = this.pendingRange();
    if (pending === null || pending.start === null || date === null) return;
    const updatedStart = this.adapter.withTime(
      pending.start,
      this.adapter.getHours(date),
      this.adapter.getMinutes(date),
      this.adapter.getSeconds(date),
    );
    const next = new TwDateRange<D>(updatedStart, pending.end);
    this.pendingRange.set(next);
    if (!this.showActions() && next.complete) {
      if (!this.isRangeValid(next)) {
        this.rangeError.set(true);
        return;
      }
      this.commit(next, 'time');
    }
  }

  private onEndTimeChange(date: D | null): void {
    const pending = this.pendingRange();
    if (pending === null || pending.end === null || date === null) return;
    const updatedEnd = this.adapter.withTime(
      pending.end,
      this.adapter.getHours(date),
      this.adapter.getMinutes(date),
      this.adapter.getSeconds(date),
    );
    const next = new TwDateRange<D>(pending.start, updatedEnd);
    this.pendingRange.set(next);
    if (!this.showActions() && next.complete) {
      if (!this.isRangeValid(next)) {
        this.rangeError.set(true);
        return;
      }
      this.commit(next, 'time');
    }
  }

  private onViewChanged(view: CalendarViewState): void {
    this.currentView.set(view);
  }

  private onTodayClicked(): void {
    const today = this.adapter.today();
    const range = new TwDateRange<D>(today, today);
    if (!this.isRangeValid(range)) return;
    this.pendingRange.set(range);
    // When the action bar is off, Today behaves like a direct commit shortcut —
    // mirrors the date-picker's parallel behaviour.
    if (!this.showActions()) {
      this.commit(range, 'preset');
      this.closeOverlay('select');
    }
  }

  private onClearAction(): void {
    // Stage-only: clearing in the action bar just drops the pending range.
    // The user must press Apply to commit, consistent with Today.
    this.pendingRange.set(null);
  }

  private onCancelAction(): void {
    this.closeOverlay('cancel', /* restore */ true);
  }

  private onApplyAction(): void {
    const pending = this.pendingRange();
    const normalised = this.normalizeRange(pending);
    if (normalised !== null && !this.isRangeValid(normalised)) {
      this.rangeError.set(true);
      this.closeOverlay('cancel', /* restore */ true);
      return;
    }
    this.commit(normalised, 'apply');
    this.closeOverlay('apply');
  }

  // ── Helpers ──

  private resolveDialogAriaLabel(): string {
    return this.ariaLabel() || 'Choose a date range';
  }

  private resolvePanelClass(): string {
    const raw = this.panelClass();
    return Array.isArray(raw) ? raw.join(' ') : (raw as string);
  }

  // ── ControlValueAccessor ──

  writeValue(value: unknown): void {
    const previous = this.internalValue();
    if (value === null || value === undefined || value === '') {
      this.internalValue.set(null);
      this.value.set(null);
      this.parseError.set(false);
      this.rangeError.set(false);
      this.rangeChange.emit({
        value: null,
        previousValue: previous,
        source: 'programmatic',
      });
      return;
    }
    const coerced = this.coerceRange(value as TwDateRangeInput<D>);
    const normalised = this.normalizeRange(coerced);
    this.internalValue.set(normalised);
    this.value.set(normalised);
    this.parseError.set(false);
    this.rangeError.set(normalised !== null && !this.isRangeValid(normalised));
    this.rangeChange.emit({
      value: normalised,
      previousValue: previous,
      source: 'programmatic',
    });
  }

  private coerceRange(value: TwDateRangeInput<D>): TwDateRange<D> | null {
    if (value === null || value === undefined) return null;
    if (value instanceof TwDateRange) {
      const start = this.coerceEndpoint(value.start);
      const end = this.coerceEndpoint(value.end);
      return new TwDateRange<D>(start, end);
    }
    const obj = value as { start: D | null; end: D | null };
    return new TwDateRange<D>(
      this.coerceEndpoint(obj.start ?? null),
      this.coerceEndpoint(obj.end ?? null),
    );
  }

  private coerceEndpoint(raw: D | null): D | null {
    if (raw === null) return null;
    const d = this.adapter.deserialize(raw) as D | null;
    if (d === null) return null;
    return this.adapter.isValid(d) ? d : null;
  }

  registerOnChange(fn: (value: TwDateRange<D> | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  // ── Validator ──

  private validatorOnChange: () => void = () => {};

  /** @internal */
  validate(control: AbstractControl): ValidationErrors | null {
    // Delegate to the calendar validator so consumers see the same
    // CalendarErrorCode set on a date-range-picker as on a bound `tw-calendar`.
    const validator = calendarValidator<'range', D>({
      mode: 'range',
      lastInvalidFormValue: null,
      constraints: {
        minDate: this.minDate(),
        maxDate: this.maxDate(),
        dateFilter: this.dateFilter(),
      },
      adapter: this.adapter,
      minRangeLength: this.minRangeLength(),
      maxRangeLength: this.maxRangeLength(),
    });
    const errors = validator(control) as CalendarValidationErrors | null;
    return errors;
  }

  /** @internal */
  registerOnValidatorChange(fn: () => void): void {
    this.validatorOnChange = fn;
  }

  // ── FormFieldControl methods ──

  /** @internal */
  setDescribedByIds(ids: string[]): void {
    this.describedByIdsSignal.set([...ids]);
  }

  /** @internal */
  onContainerClick(event: MouseEvent): void {
    if (this.isDisabled()) return;
    const target = event.target as HTMLElement | null;
    const triggerEl = this.triggerRef()?.nativeElement;
    if (triggerEl && target && triggerEl.contains(target)) return;
    if (triggerEl && document.activeElement !== triggerEl) {
      triggerEl.focus();
    }
  }
}
