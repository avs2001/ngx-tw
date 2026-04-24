import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  DestroyRef,
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
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FocusMonitor } from '@angular/cdk/a11y';
import { tv } from 'tailwind-variants';
import type { TwColor, TwSize } from 'ngx-tw/core';

/** Visual style of the selected radio indicator. */
export type RadioVariant = 'solid' | 'outline';

/** Layout direction of a radio group. */
export type RadioOrientation = 'horizontal' | 'vertical';

/** Position of the label relative to the radio control. */
export type RadioLabelPosition = 'before' | 'after';

// ── Radio tv() config ────────────────────────────────────────────

const radioVariants = tv(
  {
    slots: {
      root: 'inline-flex items-start gap-3 cursor-pointer select-none rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
      circleWrap: 'relative inline-flex items-center justify-center shrink-0 mt-0.5',
      circle:
        'inline-flex items-center justify-center rounded-full border bg-surface transition-colors duration-200 motion-reduce:transition-none',
      dotWrap:
        'inline-flex items-center justify-center pointer-events-none',
      dot: 'inline-block rounded-full',
      labelWrap: 'flex flex-col min-w-0 empty:hidden',
      label: 'font-medium text-fg empty:hidden',
      description: 'text-fg-muted empty:hidden',
    },
    variants: {
      size: {
        xs: {
          circle: 'size-3.5',
          dot: 'size-1.5',
          label: 'text-xs',
          description: 'text-2xs',
        },
        sm: {
          circle: 'size-4',
          dot: 'size-2',
          label: 'text-sm',
          description: 'text-xs',
        },
        md: {
          circle: 'size-5',
          dot: 'size-2.5',
          label: 'text-sm',
          description: 'text-xs',
        },
        lg: {
          circle: 'size-6',
          dot: 'size-3',
          label: 'text-base',
          description: 'text-sm',
        },
        xl: {
          circle: 'size-7',
          dot: 'size-3.5',
          label: 'text-base',
          description: 'text-sm',
        },
      },
      labelPosition: {
        before: { root: 'flex-row-reverse' },
        after: { root: 'flex-row' },
      },
      checked: {
        true: { circle: '' },
        false: { circle: 'border-border hover:border-border-strong' },
      },
      disabled: {
        true: { root: 'opacity-50 pointer-events-none cursor-not-allowed' },
        false: { root: '' },
      },
    },
    defaultVariants: {
      size: 'md',
      labelPosition: 'after',
      checked: false,
      disabled: false,
    },
  },
  { twMerge: true },
);

// ── Static selected-state color lookups (all classes written statically for Tailwind v4 scanning) ──

const SOLID_RING: Record<TwColor, string> = {
  primary: 'border-primary-600',
  secondary: 'border-secondary-600',
  accent: 'border-accent-600',
  neutral: 'border-fg',
  info: 'border-info-600',
  success: 'border-success-600',
  warning: 'border-warning-500',
  error: 'border-error-600',
};

const SOLID_DOT: Record<TwColor, string> = {
  primary: 'bg-primary-600',
  secondary: 'bg-secondary-600',
  accent: 'bg-accent-600',
  neutral: 'bg-fg',
  info: 'bg-info-600',
  success: 'bg-success-600',
  warning: 'bg-warning-500',
  error: 'bg-error-600',
};

const OUTLINE_RING: Record<TwColor, string> = {
  primary: 'border-primary-600',
  secondary: 'border-secondary-600',
  accent: 'border-accent-600',
  neutral: 'border-fg',
  info: 'border-info-600',
  success: 'border-success-600',
  warning: 'border-warning-500',
  error: 'border-error-600',
};

const OUTLINE_DOT: Record<TwColor, string> = {
  primary: 'bg-primary-600',
  secondary: 'bg-secondary-600',
  accent: 'bg-accent-600',
  neutral: 'bg-fg',
  info: 'bg-info-600',
  success: 'bg-success-600',
  warning: 'bg-warning-500',
  error: 'bg-error-600',
};

let nextRadioId = 0;

// ── RadioComponent ───────────────────────────────────────────────

@Component({
  selector: 'tw-radio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="circleWrapClasses()">
      <span [class]="circleClasses()">
        @if (isSelected()) {
          <span [class]="dotWrapClasses()" animate.enter="check-in">
            <ng-content select="[slot='dot']">
              <span [class]="dotClasses()"></span>
            </ng-content>
          </span>
        }
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
    'role': 'radio',
    '[id]': 'hostId',
    '[class]': 'rootClasses()',
    '[attr.data-checked]': 'isSelected()',
    '[attr.aria-checked]': 'isSelected() ? "true" : "false"',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[attr.aria-label]': 'ariaLabel() || null',
    '[attr.aria-labelledby]': 'effectiveAriaLabelledby() || null',
    '[attr.aria-describedby]': 'effectiveAriaDescribedby() || null',
    '[attr.tabindex]': 'isFocusable() ? 0 : -1',
    '[attr.name]': 'effectiveName() || null',
    '(click)': 'onActivate()',
    '(keydown)': 'onKeydown($event)',
    '(blur)': 'onBlur()',
  },
})
export class RadioComponent implements OnInit {
  /** The value this radio contributes when selected inside a `tw-radio-group`. Required when nested in a group; ignored when used standalone. */
  readonly value = input<unknown>(undefined);

