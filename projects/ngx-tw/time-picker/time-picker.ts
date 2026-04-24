import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  forwardRef,
  inject,
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
} from '@angular/core';
import {
  type ControlValueAccessor,
  FormGroupDirective,
  NgControl,
  NgForm,
  Validators,
} from '@angular/forms';
import { FocusMonitor, LiveAnnouncer } from '@angular/cdk/a11y';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import { tv } from 'tailwind-variants';
import {
  appendDigit,
  clamp,
  type ErrorStateMatcher,
  fieldMax,
  fieldMin,
  from12h,
  isTerminalDigit,
  padTwo,
  parseField,
  stepWithWrap,
  timeOfDaySeconds,
  to12h,
  type TimePickerFormat,
  type TimePickerMeridiem,
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

// ── Public types ──────────────────────────────────────────────────

/** Visual style of the time-picker chrome. */
export type TimePickerVariant = 'default' | 'naked';

/** Logical field inside the time-picker. */
export type TimePickerField = 'hour' | 'minute' | 'second' | 'meridiem';

/** Origin of a value change — useful when consumers need to distinguish user input from programmatic writes. */
export type TimePickerChangeSource =
  | 'input'
  | 'stepper'
  | 'meridiem'
  | 'clear'
  | 'programmatic';

/** Emitted by `timeChange` after a committed value update. */
export interface TimePickerChangeEvent<D> {
  /** The committed value (`null` when cleared). */
  readonly value: D | null;
  /** The value before this change. */
  readonly previousValue: D | null;
  /** What triggered the change. */
  readonly source: TimePickerChangeSource;
}

/** Emitted by `timeInput` before a commit, on every keystroke or stepper press. */
export interface TimePickerInputEvent<D> {
  /** Which field was edited. */
  readonly field: TimePickerField;
  /** The raw text currently in that field (pre-commit). */
  readonly rawText: string;
  /** The parsed value if fields form a valid time, else `null`. */
  readonly parsed: D | null;
}

// Re-export the shared format / meridiem aliases so consumers can import
// them from `ngx-tw/time-picker` without reaching into core.
export type { TimePickerFormat, TimePickerMeridiem } from 'ngx-tw/core';

// ── tv() config ───────────────────────────────────────────────────

const timePickerVariants = tv(
  {
    slots: {
      root: 'inline-flex items-center text-fg transition-[color,border-color,box-shadow] duration-200 motion-reduce:transition-none',
      fieldGroup: 'inline-flex items-center tabular-nums font-medium',
      field:
        'bg-transparent text-center outline-none border-0 p-0 m-0 text-fg placeholder:text-fg-subtle rounded-md caret-transparent focus-visible:bg-surface-muted',
      separator: 'text-fg-subtle select-none px-0.5',
      stepperGroup: 'flex flex-col ml-0.5',
      stepper:
        'inline-flex items-center justify-center text-fg-muted hover:text-fg hover:bg-surface-muted rounded-md transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-40 disabled:pointer-events-none',
      meridiem:
        'inline-flex items-center rounded-md border border-border overflow-hidden ml-2 shrink-0',
      meridiemButton:
        'font-medium text-fg-muted hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 transition-colors duration-200 motion-reduce:transition-none disabled:opacity-40 disabled:pointer-events-none',
      clearButton:
        'inline-flex items-center justify-center shrink-0 rounded-md text-fg-muted hover:text-fg hover:bg-surface-muted transition-colors duration-200 motion-reduce:transition-none size-5 ml-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
    },
    variants: {
      size: {
        xs: {
          root: 'gap-1 text-xs',
          field: 'w-5 text-xs',
          stepper: 'size-3',
          meridiemButton: 'px-1.5 py-0.5 text-2xs',
        },
        sm: {
          root: 'gap-1 text-sm',
          field: 'w-6 text-sm',
          stepper: 'size-3.5',
          meridiemButton: 'px-2 py-0.5 text-xs',
        },
        md: {
          root: 'gap-1.5 text-sm',
          field: 'w-7 text-sm',
          stepper: 'size-4',
          meridiemButton: 'px-2 py-1 text-xs',
        },
        lg: {
          root: 'gap-1.5 text-base',
          field: 'w-8 text-base',
          stepper: 'size-5',
          meridiemButton: 'px-2.5 py-1 text-sm',
        },
        xl: {
          root: 'gap-2 text-base',
          field: 'w-9 text-base',
          stepper: 'size-5',
          meridiemButton: 'px-3 py-1.5 text-sm',
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
      disabled: false,
      errorState: false,
      focused: false,
      color: 'primary',
    },
  },
  { twMerge: true },
);

let nextTimePickerId = 0;

/**
 * Segmented time editor. Renders `HH : MM` (with an optional `: SS` and/or
 * `AM/PM` toggle) and integrates with all three Angular form strategies via
 * `ControlValueAccessor`. Also participates in `<tw-form-field>` through
 * `FormFieldControl` — wrapping is optional.
 *
 * Value type is `D | null`. Every time operation flows through the injected
 * `DateAdapter<D>`, so the component works with the default native adapter
 * (`provideNativeDateAdapter()`) or any custom adapter a consumer ships.
 */
@Component({
  selector: 'tw-time-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TW_FORM_FIELD_CONTROL,
      useExisting: forwardRef(() => TimePickerComponent),
    },
  ],
  template: `
    <div [class]="fieldGroupClasses()" role="group" [attr.aria-label]="groupAriaLabel()">
      <input
        #hourInput
        type="text"
        inputmode="numeric"
        autocomplete="off"
        maxlength="2"
        [class]="fieldClasses()"
        [value]="hourDisplay()"
        [placeholder]="placeholder() ?? '--'"
        [disabled]="isDisabled()"
        [attr.readonly]="readonlyInput() ? 'true' : null"
        [attr.aria-label]="'Hours'"
        [attr.role]="'spinbutton'"
        [attr.aria-valuemin]="hourMin()"
        [attr.aria-valuemax]="hourMax()"
        [attr.aria-valuenow]="hourValueNow()"
        [attr.aria-valuetext]="hourValueText()"
        [attr.aria-invalid]="errorState() || null"
        [attr.aria-disabled]="isDisabled() || null"
        (keydown)="onFieldKeydown($event, 'hour')"
        (beforeinput)="onBeforeInput($event, 'hour')"
        (input)="onInputEvent($event, 'hour')"
        (focus)="onFieldFocus('hour')"
        (blur)="onFieldBlur('hour')"
      />

      <span [class]="separatorClasses()" aria-hidden="true">:</span>

      <input
        #minuteInput
        type="text"
        inputmode="numeric"
        autocomplete="off"
        maxlength="2"
        [class]="fieldClasses()"
        [value]="minuteText()"
        [placeholder]="placeholder() ?? '--'"
        [disabled]="isDisabled()"
        [attr.readonly]="readonlyInput() ? 'true' : null"
        [attr.aria-label]="'Minutes'"
        [attr.role]="'spinbutton'"
        [attr.aria-valuemin]="0"
        [attr.aria-valuemax]="59"
        [attr.aria-valuenow]="minuteValueNow()"
        [attr.aria-valuetext]="minuteValueText()"
        [attr.aria-invalid]="errorState() || null"
        [attr.aria-disabled]="isDisabled() || null"
        (keydown)="onFieldKeydown($event, 'minute')"
        (beforeinput)="onBeforeInput($event, 'minute')"
        (input)="onInputEvent($event, 'minute')"
        (focus)="onFieldFocus('minute')"
        (blur)="onFieldBlur('minute')"
      />

      @if (showSeconds()) {
        <span [class]="separatorClasses()" aria-hidden="true">:</span>

        <input
          #secondInput
          type="text"
          inputmode="numeric"
          autocomplete="off"
          maxlength="2"
          [class]="fieldClasses()"
          [value]="secondText()"
          [placeholder]="placeholder() ?? '--'"
          [disabled]="isDisabled()"
          [attr.readonly]="readonlyInput() ? 'true' : null"
          [attr.aria-label]="'Seconds'"
          [attr.role]="'spinbutton'"
          [attr.aria-valuemin]="0"
          [attr.aria-valuemax]="59"
          [attr.aria-valuenow]="secondValueNow()"
          [attr.aria-valuetext]="secondValueText()"
          [attr.aria-invalid]="errorState() || null"
          [attr.aria-disabled]="isDisabled() || null"
          (keydown)="onFieldKeydown($event, 'second')"
          (beforeinput)="onBeforeInput($event, 'second')"
          (input)="onInputEvent($event, 'second')"
          (focus)="onFieldFocus('second')"
          (blur)="onFieldBlur('second')"
        />
      }
    </div>

    @if (showSteppers()) {
      <div [class]="stepperGroupClasses()">
        <button
          type="button"
          tabindex="-1"
          [class]="stepperClasses()"
          [attr.aria-label]="'Increase ' + (focusedField() ?? 'hours')"
          [disabled]="isDisabled() || readonlyInput()"
          (mousedown)="onStepperMouseDown($event)"
          (click)="onStepperClick(1)"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" width="10" height="10">
            <path fill-rule="evenodd" d="M14.77 12.79a.75.75 0 0 1-1.06-.02L10 8.94l-3.71 3.83a.75.75 0 1 1-1.08-1.04l4.25-4.39a.75.75 0 0 1 1.08 0l4.25 4.39a.75.75 0 0 1-.02 1.06Z" clip-rule="evenodd" />
          </svg>
        </button>
        <button
          type="button"
          tabindex="-1"
          [class]="stepperClasses()"
          [attr.aria-label]="'Decrease ' + (focusedField() ?? 'hours')"
          [disabled]="isDisabled() || readonlyInput()"
          (mousedown)="onStepperMouseDown($event)"
          (click)="onStepperClick(-1)"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" width="10" height="10">
            <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    }

    @if (format() === '12h') {
      <div [class]="meridiemClasses()" role="radiogroup" aria-label="AM or PM">
        <button
          type="button"
          [class]="meridiemButtonClasses('AM')"
          [attr.aria-pressed]="meridiem() === 'AM'"
          [attr.aria-label]="'AM'"
          [disabled]="isDisabled() || readonlyInput()"
          (click)="setMeridiem('AM')"
          (keydown)="onMeridiemKeydown($event, 'AM')"
        >AM</button>
        <button
          type="button"
          [class]="meridiemButtonClasses('PM')"
          [attr.aria-pressed]="meridiem() === 'PM'"
          [attr.aria-label]="'PM'"
          [disabled]="isDisabled() || readonlyInput()"
          (click)="setMeridiem('PM')"
          (keydown)="onMeridiemKeydown($event, 'PM')"
        >PM</button>
      </div>
    }

    @if (showClear() && !isEmpty() && !isDisabled() && !readonlyInput()) {
      <button
        type="button"
        tabindex="-1"
        [class]="clearButtonClasses()"
        [attr.aria-label]="clearLabel()"
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
    '[id]': 'hostId',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[attr.aria-invalid]': 'errorState() || null',
    '[attr.data-variant]': 'resolvedVariant()',
  },
})
export class TimePickerComponent<D = Date>
  extends FormFieldControl<D>
  implements ControlValueAccessor, OnInit
{
  // ── Inputs ──

  /** Id on the time-picker's host element. Auto-generated when not provided. Used by the form-field's `<label for>` attribute. */
  readonly idInput = input<string | undefined>(undefined, { alias: 'id' });

  /** When true, the whole component is disabled and every field sets `aria-disabled="true"`. Defaults to `false`. */
  readonly disabledInput = input<boolean>(false, { alias: 'disabled' });

  /** When true, exposes `aria-required="true"`. Validators.required on a bound NgControl is also honoured. Defaults to `false`. */
  readonly requiredInput = input<boolean>(false, { alias: 'required' });

  /** When true, blocks typing, stepping, and the AM/PM toggle — the value is still read-only visible. Defaults to `false`. */
  readonly readonlyInput = input<boolean>(false, { alias: 'readonly' });

  /** Controls field height, font size, and stepper density. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** Semantic color used for the focused border and focus ring. Defaults to `'primary'`. */
  readonly color = input<TwColor>('primary');

  /** Visual style of the chrome. `'default'` draws its own border; `'naked'` strips chrome. Auto-resolves to `'naked'` inside `<tw-form-field>`. */
  readonly variant = input<TimePickerVariant | undefined>(undefined);

  /** `'12h'` renders 1–12 hours with an AM/PM toggle; `'24h'` renders 00–23. Defaults to `'24h'`. */
  readonly format = input<TimePickerFormat>('24h');

  /** When true, renders a seconds field after minutes. Defaults to `false`. */
  readonly showSeconds = input<boolean>(false);

  /** Amount to add/subtract when stepping hours. Defaults to `1`. */
  readonly hourStep = input<number>(1);

  /** Amount to add/subtract when stepping minutes. Defaults to `1`. */
  readonly minuteStep = input<number>(1);

  /** Amount to add/subtract when stepping seconds. Defaults to `1`. */
  readonly secondStep = input<number>(1);

  /** Earliest accepted time-of-day. Values earlier than this set `errorState`. Defaults to `null`. */
  readonly minTime = input<D | null>(null);

  /** Latest accepted time-of-day. Values later than this set `errorState`. Defaults to `null`. */
  readonly maxTime = input<D | null>(null);

  /** Date portion used when the user types a time while `value` is `null`. Defaults to today. */
  readonly referenceDate = input<D | null>(null);

  /** Placeholder shown in each field when empty. Defaults to `'--'`. */
  readonly placeholder = input<string | undefined>(undefined);

  /** Whether to render the up/down stepper column. Defaults to `true`. */
  readonly showSteppers = input<boolean>(true);

  /** Whether to render the clear affordance when a value is set. Defaults to `true`. */
  readonly showClear = input<boolean>(true);

  /** Accessible label for the clear button. Defaults to `'Clear time'`. */
  readonly clearLabel = input<string>('Clear time');

  /** Per-instance override of the `ErrorStateMatcher`. */
  readonly errorStateMatcher = input<ErrorStateMatcher | undefined>(undefined);

  /** Accessible name for the fields group. Required when no visible label is supplied. Alias: `aria-label`. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  /** ID of an external element that labels the group. Alias: `aria-labelledby`. */
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  /** Consumer-supplied `aria-describedby` ids. The form-field preserves these when merging hint/error ids. Alias: `aria-describedby`. */
  readonly userAriaDescribedByInput = input<string | undefined>(undefined, {
    alias: 'aria-describedby',
  });

  // ── Models ──

  /** Two-way bound current time. `null` when empty. Setting programmatically updates the fields without firing `onChange`. */
  readonly value = model<D | null>(null);

  // ── Outputs ──

  /** Fires on every keystroke, stepper press, or AM/PM toggle — before the new value is committed. */
  readonly timeInput = output<TimePickerInputEvent<D>>();

  /** Fires after a committed change — digit + auto-advance, stepper, meridiem toggle, clear, or programmatic write. */
  readonly timeChange = output<TimePickerChangeEvent<D>>();

  // ── Injected deps ──

  private readonly adapter = inject<DateAdapter<D>>(DATE_ADAPTER);
  private readonly focusMonitor = inject(FocusMonitor);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formField = inject(FormFieldComponent, { optional: true });
  private readonly ngControl = inject(NgControl, { optional: true, self: true });
  private readonly parentForm = inject(NgForm, { optional: true });
  private readonly parentFormGroup = inject(FormGroupDirective, { optional: true });
  private readonly defaultMatcher = inject(TW_ERROR_STATE_MATCHER);

  // ── View refs ──

  private readonly hourInputRef = viewChild.required<ElementRef<HTMLInputElement>>('hourInput');
  private readonly minuteInputRef =
    viewChild.required<ElementRef<HTMLInputElement>>('minuteInput');
  private readonly secondInputRef =
    viewChild<ElementRef<HTMLInputElement>>('secondInput');

  // ── Identity ──

  private readonly uid = nextTimePickerId++;
  /** @internal */
  readonly hostId = `tw-time-picker-${this.uid}`;

  // ── Internal state ──

  /** @internal raw display text per field — always the numerals the user sees. */
  readonly hourText = signal<string>('');
  /** @internal */
  readonly minuteText = signal<string>('');
  /** @internal */
  readonly secondText = signal<string>('');
  /** @internal */
  readonly meridiem = signal<TimePickerMeridiem>('AM');
  /** @internal */
  readonly focusedField = signal<TimePickerField | null>(null);
  /** @internal */
  readonly internalValue = linkedSignal<D | null>(() => this.value());

  private readonly cvaDisabled = signal(false);
  private readonly describedByIdsSignal = signal<readonly string[]>([]);
  private readonly focusedSignal = signal(false);
  private readonly _ngControlRev = signal(0);
  private readonly _formSubmitRev = signal(0);
  /** When true, an effect should not rewrite field text from the external value. */
  private editing = false;

  private onChange: (value: D | null) => void = () => {};
  private onTouched: () => void = () => {};

  // ── Derived state ──

  /** @internal */
  readonly isDisabled = computed(() => {
    this._ngControlRev();
    return this.disabledInput() || this.cvaDisabled() || !!this.ngControl?.disabled;
  });

  /** @internal */
  readonly isEmpty = computed(() => this.internalValue() === null);

  /** @internal Effective variant — auto-naked when wrapped in tw-form-field. */
  readonly resolvedVariant = computed<TimePickerVariant>(
    () => this.variant() ?? (this.formField ? 'naked' : 'default'),
  );

  /** @internal */
  readonly hourMin = computed(() => fieldMin('hour', this.format()));
  /** @internal */
  readonly hourMax = computed(() => fieldMax('hour', this.format()));

  /** @internal */
  readonly hourDisplay = computed(() => this.hourText());

  /** @internal */
  readonly hourValueNow = computed(() => {
    const n = parseField(this.hourText());
    return n === null ? null : n;
  });

  /** @internal */
  readonly hourValueText = computed(() => {
    const n = this.hourValueNow();
    if (n === null) return 'Empty';
    const suffix = this.format() === '12h' ? ` ${this.meridiem()}` : '';
    return `${padTwo(n)}${suffix}`;
  });

  /** @internal */
  readonly minuteValueNow = computed(() => parseField(this.minuteText()));
  /** @internal */
  readonly minuteValueText = computed(() => {
    const n = this.minuteValueNow();
    return n === null ? 'Empty' : padTwo(n);
  });

  /** @internal */
  readonly secondValueNow = computed(() => parseField(this.secondText()));
  /** @internal */
  readonly secondValueText = computed(() => {
    const n = this.secondValueNow();
    return n === null ? 'Empty' : padTwo(n);
  });

  /** @internal */
  readonly groupAriaLabel = computed(() => this.ariaLabel() ?? 'Time');

  /** @internal */
  readonly describedBy = computed(() => {
    const extra = this.describedByIdsSignal();
    const user = this.userAriaDescribedByInput();
    const merged = [...extra];
    if (user) {
      for (const id of user.split(/\s+/)) if (id) merged.push(id);
    }
    return merged.length ? merged.join(' ') : '';
  });

  // ── Range / error state ──

  private readonly rangeError = signal(false);

  // ── tv() output ──

  private readonly variantResult = computed(() =>
    timePickerVariants({
      size: this.size(),
      variant: this.resolvedVariant(),
      disabled: this.isDisabled(),
      errorState: this.errorState(),
      focused: this.focusedSignal(),
      color: this.color(),
    }),
  );

  /** @internal */ readonly rootClasses = computed(() => this.variantResult().root());
  /** @internal */ readonly fieldGroupClasses = computed(() => this.variantResult().fieldGroup());
  /** @internal */ readonly fieldClasses = computed(() => this.variantResult().field());
  /** @internal */ readonly separatorClasses = computed(() => this.variantResult().separator());
  /** @internal */ readonly stepperGroupClasses = computed(() => this.variantResult().stepperGroup());
  /** @internal */ readonly stepperClasses = computed(() => this.variantResult().stepper());
  /** @internal */ readonly meridiemClasses = computed(() => this.variantResult().meridiem());
  /** @internal */ readonly clearButtonClasses = computed(() => this.variantResult().clearButton());

  /** @internal */
  meridiemButtonClasses(which: TimePickerMeridiem): string {
    const base = this.variantResult().meridiemButton();
    const active = this.meridiem() === which;
    return active
      ? `${base} bg-primary-500 text-primary-50 hover:bg-primary-600`
      : base;
  }

  // ── FormFieldControl impl ──

  /** @internal */ readonly id: Signal<string> = computed(() => this.idInput() ?? this.hostId);
  /** @internal */ readonly focused: Signal<boolean> = this.focusedSignal.asReadonly();
  /** @internal */ readonly empty: Signal<boolean> = this.isEmpty;
  /** @internal */ readonly disabled: Signal<boolean> = this.isDisabled;
  /** @internal */ readonly required: Signal<boolean> = computed(() => {
    this._ngControlRev();
    if (this.requiredInput()) return true;
    return !!this.ngControl?.control?.hasValidator(Validators.required);
  });
  /** @internal */
  readonly errorState: Signal<boolean> = computed(() => {
    this._ngControlRev();
    this._formSubmitRev();
    this.focusedSignal();
    if (this.rangeError()) return true;
    const matcher = this.errorStateMatcher() ?? this.defaultMatcher;
    const form: TwFormSubmitted | null =
      (this.parentFormGroup as TwFormSubmitted | null) ??
      (this.parentForm as TwFormSubmitted | null);
    return matcher.isErrorState(this.ngControl?.control ?? null, form);
  });
  /** @internal */ readonly controlType = 'time-picker';
  /** @internal */
  readonly userAriaDescribedBy: Signal<string | undefined> = computed(() =>
    this.userAriaDescribedByInput(),
  );

  // ── Constructor ──

  constructor() {
    super();

    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }

    // Sync the field text whenever the underlying value changes (programmatic).
    effect(() => {
      const v = this.internalValue();
      const fmt = this.format();
      const showS = this.showSeconds();
      untracked(() => {
        if (this.editing) return;
        if (v === null || !this.adapter.isValid(v)) {
          this.hourText.set('');
          this.minuteText.set('');
          this.secondText.set('');
          this.rangeError.set(false);
          return;
        }
        const h24 = this.adapter.getHours(v);
        const m = this.adapter.getMinutes(v);
        const s = this.adapter.getSeconds(v);
        if (fmt === '12h') {
          this.hourText.set(padTwo(to12h(h24)));
          this.meridiem.set(h24 >= 12 ? 'PM' : 'AM');
        } else {
          this.hourText.set(padTwo(h24));
        }
        this.minuteText.set(padTwo(m));
        this.secondText.set(showS ? padTwo(s) : '');
        this.rangeError.set(!this.isInRange(v));
      });
    });

    // Re-render the hour text when switching format (e.g., 24h → 12h) or showSeconds.
    effect(() => {
      this.format();
      this.showSeconds();
      untracked(() => {
        const v = this.internalValue();
        if (v === null || !this.adapter.isValid(v)) return;
        const h24 = this.adapter.getHours(v);
        if (this.format() === '12h') {
          this.hourText.set(padTwo(to12h(h24)));
          this.meridiem.set(h24 >= 12 ? 'PM' : 'AM');
        } else {
          this.hourText.set(padTwo(h24));
        }
        if (this.showSeconds() && !this.secondText()) {
          this.secondText.set(padTwo(this.adapter.getSeconds(v)));
        }
      });
    });

    // Dev-mode warning for missing accessible name.
    afterNextRender(() => {
      if (!isDevMode()) return;
      const hasLabel =
        !!this.ariaLabel() ||
        !!this.ariaLabelledby() ||
        !!this.formField?.labelChild();
      if (!hasLabel) {
        console.warn(
          '[tw-time-picker] The time-picker has no accessible name. Set aria-label, aria-labelledby, or wrap the component in a <tw-form-field> with a <label twLabel>.',
        );
      }
    });

    // Dev-mode warning for bogus steps.
    afterNextRender(() => {
      if (!isDevMode()) return;
      for (const [name, step] of [
        ['hourStep', this.hourStep()],
        ['minuteStep', this.minuteStep()],
        ['secondStep', this.secondStep()],
      ] as const) {
        if (step < 1 || !Number.isFinite(step)) {
          console.warn(
            `[tw-time-picker] ${name}=${step} is invalid. Using 1 instead.`,
          );
        }
      }
    });

    // Host focus tracking.
    const monitorSub = this.focusMonitor
      .monitor(this.elementRef, true)
      .subscribe((origin) => {
        const wasFocused = this.focusedSignal();
        this.focusedSignal.set(!!origin);
        if (wasFocused && !origin) {
          this.focusedField.set(null);
          this.editing = false;
          this.normalizeEmptyFields();
          this.onTouched();
          this._ngControlRev.update((n) => n + 1);
        }
      });

    this.destroyRef.onDestroy(() => {
      monitorSub.unsubscribe();
      this.focusMonitor.stopMonitoring(this.elementRef);
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

  /** Moves focus to the hours field. */
  focus(): void {
    this.hourInputRef().nativeElement.focus();
  }

  /** Clears the value and emits `timeChange` with `source: 'clear'`. */
  clear(): void {
    this.commit(null, 'clear');
  }

  // ── Field interactions ──

  /** @internal */
  onFieldFocus(field: TimePickerField): void {
    this.focusedField.set(field);
    this.editing = true;
    const el = this.getFieldEl(field);
    if (el) el.select();
  }

  /** @internal */
  onFieldBlur(_field: TimePickerField): void {
    this.editing = false;
    this.normalizeEmptyFields();
  }

  /** @internal */
  onBeforeInput(event: Event, field: TimePickerField): void {
    const evt = event as InputEvent;
    const data = evt.data ?? '';
    // Let browsers drive Backspace / Delete natively.
    if (evt.inputType === 'deleteContentBackward' || evt.inputType === 'deleteContentForward') {
      return;
    }
    // Replace default text insertion with our buffered digit logic.
    if (evt.inputType === 'insertText' && /^\d$/.test(data)) {
      evt.preventDefault();
      this.typeDigit(field, data);
    } else if (evt.inputType === 'insertText') {
      // Reject non-digit insertions.
      evt.preventDefault();
    }
  }

  /** @internal Handle native delete events (Backspace/Delete). */
  onInputEvent(event: Event, field: TimePickerField): void {
    const evt = event as InputEvent;
    const el = event.target as HTMLInputElement;
    if (evt.inputType === 'deleteContentBackward' || evt.inputType === 'deleteContentForward') {
      this.editing = true;
      const currentLen = this.getFieldText(field).length;
      const nativeText = el.value.replace(/\D/g, '').slice(0, 2);
      if (nativeText.length < currentLen || nativeText.length === 0) {
        this.setFieldText(field, nativeText);
        this.commitFromFields('input', field);
      }
    }
  }

  /** @internal */
  onFieldKeydown(event: KeyboardEvent, field: TimePickerField): void {
    if (this.isDisabled() || this.readonlyInput()) return;
    const key = event.key;

    switch (key) {
      case 'ArrowUp':
        event.preventDefault();
        this.stepField(field, 1, event.shiftKey);
        return;
      case 'ArrowDown':
        event.preventDefault();
        this.stepField(field, -1, event.shiftKey);
        return;
      case 'ArrowLeft':
        if (this.isFieldCaretAtStart(field)) {
          event.preventDefault();
          this.moveFocus(field, -1);
        }
        return;
      case 'ArrowRight':
        if (this.isFieldCaretAtEnd(field)) {
          event.preventDefault();
          this.moveFocus(field, 1);
        }
        return;
      case 'Home':
        event.preventDefault();
        this.setFieldText(field, padTwo(this.fieldMinFor(field)));
        this.commitFromFields('input', field);
        return;
      case 'End':
        event.preventDefault();
        this.setFieldText(field, padTwo(this.fieldMaxFor(field)));
        this.commitFromFields('input', field);
        return;
      case 'Delete':
      case 'Backspace':
        // Let native input drive these; `onInputEvent` syncs state.
        return;
      default:
        if (key.length === 1 && !/\d/.test(key)) {
          event.preventDefault();
        }
        return;
    }
  }

  /** @internal */
  setMeridiem(m: TimePickerMeridiem): void {
    if (this.isDisabled() || this.readonlyInput()) return;
    if (this.meridiem() === m) return;
    this.meridiem.set(m);
    this.commitFromFields('meridiem', 'meridiem');
  }

  /** @internal */
  onMeridiemKeydown(event: KeyboardEvent, m: TimePickerMeridiem): void {
    if (this.isDisabled() || this.readonlyInput()) return;
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.setMeridiem(m === 'AM' ? 'PM' : 'AM');
    }
  }

  /** @internal */
  onStepperMouseDown(event: MouseEvent): void {
    // Keep focus on the current field when clicking the stepper.
    event.preventDefault();
  }

  /** @internal */
  onStepperClick(direction: 1 | -1): void {
    const field = this.focusedField() ?? 'hour';
    if (field === 'meridiem') {
      this.setMeridiem(this.meridiem() === 'AM' ? 'PM' : 'AM');
      return;
    }
    this.stepField(field, direction, false);
    // Restore focus to the field we stepped.
    const el = this.getFieldEl(field);
    el?.focus();
  }

  /** @internal */
  onClearClick(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.clear();
  }

  // ── Helpers ──

  private typeDigit(field: TimePickerField, digit: string): void {
    if (field === 'meridiem') return;
    const max = this.fieldMaxFor(field);
    const current = this.getFieldText(field);
    const next = appendDigit(current, digit, max);
    const advance = isTerminalDigit(current, digit, max) || next.length === 2;
    this.setFieldText(field, next);
    this.commitFromFields('input', field);
    if (advance) this.moveFocus(field, 1);
  }

  private stepField(field: TimePickerField, direction: 1 | -1, shift: boolean): void {
    if (field === 'meridiem') {
      this.setMeridiem(this.meridiem() === 'AM' ? 'PM' : 'AM');
      return;
    }
    const step = this.stepFor(field) * (shift ? 2 : 1);
    const min = this.fieldMinFor(field);
    const max = this.fieldMaxFor(field);
    const current = parseField(this.getFieldText(field)) ?? min;
    const next = stepWithWrap(current, step, direction, min, max);
    this.setFieldText(field, padTwo(next));
    this.commitFromFields('stepper', field);
  }

  private commitFromFields(source: TimePickerChangeSource, field: TimePickerField): void {
    const hourRaw = parseField(this.hourText());
    const minuteRaw = parseField(this.minuteText());
    const secondRaw = this.showSeconds() ? parseField(this.secondText()) : 0;

    this.timeInput.emit({
      field,
      rawText: field === 'meridiem' ? this.meridiem() : this.getFieldText(field),
      parsed: this.buildValueIfComplete(hourRaw, minuteRaw, secondRaw),
    });

    if (hourRaw === null || minuteRaw === null || (this.showSeconds() && secondRaw === null)) {
      return;
    }

    const h24 = this.toCanonicalHour(hourRaw);
    if (h24 === null) return;
    const base = this.resolveBaseDate();
    const next = this.adapter.withTime(base, h24, minuteRaw, this.showSeconds() ? (secondRaw ?? 0) : 0);
    if (!this.adapter.isValid(next)) return;

    this.commit(next, source);
  }

  private buildValueIfComplete(h: number | null, m: number | null, s: number | null): D | null {
    if (h === null || m === null) return null;
    if (this.showSeconds() && s === null) return null;
    const h24 = this.toCanonicalHour(h);
    if (h24 === null) return null;
    const base = this.resolveBaseDate();
    const built = this.adapter.withTime(base, h24, m, this.showSeconds() ? (s ?? 0) : 0);
    return this.adapter.isValid(built) ? built : null;
  }

  private toCanonicalHour(display: number): number | null {
    if (this.format() === '12h') {
      if (display < 1 || display > 12) return null;
      return from12h(display, this.meridiem());
    }
    if (display < 0 || display > 23) return null;
    return display;
  }

  private resolveBaseDate(): D {
    const current = this.internalValue();
    if (current !== null && this.adapter.isValid(current)) return current;
    const reference = this.referenceDate();
    if (reference !== null && this.adapter.isValid(reference)) return reference;
    return this.adapter.today();
  }

  private commit(next: D | null, source: TimePickerChangeSource): void {
    const previous = this.internalValue();
    this.internalValue.set(next);
    this.value.set(next);
    this.rangeError.set(next !== null ? !this.isInRange(next) : false);

    if (source !== 'programmatic') {
      this.onChange(next);
      this.onTouched();
      if (next === null) {
        this.liveAnnouncer.announce('Time cleared', 'polite');
      } else {
        this.liveAnnouncer.announce(`${this.formatAnnouncement(next)} selected`, 'polite');
      }
    }

    this.timeChange.emit({ value: next, previousValue: previous, source });
  }

  private formatAnnouncement(v: D): string {
    const h24 = this.adapter.getHours(v);
    const m = this.adapter.getMinutes(v);
    const s = this.adapter.getSeconds(v);
    const secPart = this.showSeconds() ? `:${padTwo(s)}` : '';
    if (this.format() === '12h') {
      return `${padTwo(to12h(h24))}:${padTwo(m)}${secPart} ${h24 >= 12 ? 'PM' : 'AM'}`;
    }
    return `${padTwo(h24)}:${padTwo(m)}${secPart}`;
  }

  private isInRange(v: D): boolean {
    const min = this.minTime();
    const max = this.maxTime();
    if (!min && !max) return true;
    const vSecs = timeOfDaySeconds(
      this.adapter.getHours(v),
      this.adapter.getMinutes(v),
      this.adapter.getSeconds(v),
    );
    if (min && this.adapter.isValid(min)) {
      const minSecs = timeOfDaySeconds(
        this.adapter.getHours(min),
        this.adapter.getMinutes(min),
        this.adapter.getSeconds(min),
      );
      if (vSecs < minSecs) return false;
    }
    if (max && this.adapter.isValid(max)) {
      const maxSecs = timeOfDaySeconds(
        this.adapter.getHours(max),
        this.adapter.getMinutes(max),
        this.adapter.getSeconds(max),
      );
      if (vSecs > maxSecs) return false;
    }
    return true;
  }

  private normalizeEmptyFields(): void {
    // Zero-pad single-digit entries once the user leaves the component so the
    // display always settles to "HH : MM".
    for (const field of ['hour', 'minute', 'second'] as const) {
      if (field === 'second' && !this.showSeconds()) continue;
      const raw = this.getFieldText(field);
      if (raw.length === 1) {
        this.setFieldText(field, padTwo(Number(raw)));
      }
    }
  }

  private moveFocus(field: TimePickerField, direction: 1 | -1): void {
    const order: TimePickerField[] = this.showSeconds()
      ? ['hour', 'minute', 'second']
      : ['hour', 'minute'];
    const idx = order.indexOf(field);
    if (idx === -1) return;
    const nextIdx = clamp(idx + direction, 0, order.length - 1);
    if (nextIdx === idx) return;
    const el = this.getFieldEl(order[nextIdx]);
    el?.focus();
  }

  private isFieldCaretAtStart(field: TimePickerField): boolean {
    const el = this.getFieldEl(field);
    if (!el) return true;
    return (el.selectionStart ?? 0) === 0;
  }

  private isFieldCaretAtEnd(field: TimePickerField): boolean {
    const el = this.getFieldEl(field);
    if (!el) return true;
    const end = el.selectionEnd ?? 0;
    return end === el.value.length;
  }

  private getFieldEl(field: TimePickerField): HTMLInputElement | null {
    switch (field) {
      case 'hour':
        return this.hourInputRef().nativeElement;
      case 'minute':
        return this.minuteInputRef().nativeElement;
      case 'second':
        return this.secondInputRef()?.nativeElement ?? null;
      default:
        return null;
    }
  }

  private getFieldText(field: TimePickerField): string {
    switch (field) {
      case 'hour':
        return this.hourText();
      case 'minute':
        return this.minuteText();
      case 'second':
        return this.secondText();
      default:
        return '';
    }
  }

  private setFieldText(field: TimePickerField, next: string): void {
    this.editing = true;
    switch (field) {
      case 'hour':
        this.hourText.set(next);
        return;
      case 'minute':
        this.minuteText.set(next);
        return;
      case 'second':
        this.secondText.set(next);
        return;
      default:
        return;
    }
  }

  private stepFor(field: TimePickerField): number {
    switch (field) {
      case 'hour':
        return Math.max(1, Math.floor(this.hourStep()));
      case 'minute':
        return Math.max(1, Math.floor(this.minuteStep()));
      case 'second':
        return Math.max(1, Math.floor(this.secondStep()));
      default:
        return 1;
    }
  }

  private fieldMinFor(field: TimePickerField): number {
    if (field === 'hour') return fieldMin('hour', this.format());
    return 0;
  }

  private fieldMaxFor(field: TimePickerField): number {
    if (field === 'hour') return fieldMax('hour', this.format());
    return 59;
  }

  // ── ControlValueAccessor ──

  writeValue(value: unknown): void {
    if (value === null || value === undefined || value === '') {
      const previous = this.internalValue();
      this.internalValue.set(null);
      this.value.set(null);
      this.rangeError.set(false);
      this.hourText.set('');
      this.minuteText.set('');
      this.secondText.set('');
      this.timeChange.emit({ value: null, previousValue: previous, source: 'programmatic' });
      return;
    }
    const coerced = this.adapter.deserialize(value);
    if (coerced === null || !this.adapter.isValid(coerced)) {
      this.internalValue.set(null);
      this.value.set(null);
      this.hourText.set('');
      this.minuteText.set('');
      this.secondText.set('');
      this.rangeError.set(true);
      return;
    }
    const previous = this.internalValue();
    this.internalValue.set(coerced);
    this.value.set(coerced);
    this.rangeError.set(!this.isInRange(coerced));
    this.timeChange.emit({ value: coerced, previousValue: previous, source: 'programmatic' });
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
    const target = event.target as HTMLElement | null;
    // Clicks that land on an actual field or button should settle focus naturally.
    if (target && (target.tagName === 'INPUT' || target.tagName === 'BUTTON')) return;
    this.hourInputRef().nativeElement.focus();
  }
}
