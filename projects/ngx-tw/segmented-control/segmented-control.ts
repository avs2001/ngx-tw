import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  ElementRef,
  forwardRef,
  inject,
  input,
  isDevMode,
  linkedSignal,
  model,
  signal,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { tv } from 'tailwind-variants';
import type { TwColor, TwOrientation, TwSize } from 'ngx-tw/core';

/** Visual style of the active indicator. */
export type SegmentedControlVariant = 'surface' | 'filled' | 'outline';

/** Border-radius shape of the container and options. */
export type SegmentedControlRounded = 'pill' | 'md';

// ── tv() config ──
// All slot styling — base, size, orientation, rounded, variant × color × active,
// disabled — flows through this single config. Static literal class strings are
// required so the Tailwind v4 JIT scanner picks them up; new
// `{role}-{solid,fg,border-strong}` combinations need a matching entry in
// `theme/index.css`'s `@source inline(...)` safelist.

const segmentedControlVariants = tv({
  slots: {
    root: 'inline-flex bg-surface-muted p-1',
    option:
      'inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap cursor-pointer transition-colors duration-normal motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
  },
  variants: {
    size: {
      xs: { option: 'px-2 py-1 text-xs' },
      sm: { option: 'px-3 py-1.5 text-sm' },
      md: { option: 'px-4 py-2 text-sm' },
      lg: { option: 'px-5 py-2.5 text-base' },
      xl: { option: 'px-6 py-3 text-base' },
    },
    orientation: {
      horizontal: { root: 'flex-row gap-1' },
      vertical: { root: 'flex-col gap-1' },
    },
    rounded: {
      pill: { root: 'rounded-full', option: 'rounded-full' },
      md: { root: 'rounded-md', option: 'rounded-md' },
    },
    // `variant` and `color` participate only via `compoundVariants` below —
    // their per-axis entries are intentionally empty so the cartesian product
    // (3 variants × 8 colors × 2 active states = 48 compound entries) owns
    // all active styling without per-axis defaults bleeding through.
    variant: {
      surface: {},
      filled: {},
      outline: {},
    },
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
    active: {
      true: {},
      false: { option: 'text-fg-muted hover:text-fg' },
    },
    disabled: {
      true: { option: 'opacity-50 pointer-events-none cursor-default' },
      false: {},
    },
  },
  compoundVariants: [
    // surface × color × active=true
    { variant: 'surface', color: 'primary', active: true, class: { option: 'bg-surface shadow-sm text-primary-fg' } },
    { variant: 'surface', color: 'secondary', active: true, class: { option: 'bg-surface shadow-sm text-secondary-fg' } },
    { variant: 'surface', color: 'accent', active: true, class: { option: 'bg-surface shadow-sm text-accent-fg' } },
    { variant: 'surface', color: 'neutral', active: true, class: { option: 'bg-surface shadow-sm text-fg' } },
    { variant: 'surface', color: 'info', active: true, class: { option: 'bg-surface shadow-sm text-info-fg' } },
    { variant: 'surface', color: 'success', active: true, class: { option: 'bg-surface shadow-sm text-success-fg' } },
    { variant: 'surface', color: 'warning', active: true, class: { option: 'bg-surface shadow-sm text-warning-fg' } },
    { variant: 'surface', color: 'error', active: true, class: { option: 'bg-surface shadow-sm text-error-fg' } },
    // filled × color × active=true
    { variant: 'filled', color: 'primary', active: true, class: { option: 'bg-primary-solid text-primary-solid-fg shadow-sm' } },
    { variant: 'filled', color: 'secondary', active: true, class: { option: 'bg-secondary-solid text-secondary-solid-fg shadow-sm' } },
    { variant: 'filled', color: 'accent', active: true, class: { option: 'bg-accent-solid text-accent-solid-fg shadow-sm' } },
    { variant: 'filled', color: 'neutral', active: true, class: { option: 'bg-neutral-solid text-neutral-solid-fg shadow-sm' } },
    { variant: 'filled', color: 'info', active: true, class: { option: 'bg-info-solid text-info-solid-fg shadow-sm' } },
    { variant: 'filled', color: 'success', active: true, class: { option: 'bg-success-solid text-success-solid-fg shadow-sm' } },
    { variant: 'filled', color: 'warning', active: true, class: { option: 'bg-warning-solid text-warning-solid-fg shadow-sm' } },
    { variant: 'filled', color: 'error', active: true, class: { option: 'bg-error-solid text-error-solid-fg shadow-sm' } },
    // outline × color × active=true
    { variant: 'outline', color: 'primary', active: true, class: { option: 'ring-2 ring-primary-border-strong text-primary-fg' } },
    { variant: 'outline', color: 'secondary', active: true, class: { option: 'ring-2 ring-secondary-border-strong text-secondary-fg' } },
    { variant: 'outline', color: 'accent', active: true, class: { option: 'ring-2 ring-accent-border-strong text-accent-fg' } },
    { variant: 'outline', color: 'neutral', active: true, class: { option: 'ring-2 ring-border-strong text-fg' } },
    { variant: 'outline', color: 'info', active: true, class: { option: 'ring-2 ring-info-border-strong text-info-fg' } },
    { variant: 'outline', color: 'success', active: true, class: { option: 'ring-2 ring-success-border-strong text-success-fg' } },
    { variant: 'outline', color: 'warning', active: true, class: { option: 'ring-2 ring-warning-border-strong text-warning-fg' } },
    { variant: 'outline', color: 'error', active: true, class: { option: 'ring-2 ring-error-border-strong text-error-fg' } },
  ],
  defaultVariants: {
    size: 'md',
    orientation: 'horizontal',
    rounded: 'pill',
    variant: 'surface',
    color: 'primary',
    active: false,
    disabled: false,
  },
}, { twMerge: true });