  /** Overrides the parent group's color for this radio. When undefined, inherits from the group (or defaults to `'primary'` standalone). */
  readonly color = input<TwColor | undefined>(undefined);

  /** Overrides the parent group's size for this radio. When undefined, inherits from the group (or defaults to `'md'` standalone). */
  readonly size = input<TwSize | undefined>(undefined);

  /** Overrides the parent group's variant for this radio. When undefined, inherits from the group (or defaults to `'solid'` standalone). */
  readonly variant = input<RadioVariant | undefined>(undefined);

  /** When true, disables this radio regardless of the group's state. Group-disabled always wins as an OR. Defaults to `false`. */
  readonly disabled = input(false);

  /** Optional inline label rendered next to the radio. Use default content projection for rich label content instead. */
  readonly label = input<string | undefined>(undefined);

  /** Optional secondary description rendered under the label. Use `[slot="description"]` content projection for rich content instead. */
  readonly description = input<string | undefined>(undefined);

  /** Position of the label/description relative to the radio. Defaults to `'after'`. */
  readonly labelPosition = input<RadioLabelPosition>('after');

  /** Optional name attribute for standalone use. Ignored when the parent group provides a name. */
  readonly name = input<string | undefined>(undefined);

  /** Accessible name when no visible label is provided. Mirrored to `aria-label`. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  /** ID of an external element that labels the radio. Mirrored to `aria-labelledby`. */
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  /** ID of an external element that describes the radio. Mirrored to `aria-describedby`. */
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  /** Two-way bound checked state. Authoritative only in standalone mode; when inside a `tw-radio-group`, this model reflects group selection but does NOT drive it. */
  readonly checked = model(false);

  /** Fires after the checked state changes from a user interaction on this radio. In grouped mode only fires when this radio becomes the selected one. Does not fire when selection is updated programmatically. */
  readonly change = output<boolean>();

  private readonly focusMonitor = inject(FocusMonitor);
  readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly parent = inject(forwardRef(() => RadioGroupComponent), { optional: true });

  private readonly uid = nextRadioId++;
  readonly hostId = `tw-radio-${this.uid}`;
  readonly labelId = `${this.hostId}-label`;
  readonly descriptionId = `${this.hostId}-description`;

  private readonly internalChecked = linkedSignal(() => this.checked());

  /** Resolved color — radio's own color wins, then group's, then `'primary'`. */
  readonly effectiveColor = computed<TwColor>(
    () => this.color() ?? this.parent?.color() ?? 'primary',
  );

  /** Resolved size — radio's own size wins, then group's, then `'md'`. */
  readonly effectiveSize = computed<TwSize>(
    () => this.size() ?? this.parent?.size() ?? 'md',
  );

  /** Resolved variant — radio's own variant wins, then group's, then `'solid'`. */
  readonly effectiveVariant = computed<RadioVariant>(
    () => this.variant() ?? this.parent?.variant() ?? 'solid',
  );

  /** Resolved name attribute — parent group's name wins for HTML form semantics. */
  readonly effectiveName = computed(() => this.parent?.name() ?? this.name());

  /** Whether this radio is currently selected (grouped: parent.value === this.value; standalone: internal checked). */
  readonly isSelected = computed(() => {
    if (this.parent) return this.parent.value() === this.value();
    return this.internalChecked();
  });

  /** Whether this radio is disabled (own disabled OR parent's disabled). */
  readonly isDisabled = computed(
    () => this.disabled() || (this.parent?.isDisabled() ?? false),
  );

