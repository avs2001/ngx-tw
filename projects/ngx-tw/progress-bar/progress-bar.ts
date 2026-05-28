/**
 * `tw-progress-bar` — visualises measurable progress.
 *
 * Composition usecases:
 * - Upload progress (determinate linear with `options.formatter` → `"3.2 MB / 10 MB"`).
 * - Multi-step wizard (segmented variant, `options.segments` = step count).
 * - Skill / rating display (static determinate linear).
 * - Inline list-row progress (compact `size="sm"`, constrained width via host class).
 * - Card-footer task completion (`options.showValue=true`, `color` switches to `success`/`error`).
 * - Indeterminate loading before first byte (omit `value` — the bar sweeps).
 *
 * For unknown-duration operations with no measurable progress, use `tw-spinner` instead.
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  untracked,
} from '@angular/core';
import { tv } from 'tailwind-variants';
import type { TwColor } from 'ngx-tw/core';

// `ngDevMode` is a globalThis flag set by Angular's build tooling — true in dev,
// `false` in production builds. The `typeof` guard keeps the warning path safe
// in environments (SSR, ad-hoc test harnesses) where the global is undeclared.
// Preferred over `isDevMode()` because the latter is a runtime function call;
// `ngDevMode` is a build-time constant the bundler can dead-code-eliminate.
declare const ngDevMode: boolean | undefined;

/** Visual style of the progress bar. */
export type ProgressBarVariant = 'linear' | 'segmented';

/** Size scale specific to progress bars (bar thickness). */
export type ProgressBarSize = 'sm' | 'md' | 'lg';

/** Function signature for formatting the visible / announced progress value. */
export type ProgressBarValueFormatter = (value: number, max: number, min: number) => string;

/**
 * Non-visual configuration bundled into a single input to keep the component's public
 * surface small. Every field is optional and falls back to a sensible default.
 */
export interface ProgressBarOptions {
  /** Lower bound of the value range. Defaults to `0`. */
  min?: number;
  /** Upper bound of the value range. Defaults to `100`. */
  max?: number;
  /** Number of equal cells when `variant` is `'segmented'`. Ignored for `'linear'`. Defaults to `5`. */
  segments?: number;
  /** When true, renders the formatted progress value next to the label. Defaults to `false`. */
  showValue?: boolean;
  /** Custom formatter for the displayed and announced value. Defaults to an integer percentage, e.g. `'42%'`. */
  formatter?: ProgressBarValueFormatter;
  /** Accessible name when no visible `label` is provided. Mirrored to `aria-label` on the progressbar element. */
  ariaLabel?: string;
  /** ID of an external element that labels the progress bar. Mirrored to `aria-labelledby`. */
  ariaLabelledby?: string;
}

// ── Static fill-color lookup (Tailwind v4 scans class strings statically) ──

const FILL_COLORS: Record<TwColor, string> = {
  primary: 'bg-primary-500',
  secondary: 'bg-secondary-500',
  accent: 'bg-accent-500',
  neutral: 'bg-fg',
  info: 'bg-info-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
};

// ── tv() config ──

