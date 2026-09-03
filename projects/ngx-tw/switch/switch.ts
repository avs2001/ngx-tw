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
} from '@angular/core';
import {
  type ControlValueAccessor,
  NgControl,
  Validators,
} from '@angular/forms';
import { FocusMonitor } from '@angular/cdk/a11y';
import { tv } from 'tailwind-variants';
import {
  type ErrorStateMatcher,
  type TwColor,
  type TwSize,
  wireErrorState,
} from '@cdevhub/ngx-tw/core';

/** Position of the label relative to the switch control. */
export type SwitchLabelPosition = 'before' | 'after';

// ── tv() config ──────────────────────────────────────────────────

const switchVariants = tv(
  {
    slots: {
      root: 'inline-flex items-center gap-3 cursor-pointer select-none rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
      switchEl: 'relative inline-flex items-center shrink-0',
      track:
        'relative inline-flex items-center rounded-full border border-transparent transition-colors duration-normal motion-reduce:transition-none',
      thumb:
        'absolute left-0.5 inline-flex items-center justify-center bg-surface rounded-full shadow-sm transition-transform duration-normal motion-reduce:transition-none',
      iconWrap:
        'absolute inset-0 flex items-center justify-between px-1 pointer-events-none empty:hidden',
      labelWrap: 'flex flex-col min-w-0 empty:hidden',
      label: 'font-medium text-fg empty:hidden',
      description: 'text-fg-muted empty:hidden',
    },
    variants: {
      size: {
        xs: {
          track: 'h-4 w-7',
          thumb: 'size-3 data-[checked=true]:translate-x-3',
          label: 'text-xs',
          description: 'text-2xs',
        },
        sm: {
          track: 'h-5 w-9',
          thumb: 'size-4 data-[checked=true]:translate-x-4',
          label: 'text-sm',
          description: 'text-xs',
        },
        md: {
          track: 'h-6 w-11',
          thumb: 'size-5 data-[checked=true]:translate-x-5',
          label: 'text-sm',
          description: 'text-xs',
        },
        lg: {
          track: 'h-7 w-12',
          thumb: 'size-6 data-[checked=true]:translate-x-5',
          label: 'text-base',
          description: 'text-sm',
        },
        xl: {
          track: 'h-8 w-14',
          thumb: 'size-7 data-[checked=true]:translate-x-6',
          label: 'text-base',
          description: 'text-sm',
        },
      },
      labelPosition: {
        before: { root: 'flex-row-reverse' },
        after: { root: 'flex-row' },
      },
      checked: {
        true: { track: '' },
        false: { track: 'bg-surface-muted' },
      },
      disabled: {
        true: { root: 'opacity-50 pointer-events-none cursor-not-allowed' },
        false: { root: '' },
      },
      errorState: {
        true: { label: 'text-error-700', description: 'text-error-600' },
        false: { label: '', description: '' },
      },
    },
    compoundVariants: [
      // Error state on an off (unchecked) switch repaints the rail with the error color.
      // The on (checked) track is dominated by CHECKED_TRACK[color]; consumers wanting an
      // error appearance on a checked switch should set `color="error"` directly.
      {
        errorState: true,
        checked: false,
        class: { track: 'bg-error-100 ring-1 ring-inset ring-error-border-strong' },
      },
    ],
    defaultVariants: {
      size: 'md',
      labelPosition: 'after',
      checked: false,
      disabled: false,
      errorState: false,
    },
  },
  { twMerge: true },
);

// ── Static checked-state color lookups (statically written for Tailwind v4 scanning) ──

const CHECKED_TRACK: Record<TwColor, string> = {
  primary: 'bg-primary-600',
  secondary: 'bg-secondary-600',
  accent: 'bg-accent-600',
  neutral: 'bg-fg',
  info: 'bg-info-600',
  success: 'bg-success-600',
  warning: 'bg-warning-500',
  error: 'bg-error-600',
};

const CHECKED_ICON_COLOR: Record<TwColor, string> = {
  primary: 'text-on-primary',
  secondary: 'text-on-secondary',
  accent: 'text-on-accent',
  neutral: 'text-on-neutral',
  info: 'text-on-info',
  success: 'text-on-success',
  warning: 'text-on-warning',
  error: 'text-on-error',
};

let nextId = 0;

// ── SwitchComponent ──────────────────────────────────────────────

