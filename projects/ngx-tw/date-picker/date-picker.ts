import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
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
  type ControlValueAccessor,
  FormGroupDirective,
  NgControl,
  NgForm,
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
  resolveSelectScrollStrategy,
  type TimePickerFormat,
  timeOfDaySeconds,
  TW_ERROR_STATE_MATCHER,
  type TwColor,
  type TwFormSubmitted,
  type TwSize,
} from '@cdevhub/ngx-tw/core';
import {
  FormFieldComponent,
  FormFieldControl,
  TW_FORM_FIELD_CONTROL,
} from '@cdevhub/ngx-tw/form-field';
import { DATE_ADAPTER, type DateAdapter } from '@cdevhub/ngx-tw/calendar';
import type { CalendarCell, CalendarViewState, DateClassFn, DateFilterFn } from '@cdevhub/ngx-tw/calendar';
import { DatePickerOverlayComponent } from './date-picker-overlay';

// ── Public types ──────────────────────────────────────────────────

/** Visual style of the date-picker trigger. */
export type DatePickerVariant = 'default' | 'naked';

/** Origin of a value change, used to distinguish user input from programmatic writes. */
export type DatePickerChangeSource =
  | 'input'
  | 'calendar'
  | 'apply'
  | 'clear'
  | 'today'
  | 'programmatic';

/** Reason the overlay closed. */
export type DatePickerCloseReason =
  | 'select'
  | 'apply'
  | 'cancel'
  | 'escape'
  | 'backdrop'
  | 'programmatic';

/** Emitted by `dateInput`. */
export interface DatePickerInputEvent<D> {
  /** The raw string currently in the input (pre-parse). */
  readonly rawText: string;
  /** The parsed value if parsing succeeded and it's in range; otherwise `null`. */
  readonly parsed: D | null;
  /** The input element itself. */
  readonly target: HTMLInputElement;
}

/** Emitted by `dateChange`. */
export interface DatePickerChangeEvent<D> {
  /** The committed value (`null` when cleared). */
  readonly value: D | null;
  /** The value before this change. */
  readonly previousValue: D | null;
  /** What triggered the change. */
  readonly source: DatePickerChangeSource;
}

/** Emitted by `opened` and `closed`. */
export interface DatePickerOpenedEvent {
  /** The trigger (input) element. */
  readonly trigger: HTMLElement;
}

/** A quick-select preset rendered above the calendar in the overlay. Mirrors `DateRangePreset`. */
export interface DatePickerPreset<D = Date> {
  /** Label shown on the preset button. */
  readonly label: string;
  /** Factory returning the date to apply when this preset is chosen. Called fresh each click so "today"-relative presets stay current. */
  readonly date: () => D;
  /** Optional identifier — surfaced in `presetSelected` and used to detect the active preset for visual state. */
  readonly id?: string;
}

/** Bundle of time-of-day configuration forwarded to the embedded `<tw-time-picker>`. Passing a non-null object turns the time-picker on and forwards each field; pass `{}` to enable with all defaults. */
export interface DatePickerTimeConfig<D = Date> {
  /** Clock format. Defaults to `'24h'`. */
  readonly format?: TimePickerFormat;
  /** Whether to expose a seconds field. Defaults to `false`. */
  readonly showSeconds?: boolean;
  /** Hour step. Defaults to `1`. */
  readonly hourStep?: number;
  /** Minute step. Defaults to `1`. */
  readonly minuteStep?: number;
  /** Second step. Defaults to `1`. */
  readonly secondStep?: number;
  /** Earliest accepted time-of-day. Values earlier than this set `errorState`. */
  readonly minTime?: D | null;
  /** Latest accepted time-of-day. Values later than this set `errorState`. */
  readonly maxTime?: D | null;
}

/** Re-exported from `ngx-tw/calendar` for consumers importing only the date-picker. */
export type { CalendarViewState, DateFilterFn, DateClassFn };

/** Re-exported from `ngx-tw/core` for consumers importing only the date-picker. */
export type { TimePickerFormat };

// ── tv() config ───────────────────────────────────────────────────

