/**
 * `tw-slider` — select a single value or a contiguous range from a numeric scale.
 *
 * Composition usecases:
 * - Single-value control bound via `[(value)]`.
 * - Range selector via `[range]="true"` with a `[number, number]` value.
 * - Quantised scale via `[step]` and optional tick `[marks]`.
 * - Custom mark labels for semantic scales (temperature, volume, brightness).
 * - Forms: works with template-driven, reactive, and signal forms through `ControlValueAccessor`.
 */
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  isDevMode,
  linkedSignal,
  model,
  type OnInit,
  output,
  signal,
  type Signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  type ControlValueAccessor,
  FormGroupDirective,
  NgControl,
  NgForm,
  Validators,
} from '@angular/forms';
import { FocusMonitor } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { merge } from 'rxjs';
import { tv } from 'tailwind-variants';
import {
  type ErrorStateMatcher,
  TW_ERROR_STATE_MATCHER,
  type TwColor,
  type TwSize,
  type TwFormSubmitted,
} from '@cdevhub/ngx-tw/core';

/** Visual style of the slider fill. */
export type SliderVariant = 'solid' | 'soft' | 'outline';

/** Value emitted by the slider. A plain number for single mode, or `[start, end]` for range mode. */
export type SliderValue = number | readonly [number, number];

/** A tick mark on the slider scale. Optionally carries a display label. */
export interface SliderMark {
  /** Numeric position of the mark on the slider scale. Must be within `[min, max]`. */
  value: number;
  /** Optional label rendered beneath the mark when `showMarkLabels` is true. */
  label?: string;
}

/** Format function for the value displayed in the value bubble, min/max labels, and `aria-valuetext`. */
export type SliderValueFormatter = (value: number) => string;

/** Identifies which thumb is the interaction target in range mode. */
type ThumbId = 'single' | 'start' | 'end';

// ── Static color lookups (Tailwind v4 scans class strings statically) ──

const FILL_SOLID: Record<TwColor, string> = {
  primary: 'bg-primary-500',
  secondary: 'bg-secondary-500',
  accent: 'bg-accent-500',
  neutral: 'bg-fg',
  info: 'bg-info-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
};

const FILL_SOFT: Record<TwColor, string> = {
  primary: 'bg-primary-300',
  secondary: 'bg-secondary-300',
  accent: 'bg-accent-300',
  neutral: 'bg-fg-muted',
  info: 'bg-info-300',
  success: 'bg-success-300',
  warning: 'bg-warning-300',
  error: 'bg-error-300',
};

const FILL_OUTLINE_BORDER: Record<TwColor, string> = {
  primary: 'border-primary-500',
  secondary: 'border-secondary-500',
  accent: 'border-accent-500',
  neutral: 'border-fg',
  info: 'border-info-500',
  success: 'border-success-500',
  warning: 'border-warning-500',
  error: 'border-error-500',
};

const THUMB_BORDER: Record<TwColor, string> = {
  primary: 'border-primary-500',
  secondary: 'border-secondary-500',
  accent: 'border-accent-500',
  neutral: 'border-fg',
  info: 'border-info-500',
  success: 'border-success-500',
  warning: 'border-warning-500',
  error: 'border-error-500',
};

const FOCUS_RING: Record<TwColor, string> = {
  primary: 'focus-visible:outline-primary-500',
  secondary: 'focus-visible:outline-secondary-500',
  accent: 'focus-visible:outline-accent-500',
  neutral: 'focus-visible:outline-fg',
  info: 'focus-visible:outline-info-500',
  success: 'focus-visible:outline-success-500',
  warning: 'focus-visible:outline-warning-500',
  error: 'focus-visible:outline-error-500',
};

// ── tv() config ──────────────────────────────────────────────────

