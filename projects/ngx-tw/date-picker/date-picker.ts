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
import {
  type ConnectedPosition,
  Overlay,
  type OverlayRef,
  type ScrollStrategy,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { FocusMonitor, FocusTrapFactory, LiveAnnouncer } from '@angular/cdk/a11y';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge, Subscription } from 'rxjs';
import { tv } from 'tailwind-variants';
import {
  type ErrorStateMatcher,
  type TimePickerFormat,
  timeOfDaySeconds,
  TW_ERROR_STATE_MATCHER,
  type TwColor,
  type TwFormSubmitted,
  type TwSize,
} from 'ngx-tw/core';
import {
  FormFieldComponent,
  FormFieldControl,
  TW_FORM_FIELD_CONTROL,
} from 'ngx-tw/form-field';
import { DATE_ADAPTER, type DateAdapter } from 'ngx-tw/calendar';
import type { TwCalendarView, TwDateFilter } from 'ngx-tw/calendar';
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

/** Re-exported from `ngx-tw/calendar` for consumers importing only the date-picker. */
export type { TwCalendarView, TwDateFilter };

/** Re-exported from `ngx-tw/core` for consumers importing only the date-picker. */
export type { TimePickerFormat };

// ── Constants ─────────────────────────────────────────────────────

// Duration for leave animation — matches theme/_base.css scale-out/fade-out.
const ANIMATION_DURATION = 150;

// ── tv() config ───────────────────────────────────────────────────