const datePickerVariants = tv(
  {
    slots: {
      root: 'relative inline-flex items-center w-full text-fg transition-[color,border-color,box-shadow] duration-normal motion-reduce:transition-none',
      input:
        'flex-1 min-w-0 bg-transparent text-fg placeholder:text-fg-subtle outline-none border-0 p-0 m-0 font-inherit',
      triggerButton:
        'inline-flex items-center justify-center shrink-0 rounded-md text-fg-muted hover:text-fg hover:bg-surface-muted transition-colors duration-normal motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
      triggerIcon: 'shrink-0',
      // size-6 (24×24 CSS px) is the WCAG AA minimum interactive target — bumping past size-5 keeps the affordance hittable without growing the inline row.
      clearButton:
        'inline-flex items-center justify-center shrink-0 rounded-md text-fg-muted hover:text-fg hover:bg-surface-muted transition-colors duration-normal motion-reduce:transition-none size-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
    },
    variants: {
      size: {
        xs: {
          root: 'gap-1 text-xs',
          input: 'text-xs',
          triggerButton: 'size-6',
          // size-3.5 (14px) is the codified half-step for xs-density chevrons — size-3 (12px) looks pinched next to text-xs and size-4 (16px) crowds the 24px trigger.
          triggerIcon: 'size-3.5',
        },
        sm: {
          root: 'gap-1.5 text-sm',
          input: 'text-sm',
          triggerButton: 'size-7',
          triggerIcon: 'size-4',
        },
        md: {
          root: 'gap-2 text-sm',
          input: 'text-sm',
          triggerButton: 'size-8',
          triggerIcon: 'size-4',
        },
        lg: {
          root: 'gap-2 text-base',
          input: 'text-base',
          triggerButton: 'size-9',
          triggerIcon: 'size-5',
        },
        xl: {
          root: 'gap-2 text-base',
          input: 'text-base',
          // size-10 (40px) extends the codified xs..lg square-interactive scale (24/28/32/36) by one step for xl. Stepping down to size-9 would make lg and xl visually identical since both use text-base; matches paginator's xl handling (size-11).
          triggerButton: 'size-10',
          triggerIcon: 'size-5',
        },
      },
      variant: {
        default: {
          root: 'rounded-md border border-border bg-surface px-3 py-2 hover:border-border-strong',
        },
        naked: {
          root: 'bg-transparent border-0 rounded-none p-0 focus-within:outline-none',
        },
      },
      open: { true: { triggerButton: 'bg-surface-muted text-fg' }, false: {} },
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
      // Default variant — focused border per color
      { variant: 'default', focused: true, color: 'primary', class: { root: 'border-primary-500' } },
      { variant: 'default', focused: true, color: 'secondary', class: { root: 'border-secondary-500' } },
      { variant: 'default', focused: true, color: 'accent', class: { root: 'border-accent-500' } },
      { variant: 'default', focused: true, color: 'neutral', class: { root: 'border-border-strong' } },
      { variant: 'default', focused: true, color: 'info', class: { root: 'border-info-500' } },
      { variant: 'default', focused: true, color: 'success', class: { root: 'border-success-500' } },
      { variant: 'default', focused: true, color: 'warning', class: { root: 'border-warning-500' } },
      { variant: 'default', focused: true, color: 'error', class: { root: 'border-error-500' } },
      // Default variant + error state → red outline
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

let nextDatePickerId = 0;

// ── Default display format ────────────────────────────────────────

const DEFAULT_DISPLAY_FORMAT = {
  dateTimeFormat: { year: 'numeric', month: 'short', day: 'numeric' } as Intl.DateTimeFormatOptions,
};

/**
 * ARIA date-picker dialog. Combines a typable text input with a popover
 * calendar. All three Angular forms strategies (reactive, template-driven,
 * signal-forms) are supported via `ControlValueAccessor`, and the component
 * integrates with `<tw-form-field>` by implementing `FormFieldControl`.
 *
 * All date operations go through the injected `DateAdapter<D>`; call
 * `provideNativeDateAdapter()` in your app providers to bootstrap the default.
 */
@Component({
  selector: 'tw-date-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TW_FORM_FIELD_CONTROL,
      useExisting: forwardRef(() => DatePickerComponent),
    },
    PickerOverlayCoordinator,
  ],
  template: `
    <!-- Optional rich-label trigger. When projected (a child carries [slot=trigger]), the default input/clear/trigger chrome is hidden. Clicks anywhere in the projected content open the overlay. -->
    <div
      class="contents"
      (click)="onCustomTriggerClick($event)"
      (keydown)="onCustomTriggerKeydown($event)"
    >
      <ng-content select="[slot=trigger]" />
    </div>

    <input
      #dateInput
      type="text"
      [id]="hostId"
      [class]="inputClasses()"
      [class.sr-only]="hasCustomTrigger()"
      [value]="rawInputText()"
      [placeholder]="placeholder() || ''"
      [disabled]="isDisabled()"
      [tabindex]="hasCustomTrigger() ? -1 : null"
      [attr.readonly]="readonlyInput() ? 'true' : null"
      [attr.role]="'combobox'"
      [attr.aria-haspopup]="'dialog'"
      [attr.aria-expanded]="open() ? 'true' : 'false'"
      [attr.aria-controls]="dialogId"
      [attr.aria-autocomplete]="'none'"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-labelledby]="ariaLabelledby() || null"
      [attr.aria-describedby]="describedBy() || null"
      [attr.aria-required]="requiredInput() || null"
      [attr.aria-invalid]="errorState() || null"
      [attr.aria-disabled]="isDisabled() || null"
      [attr.data-variant]="resolvedVariant()"
      (input)="onInputEvent($event)"
      (blur)="onInputBlur()"
      (focus)="onInputFocus()"
      (keydown)="onInputKeydown($event)"
    />

    @if (!hasCustomTrigger() && showClear() && !isEmpty() && !isDisabled() && !readonlyInput()) {
      <button
        type="button"
        tabindex="-1"
        [class]="clearButtonClasses()"
        [attr.aria-label]="'Clear date'"
        (click)="onClearClick($event)"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="size-4">
          <path
            fill-rule="evenodd"
            d="M10 8.586 4.707 3.293a1 1 0 0 0-1.414 1.414L8.586 10l-5.293 5.293a1 1 0 1 0 1.414 1.414L10 11.414l5.293 5.293a1 1 0 0 0 1.414-1.414L11.414 10l5.293-5.293a1 1 0 0 0-1.414-1.414L10 8.586Z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    }

    @if (!hasCustomTrigger()) {
      <button
        #triggerBtn
        type="button"
        [class]="triggerButtonClasses()"
        [attr.aria-label]="triggerAriaLabel()"
        [attr.aria-haspopup]="'dialog'"
        [attr.aria-expanded]="open() ? 'true' : 'false'"
        [attr.aria-controls]="dialogId"
        [attr.aria-disabled]="isDisabled() || null"
        [disabled]="isDisabled()"
        (click)="onTriggerClick()"
        (keydown)="onTriggerKeydown($event)"
      >
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
      </button>
    }
  `,
  host: {
    '[class]': 'rootClasses()',
  },
})
export class DatePickerComponent<D = Date>
  extends FormFieldControl<D>
  implements ControlValueAccessor, OnInit
{
  // ── Inputs ──

  /** Id on the date-picker's input element. Auto-generated when not provided. Used by the form-field's `<label for>` attribute. */
  readonly idInput = input<string | undefined>(undefined, { alias: 'id' });

  /** Minimum selectable date. Typed input earlier than this sets `errorState` and the calendar disables the cell. Defaults to `null`. */
  readonly minDate = input<D | null>(null);

  /** Maximum selectable date. Typed input later than this sets `errorState` and the calendar disables the cell. Defaults to `null`. */
  readonly maxDate = input<D | null>(null);

  /** Per-date predicate — return `false` to disable. Applied in both the calendar and the text-parse path. */
  readonly dateFilter = input<DateFilterFn<D> | null>(null);

  /** Which calendar view opens first — `'day'`, `'month'`, or `'year'`. Defaults to `'day'`. */
  readonly startView = input<CalendarViewState>('day');

  /** Date to focus when the calendar opens with no selection. Falls back to today. */
  readonly startAt = input<D | null>(null);

  /** Display format passed to `DateAdapter.format()`. With the default adapter, accepts `{ dateTimeFormat: Intl.DateTimeFormatOptions }`. When `withTime` is true and this is left at the default, hour/minute (and optional seconds) are folded in automatically. */
  readonly format = input<unknown>(DEFAULT_DISPLAY_FORMAT);

  /** Optional format hint passed to `DateAdapter.parse()`. Ignored by the native adapter. */
  readonly parseFormat = input<unknown | undefined>(undefined);

  /** Placeholder text shown in the input when no value is entered. */
  readonly placeholder = input<string | undefined>(undefined);

  /** When true, the input is disabled, the trigger cannot open the calendar, and `aria-disabled="true"` is set. Defaults to `false`. */
  readonly disabledInput = input<boolean, unknown>(false, {
    alias: 'disabled',
    transform: booleanAttribute,
  });

  /** When true, exposes `aria-required="true"`. Validators.required on a bound NgControl is also honoured. Defaults to `false`. */
  readonly requiredInput = input<boolean, unknown>(false, {
    alias: 'required',
    transform: booleanAttribute,
  });

  /** When true, blocks typing but still allows picking via the calendar trigger. Defaults to `false`. */
  readonly readonlyInput = input<boolean, unknown>(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });

  /** Trigger padding, font size, and calendar cell density. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** Semantic color for focused border, calendar selection ring, and today marker. Defaults to `'primary'`. */
  readonly color = input<TwColor>('primary');

  /** Visual style of the trigger. `'default'` draws its own border; `'naked'` strips chrome. Auto-resolves to `'naked'` when inside `<tw-form-field>`. */
  readonly variant = input<DatePickerVariant | undefined>(undefined);

  /** Whether to show a clear-button affordance inside the trigger when a value is set. Defaults to `true`. */
  // TRUE-default: a picker without a clear affordance forces consumers to wire one — most form pickers expect the inline clear, matching `<tw-input>`'s clear button.
  readonly showClear = input<boolean>(true);

  /** When true, renders a `Today / Clear / Cancel / Apply` action bar at the bottom of the overlay. Defaults to `false`. */
  readonly showActions = input<boolean>(false);

  /** Label for the `Today` action in the overlay's action bar. */
  readonly todayLabel = input<string>('Today');

  /** Label for the `Clear` action in the overlay's action bar. */
  readonly clearLabel = input<string>('Clear');

  /** Label for the `Cancel` action in the overlay's action bar. */
  readonly cancelLabel = input<string>('Cancel');

  /** Label for the `Apply` action in the overlay's action bar. */
  readonly applyLabel = input<string>('Apply');

  /** When true, focusing the text input opens the overlay. Defaults to `false`. */
  readonly openOnFocus = input<boolean>(false);

  /** Extra class(es) applied to the overlay panel element. */
  readonly panelClass = input<string | readonly string[]>('');

  /** CDK scroll strategy for the overlay. Defaults to `'reposition'`. */
  readonly scrollStrategy = input<'reposition' | 'close' | 'block'>('reposition');

  /** Pixel distance between trigger and overlay. Defaults to `4`. */
  readonly offset = input<number>(4);

  /** Accessible name for the calendar trigger button. Defaults to `'Open calendar'`. */
  readonly triggerAriaLabel = input<string>('Open calendar');

  /**
   * Bundles the time-of-day configuration. Passing a non-null object turns on the embedded `<tw-time-picker>` and forwards each field.
   *
   * Defaults to `null` (no time field). Pass an empty object `{}` to enable the time picker with all defaults.
   */
  readonly timeConfig = input<DatePickerTimeConfig<D> | null>(null);

  /** Per-instance locale override. Forwarded to the embedded calendar and the underlying `DateAdapter` for parse/format. Falls back to Angular `LOCALE_ID` when `null`. */
  readonly locale = input<string | null>(null);

  /** Function producing per-cell CSS classes, forwarded to the embedded calendar. Useful for visually marking special dates (holidays, billing cycles). */
  readonly dateClass = input<DateClassFn<D> | null>(null);

  /** Optional cell-content template, forwarded to the embedded calendar. Use to customize cell visuals beyond `dateClass`. */
  readonly cellTemplate = input<TemplateRef<{ $implicit: CalendarCell<D> }> | null>(null);

  /** Optional quick-select presets rendered as a vertical list before the calendar. Each preset provides a `label` and a `date` factory. An empty array hides the preset panel. */
  readonly presets = input<readonly DatePickerPreset<D>[]>([]);

  /** Per-instance override of the `ErrorStateMatcher`. */
  readonly errorStateMatcher = input<ErrorStateMatcher | undefined>(undefined);

  /** Accessible name for the input. Required when no visible label is supplied. Alias: `aria-label`. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  /** ID of an external element that labels the input. Alias: `aria-labelledby`. */
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  /** Consumer-supplied `aria-describedby` ids. The form-field preserves these when merging hint/error ids. Alias: `aria-describedby`. */
  readonly userAriaDescribedByInput = input<string | undefined>(undefined, {
    alias: 'aria-describedby',
  });

  // ── Models (two-way) ──

  /** Two-way bound selected date. `null` when no selection. Setting programmatically updates the display; does NOT trigger `onChange`. */
  readonly value = model<D | null>(null);

  /** Two-way bound open state of the calendar overlay. */
  readonly open = model(false);

  // ── Outputs ──

  /** Fires after the overlay's enter animation completes. Payload is the trigger element. */
  readonly opened = output<DatePickerOpenedEvent>();

  /** Fires after the overlay's leave animation completes. Payload is the reason it closed. */
  readonly closed = output<DatePickerCloseReason>();

  /** Fires on every keystroke in the text input (before parsing). Does NOT mean the value has committed. */
  readonly dateInput = output<DatePickerInputEvent<D>>();

  /** Fires after a commit — from parsing typed input or picking in the calendar. */
  readonly dateChange = output<DatePickerChangeEvent<D>>();

  /** Fires when the user picks one of the entries from `presets`. Payload is the preset that fired. */
  readonly presetSelected = output<DatePickerPreset<D>>();

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
  private readonly formField = inject(FormFieldComponent, { optional: true });
  private readonly ngControl = inject(NgControl, { optional: true, self: true });
  private readonly parentForm = inject(NgForm, { optional: true });
  private readonly parentFormGroup = inject(FormGroupDirective, { optional: true });
  private readonly defaultMatcher = inject(TW_ERROR_STATE_MATCHER);

  // ── View refs ──

  private readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('dateInput');
  private readonly triggerRef = viewChild<ElementRef<HTMLButtonElement>>('triggerBtn');

  /** @internal Whether a `[slot=trigger]` is projected. Detected post-mount via DOM query so we can drop the default chrome. */
  readonly hasCustomTrigger = signal(false);

  // ── Identity ──

  private readonly uid = nextDatePickerId++;
  /** @internal */
  readonly hostId = `tw-date-picker-${this.uid}`;
  /** @internal */
  readonly dialogId = `${this.hostId}-dialog`;

  // ── Internal state ──

  /** @internal Decouples programmatic writes from user commits so `writeValue` doesn't re-trigger parent effects. */
  readonly internalValue = linkedSignal<D | null>(() => this.value());
  /** @internal */
  readonly rawInputText = signal<string>('');
  /** @internal */
  readonly parseError = signal(false);
  /** @internal */
  readonly rangeError = signal(false);
  /** @internal */
  readonly focusedSignal = signal(false);

  private readonly cvaDisabled = signal(false);
  private readonly describedByIdsSignal = signal<readonly string[]>([]);
  private readonly closingSignal = signal(false);
  private readonly lastValueBeforeOpen = signal<D | null>(null);
  private readonly pendingCalendarValue = signal<D | null>(null);
  private readonly activePresetIdSignal = signal<string | undefined>(undefined);
  private readonly _ngControlRev = signal(0);
  private readonly _formSubmitRev = signal(0);

  private onChange: (value: D | null) => void = () => {};
  private onTouched: () => void = () => {};

  private readonly overlayInstanceSignal = signal<DatePickerOverlayComponent<D> | null>(null);
  private returnFocusTo: HTMLElement | null = null;

  private get overlayInstance(): DatePickerOverlayComponent<D> | null {
    return this.overlayInstanceSignal();
  }

  // ── Derived state ──

  /** @internal */
  readonly isDisabled = computed(() => {
    this._ngControlRev();
    return this.disabledInput() || this.cvaDisabled() || !!this.ngControl?.disabled;
  });

  /** @internal Effective variant — auto-naked when wrapped in tw-form-field. */
  readonly resolvedVariant = computed<DatePickerVariant>(
    () => this.variant() ?? (this.formField ? 'naked' : 'default'),
  );

  /** @internal */
  readonly isEmpty = computed(() => this.internalValue() === null && !this.rawInputText());

  /** Whether the time picker is rendered inside the overlay. True iff `timeConfig` is non-null. */
  readonly withTime = computed<boolean>(() => this.timeConfig() !== null);

  /** @internal Effective time-of-day configuration — merges `timeConfig` over the documented per-field defaults. */
  readonly effectiveTimeConfig = computed<Required<Omit<DatePickerTimeConfig<D>, 'minTime' | 'maxTime'>> & { minTime: D | null; maxTime: D | null }>(() => {
    const cfg = this.timeConfig();
    return {
      format: cfg?.format ?? '24h',
      showSeconds: cfg?.showSeconds ?? false,
      hourStep: cfg?.hourStep ?? 1,
      minuteStep: cfg?.minuteStep ?? 1,
      secondStep: cfg?.secondStep ?? 1,
      minTime: cfg?.minTime ?? null,
      maxTime: cfg?.maxTime ?? null,
    };
  });

  /** @internal Effective display format — folds hour/minute (and optional seconds) into the default when `withTime` is on and the user hasn't overridden `format`. */
  readonly effectiveFormat = computed<unknown>(() => {
    const fmt = this.format();
    if (!this.withTime() || fmt !== DEFAULT_DISPLAY_FORMAT) return fmt;
    const time = this.effectiveTimeConfig();
    const hour12 = time.format === '12h';
    const base: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12,
    };
    if (time.showSeconds) base.second = '2-digit';
    return { dateTimeFormat: base };
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
    datePickerVariants({
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
  readonly inputClasses = computed(() => this.variantResult().input());
  /** @internal */
  readonly triggerButtonClasses = computed(() => this.variantResult().triggerButton());
  /** @internal */
  readonly triggerIconClasses = computed(() => this.variantResult().triggerIcon());
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
  readonly controlType = 'date-picker';
  /** @internal */
  readonly userAriaDescribedBy: Signal<string | undefined> = computed(() =>
    this.userAriaDescribedByInput(),
  );

  // ── Constructor ──

  constructor() {
    super();

    // Wire this component as the NgControl's value accessor without registering
    // NG_VALUE_ACCESSOR in providers, which would create a circular DI with the
    // `inject(NgControl, { self: true })` above.
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }

    // Sync rawInputText whenever the underlying value changes (programmatic or user).
    effect(() => {
      const v = this.internalValue();
      const fmt = this.effectiveFormat();
      untracked(() => {
        const display = v === null ? '' : this.adapter.format(v, fmt);
        this.rawInputText.set(display);
        this.parseError.set(false);
        this.rangeError.set(false);
      });
    });

    // Mirror the `open` model into the overlay lifecycle.
    effect(() => {
      const shouldOpen = this.open();
      const disabled = this.isDisabled();
      if (disabled && this.overlayInstance) {
        this.closeOverlay('programmatic');
        return;
      }
      if (shouldOpen && !this.overlayInstance && !disabled && !this.closingSignal()) {
        this.openOverlay();
      } else if (!shouldOpen && this.overlayInstance && !this.closingSignal()) {
        this.closeOverlay('programmatic');
      }
    });

    // Push state into the overlay whenever anything relevant changes.
    // Reads happen in the tracked phase; writes to the overlay instance are
    // wrapped in `untracked()` so they never feed back into this effect.
    effect(() => {
      const instance = this.overlayInstance;
      if (!instance) return;
      const time = this.effectiveTimeConfig();
      const size = this.size();
      const color = this.color();
      const minDate = this.minDate();
      const maxDate = this.maxDate();
      const dateFilter = this.dateFilter();
      const startView = this.startView();
      const startAt = this.startAt() ?? this.internalValue() ?? null;
      const pendingValue = this.pendingCalendarValue();
      const showActions = this.showActions();
      const todayLabel = this.todayLabel();
      const clearLabel = this.clearLabel();
      const cancelLabel = this.cancelLabel();
      const applyLabel = this.applyLabel();
      const dialogAriaLabel = this.resolveDialogAriaLabel();
      const panelClassValue = this.resolvePanelClass();
      const withTime = this.withTime();
      const locale = this.locale();
      const dateClass = this.dateClass();
      const cellTemplate = this.cellTemplate();
      const presets = this.presets();
      const activePresetId = this.activePresetIdSignal();
      untracked(() => {
        instance.size.set(size);
        instance.color.set(color);
        instance.minDate.set(minDate);
        instance.maxDate.set(maxDate);
        instance.dateFilter.set(dateFilter);
        instance.startView.set(startView);
        instance.startAt.set(startAt);
        instance.pendingValue.set(pendingValue);
        instance.showActions.set(showActions);
        instance.todayLabel.set(todayLabel);
        instance.clearLabel.set(clearLabel);
        instance.cancelLabel.set(cancelLabel);
        instance.applyLabel.set(applyLabel);
        instance.dialogId.set(this.dialogId);
        instance.dialogAriaLabel.set(dialogAriaLabel);
        instance.panelClassValue.set(panelClassValue);
        instance.withTime.set(withTime);
        instance.timeFormat.set(time.format);
        instance.showSeconds.set(time.showSeconds);
        instance.hourStep.set(time.hourStep);
        instance.minuteStep.set(time.minuteStep);
        instance.secondStep.set(time.secondStep);
        instance.minTime.set(time.minTime);
        instance.maxTime.set(time.maxTime);
        instance.locale.set(locale);
        instance.dateClass.set(dateClass);
        instance.cellTemplate.set(cellTemplate);
        instance.presets.set(presets);
        instance.activePresetId.set(activePresetId);
      });
    });

    // Push locale into the adapter for parse/format. The calendar also calls
    // setLocale, but a standalone picker without a calendar open still needs
    // the parser to honour the picker's locale.
    effect(() => {
      const locale = this.locale();
      if (locale === null) return;
      untracked(() => this.adapter.setLocale(locale));
    });

    // Dev-mode accessible-name warning + projected-trigger detection.
    afterNextRender(() => {
      const host = this.elementRef.nativeElement;
      // Detect [slot=trigger] projection by querying for projected children that carry the attribute.
      // Angular's <ng-content select="[slot=trigger]"> moves them into the rendered DOM under the host.
      if (host.querySelector('[slot="trigger"]')) {
        this.hasCustomTrigger.set(true);
      }

      if (!isDevMode()) return;
      const hasLabel =
        !!this.ariaLabel() ||
        !!this.ariaLabelledby() ||
        !!this.formField?.labelChild();
      if (!hasLabel) {
        console.warn(
          '[tw-date-picker] The date-picker has no accessible name. Set aria-label, aria-labelledby, or wrap the component in a <tw-form-field> with a <label twLabel>.',
        );
      }
    });

    // Monitor focus on the host (trigger + input + overlay when opened).
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
      // clears its timers; we only need to drop the local instance signal.
      this.overlayInstanceSignal.set(null);
    });
  }

  ngOnInit(): void {
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

  /** Clears the current value and emits `dateChange` with `source: 'clear'`. */
  clear(): void {
    this.commit(null, 'clear');
  }

  // ── Input interactions ──

  /** @internal */
  onInputEvent(event: Event): void {
    const target = event.target as HTMLInputElement;
    const rawText = target.value;
    this.rawInputText.set(rawText);
    this.parseError.set(false);
    this.rangeError.set(false);
    // Non-committing parse so the payload's `parsed` field reflects success when achievable.
    let parsed: D | null = null;
    if (rawText.trim()) {
      const candidate = this.adapter.parse(rawText, this.parseFormat());
      if (candidate && this.adapter.isValid(candidate) && this.isInRange(candidate)) {
        parsed = candidate;
      }
    }
    this.dateInput.emit({ rawText, parsed, target });
  }

  /** @internal */
  onInputBlur(): void {
    this.commitFromInput();
  }

  /** @internal */
  onInputFocus(): void {
    if (this.openOnFocus() && !this.isDisabled() && !this.readonlyInput()) {
      this.returnFocusTo = this.inputRef().nativeElement;
      this.openPicker();
    }
  }

  /** @internal */
  onInputKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    const key = event.key;

    if (event.altKey && key === 'ArrowDown') {
      event.preventDefault();
      this.returnFocusTo = this.inputRef().nativeElement;
      this.openPicker();
      return;
    }
    if (event.altKey && key === 'ArrowUp') {
      if (this.open()) {
        event.preventDefault();
        this.closeOverlay('cancel', /* restore */ true);
      }
      return;
    }

    switch (key) {
      case 'Enter':
        event.preventDefault();
        this.commitFromInput();
        if (this.open()) {
          this.closeOverlay('select');
        }
        return;
      case 'Escape':
        if (this.open()) {
          event.preventDefault();
          this.closeOverlay('escape', /* restore */ true);
        }
        return;
      case 'Tab':
        if (this.open()) {
          // Let focus move out naturally; close the overlay.
          this.closeOverlay('programmatic');
        }
        return;
      default:
        return;
    }
  }

  /** @internal */
  onClearClick(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.clear();
  }

  /** @internal */
  onTriggerClick(): void {
    if (this.isDisabled()) return;
    const trigger = this.triggerRef();
    if (trigger) this.returnFocusTo = trigger.nativeElement;
    this.toggle();
  }

  /** @internal */
  onTriggerKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      const trigger = this.triggerRef();
      if (trigger) this.returnFocusTo = trigger.nativeElement;
      if (!this.open()) this.openPicker();
    } else if (event.key === 'Escape' && this.open()) {
      event.preventDefault();
      this.closeOverlay('escape', /* restore */ true);
    }
  }

  /** @internal */
  onCustomTriggerClick(event: MouseEvent): void {
    if (!this.hasCustomTrigger() || this.isDisabled()) return;
    // The projected element itself is the focus target on close.
    const target = event.currentTarget as HTMLElement | null;
    if (target) this.returnFocusTo = target;
    event.preventDefault();
    this.toggle();
  }

  /** @internal */
  onCustomTriggerKeydown(event: KeyboardEvent): void {
    if (!this.hasCustomTrigger() || this.isDisabled()) return;
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      const target = event.currentTarget as HTMLElement | null;
      if (target) this.returnFocusTo = target;
      if (!this.open()) this.openPicker();
    } else if (event.key === 'Escape' && this.open()) {
      event.preventDefault();
      this.closeOverlay('escape', /* restore */ true);
    }
  }

  // ── Parse & commit ──

  private commitFromInput(): void {
    const raw = this.rawInputText().trim();
    if (!raw) {
      if (this.internalValue() !== null || this.parseError() || this.rangeError()) {
        this.commit(null, 'input');
      } else {
        this.parseError.set(false);
        this.rangeError.set(false);
      }
      return;
    }
    const parsed = this.adapter.parse(raw, this.parseFormat());
    if (!parsed || !this.adapter.isValid(parsed)) {
      this.parseError.set(true);
      this.rangeError.set(false);
      return;
    }
    if (!this.isInRange(parsed)) {
      this.parseError.set(false);
      this.rangeError.set(true);
      return;
    }
    this.commit(parsed, 'input');
  }

  private commit(next: D | null, source: DatePickerChangeSource): void {
    const previous = this.internalValue();
    this.internalValue.set(next);
    this.value.set(next);
    this.parseError.set(false);
    this.rangeError.set(false);
    const display = next === null ? '' : this.adapter.format(next, this.effectiveFormat());
    this.rawInputText.set(display);
    const el = this.inputRef().nativeElement;
    if (el.value !== display) el.value = display;

    if (source !== 'programmatic') {
      this.onChange(next);
      this.onTouched();
      if (next === null) {
        this.liveAnnouncer.announce('Date cleared', 'polite');
      } else {
        this.liveAnnouncer.announce(`${display} selected`, 'polite');
      }
    }
    this.dateChange.emit({ value: next, previousValue: previous, source });
  }

  private isInRange(d: D): boolean {
    const min = this.minDate();
    if (min && this.adapter.compare(d, min) < 0) return false;
    const max = this.maxDate();
    if (max && this.adapter.compare(d, max) > 0) return false;
    const filter = this.dateFilter();
    if (filter && !filter(d)) return false;
    if (this.withTime() && !this.isTimeInRange(d)) return false;
    return true;
  }

  private isTimeInRange(d: D): boolean {
    const { minTime: min, maxTime: max } = this.effectiveTimeConfig();
    if (!min && !max) return true;
    const adapter = this.adapter;
    const vSecs = timeOfDaySeconds(adapter.getHours(d), adapter.getMinutes(d), adapter.getSeconds(d));
    if (min && adapter.isValid(min)) {
      const minSecs = timeOfDaySeconds(adapter.getHours(min), adapter.getMinutes(min), adapter.getSeconds(min));
      if (vSecs < minSecs) return false;
    }
    if (max && adapter.isValid(max)) {
      const maxSecs = timeOfDaySeconds(adapter.getHours(max), adapter.getMinutes(max), adapter.getSeconds(max));
      if (vSecs > maxSecs) return false;
    }
    return true;
  }

  // ── Overlay lifecycle ──

  private openOverlay(): void {
    if (!this.returnFocusTo) {
      this.returnFocusTo = this.resolveFocusTarget();
    }
    this.lastValueBeforeOpen.set(this.internalValue());
    this.pendingCalendarValue.set(this.internalValue());

    const result = this.coordinator.open<DatePickerOverlayComponent<D>>({
      origin: this.elementRef,
      portalComponent: DatePickerOverlayComponent as unknown as new (
        ...args: unknown[]
      ) => DatePickerOverlayComponent<D>,
      viewContainerRef: this.viewContainerRef,
      injector: this.injector,
      positions: buildSelectLikePositions(this.offset()),
      scrollStrategy: resolveSelectScrollStrategy(this.scrollStrategy(), this.overlayService),
      panelClass: 'tw-date-picker-panel',
    });
    if (!result) return;

    const instance = result.instance;
    instance.onCalendarSelect.set((date) => this.onCalendarSelection(date));
    instance.onTimeInput.set((date) => this.onTimeInput(date));
    instance.onToday.set(() => this.onTodayClicked());
    instance.onClear.set(() => this.onClearAction());
    instance.onCancel.set(() => this.onCancelAction());
    instance.onApply.set(() => this.onApplyAction());
    instance.onPresetSelect.set((preset) => this.onPresetClick(preset));
    instance.activePresetId.set(this.activePresetIdSignal());
    this.overlayInstanceSignal.set(instance);

    // Per-open streams from the coordinator complete on close, so no
    // takeUntilDestroyed is needed — accumulating subscribers across multiple
    // open/close cycles is the bug we'd hit otherwise.
    this.coordinator
      .backdropClick$()
      .subscribe(() => this.closeOverlay('backdrop'));

    this.coordinator.escape$().subscribe((event) => {
      event.preventDefault();
      this.closeOverlay('escape', /* restore */ true);
    });

    // Defer `opened` emission until after the enter animation completes — was
    // previously fired synchronously on open() (audit Medium, date-picker.ts:1199).
    this.coordinator
      .opened$()
      .subscribe(() => this.opened.emit({ trigger: this.elementRef.nativeElement }));

    queueMicrotask(() => {
      this.overlayInstance?.focusCalendar();
    });
  }

  private closeOverlay(reason: DatePickerCloseReason, restore = false): void {
    if (this.closingSignal() || !this.overlayInstance) return;
    this.closingSignal.set(true);
    this.overlayInstance.leaving.set(true);

    if (restore) {
      const previous = this.lastValueBeforeOpen();
      if (previous !== this.internalValue()) {
        // Silent restore — no emit of dateChange.
        this.internalValue.set(previous);
        this.value.set(previous);
        const display = previous === null ? '' : this.adapter.format(previous, this.effectiveFormat());
        this.rawInputText.set(display);
        this.parseError.set(false);
        this.rangeError.set(false);
      }
    }

    // Fallback chain ensures focus always returns to a visible element even when
    // returnFocusTo was never set (e.g. open() flipped programmatically).
    (this.returnFocusTo ?? this.resolveFocusTarget()).focus();

    this.coordinator.close(() => {
      this.overlayInstanceSignal.set(null);
      this.pendingCalendarValue.set(null);
      this.returnFocusTo = null;
      untracked(() => this.open.set(false));
      this.closingSignal.set(false);
      this.closed.emit(reason);
    });
  }

  // ── Calendar / action-bar callbacks ──

  private onCalendarSelection(date: D): void {
    const withTime = this.withTime() ? this.carryTimeOfDay(date) : date;
    // When time-of-day editing is active, picking a day never auto-commits —
    // the user needs a chance to tweak the time before closing.
    if (this.showActions() || this.withTime()) {
      this.pendingCalendarValue.set(withTime);
      return;
    }
    this.commit(withTime, 'calendar');
    this.closeOverlay('select');
  }

  /** @internal Called by the overlay when the embedded time-picker reports a new value. */
  private onTimeInput(date: D | null): void {
    if (date === null) {
      this.pendingCalendarValue.set(null);
      if (!this.showActions()) {
        this.commit(null, 'calendar');
      }
      return;
    }
    this.pendingCalendarValue.set(date);
    if (!this.showActions()) {
      this.commit(date, 'calendar');
    }
  }

  private onTodayClicked(): void {
    const today = this.adapter.today();
    if (!this.isInRange(today)) return;
    const withTime = this.withTime() ? this.carryTimeOfDay(today) : today;
    this.pendingCalendarValue.set(withTime);
  }

  /** Copies the time-of-day from the current pending/selected value onto `picked`. */
  private carryTimeOfDay(picked: D): D {
    const source = this.pendingCalendarValue() ?? this.internalValue();
    if (source === null || !this.adapter.isValid(source)) return picked;
    return this.adapter.withTime(
      picked,
      this.adapter.getHours(source),
      this.adapter.getMinutes(source),
      this.adapter.getSeconds(source),
    );
  }

  private onClearAction(): void {
    this.commit(null, 'clear');
    this.closeOverlay('apply');
  }

  private onCancelAction(): void {
    this.closeOverlay('cancel', /* restore */ true);
  }

  private onApplyAction(): void {
    const pending = this.pendingCalendarValue();
    if (pending !== null && !this.isInRange(pending)) {
      this.closeOverlay('cancel', /* restore */ true);
      return;
    }
    this.commit(pending, 'apply');
    this.closeOverlay('apply');
  }

  private onPresetClick(preset: DatePickerPreset<D>): void {
    const next = preset.date();
    if (!this.adapter.isValid(next) || !this.isInRange(next)) return;
    this.activePresetIdSignal.set(preset.id);
    this.presetSelected.emit(preset);
    if (this.showActions()) {
      this.pendingCalendarValue.set(next);
      return;
    }
    this.commit(next, 'calendar');
    this.closeOverlay('select');
  }

  // ── Helpers ──

  private resolveDialogAriaLabel(): string {
    return this.ariaLabel() || 'Choose a date';
  }

  private resolvePanelClass(): string {
    const raw = this.panelClass();
    return Array.isArray(raw) ? raw.join(' ') : (raw as string);
  }

  /** Picks the best element to receive focus on overlay close. Prefers the explicit `returnFocusTo` source, then the trigger button, the projected custom trigger, and finally the input. */
  private resolveFocusTarget(): HTMLElement {
    const trigger = this.triggerRef();
    if (trigger) return trigger.nativeElement;
    const host = this.elementRef.nativeElement;
    const custom = host.querySelector('[slot="trigger"]') as HTMLElement | null;
    if (custom) return custom;
    return this.inputRef().nativeElement;
  }

  // ── ControlValueAccessor ──

  writeValue(value: unknown): void {
    if (value === null || value === undefined || value === '') {
      this.internalValue.set(null);
      this.value.set(null);
      this.parseError.set(false);
      this.rangeError.set(false);
      this.rawInputText.set('');
      this.dateChange.emit({
        value: null,
        previousValue: this.internalValue(),
        source: 'programmatic',
      });
      return;
    }
    const coerced = this.adapter.deserialize(value);
    if (coerced === null) {
      this.internalValue.set(null);
      this.value.set(null);
      this.rawInputText.set('');
      this.parseError.set(false);
      this.rangeError.set(false);
      return;
    }
    if (!this.adapter.isValid(coerced)) {
      this.parseError.set(true);
      this.rawInputText.set(String(value));
      return;
    }
    const previous = this.internalValue();
    this.internalValue.set(coerced);
    this.value.set(coerced);
    this.parseError.set(false);
    this.rangeError.set(false);
    this.rawInputText.set(this.adapter.format(coerced, this.effectiveFormat()));
    this.dateChange.emit({ value: coerced, previousValue: previous, source: 'programmatic' });
  }

  registerOnChange(fn: (value: D | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  // ── FormFieldControl methods ──

  /** @internal */
  setDescribedByIds(ids: string[]): void {
    this.describedByIdsSignal.set([...ids]);
  }

  /** @internal */
  onContainerClick(event: MouseEvent): void {
    if (this.isDisabled() || this.hasCustomTrigger()) return;
    // Don't steal focus when the user clicks the trigger button directly.
    const target = event.target as HTMLElement | null;
    const triggerEl = this.triggerRef()?.nativeElement;
    if (triggerEl && target && triggerEl.contains(target)) return;
    const inputEl = this.inputRef()?.nativeElement;
    if (inputEl && document.activeElement !== inputEl) {
      inputEl.focus();
    }
  }
}