const progressBarVariants = tv({
  slots: {
    root: 'flex flex-col w-full',
    header: 'flex items-center justify-between gap-3',
    label: 'text-xs text-fg-muted',
    valueText: 'text-xs text-fg-muted font-medium tabular-nums',
    rail: 'relative w-full overflow-hidden rounded-full bg-surface-muted',
    fill: 'absolute inset-y-0 left-0 rounded-full',
    segmentList: 'flex w-full gap-1',
    segment: 'flex-1 rounded-full',
  },
  variants: {
    size: {
      sm: { rail: 'h-1', segment: 'h-1' },
      md: { rail: 'h-2', segment: 'h-2' },
      lg: { rail: 'h-3', segment: 'h-3' },
    },
    variant: {
      linear: { segmentList: 'hidden' },
      segmented: { rail: 'hidden' },
    },
    isIndeterminate: {
      true: { fill: 'w-[30%] animate-progress-bar-indeterminate' },
      false: { fill: 'transition-[width] duration-normal motion-reduce:transition-none' },
    },
    hasHeader: {
      true: { root: 'gap-1.5' },
      false: { root: 'gap-0' },
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'linear',
    isIndeterminate: false,
    hasHeader: false,
  },
}, {
  twMerge: true,
});

let nextId = 0;

const DEFAULT_FORMATTER: ProgressBarValueFormatter = (value, max, min) => {
  const range = max - min;
  if (range <= 0) return '0%';
  return `${Math.round(((value - min) / range) * 100)}%`;
};

/**
 * Indicates progress toward the completion of a task.
 *
 * @example
 * ```html
 * <tw-progress-bar [value]="40" />
 * <tw-progress-bar label="Fetching records" />
 * <tw-progress-bar
 *   variant="segmented"
 *   [value]="step() * 25"
 *   [options]="{ segments: 4 }"
 * />
 * ```
 */
@Component({
  selector: 'tw-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'rootClasses()',
  },
  template: `
    @if (hasHeader()) {
      <div [class]="headerClasses()">
        @if (label(); as lbl) {
          <span [id]="labelId" [class]="labelClasses()">{{ lbl }}</span>
        } @else {
          <span></span>
        }
        @if (resolvedShowValue() && !isIndeterminate()) {
          <span [class]="valueTextClasses()">{{ formattedValue() }}</span>
        }
      </div>
    }

    @if (variant() === 'linear') {
      <div
        [class]="railClasses()"
        role="progressbar"
        [attr.aria-valuemin]="resolvedMin()"
        [attr.aria-valuemax]="resolvedMax()"
        [attr.aria-valuenow]="isIndeterminate() ? null : clampedValue()"
        [attr.aria-valuetext]="isIndeterminate() ? null : formattedValue()"
        [attr.aria-busy]="isIndeterminate() ? true : null"
        [attr.aria-label]="resolvedAriaLabel()"
        [attr.aria-labelledby]="resolvedAriaLabelledby()"
      >
        @if (isIndeterminate()) {
          <span [class]="fillClasses()"></span>
        } @else {
          <span [class]="fillClasses()" [style.width.%]="progressRatio() * 100"></span>
        }
      </div>
    } @else {
      <div
        [class]="segmentListClasses()"
        role="progressbar"
        [attr.aria-valuemin]="resolvedMin()"
        [attr.aria-valuemax]="resolvedMax()"
        [attr.aria-valuenow]="isIndeterminate() ? null : clampedValue()"
        [attr.aria-valuetext]="isIndeterminate() ? null : formattedValue()"
        [attr.aria-busy]="isIndeterminate() ? true : null"
        [attr.aria-label]="resolvedAriaLabel()"
        [attr.aria-labelledby]="resolvedAriaLabelledby()"
      >
        @for (i of segmentIndices(); track i) {
          <span [class]="segmentClassFor(i)"></span>
        }
      </div>
    }
  `,
})
export class ProgressBarComponent {
  /** Current progress value. When null or undefined, the bar renders indeterminate. Values outside `[options.min, options.max]` are clamped. */
  readonly value = input<number | null | undefined>(null);

  /** Visual style of the bar. `'linear'` renders a single fill; `'segmented'` splits the rail into discrete steps. Defaults to `'linear'`. */
  readonly variant = input<ProgressBarVariant>('linear');

  /** Semantic color of the filled portion. Defaults to `'primary'`. Use status colors (`success`/`warning`/`error`) to reflect task outcome. */
  readonly color = input<TwColor>('primary');

  /** Bar thickness. `'sm'` = h-1, `'md'` = h-2, `'lg'` = h-3. Defaults to `'md'`. */
  readonly size = input<ProgressBarSize>('md');

  /** Visible label rendered above the bar. When set, the bar is wired to the label via `aria-labelledby`. */
  readonly label = input<string | undefined>(undefined);

  /** Bundles non-visual configuration: value range (`min`/`max`/`segments`), value readout (`showValue`/`formatter`), and accessibility fallbacks (`ariaLabel`/`ariaLabelledby`). Every field is optional. */
  readonly options = input<ProgressBarOptions | undefined>(undefined);

  /** @internal */
  readonly labelId = `tw-progress-bar-${nextId++}-label`;

  /** @internal */
  readonly resolvedMin = computed(() => this.options()?.min ?? 0);

  /** @internal */
  readonly resolvedMax = computed(() => this.options()?.max ?? 100);