const datePickerVariants = tv(
  {
    slots: {
      root: 'relative inline-flex items-center w-full text-fg transition-[color,border-color,box-shadow] duration-200 motion-reduce:transition-none',
      input:
        'flex-1 min-w-0 bg-transparent text-fg placeholder:text-fg-subtle outline-none border-0 p-0 m-0 font-inherit',
      triggerButton:
        'inline-flex items-center justify-center shrink-0 rounded-md text-fg-muted hover:text-fg hover:bg-surface-muted transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
      triggerIcon: 'shrink-0',
      clearButton:
        'inline-flex items-center justify-center shrink-0 rounded-md text-fg-muted hover:text-fg hover:bg-surface-muted transition-colors duration-200 motion-reduce:transition-none size-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
    },
    variants: {
      size: {
        xs: {
          root: 'gap-1 text-xs',
          input: 'text-xs',
          triggerButton: 'size-6',
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

// ── Overlay positions ─────────────────────────────────────────────

function buildDatePickerPositions(offset: number): ConnectedPosition[] {
  return [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: offset },
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: offset },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -offset },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -offset },
  ];
}

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
  ],
  template: `
    <input
      #dateInput
      type="text"
      [id]="hostId"
      [class]="inputClasses()"
      [value]="rawInputText()"
      [placeholder]="placeholder() || ''"
      [disabled]="isDisabled()"
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

    @if (showClear() && !isEmpty() && !isDisabled() && !readonlyInput()) {
      <button
        type="button"
        tabindex="-1"
        [class]="clearButtonClasses()"
        [attr.aria-label]="'Clear date'"
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
  readonly dateFilter = input<TwDateFilter<D> | null>(null);

  /** Which calendar view opens first — `'day'`, `'month'`, or `'year'`. Defaults to `'day'`. */
  readonly startView = input<TwCalendarView>('day');

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

  /** When true, the overlay also renders a `<tw-time-picker>` so users can pick a time-of-day alongside the date. Defaults to `false`. */
  readonly withTime = input<boolean>(false);

  /** Format of the embedded time-picker. `'24h'` renders 00–23 hours; `'12h'` adds an AM/PM toggle. Defaults to `'24h'`. */
  readonly timeFormat = input<TimePickerFormat>('24h');

  /** Whether the embedded time-picker exposes a seconds field. Defaults to `false`. */
  readonly showSeconds = input<boolean>(false);

  /** Step for the embedded time-picker's hour field. Defaults to `1`. */
  readonly hourStep = input<number>(1);

  /** Step for the embedded time-picker's minute field. Defaults to `1`. */
  readonly minuteStep = input<number>(1);

  /** Step for the embedded time-picker's second field. Defaults to `1`. */
  readonly secondStep = input<number>(1);

  /** Earliest accepted time-of-day. Values earlier than this set `errorState`. Ignored when `withTime` is false. */
  readonly minTime = input<D | null>(null);

  /** Latest accepted time-of-day. Values later than this set `errorState`. Ignored when `withTime` is false. */
  readonly maxTime = input<D | null>(null);

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

  // ── Injected deps ──

  private readonly adapter = inject<DateAdapter<D>>(DATE_ADAPTER);
  private readonly overlayService = inject(Overlay);
  private readonly focusMonitor = inject(FocusMonitor);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly focusTrapFactory = inject(FocusTrapFactory);
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
  private readonly triggerRef = viewChild.required<ElementRef<HTMLButtonElement>>('triggerBtn');

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
  private readonly _ngControlRev = signal(0);
  private readonly _formSubmitRev = signal(0);

  private onChange: (value: D | null) => void = () => {};
  private onTouched: () => void = () => {};

  private overlayRef: OverlayRef | null = null;
  private readonly overlayInstanceSignal = signal<DatePickerOverlayComponent<D> | null>(null);
  private focusTrap: ReturnType<FocusTrapFactory['create']> | null = null;
  private perOpenSubs: Subscription | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
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

  /** @internal Effective display format — folds hour/minute (and optional seconds) into the default when `withTime` is on and the user hasn't overridden `format`. */
  readonly effectiveFormat = computed<unknown>(() => {
    const fmt = this.format();
    if (!this.withTime() || fmt !== DEFAULT_DISPLAY_FORMAT) return fmt;
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
    effect(() => {
      const instance = this.overlayInstance;
      if (!instance) return;
      instance.size.set(this.size());
      instance.color.set(this.color());
      instance.minDate.set(this.minDate());
      instance.maxDate.set(this.maxDate());
      instance.dateFilter.set(this.dateFilter());
      instance.startView.set(this.startView());
      instance.startAt.set(this.startAt() ?? this.internalValue() ?? null);
      instance.pendingValue.set(this.pendingCalendarValue());
      instance.showActions.set(this.showActions());
      instance.todayLabel.set(this.todayLabel());
      instance.clearLabel.set(this.clearLabel());
      instance.cancelLabel.set(this.cancelLabel());
      instance.applyLabel.set(this.applyLabel());
      instance.dialogId.set(this.dialogId);
      instance.dialogAriaLabel.set(this.resolveDialogAriaLabel());
      instance.panelClassValue.set(this.resolvePanelClass());
      instance.withTime.set(this.withTime());
      instance.timeFormat.set(this.timeFormat());
      instance.showSeconds.set(this.showSeconds());
      instance.hourStep.set(this.hourStep());
      instance.minuteStep.set(this.minuteStep());
      instance.secondStep.set(this.secondStep());
      instance.minTime.set(this.minTime());
      instance.maxTime.set(this.maxTime());
    });

    // Dev-mode accessible-name warning.
    afterNextRender(() => {
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
      this.clearCloseTimer();
      this.destroyFocusTrap();
      this.perOpenSubs?.unsubscribe();
      this.overlayRef?.dispose();
      this.overlayRef = null;
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
    this.rawInputText.set(target.value);
    this.parseError.set(false);
    this.rangeError.set(false);
    this.dateInput.emit({ rawText: target.value, parsed: null, target });
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
    this.returnFocusTo = this.triggerRef().nativeElement;
    this.toggle();
  }

  /** @internal */
  onTriggerKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      this.returnFocusTo = this.triggerRef().nativeElement;
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
    const min = this.minTime();
    const max = this.maxTime();
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
      this.returnFocusTo = this.inputRef().nativeElement;
    }
    this.lastValueBeforeOpen.set(this.internalValue());
    this.pendingCalendarValue.set(this.internalValue());
    this.ensureOverlay();
    this.attachOverlayComponent();
    this.subscribePerOpen();
    this.setupFocusTrap();
    queueMicrotask(() => {
      this.overlayInstance?.focusCalendar();
    });
    this.opened.emit({ trigger: this.elementRef.nativeElement });
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

    this.destroyFocusTrap();
    this.returnFocusTo?.focus();

    this.closeTimer = setTimeout(() => {
      this.closeTimer = null;
      if (this.overlayRef?.hasAttached()) {
        this.overlayRef.detach();
      }
      this.perOpenSubs?.unsubscribe();
      this.perOpenSubs = null;
      this.overlayInstanceSignal.set(null);
      this.pendingCalendarValue.set(null);
      this.returnFocusTo = null;
      untracked(() => this.open.set(false));
      this.closingSignal.set(false);
      this.closed.emit(reason);
    }, ANIMATION_DURATION);
  }

  private ensureOverlay(): void {
    if (this.overlayRef) return;
    const positionStrategy = this.overlayService
      .position()
      .flexibleConnectedTo(this.elementRef)
      .withPositions(buildDatePickerPositions(this.offset()))
      .withFlexibleDimensions(false)
      .withPush(false)
      .withViewportMargin(8);

    this.overlayRef = this.overlayService.create({
      positionStrategy,
      scrollStrategy: this.resolveScrollStrategy(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      panelClass: 'tw-date-picker-panel',
    });
  }

  private attachOverlayComponent(): void {
    if (!this.overlayRef) return;
    const portal = new ComponentPortal<DatePickerOverlayComponent<D>>(
      DatePickerOverlayComponent as unknown as new () => DatePickerOverlayComponent<D>,
      this.viewContainerRef,
      this.injector,
    );
    const ref = this.overlayRef.attach(portal);
    const instance = ref.instance;
    instance.onCalendarSelect.set((date) => this.onCalendarSelection(date));
    instance.onTimeInput.set((date) => this.onTimeInput(date));
    instance.onToday.set(() => this.onTodayClicked());
    instance.onClear.set(() => this.onClearAction());
    instance.onCancel.set(() => this.onCancelAction());
    instance.onApply.set(() => this.onApplyAction());
    this.overlayInstanceSignal.set(instance);
  }

  private subscribePerOpen(): void {
    this.perOpenSubs?.unsubscribe();
    this.perOpenSubs = new Subscription();
    if (!this.overlayRef) return;

    this.perOpenSubs.add(
      this.overlayRef
        .backdropClick()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.closeOverlay('backdrop')),
    );

    this.perOpenSubs.add(
      this.overlayRef
        .keydownEvents()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            this.closeOverlay('escape', /* restore */ true);
          }
        }),
    );
  }

  private setupFocusTrap(): void {
    if (!this.overlayRef) return;
    const overlayEl = this.overlayRef.overlayElement;
    this.focusTrap = this.focusTrapFactory.create(overlayEl);
  }

  private destroyFocusTrap(): void {
    this.focusTrap?.destroy();
    this.focusTrap = null;
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

  // ── Helpers ──

  private resolveDialogAriaLabel(): string {
    return this.ariaLabel() || 'Choose a date';
  }

  private resolvePanelClass(): string {
    const raw = this.panelClass();
    return Array.isArray(raw) ? raw.join(' ') : (raw as string);
  }

  private resolveScrollStrategy(): ScrollStrategy {
    const s = this.scrollStrategy();
    switch (s) {
      case 'close':
        return this.overlayService.scrollStrategies.close();
      case 'block':
        return this.overlayService.scrollStrategies.block();
      default:
        return this.overlayService.scrollStrategies.reposition();
    }
  }

  private clearCloseTimer(): void {
    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
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
    if (this.isDisabled()) return;
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