// ── SegmentedControlOptionComponent ──

let nextId = 0;

@Component({
  selector: 'tw-segmented-option',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    'role': 'radio',
    '[id]': 'id',
    '[class]': 'classes()',
    '[attr.aria-checked]': 'isActive()',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[attr.tabindex]': 'isFocusable() ? 0 : -1',
    '(click)': 'select()',
  },
})
export class SegmentedControlOptionComponent {
  /** Unique value identifying this option. Required. */
  readonly value = input.required<string>();

  /** When true, this option cannot be selected and is skipped by keyboard navigation. Defaults to `false`. */
  readonly disabled = input(false);

  readonly elementRef = inject(ElementRef<HTMLElement>);
  // `{ optional: true }` so the dev-mode guard below can fire a clearer
  // error than a raw DI failure when the option is rendered outside a
  // `<tw-segmented-control>`. All downstream reads use `this.parent?.` so
  // production misconfiguration degrades cleanly to a non-interactive option
  // (the dev `console.error` makes the cause obvious during development).
  private readonly parent: SegmentedControlComponent | null = inject(
    forwardRef(() => SegmentedControlComponent),
    { optional: true },
  );

  readonly id = `tw-segmented-option-${nextId++}`;

  constructor() {
    if (isDevMode() && !this.parent) {
      console.error(
        '<tw-segmented-option> must be a child of <tw-segmented-control>.',
      );
    }
  }

  readonly isActive = computed(() => this.parent?.activeValue() === this.value());

  readonly isDisabled = computed(() => this.disabled() || (this.parent?.isDisabled() ?? false));

  readonly isFocusable = computed(() => {
    if (this.isDisabled()) return false;
    if (this.isActive()) return true;
    // If no option is active, first non-disabled option gets focus
    if (this.parent?.activeValue() === null) {
      const opts = this.parent.options();
      const first = opts.find((o: SegmentedControlOptionComponent) => !o.isDisabled());
      return first?.value() === this.value();
    }
    return false;
  });

  readonly classes = computed(() => {
    const result = segmentedControlVariants({
      size: this.parent?.size() ?? 'md',
      orientation: this.parent?.orientation() ?? 'horizontal',
      rounded: this.parent?.effectiveRounded() ?? 'pill',
      variant: this.parent?.variant() ?? 'surface',
      color: this.parent?.color() ?? 'primary',
      active: this.isActive(),
      disabled: this.isDisabled(),
    });
    return result.option();
  });