  /** @internal */
  readonly resolvedSegments = computed(() => this.options()?.segments ?? 5);

  /** @internal */
  readonly resolvedShowValue = computed(() => this.options()?.showValue ?? false);

  /** @internal */
  readonly isIndeterminate = computed(() => {
    const v = this.value();
    return v === null || v === undefined;
  });

  /** @internal */
  readonly clampedValue = computed(() => {
    const v = this.value();
    if (v === null || v === undefined) return this.resolvedMin();
    const lo = this.resolvedMin();
    const hi = this.resolvedMax();
    if (v < lo) return lo;
    if (v > hi) return hi;
    return v;
  });

  /** @internal */
  readonly progressRatio = computed(() => {
    if (this.isIndeterminate()) return 0;
    const range = this.resolvedMax() - this.resolvedMin();
    if (range <= 0) return 0;
    return (this.clampedValue() - this.resolvedMin()) / range;
  });

  /** @internal */
  readonly formattedValue = computed(() => {
    if (this.isIndeterminate()) return '';
    const fmt = this.options()?.formatter ?? DEFAULT_FORMATTER;
    return fmt(this.clampedValue(), this.resolvedMax(), this.resolvedMin());
  });

  /** @internal */
  readonly hasHeader = computed(() => !!this.label() || this.resolvedShowValue());

  /** @internal */
  readonly segmentIndices = computed(() => {
    const n = Math.max(1, Math.floor(this.resolvedSegments()));
    return Array.from({ length: n }, (_, i) => i);
  });

  /** @internal */
  readonly resolvedAriaLabel = computed(() => {
    if (this.label()) return null;
    if (this.options()?.ariaLabelledby) return null;
    return this.options()?.ariaLabel ?? null;
  });

  /** @internal */
  readonly resolvedAriaLabelledby = computed(() => {
    if (this.label()) return this.labelId;
    return this.options()?.ariaLabelledby ?? null;
  });

  // ── tv() slot computeds ──

  private readonly variantResult = computed(() =>
    progressBarVariants({
      size: this.size(),
      variant: this.variant(),
      isIndeterminate: this.isIndeterminate(),
      hasHeader: this.hasHeader(),
    }),
  );

  readonly rootClasses = computed(() => this.variantResult().root());
  readonly headerClasses = computed(() => this.variantResult().header());
  readonly labelClasses = computed(() => this.variantResult().label());
  readonly valueTextClasses = computed(() => this.variantResult().valueText());
  readonly railClasses = computed(() => this.variantResult().rail());
  readonly fillClasses = computed(() => `${this.variantResult().fill()} ${FILL_COLORS[this.color()]}`);
  readonly segmentListClasses = computed(() => this.variantResult().segmentList());
  private readonly segmentBaseClasses = computed(() => this.variantResult().segment());

  /** @internal */
  segmentClassFor(index: number): string {
    const base = this.segmentBaseClasses();
    const filled = (index + 1) / this.segmentIndices().length <= this.progressRatio();
    const bg = filled ? FILL_COLORS[this.color()] : 'bg-surface-muted';
    return `${base} ${bg}`;
  }

  // ── Dev-mode accessible-name warning (fires once per instance) ──
  //
  // The effect is reactive on purpose: if a consumer mounts the component
  // without a label and later removes the only accessible name they had, the
  // warning still fires on the *first* render where no name is present. Once
  // it has fired, `warned` short-circuits further evaluations. Production
  // builds skip the entire effect setup because `ngDevMode` is statically
  // `false` and the constructor returns early.

  constructor() {
    if (typeof ngDevMode !== 'undefined' && !ngDevMode) return;
    let warned = false;
    effect(() => {
      if (warned) return;
      const opts = this.options();
      if (this.label() || opts?.ariaLabel || opts?.ariaLabelledby) return;
      // `untracked` wraps the side-effect so the console.warn / flag mutation
      // can never create a reactive subscription — defensive in case future
      // work adds signal reads inside the warning block.
      untracked(() => {
        warned = true;
        console.warn(
          'tw-progress-bar: no accessible name provided. Supply one of `label`, `options.ariaLabel`, or `options.ariaLabelledby`.',
        );
      });
    });
  }
}
