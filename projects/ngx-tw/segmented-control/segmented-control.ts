import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  DestroyRef,
  ElementRef,
  forwardRef,
  inject,
  input,
  linkedSignal,
  model,
  type OnInit,
  signal,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FocusMonitor } from '@angular/cdk/a11y';
import { tv } from 'tailwind-variants';
import type { TwColor, TwSize } from 'ngx-tw/core';

/** Visual style of the active indicator. */
export type SegmentedControlVariant = 'surface' | 'filled' | 'outline';

/** Border-radius shape of the container and options. */
export type SegmentedControlRounded = 'pill' | 'md';

// ── tv() config ──

const segmentedControlVariants = tv({
  slots: {
    root: 'inline-flex bg-surface-muted p-1',
    option:
      'inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap cursor-pointer transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
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
  },
  defaultVariants: {
    size: 'md',
    orientation: 'horizontal',
    rounded: 'pill',
  },
}, { twMerge: true });

// ── Static active class lookups (all classes written statically for Tailwind v4 scanning) ──

const SURFACE_ACTIVE: Record<TwColor, string> = {
  primary: 'bg-surface shadow-sm text-primary-700 dark:text-primary-300',
  secondary: 'bg-surface shadow-sm text-secondary-700 dark:text-secondary-300',
  accent: 'bg-surface shadow-sm text-accent-700 dark:text-accent-300',
  neutral: 'bg-surface shadow-sm text-fg',
  info: 'bg-surface shadow-sm text-info-700 dark:text-info-300',
  success: 'bg-surface shadow-sm text-success-700 dark:text-success-300',
  warning: 'bg-surface shadow-sm text-warning-700 dark:text-warning-300',
  error: 'bg-surface shadow-sm text-error-700 dark:text-error-300',
};

const FILLED_ACTIVE: Record<TwColor, string> = {
  primary: 'bg-primary-600 text-white shadow-sm',
  secondary: 'bg-secondary-600 text-white shadow-sm',
  accent: 'bg-accent-600 text-white shadow-sm',
  neutral: 'bg-surface-muted text-fg shadow-sm',
  info: 'bg-info-600 text-white shadow-sm',
  success: 'bg-success-600 text-white shadow-sm',
  warning: 'bg-warning-500 text-black shadow-sm',
  error: 'bg-error-600 text-white shadow-sm',
};

const OUTLINE_ACTIVE: Record<TwColor, string> = {
  primary: 'ring-2 ring-primary-500 text-primary-700',
  secondary: 'ring-2 ring-secondary-500 text-secondary-700',
  accent: 'ring-2 ring-accent-500 text-accent-700',
  neutral: 'ring-2 ring-border-strong text-fg',
  info: 'ring-2 ring-info-500 text-info-700',
  success: 'ring-2 ring-success-500 text-success-700',
  warning: 'ring-2 ring-warning-500 text-warning-700',
  error: 'ring-2 ring-error-500 text-error-700',
};

const ACTIVE_CLASSES: Record<SegmentedControlVariant, Record<TwColor, string>> = {
  surface: SURFACE_ACTIVE,
  filled: FILLED_ACTIVE,
  outline: OUTLINE_ACTIVE,
};

const INACTIVE_CLASSES = 'text-fg-muted hover:text-fg';

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
  private readonly parent = inject(forwardRef(() => SegmentedControlComponent));

  readonly id = `tw-segmented-option-${nextId++}`;

  readonly isActive = computed(() => this.parent.activeValue() === this.value());

  readonly isDisabled = computed(() => this.disabled() || this.parent.isDisabled());

  readonly isFocusable = computed(() => {
    if (this.isDisabled()) return false;
    if (this.isActive()) return true;
    // If no option is active, first non-disabled option gets focus
    if (this.parent.activeValue() === null) {
      const opts = this.parent.options();
      const first = opts.find((o: SegmentedControlOptionComponent) => !o.isDisabled());
      return first?.value() === this.value();
    }
    return false;
  });

  readonly classes = computed(() => {
    const base = this.parent.baseOptionClasses();
    if (this.isDisabled()) {
      return `${base} opacity-50 pointer-events-none cursor-default`;
    }
    const state = this.isActive()
      ? ACTIVE_CLASSES[this.parent.variant() as SegmentedControlVariant][this.parent.color() as TwColor]
      : INACTIVE_CLASSES;
    return `${base} ${state}`;
  });

  select(): void {
    if (this.isDisabled()) return;
    this.parent.selectOption(this.value());
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
export class SegmentedControlComponent implements ControlValueAccessor, OnInit {
  /** Controls the active indicator style. `'surface'` shows a raised white pill; `'filled'` shows a solid colored background; `'outline'` shows a colored ring border. Defaults to `'surface'`. */
  readonly variant = input<SegmentedControlVariant>('surface');

  /** Sets the semantic color for the active option indicator. Defaults to `'primary'`. */
  readonly color = input<TwColor>('primary');

  /** Controls padding, font size, and gap of options. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** Layout direction of the control. Defaults to `'horizontal'`. */
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');

  /** Controls the border-radius shape of the container and options. `'pill'` uses fully rounded corners; `'md'` uses standard radius. Vertical orientation forces `'md'`. Defaults to `'pill'`. */
  readonly rounded = input<SegmentedControlRounded>('pill');

  /** When true, prevents all interaction and applies muted styling. Defaults to `false`. */
  readonly disabled = input(false);

  /** The value of the currently selected option. Two-way bound. Updates on user selection. */
  readonly value = model<string | null>(null);

  private readonly focusMonitor = inject(FocusMonitor);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  /** @internal */
  readonly options = contentChildren(SegmentedControlOptionComponent);

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};
  private readonly cvaDisabled = signal(false);

  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  readonly activeValue = linkedSignal(() => this.value());

  private readonly effectiveRounded = computed<SegmentedControlRounded>(() =>
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
    return this.isDisabled() ? `${base} opacity-50 pointer-events-none` : base;
  });

  /** @internal */
  readonly baseOptionClasses = computed(() => this.variantResult().option());

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

  // ── Lifecycle ──

  ngOnInit(): void {
    this.focusMonitor.monitor(this.elementRef);
    this.destroyRef.onDestroy(() => {
      this.focusMonitor.stopMonitoring(this.elementRef);
    });
  }
}