const sliderVariants = tv(
  {
    slots: {
      root: 'flex flex-col w-full select-none',
      header: 'flex items-center justify-between gap-3',
      label: 'text-sm font-medium text-fg empty:hidden',
      valueText: 'text-sm text-fg-muted font-medium tabular-nums',
      description: 'text-xs text-fg-muted empty:hidden',
      region: 'relative flex items-center touch-none',
      rail:
        'relative w-full rounded-full bg-surface-muted transition-colors duration-normal motion-reduce:transition-none',
      fill:
        'absolute inset-y-0 rounded-full transition-colors duration-normal motion-reduce:transition-none',
      marksRow: 'absolute inset-0 pointer-events-none',
      mark:
        'absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface transition-colors duration-normal motion-reduce:transition-none',
      markActive: '',
      thumb:
        'absolute top-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full border-2 bg-surface-raised shadow-sm cursor-grab active:cursor-grabbing touch-none focus-visible:outline-2 focus-visible:outline-offset-2 transition-[transform,box-shadow] duration-fast motion-reduce:transition-none hover:shadow-md data-[dragging=true]:shadow-md data-[dragging=true]:scale-110',
      bubble:
        'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-0.5 rounded-md bg-fg text-surface text-xs font-medium tabular-nums whitespace-nowrap pointer-events-none opacity-0 transition-opacity duration-fast motion-reduce:transition-none',
      bubbleVisible: 'opacity-100',
      markLabelsRow: 'relative w-full mt-2',
      markLabel:
        'absolute top-0 -translate-x-1/2 text-xs text-fg-muted tabular-nums whitespace-nowrap',
      minMaxRow: 'flex items-center justify-between mt-2 text-xs text-fg-muted tabular-nums',
    },
    variants: {
      size: {
        // Thumb sizes follow the square-interactive scale (WCAG 2.2 SC 2.5.8 target-size).
        // Rail/mark/region adjust independently for proportional visual weight.
        xs: {
          rail: 'h-1',
          thumb: 'size-6',
          mark: 'size-2',
          region: 'h-6 py-1',
        },
        sm: {
          rail: 'h-1.5',
          thumb: 'size-7',
          mark: 'size-2.5',
          region: 'h-7 py-1',
        },
        md: {
          rail: 'h-2',
          thumb: 'size-8',
          mark: 'size-3',
          region: 'h-8 py-1.5',
        },
        lg: {
          rail: 'h-2.5',
          thumb: 'size-9',
          mark: 'size-3',
          region: 'h-9 py-2',
        },
        xl: {
          rail: 'h-3',
          thumb: 'size-10',
          mark: 'size-3',
          region: 'h-10 py-2',
        },
      },
      variant: {
        solid: {},
        soft: {},
        outline: {
          rail: 'border border-border bg-transparent',
          fill: 'border border-transparent',
        },
      },
      disabled: {
        true: { root: 'opacity-50 pointer-events-none' },
        false: { root: '' },
      },
      hasHeader: {
        true: { root: 'gap-2' },
        false: { root: 'gap-0' },
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'solid',
      disabled: false,
      hasHeader: false,
    },
  },
  { twMerge: true },
);

let nextId = 0;

const DEFAULT_FORMATTER: SliderValueFormatter = (value) => {
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 100) / 100);
};

const clamp = (value: number, lo: number, hi: number): number =>
  value < lo ? lo : value > hi ? hi : value;

const toRange = (value: SliderValue | null | undefined): [number, number] => {
  if (Array.isArray(value)) return [value[0], value[1]];
  return [0, typeof value === 'number' ? value : 0];
};

const toNumber = (value: SliderValue | null | undefined, fallback: number): number => {
  if (Array.isArray(value)) return value[1];
  return typeof value === 'number' ? value : fallback;
};

/**
 * Select a single value or a numeric range from a scale.
 *
 * @example
 * ```html
 * <tw-slider [(value)]="volume" [min]="0" [max]="100" [step]="5" />
 * <tw-slider range [(value)]="priceRange" [min]="0" [max]="1000" [step]="10" showMinMax />
 * <tw-slider [marks]="true" [step]="25" showMarkLabels label="Brightness" />
 * ```
 */