  select(): void {
    if (this.isDisabled()) return;
    this.parent?.selectOption(this.value());
  }

  focus(): void {
    this.elementRef.nativeElement.focus();
  }
}

// ── SegmentedControlComponent ──

@Component({
  selector: 'tw-segmented-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SegmentedControlComponent),
      multi: true,
    },
  ],
  host: {
    'role': 'radiogroup',
    '[class]': 'rootClasses()',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '(keydown)': 'onKeydown($event)',
  },
})
export class SegmentedControlComponent implements ControlValueAccessor {
  /** Controls the active indicator style. `'surface'` shows a raised white pill; `'filled'` shows a solid colored background; `'outline'` shows a colored ring border. Defaults to `'surface'`. */
  readonly variant = input<SegmentedControlVariant>('surface');

  /** Sets the semantic color for the active option indicator. Defaults to `'primary'`. */
  readonly color = input<TwColor>('primary');

  /** Controls padding, font size, and gap of options. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** Layout direction of the control. Defaults to `'horizontal'`. */
  readonly orientation = input<TwOrientation>('horizontal');

  /** Controls the border-radius shape of the container and options. `'pill'` uses fully rounded corners; `'md'` uses standard radius. Vertical orientation forces `'md'`. Defaults to `'pill'`. */
  readonly rounded = input<SegmentedControlRounded>('pill');

  /** When true, prevents all interaction and applies muted styling. Defaults to `false`. */
  readonly disabled = input(false);

  /** The value of the currently selected option. Two-way bound. Updates on user selection. */
  readonly value = model<string | null>(null);

  /** @internal */
  readonly options = contentChildren(SegmentedControlOptionComponent);

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};
  private readonly cvaDisabled = signal(false);

  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  readonly activeValue = linkedSignal(() => this.value());

  /** @internal Read by `SegmentedControlOptionComponent.classes` to resolve the option's tv() bucket. Vertical orientation forces `'md'` regardless of input. */
  readonly effectiveRounded = computed<SegmentedControlRounded>(() =>
    this.orientation() === 'vertical' ? 'md' : this.rounded(),
  );

  private readonly variantResult = computed(() =>
    segmentedControlVariants({
      size: this.size(),
      orientation: this.orientation(),
      rounded: this.effectiveRounded(),
    }),
  );

  readonly rootClasses = computed(() => {
    const base = this.variantResult().root();
    return this.isDisabled()
      ? `${base} opacity-50 pointer-events-none`
      : base;
  });

  // ── Selection ──

  selectOption(val: string): void {
    if (this.isDisabled()) return;
    this.activeValue.set(val);
    this.value.set(val);
    this.onChange(val);
    this.onTouched();
  }

  // ── Keyboard navigation ──

  onKeydown(event: KeyboardEvent): void {
    const opts = this.options();
    if (opts.length === 0) return;

    let targetIndex = -1;
    const currentIdx = opts.findIndex(o => o.value() === this.activeValue());
    const startIdx = currentIdx >= 0 ? currentIdx : 0;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        targetIndex = this.findNextEnabledIndex(opts, startIdx, 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        targetIndex = this.findNextEnabledIndex(opts, startIdx, -1);
        break;
      case 'Home':
        targetIndex = opts.findIndex(o => !o.isDisabled());
        break;
      case 'End':
        for (let i = opts.length - 1; i >= 0; i--) {
          if (!opts[i].isDisabled()) { targetIndex = i; break; }
        }
        break;
      default:
        return;
    }

    if (targetIndex >= 0) {
      event.preventDefault();
      const opt = opts[targetIndex];
      this.selectOption(opt.value());
      opt.focus();
    }
  }

  private findNextEnabledIndex(
    opts: readonly SegmentedControlOptionComponent[],
    from: number,
    direction: 1 | -1,
  ): number {
    const len = opts.length;
    let idx = from;
    for (let i = 0; i < len; i++) {
      idx = (idx + direction + len) % len;
      if (!opts[idx].isDisabled()) return idx;
    }
    return -1;
  }

  // ── ControlValueAccessor ──

  writeValue(val: string | null): void {
    this.activeValue.set(val);
    this.value.set(val ?? null);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}