@Component({
  selector: 'tw-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="switchClasses()">
      <span [class]="trackClasses()">
        <span [class]="iconWrapClasses()">
          <span [class]="offIconClasses()">
            <ng-content select="[slot='off-icon']" />
          </span>
          <span [class]="onIconClasses()">
            <ng-content select="[slot='on-icon']" />
          </span>
        </span>
        <span [class]="thumbClasses()" [attr.data-checked]="internalChecked()"></span>
      </span>
    </span>

    <span [class]="labelWrapClasses()">
      <span [id]="labelId" [class]="labelClasses()">
        <ng-content />
        @if (label()) {
          {{ label() }}
        }
      </span>
      <span [id]="descriptionId" [class]="descriptionClasses()">
        <ng-content select="[slot='description']" />
        @if (description()) {
          {{ description() }}
        }
      </span>
    </span>
  `,
  host: {
    'role': 'switch',
    '[id]': 'hostId',
    '[class]': 'rootClasses()',
    '[attr.data-checked]': 'internalChecked()',
    '[attr.aria-checked]': 'internalChecked()',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[attr.aria-invalid]': 'errorState() || null',
    '[attr.aria-required]': 'required() || null',
    '[attr.aria-label]': 'ariaLabel() || null',
    '[attr.aria-labelledby]': 'effectiveAriaLabelledby() || null',
    '[attr.aria-describedby]': 'effectiveAriaDescribedby() || null',
    '[attr.tabindex]': 'isDisabled() ? -1 : 0',
    '[attr.name]': 'name() || null',
    '(click)': 'toggle()',
    '(keydown)': 'onKeydown($event)',
    '(blur)': 'onBlur()',
  },
})
export class SwitchComponent implements ControlValueAccessor, OnInit {
  /** Sets the semantic color for the active (checked) track. Defaults to `'primary'`. */
  readonly color = input<TwColor>('primary');

  /** Controls the overall scale of the track, thumb, and label typography. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** When true, prevents interaction and applies muted styling. Defaults to `false`. */
  readonly disabled = input(false);

  /** When true, sets `aria-required="true"` so assistive tech announces the control as required. Also inferred from `Validators.required` / `Validators.requiredTrue` on a bound control, so a reactive/template-driven form does not have to state it twice. Defaults to `false`. */
  readonly requiredInput = input(false, { alias: 'required' });

  /**
   * @internal Shared `errorState` / `required` / `errors` derivation — see
   * `wireErrorState`. Declared here, above `required`, because class field
   * initializers run in declaration order.
   */
  private readonly errorWiring = wireErrorState({
    ngControl: () => this.ngControl,
    matcher: () => this.errorStateMatcher(),
    required: () => this.requiredInput(),
    // A switch bound with `Validators.requiredTrue` is required too.
    requiredValidators: [Validators.required, Validators.requiredTrue],
  });

  /**
   * @internal Resolved required state: the `required` input OR'd with
   * `Validators.required` / `Validators.requiredTrue` on a bound `NgControl`.
   */
  readonly required: Signal<boolean> = this.errorWiring.required;

  /** Optional inline label rendered next to the switch. Use default content projection for rich label content instead. */
  readonly label = input<string | undefined>(undefined);

  /** Optional secondary description rendered under the label. Use `[slot="description"]` content projection for rich content instead. */
  readonly description = input<string | undefined>(undefined);

  /** Position of the label/description relative to the switch. Defaults to `'after'`. */
  readonly labelPosition = input<SwitchLabelPosition>('after');

  /** Optional name attribute, mirrored to the host for form association. */
  readonly name = input<string | undefined>(undefined);

  /** Accessible name when no visible label is provided. Mirrored to `aria-label`. Defaults to `undefined`. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  /** ID of an external element that labels the switch. Mirrored to `aria-labelledby`. Defaults to `undefined`. */
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  /** ID of an external element that describes the switch. Mirrored to `aria-describedby`. Defaults to `undefined`. */
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  /**
   * Two-way bound checked state. Updates when the user toggles via click or
   * Space, **and** when a bound form writes into the control
   * (`FormControl.setValue`, `ngModel`, `writeValue`). Defaults to `false`.
   *
   * The two-way binding mints a `checkedChange` output. That output is the
   * *any-change* channel: it fires on programmatic writes as well as user
   * gestures. `(change)` is the *user-gesture-only* channel. Bind
   * `(checkedChange)` to mirror state; bind `(change)` for analytics or a
   * confirmation prompt, where a programmatic write must not count as a click.
   * Writing back into the same form from a `(checkedChange)` handler will echo.
   */
  readonly checked = model(false);

  /** Per-instance override of the {@link ErrorStateMatcher}. When omitted, the switch uses the `TW_ERROR_STATE_MATCHER` token's value. */
  readonly errorStateMatcher = input<ErrorStateMatcher | undefined>(undefined);

  /**
   * Fires after the checked state changes from a user interaction (click or
   * Space). Does **not** fire when the value is updated programmatically via
   * `writeValue` / `FormControl.setValue` / `ngModel` — for those, bind the
   * two-way binding's `(checkedChange)` instead, which fires on any change.
   */
  readonly change = output<boolean>();

  private readonly focusMonitor = inject(FocusMonitor);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};
  private readonly cvaDisabled = signal(false);

  private readonly uid = nextId++;
  readonly hostId = `tw-switch-${this.uid}`;
  readonly labelId = `${this.hostId}-label`;
  readonly descriptionId = `${this.hostId}-description`;

  constructor() {
    // Material-style CVA wiring: declare ourselves as the value accessor on any
    // host-level `NgControl` (FormControlDirective, NgModel, etc.). This avoids
    // the circular-DI that a static `NG_VALUE_ACCESSOR` provider would create
    // because `NgControl` is injected with `self: true` on the same element.
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }

    afterNextRender(() => {
      if (isDevMode() && !this.hasAccessibleNameHint()) {
        console.warn(
          '[tw-switch] The switch has no accessible name. Provide a `label` input, project label content, or set `aria-label` / `aria-labelledby`.',
        );
      }
    });
  }

  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  /** Whether the switch is in an error state per the configured `ErrorStateMatcher`. Reads the bound `NgControl.invalid` through the matcher. */
  readonly errorState: Signal<boolean> = this.errorWiring.errorState;

  readonly internalChecked = linkedSignal(() => this.checked());

  readonly effectiveAriaLabelledby = computed(() => {
    const external = this.ariaLabelledby();
    if (external) return external;
    if (this.ariaLabel()) return undefined;
    return this.labelId;
  });

  readonly effectiveAriaDescribedby = computed(() => {
    const external = this.ariaDescribedby();
    if (external) return external;
    return this.descriptionId;
  });

  private readonly variantResult = computed(() =>
    switchVariants({
      size: this.size(),
      labelPosition: this.labelPosition(),
      checked: this.internalChecked(),
      disabled: this.isDisabled(),
      errorState: this.errorState(),
    }),
  );

  readonly rootClasses = computed(() => this.variantResult().root());
  readonly switchClasses = computed(() => this.variantResult().switchEl());
  readonly labelWrapClasses = computed(() => this.variantResult().labelWrap());
  readonly labelClasses = computed(() => this.variantResult().label());
  readonly descriptionClasses = computed(() => this.variantResult().description());
  readonly iconWrapClasses = computed(() => this.variantResult().iconWrap());
  readonly thumbClasses = computed(() => this.variantResult().thumb());

  readonly trackClasses = computed(() => {
    const base = this.variantResult().track();
    return this.internalChecked() ? `${base} ${CHECKED_TRACK[this.color()]}` : base;
  });

  readonly onIconClasses = computed(() => {
    const base =
      'inline-flex items-center justify-center transition-opacity duration-normal motion-reduce:transition-none empty:hidden';
    const visibility = this.internalChecked() ? 'opacity-100' : 'opacity-0';
    const color = this.internalChecked() ? CHECKED_ICON_COLOR[this.color()] : 'text-fg-muted';
    return `${base} ${visibility} ${color}`;
  });

  readonly offIconClasses = computed(() => {
    const base =
      'inline-flex items-center justify-center transition-opacity duration-normal motion-reduce:transition-none text-fg-muted empty:hidden';
    const visibility = this.internalChecked() ? 'opacity-0' : 'opacity-100';
    return `${base} ${visibility}`;
  });

  // ── Interactions ──────────────────────────────────────────

  /** Toggles the checked state. No-op when disabled. */
  toggle(): void {
    if (this.isDisabled()) return;
    const next = !this.internalChecked();
    this.internalChecked.set(next);
    this.checked.set(next);
    this.onChange(next);
    // Deliberately NOT `onTouched()`. Angular's CVA contract registers
    // `onTouched` as the BLUR notification; calling it here flipped `touched`
    // the instant the value changed, so a consumer staging error display on
    // `touched` ("only once they leave the field") got different behaviour from
    // `tw-switch` than from `tw-slider` / `tw-input`. `onBlur()` below is the
    // only place that fires it.
    this.change.emit(next);
  }

  /** Handles keyboard activation. Space toggles the switch — matches the ARIA `switch` role pattern (Enter is intentionally NOT handled, mirroring `<tw-checkbox>`). */
  onKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      this.toggle();
    }
  }

  /** @internal Called on host blur to notify forms the control has been touched and recompute errorState. */
  onBlur(): void {
    this.onTouched();
    this.errorWiring.bump();
  }

  // ── ControlValueAccessor ──────────────────────────────────

  writeValue(value: boolean | null | undefined): void {
    const next = !!value;
    this.internalChecked.set(next);
    this.checked.set(next);
  }

  registerOnChange(fn: (value: boolean) => void): void {
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
    this.focusMonitor.monitor(this.elementRef);
    this.destroyRef.onDestroy(() => {
      this.focusMonitor.stopMonitoring(this.elementRef);
    });

    // NgControl's `control` is set by the parent FormControl* directive before
    // children's `ngOnInit`. Connect here so errorState reacts to status/value
    // changes on the bound control.
    this.errorWiring.connect();
  }

  private hasAccessibleNameHint(): boolean {
    if (this.label() || this.ariaLabel() || this.ariaLabelledby()) return true;
    const host = this.elementRef.nativeElement;
    return host.textContent !== null && host.textContent.trim().length > 0;
  }
}