  /** Roving tabindex: in a group, only the selected (or first enabled if none selected) radio is focusable. Standalone radios are always focusable unless disabled. */
  readonly isFocusable = computed(() => {
    if (this.isDisabled()) return false;
    if (!this.parent) return true;
    if (this.isSelected()) return true;
    const parentValue = this.parent.value();
    if (parentValue === null || parentValue === undefined) {
      const firstEnabled = this.parent
        .radios()
        .find((r: RadioComponent) => !r.isDisabled());
      return firstEnabled === this;
    }
    return false;
  });

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
    radioVariants({
      size: this.effectiveSize(),
      labelPosition: this.labelPosition(),
      checked: this.isSelected(),
      disabled: this.isDisabled(),
    }),
  );

  readonly rootClasses = computed(() => this.variantResult().root());
  readonly circleWrapClasses = computed(() => this.variantResult().circleWrap());
  readonly labelWrapClasses = computed(() => this.variantResult().labelWrap());
  readonly labelClasses = computed(() => this.variantResult().label());
  readonly descriptionClasses = computed(() => this.variantResult().description());
  readonly dotWrapClasses = computed(() => this.variantResult().dotWrap());

  readonly circleClasses = computed(() => {
    const base = this.variantResult().circle();
    if (!this.isSelected()) return base;
    const ringLookup = this.effectiveVariant() === 'solid' ? SOLID_RING : OUTLINE_RING;
    return `${base} ${ringLookup[this.effectiveColor()]}`;
  });

  readonly dotClasses = computed(() => {
    const base = this.variantResult().dot();
    const dotLookup = this.effectiveVariant() === 'solid' ? SOLID_DOT : OUTLINE_DOT;
    return `${base} ${dotLookup[this.effectiveColor()]}`;
  });

  constructor() {
    afterNextRender(() => {
      if (isDevMode() && !this.hasAccessibleNameHint()) {
        console.warn(
          '[tw-radio] The radio has no accessible name. Provide a `label` input, project label content, or set `aria-label` / `aria-labelledby`.',
        );
      }
    });
  }

  /** Called by user click or group keyboard handler. Selects this radio. */
  onActivate(): void {
    if (this.isDisabled()) return;
    if (this.parent) {
      const wasSelected = this.isSelected();
      this.parent.selectValue(this.value());
      if (!wasSelected) {
        this.change.emit(true);
      }
      return;
    }
    // Standalone — match native <input type="radio">: clicking does not toggle back off
    if (!this.internalChecked()) {
      this.internalChecked.set(true);
      this.checked.set(true);
      this.change.emit(true);
    }
  }

  /** Handles keyboard activation. Space selects; Enter does NOT — matches native `<input type="radio">` semantics. */
  onKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      this.onActivate();
    }
  }

  /** @internal Host blur. In a group, notifies the group's CVA touched callback. */
  onBlur(): void {
    this.parent?.notifyTouched();
  }

  /** Focuses the host element. Required for keyboard navigation from the group. */
  focus(): void {
    this.elementRef.nativeElement.focus();
  }

  ngOnInit(): void {
    this.focusMonitor.monitor(this.elementRef);
    this.destroyRef.onDestroy(() => {
      this.focusMonitor.stopMonitoring(this.elementRef);
    });
  }

  private hasAccessibleNameHint(): boolean {
    if (this.label() || this.ariaLabel() || this.ariaLabelledby()) return true;
    const host = this.elementRef.nativeElement;
    return host.textContent !== null && host.textContent.trim().length > 0;
  }
}

// ── RadioGroup tv() config ───────────────────────────────────────

const radioGroupVariants = tv(
  {
    base: 'flex',
    variants: {
      orientation: {
        vertical: 'flex-col gap-2',
        horizontal: 'flex-row flex-wrap gap-3',
      },
      disabled: {
        true: 'opacity-50 pointer-events-none cursor-not-allowed',
        false: '',
      },
    },
    defaultVariants: {
      orientation: 'vertical',
      disabled: false,
    },
  },
  { twMerge: true },
);

let nextGroupId = 0;

// ── RadioGroupComponent ──────────────────────────────────────────

@Component({
  selector: 'tw-radio-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioGroupComponent),
      multi: true,
    },
  ],
  host: {
    'role': 'radiogroup',
    '[id]': 'hostId',
    '[class]': 'rootClasses()',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[attr.aria-required]': 'required() || null',
    '[attr.aria-label]': 'ariaLabel() || null',
    '[attr.aria-labelledby]': 'ariaLabelledby() || null',
    '[attr.aria-describedby]': 'ariaDescribedby() || null',
    '(keydown)': 'onKeydown($event)',
  },
})
export class RadioGroupComponent<T = unknown> implements ControlValueAccessor, OnInit {
  /** Sets the semantic color applied to the selected radio's dot/ring. Propagated to children unless a child overrides it. Defaults to `'primary'`. */
  readonly color = input<TwColor>('primary');

  /** Controls the overall scale of radios inside the group. Propagated to children unless a child overrides it. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** Visual style of the selected indicator. `'solid'` fills the dot with the color against a colored ring; `'outline'` keeps a transparent fill with a colored ring and colored dot. Propagated to children unless a child overrides it. Defaults to `'solid'`. */
  readonly variant = input<RadioVariant>('solid');

