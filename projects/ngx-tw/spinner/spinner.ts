import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { tv } from 'tailwind-variants';
import type { TwColor, TwSize } from 'ngx-tw/core';

/** Visual style of the spinner. */
export type SpinnerVariant = 'circular' | 'dots' | 'bars';

/** Semantic color for the spinner. `'current'` inherits from parent `currentColor`. */
export type SpinnerColor = TwColor | 'current';

/** Size of the spinner. `'inherit'` sizes the spinner to `1em` so it scales with the surrounding font. */
export type SpinnerSize = TwSize | 'inherit';

const spinnerVariants = tv({
  slots: {
    root: 'relative inline-flex items-center justify-center shrink-0 align-middle',
    svg: 'size-full animate-spin motion-reduce:animate-none',
    track: '',
    stroke: '',
    dots: 'inline-flex items-center justify-center gap-1 size-full',
    bars: 'inline-flex items-end justify-center gap-1 size-full',
    bar: 'tw-spinner-bar',
    dot: 'tw-spinner-dot',
    srLabel: 'sr-only',
  },
  variants: {
    color: {
      current: {},
      primary: { root: 'text-primary-500' },
      secondary: { root: 'text-secondary-500' },
      accent: { root: 'text-accent-500' },
      neutral: { root: 'text-fg-muted' },
      info: { root: 'text-info-500' },
      success: { root: 'text-success-500' },
      warning: { root: 'text-warning-500' },
      error: { root: 'text-error-500' },
    },
    size: {
      xs: { root: 'size-3' },
      sm: { root: 'size-4' },
      md: { root: 'size-5' },
      lg: { root: 'size-6' },
      xl: { root: 'size-8' },
      inherit: { root: 'size-[1em]' },
    },
  },
  defaultVariants: {
    color: 'current',
    size: 'md',
  },
}, {
  twMerge: true,
});

/**
 * Indeterminate loading indicator.
 *
 * Designed to compose inside other ngx-tw components:
 * - Inside `<button twButton [loading]="true">` — inherits the button's text color via `color="current"`.
 * - Inside `<tw-form-field>` as `twSuffix` — indicates async validation / pending load.
 * - Inline with text using `size="inherit"` — scales with the surrounding font.
 * - Centered inside cards or overlay wrappers for region-level loading states.
 *
 * @example
 * ```html
 * <tw-spinner />
 * <tw-spinner color="success" size="lg" />
 * <tw-spinner twSuffix size="sm" label="Validating email" />
 * ```
 */
@Component({
  selector: 'tw-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'role': 'status',
    'aria-live': 'polite',
    '[class]': 'rootClasses()',
  },
  template: `
    @switch (variant()) {
      @case ('circular') {
        <svg [class]="svgClasses()" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          @if (track()) {
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="3"
              opacity="0.2"
            />
          }
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-dasharray="60"
            stroke-dashoffset="40"
          />
        </svg>
      }
      @case ('dots') {
        <span [class]="dotsClasses()" aria-hidden="true">
          <span [class]="dotClasses()" style="animation-delay: -0.3s"></span>
          <span [class]="dotClasses()" style="animation-delay: -0.15s"></span>
          <span [class]="dotClasses()"></span>
        </span>
      }
      @case ('bars') {
        <span [class]="barsClasses()" aria-hidden="true">
          <span [class]="barClasses()" style="animation-delay: -0.4s"></span>
          <span [class]="barClasses()" style="animation-delay: -0.2s"></span>
          <span [class]="barClasses()"></span>
        </span>
      }
    }
    <span [class]="srLabelClasses()">{{ label() }}</span>
  `,
})
export class SpinnerComponent {
  /** Controls the visual style of the spinner. Defaults to `'circular'`. */
  readonly variant = input<SpinnerVariant>('circular');

  /** Semantic color. `'current'` inherits the surrounding text color — required for composition inside buttons and form-field prefix/suffix slots. Defaults to `'current'`. */
  readonly color = input<SpinnerColor>('current');

  /** Sets the spinner dimensions. `'inherit'` sizes the spinner to `1em` so it matches the surrounding font size (useful for inline text indicators). Defaults to `'md'`. */
  readonly size = input<SpinnerSize>('md');

  /** When true, renders a subtle ring behind the rotating stroke. Without the track ring the spinner reads as a partial arc, not a loading indicator. Only applies to the `'circular'` variant. Defaults to `true`. */
  readonly track = input(true);

  /** Accessible label announced by assistive technology. Rendered in a visually hidden span. Defaults to `'Loading'`. */
  readonly label = input('Loading');

  private readonly variantResult = computed(() =>
    spinnerVariants({ color: this.color(), size: this.size() }),
  );

  readonly rootClasses = computed(() => this.variantResult().root());
  readonly svgClasses = computed(() => this.variantResult().svg());
  readonly dotsClasses = computed(() => this.variantResult().dots());
  readonly dotClasses = computed(() => this.variantResult().dot());
  readonly barsClasses = computed(() => this.variantResult().bars());
  readonly barClasses = computed(() => this.variantResult().bar());
  readonly srLabelClasses = computed(() => this.variantResult().srLabel());
}