@Component({
  selector: 'tw-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (hasHeader()) {
      <div [class]="headerClasses()">
        @if (label(); as lbl) {
          <span [id]="labelId" [class]="labelClasses()">{{ lbl }}</span>
        } @else {
          <span></span>
        }
        @if (showValue()) {
          <span [class]="valueTextClasses()">{{ headerValueText() }}</span>
        }
      </div>
    }
    @if (description(); as desc) {
      <span [id]="descriptionId" [class]="descriptionClasses()">{{ desc }}</span>
    }

    <div
      #region
      [class]="regionClasses()"
      (pointerdown)="onTrackPointerDown($event)"
    >
      <div [class]="railClasses()">
        <div
          [class]="fillClasses()"
          [style.left.%]="fillLeftPct()"
          [style.width.%]="fillWidthPct()"
        ></div>

        @if (hasVisibleMarks()) {
          <div [class]="marksRowClasses()">
            @for (m of resolvedMarks(); track m.value) {
              <span
                [class]="markClassFor(m.value)"
                [style.left.%]="valuePct(m.value)"
              ></span>
            }
          </div>
        }

        @if (range()) {
          <button
            type="button"
            #startThumb
            [class]="thumbClasses()"
            [style.left.%]="startPct()"
            role="slider"
            [id]="startThumbId"
            [attr.aria-label]="resolvedStartAriaLabel()"
            [attr.aria-labelledby]="resolvedStartAriaLabelledby()"
            [attr.aria-describedby]="resolvedAriaDescribedby()"
            [attr.aria-valuemin]="min()"
            [attr.aria-valuemax]="effectiveStartMax()"
            [attr.aria-valuenow]="startValue()"
            [attr.aria-valuetext]="format(startValue())"
            [attr.aria-orientation]="'horizontal'"
            [attr.aria-disabled]="isDisabled() || null"
            [attr.aria-required]="required() || null"
            [attr.aria-invalid]="errorState() || null"
            [attr.data-dragging]="activeThumb() === 'start'"
            [attr.tabindex]="isDisabled() ? -1 : 0"
            (pointerdown)="onThumbPointerDown($event, 'start')"
            (keydown)="onThumbKeyDown($event, 'start')"
            (blur)="onThumbBlur()"
          >
            <span
              aria-hidden="true"
              [class]="bubbleClassFor('start')"
            >{{ format(startValue()) }}</span>
          </button>
          <button
            type="button"
            #endThumb
            [class]="thumbClasses()"
            [style.left.%]="endPct()"
            role="slider"
            [id]="endThumbId"
            [attr.aria-label]="resolvedEndAriaLabel()"
            [attr.aria-labelledby]="resolvedEndAriaLabelledby()"
            [attr.aria-describedby]="resolvedAriaDescribedby()"
            [attr.aria-valuemin]="effectiveEndMin()"
            [attr.aria-valuemax]="max()"
            [attr.aria-valuenow]="endValue()"
            [attr.aria-valuetext]="format(endValue())"
            [attr.aria-orientation]="'horizontal'"
            [attr.aria-disabled]="isDisabled() || null"
            [attr.aria-required]="required() || null"
            [attr.aria-invalid]="errorState() || null"
            [attr.data-dragging]="activeThumb() === 'end'"
            [attr.tabindex]="isDisabled() ? -1 : 0"
            (pointerdown)="onThumbPointerDown($event, 'end')"
            (keydown)="onThumbKeyDown($event, 'end')"
            (blur)="onThumbBlur()"
          >
            <span
              aria-hidden="true"
              [class]="bubbleClassFor('end')"
            >{{ format(endValue()) }}</span>
          </button>
        } @else {
          <button
            type="button"
            #singleThumb
            [class]="thumbClasses()"
            [style.left.%]="singlePct()"
            role="slider"
            [id]="singleThumbId"
            [attr.aria-label]="resolvedSingleAriaLabel()"
            [attr.aria-labelledby]="resolvedSingleAriaLabelledby()"
            [attr.aria-describedby]="resolvedAriaDescribedby()"
            [attr.aria-valuemin]="min()"
            [attr.aria-valuemax]="max()"
            [attr.aria-valuenow]="singleValue()"
            [attr.aria-valuetext]="format(singleValue())"
            [attr.aria-orientation]="'horizontal'"
            [attr.aria-disabled]="isDisabled() || null"
            [attr.aria-required]="required() || null"
            [attr.aria-invalid]="errorState() || null"
            [attr.data-dragging]="activeThumb() === 'single'"
            [attr.tabindex]="isDisabled() ? -1 : 0"
            (pointerdown)="onThumbPointerDown($event, 'single')"
            (keydown)="onThumbKeyDown($event, 'single')"
            (blur)="onThumbBlur()"
          >
            <span
              aria-hidden="true"
              [class]="bubbleClassFor('single')"
            >{{ format(singleValue()) }}</span>
          </button>
        }
      </div>
    </div>

    @if (hasMarkLabels()) {
      <div [class]="markLabelsRowClasses()" aria-hidden="true">
        @for (m of resolvedMarks(); track m.value) {
          <span [class]="markLabelClasses()" [style.left.%]="valuePct(m.value)">
            {{ m.label ?? format(m.value) }}
          </span>
        }
      </div>
    }

    @if (showMinMax()) {
      <div [class]="minMaxRowClasses()" aria-hidden="true">
        <span>{{ format(min()) }}</span>
        <span>{{ format(max()) }}</span>
      </div>
    }
  `,
  host: {
    '[class]': 'rootClasses()',
    '[attr.data-disabled]': 'isDisabled() || null',
  },
})
export class SliderComponent implements ControlValueAccessor, OnInit {
  /**
   * Lower bound of the slider scale. Defaults to `0`.
   *
   * Accepts `undefined` so `[formField]` type-checks under `strictTemplates`:
   * signal forms writes the `min` control binding from the field's own
   * `min()` state, which is `number | undefined`. `undefined` resolves back to
   * the documented default through {@link min}.
   */
  readonly minInput = input<number | undefined>(0, { alias: 'min' });

  /**
   * Upper bound of the slider scale. Defaults to `100`.
   *
   * Accepts `undefined` for the same reason as {@link minInput}; `undefined`
   * resolves back to the documented default through {@link max}.
   */
  readonly maxInput = input<number | undefined>(100, { alias: 'max' });

  /** @internal Resolved lower bound — the `min` input with its documented `0` default restored when the binding resolves to `undefined`. Every internal reader goes through this, never through the raw input. */
  readonly min: Signal<number> = computed(() => this.minInput() ?? 0);

  /** @internal Resolved upper bound — the `max` input with its documented `100` default restored when the binding resolves to `undefined`. */
  readonly max: Signal<number> = computed(() => this.maxInput() ?? 100);

  /** Step increment used for snapping, keyboard nav, and auto-generated marks. Pass `null` for continuous values. Defaults to `1`. */
  readonly step = input<number | null>(1);

  /** Semantic color for the filled portion and thumb border. Defaults to `'primary'`. */
  readonly color = input<TwColor>('primary');

  /** Overall scale of the rail, thumb, and typography. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** Visual style of the fill: `'solid'` (vivid), `'soft'` (muted), or `'outline'` (rail bordered, fill color-500). Defaults to `'solid'`. */
  readonly variant = input<SliderVariant>('solid');

  /** When true, prevents interaction and applies muted styling. Defaults to `false`. */
  readonly disabled = input(false);

  /** When true, sets `aria-required="true"` on the thumb for assistive tech. Also inferred from `Validators.required` on a bound control, so a reactive/template-driven form does not have to state it twice. Defaults to `false`. */
  readonly requiredInput = input(false, { alias: 'required' });

  /**
   * @internal Resolved required state: the `required` input OR'd with
   * `Validators.required` on a bound `NgControl`. The OR (rather than a
   * validator-only read) is what keeps signal forms working — `cvaControlCreate`
   * writes the `required` *input* directly from the field state and never
   * consults validators, so the input arm carries that branch while the
   * validator arm carries reactive/template-driven forms.
   */
  readonly required: Signal<boolean> = computed(() => {
    this._ngControlRev();
    if (this.requiredInput()) return true;
    return !!this.ngControl?.control?.hasValidator(Validators.required);
  });

  /** When true, the slider selects a `[start, end]` range and renders two thumbs. Defaults to `false`. */
  readonly range = input(false);

  /** Tick marks: `true` auto-generates one mark per step, an array supplies custom marks, `false` renders no marks. Defaults to `false`. */
  readonly marks = input<SliderMark[] | boolean>(false);

  /** When true, renders the mark labels beneath the rail. Requires `marks` to resolve to a list. Defaults to `false`. */
  readonly showMarkLabels = input(false);

  /** When true, renders the min and max values at the ends of the scale. Defaults to `false`. */
  readonly showMinMax = input(false);

  /** When true, renders a value bubble above the active thumb (on hover/focus/drag) and the current value in the header. Defaults to `false`. */
  readonly showValue = input(false);

  /** Optional visible label rendered above the rail. When set, the slider is wired to the label via `aria-labelledby`. */
  readonly label = input<string | undefined>(undefined);

  /** Optional secondary description rendered under the label. Mirrored to `aria-describedby`. */
  readonly description = input<string | undefined>(undefined);

  /** Custom formatter for the value bubble, min/max labels, and `aria-valuetext`. Defaults to an integer or 2-decimal string. */
  readonly valueFormatter = input<SliderValueFormatter | undefined>(undefined);

  /** Optional form name attribute. Purely informational — the component does not render a native input. */
  readonly name = input<string | undefined>(undefined);

  /** Accessible name for the single-value thumb when no visible label is provided. Defaults to `undefined`. Alias: `aria-label`. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  /** ID of an external element labelling the single-value thumb. Defaults to `undefined`. Alias: `aria-labelledby`. */
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  /** ID of an external element describing the slider. Defaults to `undefined`. Alias: `aria-describedby`. */
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  /** Accessible name for the start (lower) thumb in range mode. Defaults to `"Minimum"`. */
  readonly ariaLabelStart = input<string>('Minimum');

  /** Accessible name for the end (upper) thumb in range mode. Defaults to `"Maximum"`. */
  readonly ariaLabelEnd = input<string>('Maximum');

  /** Two-way bound slider value. A `number` for single mode, or `[start, end]` for range mode. Updates on every interaction. Defaults to `0`. */
  readonly value = model<SliderValue>(0);

  /** Fires continuously while the user drags or holds a key. Payload matches the current `value`. Template event name is `input` — the TS-side identifier is `valueInput` to avoid shadowing the imported `input` factory. */
  readonly valueInput = output<SliderValue>({ alias: 'input' });

  /** Fires when the user commits a change (pointer release, key release, or blur after keyboard change). Payload matches the current `value`. */
  readonly change = output<SliderValue>();

  /** Per-instance override of the {@link ErrorStateMatcher}. When omitted, the component uses the `TW_ERROR_STATE_MATCHER` token's value. */
  readonly errorStateMatcher = input<ErrorStateMatcher | undefined>(undefined);

  private readonly focusMonitor = inject(FocusMonitor);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly directionality = inject(Directionality, { optional: true });
  private readonly ngControl = inject(NgControl, { optional: true, self: true });
  private readonly parentForm = inject(NgForm, { optional: true });
  private readonly parentFormGroup = inject(FormGroupDirective, { optional: true });
  private readonly defaultMatcher = inject(TW_ERROR_STATE_MATCHER);

  private readonly _ngControlRev = signal(0);
  private readonly _formSubmitRev = signal(0);

  /** Whether the form control is in an error state per the configured `ErrorStateMatcher`. */
  readonly errorState: Signal<boolean> = computed(() => {
    this._ngControlRev();
    this._formSubmitRev();
    // Read focus so blur-driven `touched` transitions repaint the error
    // border even when the underlying control's status/value didn't change.
    this.focusedThumb();
    const matcher = this.errorStateMatcher() ?? this.defaultMatcher;
    const form: TwFormSubmitted | null =
      (this.parentFormGroup as TwFormSubmitted | null) ??
      (this.parentForm as TwFormSubmitted | null);
    return matcher.isErrorState(this.ngControl?.control ?? null, form);
  });

  private readonly region = viewChild.required<ElementRef<HTMLElement>>('region');
  private readonly startThumb = viewChild<ElementRef<HTMLButtonElement>>('startThumb');
  private readonly endThumb = viewChild<ElementRef<HTMLButtonElement>>('endThumb');
  private readonly singleThumb = viewChild<ElementRef<HTMLButtonElement>>('singleThumb');

  private onChange: (value: SliderValue) => void = () => {};
  private onTouched: () => void = () => {};
  private readonly cvaDisabled = signal(false);

  /** @internal ID of the host element. */
  private readonly uid = nextId++;
  /** @internal */
  readonly labelId = `tw-slider-${this.uid}-label`;
  /** @internal */
  readonly descriptionId = `tw-slider-${this.uid}-description`;
  /** @internal */
  readonly singleThumbId = `tw-slider-${this.uid}-thumb`;
  /** @internal */
  readonly startThumbId = `tw-slider-${this.uid}-start`;
  /** @internal */
  readonly endThumbId = `tw-slider-${this.uid}-end`;

  /** @internal Internal values during drag / interaction, independent of external model. */
  private readonly internalStart = linkedSignal<number>(() => toRange(this.value())[0]);
  private readonly internalEnd = linkedSignal<number>(() => toRange(this.value())[1]);
  private readonly internalSingle = linkedSignal<number>(() => toNumber(this.value(), this.min()));

  /** @internal Which thumb currently has an active pointer gesture (or null). Bound in the template to drive the pressed-thumb styling. */
  readonly activeThumb = signal<ThumbId | null>(null);
  /** @internal Which thumb is focused (for bubble visibility). */
  private readonly focusedThumb = signal<ThumbId | null>(null);
  /** @internal Set of pointer IDs currently captured per-thumb for release tracking. */
  private readonly capturedPointers = new Map<number, { thumb: ThumbId; target: HTMLElement }>();
  /** @internal Tracks whether a keyboard interaction has mutated the value since last blur. */
  private keyboardDirty = false;

  constructor() {
    // Material-style CVA wiring: declare ourselves as the value accessor on any
    // host-level `NgControl` (FormControlDirective, NgModel, etc.). This avoids
    // the circular-DI that a static `NG_VALUE_ACCESSOR` provider would create
    // because `NgControl` is injected with `self: true` on the same element.
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }

    afterNextRender(() => {
      if (isDevMode() && !this.hasAccessibleName()) {
        console.warn(
          '[tw-slider] No accessible name provided. Supply a `label` input, `aria-label`, or `aria-labelledby`. In range mode, `ariaLabelStart` and `ariaLabelEnd` are used as fallbacks.',
        );
      }
    });
  }

  // ── Derived state ─────────────────────────────────────────

  /** @internal Effective disabled state (input OR set via CVA). */
  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  /** @internal Whether a label/value header row should render. */
  readonly hasHeader = computed(() => !!this.label() || this.showValue());

  /** @internal Effective step: min 0 (continuous). */
  private readonly effectiveStep = computed(() => {
    const s = this.step();
    if (s === null || s === undefined) return 0;
    return Math.abs(s);
  });

  /** @internal Current scale range. */
  private readonly scaleRange = computed(() => {
    const lo = this.min();
    const hi = this.max();
    return hi > lo ? hi - lo : 0;
  });

  /** @internal Whether marks are resolved as a visible list. */
  private readonly marksResolved = computed<SliderMark[]>(() => {
    const source = this.marks();
    const lo = this.min();
    const hi = this.max();
    if (Array.isArray(source)) {
      return source.filter((m) => m.value >= lo && m.value <= hi);
    }
    if (source !== true) return [];
    const step = this.effectiveStep();
    if (step <= 0 || this.scaleRange() <= 0) return [];
    const out: SliderMark[] = [];
    for (let v = lo; v <= hi + 1e-9; v += step) {
      out.push({ value: Math.round(v * 1e6) / 1e6 });
    }
    return out;
  });

  /** @internal */
  readonly resolvedMarks = computed(() => this.marksResolved());
  /** @internal */
  readonly hasVisibleMarks = computed(() => this.marksResolved().length > 0);
  /** @internal */
  readonly hasMarkLabels = computed(
    () => this.showMarkLabels() && this.marksResolved().length > 0,
  );

  /** @internal Clamped current values. */
  readonly startValue = computed(() =>
    this.clampAndSnap(Math.min(this.internalStart(), this.internalEnd())),
  );
  /** @internal */
  readonly endValue = computed(() =>
    this.clampAndSnap(Math.max(this.internalStart(), this.internalEnd())),
  );
  /** @internal */
  readonly singleValue = computed(() => this.clampAndSnap(this.internalSingle()));

  /** @internal aria-valuemax for the start thumb (cannot cross end thumb). */
  readonly effectiveStartMax = computed(() => this.endValue());
  /** @internal aria-valuemin for the end thumb (cannot go below start thumb). */
  readonly effectiveEndMin = computed(() => this.startValue());

  /** @internal Percentage position of the single thumb on the rail. */
  readonly singlePct = computed(() => this.valuePct(this.singleValue()));
  /** @internal */
  readonly startPct = computed(() => this.valuePct(this.startValue()));
  /** @internal */
  readonly endPct = computed(() => this.valuePct(this.endValue()));

  /** @internal Fill segment position. */
  readonly fillLeftPct = computed(() => (this.range() ? this.startPct() : 0));
  /** @internal */
  readonly fillWidthPct = computed(() =>
    this.range() ? this.endPct() - this.startPct() : this.singlePct(),
  );

  /** @internal Formatted display of the current value for the header. */
  readonly headerValueText = computed(() => {
    if (this.range()) {
      return `${this.format(this.startValue())} – ${this.format(this.endValue())}`;
    }
    return this.format(this.singleValue());
  });

  // ── tv slot classes ─────────────────────────────────────────

  private readonly variantResult = computed(() =>
    sliderVariants({
      size: this.size(),
      variant: this.variant(),
      disabled: this.isDisabled(),
      hasHeader: this.hasHeader(),
    }),
  );

  /** @internal */
  readonly rootClasses = computed(() => this.variantResult().root());
  /** @internal */
  readonly headerClasses = computed(() => this.variantResult().header());
  /** @internal */
  readonly labelClasses = computed(() => this.variantResult().label());
  /** @internal */
  readonly valueTextClasses = computed(() => this.variantResult().valueText());
  /** @internal */
  readonly descriptionClasses = computed(() => this.variantResult().description());
  /** @internal */
  readonly regionClasses = computed(() => this.variantResult().region());
  /** @internal */
  readonly railClasses = computed(() => {
    const base = this.variantResult().rail();
    if (this.variant() === 'outline') return base;
    return base;
  });
  /** @internal */
  readonly fillClasses = computed(() => {
    const base = this.variantResult().fill();
    const variant = this.variant();
    const color = this.color();
    if (variant === 'soft') return `${base} ${FILL_SOFT[color]}`;
    if (variant === 'outline') {
      return `${base} ${FILL_SOLID[color]} ${FILL_OUTLINE_BORDER[color]}`;
    }
    return `${base} ${FILL_SOLID[color]}`;
  });
  /** @internal */
  readonly marksRowClasses = computed(() => this.variantResult().marksRow());
  /** @internal */
  readonly markLabelsRowClasses = computed(() => this.variantResult().markLabelsRow());
  /** @internal */
  readonly markLabelClasses = computed(() => this.variantResult().markLabel());
  /** @internal */
  readonly minMaxRowClasses = computed(() => this.variantResult().minMaxRow());
  /** @internal */
  readonly thumbClasses = computed(
    () => `${this.variantResult().thumb()} ${THUMB_BORDER[this.color()]} ${FOCUS_RING[this.color()]}`,
  );

  /**
   * @internal Memoized class map for mark dots — keyed by mark value. Recomputed
   * only when the variant slots, fill range, or marks list changes; lookups
   * from the template (`markClassFor(markValue)`) are O(1) Map reads.
   */
  private readonly markClassMap = computed(() => {
    const base = this.variantResult().mark();
    const lo = this.range() ? this.startValue() : this.min();
    const hi = this.range() ? this.endValue() : this.singleValue();
    const insideClass = `${base} bg-surface`;
    const outsideClass = `${base} bg-fg-muted/30`;
    const map = new Map<number, string>();
    for (const mark of this.marksResolved()) {
      const inside = mark.value >= lo && mark.value <= hi;
      map.set(mark.value, inside ? insideClass : outsideClass);
    }
    return { map, outsideClass };
  });

  /** @internal Mark dot color depends on whether it falls inside the filled segment. */
  markClassFor(markValue: number): string {
    const { map, outsideClass } = this.markClassMap();
    return map.get(markValue) ?? outsideClass;
  }

  /**
   * @internal Memoized bubble classes per thumb — enumerated once per
   * dependency change so each `bubbleClassFor(thumb)` is a single object
   * property read.
   */
  private readonly bubbleClassMap = computed<Record<ThumbId, string>>(() => {
    const base = this.variantResult().bubble();
    if (!this.showValue()) {
      return { single: base, start: base, end: base };
    }
    const visibleClass = `${base} ${this.variantResult().bubbleVisible()}`;
    const active = this.activeThumb();
    const focused = this.focusedThumb();
    const classFor = (thumb: ThumbId): string =>
      active === thumb || focused === thumb ? visibleClass : base;
    return {
      single: classFor('single'),
      start: classFor('start'),
      end: classFor('end'),
    };
  });

  /** @internal Bubble visibility depends on drag / focus / hover state. */
  bubbleClassFor(thumb: ThumbId): string {
    return this.bubbleClassMap()[thumb];
  }

  // ── Accessible-name resolution ─────────────────────────────

  /** @internal */
  readonly resolvedAriaDescribedby = computed(() => {
    const external = this.ariaDescribedby();
    if (external) return external;
    return this.description() ? this.descriptionId : null;
  });

  /** @internal */
  readonly resolvedSingleAriaLabel = computed(() => {
    if (this.label()) return null;
    if (this.ariaLabelledby()) return null;
    return this.ariaLabel() ?? null;
  });
  /** @internal */
  readonly resolvedSingleAriaLabelledby = computed(() => {
    if (this.label()) return this.labelId;
    return this.ariaLabelledby() ?? null;
  });

  /** @internal */
  readonly resolvedStartAriaLabel = computed(() => {
    if (this.ariaLabelledby() || this.label()) return null;
    return this.ariaLabelStart();
  });
  /** @internal */
  readonly resolvedStartAriaLabelledby = computed(() => {
    if (this.ariaLabelledby()) return this.ariaLabelledby() ?? null;
    return this.label() ? this.labelId : null;
  });
  /** @internal */
  readonly resolvedEndAriaLabel = computed(() => {
    if (this.ariaLabelledby() || this.label()) return null;
    return this.ariaLabelEnd();
  });
  /** @internal */
  readonly resolvedEndAriaLabelledby = computed(() => {
    if (this.ariaLabelledby()) return this.ariaLabelledby() ?? null;
    return this.label() ? this.labelId : null;
  });

  // ── Interactions ───────────────────────────────────────────

  /** Track click: move the nearest thumb to the clicked position and begin a drag. */
  onTrackPointerDown(event: PointerEvent): void {
    if (this.isDisabled()) return;
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    // Ignore presses that started on a thumb — its own handler runs.
    const target = event.target as HTMLElement | null;
    if (target?.closest('[role="slider"]')) return;

    const nearest = this.nearestThumbFor(event.clientX);
    const thumbEl = this.thumbElementFor(nearest);
    if (!thumbEl) return;
    thumbEl.focus();
    this.updateValueFromClientX(nearest, event.clientX, true);
    this.beginDrag(nearest, thumbEl, event);
  }

  /** Thumb press: capture pointer and begin a drag gesture. */
  onThumbPointerDown(event: PointerEvent, thumb: ThumbId): void {
    if (this.isDisabled()) return;
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    const target = event.currentTarget as HTMLButtonElement;
    target.focus();
    this.beginDrag(thumb, target, event);
  }

  private beginDrag(thumb: ThumbId, thumbEl: HTMLElement, event: PointerEvent): void {
    event.preventDefault();
    try {
      thumbEl.setPointerCapture(event.pointerId);
    } catch {
      // setPointerCapture can throw in some synthetic test environments — degrade gracefully.
    }
    this.activeThumb.set(thumb);
    this.capturedPointers.set(event.pointerId, { thumb, target: thumbEl });
    thumbEl.addEventListener('pointermove', this.onPointerMove);
    thumbEl.addEventListener('pointerup', this.onPointerUp);
    thumbEl.addEventListener('pointercancel', this.onPointerUp);
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    const entry = this.capturedPointers.get(event.pointerId);
    if (!entry) return;
    this.updateValueFromClientX(entry.thumb, event.clientX, false);
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    const entry = this.capturedPointers.get(event.pointerId);
    if (!entry) return;
    const { target } = entry;
    try {
      target.releasePointerCapture(event.pointerId);
    } catch {
      // noop
    }
    target.removeEventListener('pointermove', this.onPointerMove);
    target.removeEventListener('pointerup', this.onPointerUp);
    target.removeEventListener('pointercancel', this.onPointerUp);
    this.capturedPointers.delete(event.pointerId);
    if (this.capturedPointers.size === 0) {
      this.activeThumb.set(null);
    }
    this.commitValue();
  };

  /** Keyboard navigation: arrows for step, PageUp/Down for 10% jumps, Home/End for extremes. */
  onThumbKeyDown(event: KeyboardEvent, thumb: ThumbId): void {
    if (this.isDisabled()) return;
    const rtl = this.directionality?.value === 'rtl';
    const range = this.scaleRange();
    const step = this.effectiveStep() || range / 100 || 1;
    const bigStep = range > 0 ? range / 10 : step * 10;

    let delta = 0;
    let jumpTo: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
        delta = rtl ? -step : step;
        break;
      case 'ArrowUp':
        delta = step;
        break;
      case 'ArrowLeft':
        delta = rtl ? step : -step;
        break;
      case 'ArrowDown':
        delta = -step;
        break;
      case 'PageUp':
        delta = bigStep;
        break;
      case 'PageDown':
        delta = -bigStep;
        break;
      case 'Home':
        jumpTo = this.min();
        break;
      case 'End':
        jumpTo = this.max();
        break;
      default:
        return;
    }

    event.preventDefault();
    const current = this.getThumbValue(thumb);
    const next = jumpTo !== null ? jumpTo : current + delta;
    this.setThumbValue(thumb, next, /* emitInput */ true);
    this.commitValue();
    this.keyboardDirty = true;
  }

  /** @internal */
  onThumbBlur(): void {
    this.focusedThumb.set(null);
    if (this.keyboardDirty) {
      this.keyboardDirty = false;
      this.onTouched();
    } else {
      this.onTouched();
    }
  }

  // ── Value math ─────────────────────────────────────────────

  /** @internal Clamp to min/max and snap to step. Returns a finite number. */
  private clampAndSnap(raw: number): number {
    if (!Number.isFinite(raw)) return this.min();
    const lo = this.min();
    const hi = this.max();
    const bounded = clamp(raw, lo, hi);
    const step = this.effectiveStep();
    if (step <= 0) return bounded;
    const snapped = Math.round((bounded - lo) / step) * step + lo;
    // Protect against floating-point drift that pushes values just past max.
    return clamp(snapped, lo, hi);
  }

  /** @internal Percent of value along the scale, in [0, 100]. */
  valuePct(value: number): number {
    const range = this.scaleRange();
    if (range <= 0) return 0;
    return ((value - this.min()) / range) * 100;
  }

  /** @internal Format a single number using the configured formatter. */
  format(value: number): string {
    const fmt = this.valueFormatter() ?? DEFAULT_FORMATTER;
    return fmt(value);
  }

  private getThumbValue(thumb: ThumbId): number {
    if (thumb === 'start') return this.startValue();
    if (thumb === 'end') return this.endValue();
    return this.singleValue();
  }

  private setThumbValue(thumb: ThumbId, raw: number, emitInput: boolean): void {
    const snapped = this.clampAndSnap(raw);
    if (thumb === 'single') {
      if (snapped === this.internalSingle()) return;
      this.internalSingle.set(snapped);
    } else if (thumb === 'start') {
      const clamped = Math.min(snapped, this.internalEnd());
      if (clamped === this.internalStart()) return;
      this.internalStart.set(clamped);
    } else {
      const clamped = Math.max(snapped, this.internalStart());
      if (clamped === this.internalEnd()) return;
      this.internalEnd.set(clamped);
    }
    const current = this.currentValue();
    this.value.set(current);
    if (emitInput) this.valueInput.emit(current);
  }

  private updateValueFromClientX(
    thumb: ThumbId,
    clientX: number,
    focusThumb: boolean,
  ): void {
    const regionEl = this.region().nativeElement;
    const rect = regionEl.getBoundingClientRect();
    if (rect.width <= 0) return;
    const rtl = this.directionality?.value === 'rtl';
    const ratio = (clientX - rect.left) / rect.width;
    const pct = clamp(rtl ? 1 - ratio : ratio, 0, 1);
    const raw = this.min() + pct * this.scaleRange();
    this.setThumbValue(thumb, raw, true);
    if (focusThumb) {
      const thumbEl = this.thumbElementFor(thumb);
      thumbEl?.focus();
    }
  }

  private thumbElementFor(thumb: ThumbId): HTMLButtonElement | undefined {
    if (thumb === 'single') return this.singleThumb()?.nativeElement;
    if (thumb === 'start') return this.startThumb()?.nativeElement;
    return this.endThumb()?.nativeElement;
  }

  private nearestThumbFor(clientX: number): ThumbId {
    if (!this.range()) return 'single';
    const regionEl = this.region().nativeElement;
    const rect = regionEl.getBoundingClientRect();
    if (rect.width <= 0) return 'start';
    const rtl = this.directionality?.value === 'rtl';
    const ratio = (clientX - rect.left) / rect.width;
    const pct = clamp(rtl ? 1 - ratio : ratio, 0, 1);
    const target = this.min() + pct * this.scaleRange();
    const distStart = Math.abs(target - this.startValue());
    const distEnd = Math.abs(target - this.endValue());
    if (distStart === distEnd) {
      // Prefer the end thumb when to the right of the fill, start otherwise.
      return target >= this.endValue() ? 'end' : 'start';
    }
    return distStart < distEnd ? 'start' : 'end';
  }

  private currentValue(): SliderValue {
    if (this.range()) return [this.startValue(), this.endValue()] as const;
    return this.singleValue();
  }

  private commitValue(): void {
    const current = this.currentValue();
    this.value.set(current);
    this.onChange(current);
    this.change.emit(current);
  }

  private hasAccessibleName(): boolean {
    if (this.label() || this.ariaLabel() || this.ariaLabelledby()) return true;
    // In range mode, explicit per-thumb labels default to Minimum/Maximum.
    return this.range();
  }

  // ── ControlValueAccessor ──────────────────────────────────

  writeValue(value: SliderValue | null | undefined): void {
    if (value === null || value === undefined) {
      this.internalSingle.set(this.clampAndSnap(this.min()));
      this.internalStart.set(this.clampAndSnap(this.min()));
      this.internalEnd.set(this.clampAndSnap(this.max()));
      return;
    }
    if (Array.isArray(value)) {
      const [start, end] = value as readonly [number, number];
      this.internalStart.set(this.clampAndSnap(start));
      this.internalEnd.set(this.clampAndSnap(end));
    } else {
      this.internalSingle.set(this.clampAndSnap(value as number));
    }
  }

  registerOnChange(fn: (value: SliderValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  // ── Lifecycle ─────────────────────────────────────────────

  ngOnInit(): void {
    this.focusMonitor
      .monitor(this.elementRef, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((origin) => {
        if (origin === null) {
          this.focusedThumb.set(null);
          return;
        }
        const active = this.elementRef.nativeElement.ownerDocument?.activeElement;
        if (!active) return;
        if (active === this.singleThumb()?.nativeElement) this.focusedThumb.set('single');
        else if (active === this.startThumb()?.nativeElement) this.focusedThumb.set('start');
        else if (active === this.endThumb()?.nativeElement) this.focusedThumb.set('end');
        else this.focusedThumb.set(null);
      });

    // Re-run the error-state matcher when the bound control's status/value
    // changes or the parent form is submitted. `ngOnInit` is the natural
    // mount point — by here, the parent `FormControl*` directive's
    // `ngOnChanges` has already populated `ngControl.control`.
    const ctrl = this.ngControl?.control;
    if (ctrl) {
      const streams = [ctrl.statusChanges, ctrl.valueChanges].filter(
        (s): s is NonNullable<typeof s> => !!s,
      );
      if (streams.length) {
        merge(...streams)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this._ngControlRev.update((v) => v + 1));
      }
    }

    const submit = this.parentFormGroup?.ngSubmit ?? this.parentForm?.ngSubmit;
    if (submit) {
      submit
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this._formSubmitRev.update((v) => v + 1));
    }

    this.destroyRef.onDestroy(() => {
      this.focusMonitor.stopMonitoring(this.elementRef);
      for (const { target } of this.capturedPointers.values()) {
        target.removeEventListener('pointermove', this.onPointerMove);
        target.removeEventListener('pointerup', this.onPointerUp);
        target.removeEventListener('pointercancel', this.onPointerUp);
      }
      this.capturedPointers.clear();
    });
  }
}