  /** Layout direction of the group. Drives `aria-orientation` and the arrow-key model. Defaults to `'vertical'`. */
  readonly orientation = input<RadioOrientation>('vertical');

  /** When true, disables every radio in the group and blocks keyboard interaction. Defaults to `false`. */
  readonly disabled = input(false);

  /** When true, sets `aria-required="true"` on the group for assistive tech. Defaults to `false`. */
  readonly required = input(false);

  /** Optional form-association name. Propagated to each child radio's host `name` attribute so standard HTML form semantics still apply. */
  readonly name = input<string | undefined>(undefined);

  /** Accessible name for the group when no visible label is provided. Mirrored to `aria-label`. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  /** ID of an external element that labels the group. Mirrored to `aria-labelledby`. */
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  /** ID of an external element that describes the group. Mirrored to `aria-describedby`. */
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  /** Two-way bound selected value. Updates when the user picks a radio; fires `valueChange`. `null` means no selection. */
  readonly value = model<T | null>(null);

  /** Fires after the selected value changes from a user interaction. Does not fire when the value is updated programmatically via `writeValue`. */
  readonly change = output<T | null>();

  /** @internal Child radios discovered via content projection. */
  readonly radios = contentChildren(RadioComponent, { descendants: true });

  private readonly focusMonitor = inject(FocusMonitor);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly hostId = `tw-radio-group-${nextGroupId++}`;

  private onChange: (value: T | null) => void = () => {};
  private onTouched: () => void = () => {};
  private readonly cvaDisabled = signal(false);

  /** Effective disabled state — input OR CVA disabled. */
  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  readonly activeValue = linkedSignal(() => this.value());

  private readonly variantResult = computed(() =>
    radioGroupVariants({
      orientation: this.orientation(),
      disabled: this.isDisabled(),
    }),
  );

  readonly rootClasses = computed(() => this.variantResult());

  constructor() {
    afterNextRender(() => {
      if (isDevMode() && !this.ariaLabel() && !this.ariaLabelledby()) {
        console.warn(
          '[tw-radio-group] The radiogroup has no accessible name. Set `aria-label` or `aria-labelledby`.',
        );
      }
    });
  }

  /** Selects the given value from a user interaction. Updates the model and notifies forms. */
  selectValue(next: unknown): void {
    if (this.isDisabled()) return;
    const typed = next as T | null;
    if (typed === this.activeValue()) {
      this.onTouched();
      return;
    }
    this.activeValue.set(typed);
    this.value.set(typed);
    this.onChange(typed);
    this.onTouched();
    this.change.emit(typed);
  }

  /** @internal Called by child radios on blur — propagates to CVA onTouched. */
  notifyTouched(): void {
    this.onTouched();
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    const radios = this.radios();
    if (radios.length === 0) return;

    const enabledCount = radios.reduce(
      (count, r) => (r.isDisabled() ? count : count + 1),
      0,
    );
    if (enabledCount === 0) return;

    const currentIdx = radios.findIndex(
      (r: RadioComponent) => r.value() === this.activeValue(),
    );
    const startIdx = currentIdx >= 0 ? currentIdx : this.firstEnabledIndex(radios);

    let targetIndex = -1;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        targetIndex = this.findNextEnabledIndex(radios, startIdx, 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        targetIndex = this.findNextEnabledIndex(radios, startIdx, -1);
        break;
      case 'Home':
        targetIndex = this.firstEnabledIndex(radios);
        break;
      case 'End':
        targetIndex = this.lastEnabledIndex(radios);
        break;
      default:
        return;
    }

    if (targetIndex >= 0) {
      event.preventDefault();
      const target = radios[targetIndex];
      this.selectValue(target.value());
      target.focus();
    }
  }

  private findNextEnabledIndex(
    radios: readonly RadioComponent[],
    from: number,
    direction: 1 | -1,
  ): number {
    const len = radios.length;
    let idx = from;
    for (let i = 0; i < len; i++) {
      idx = (idx + direction + len) % len;
      if (!radios[idx].isDisabled()) return idx;
    }
    return -1;
  }

  private firstEnabledIndex(radios: readonly RadioComponent[]): number {
    for (let i = 0; i < radios.length; i++) {
      if (!radios[i].isDisabled()) return i;
    }
    return -1;
  }

  private lastEnabledIndex(radios: readonly RadioComponent[]): number {
    for (let i = radios.length - 1; i >= 0; i--) {
      if (!radios[i].isDisabled()) return i;
    }
    return -1;
  }

  // ── ControlValueAccessor ──

  writeValue(value: T | null): void {
    this.activeValue.set(value);
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  ngOnInit(): void {
    this.focusMonitor.monitor(this.elementRef);
    this.destroyRef.onDestroy(() => {
      this.focusMonitor.stopMonitoring(this.elementRef);
    });
  }
}
