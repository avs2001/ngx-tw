import {
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  type OnInit,
} from '@angular/core';
import { FocusMonitor } from '@angular/cdk/a11y';
import { tv } from 'tailwind-variants';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';

/** Visual style of the button. */
export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'soft' | 'link';

const buttonVariants = tv({
  base: 'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors duration-normal motion-reduce:transition-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
  variants: {
    variant: {
      solid: '',
      outline: 'border',
      ghost: '',
      soft: '',
      link: 'underline-offset-4 hover:underline',
    },
    color: {
      primary: '',
      secondary: '',
      accent: '',
      neutral: '',
      info: '',
      success: '',
      warning: '',
      error: '',
    },
    // Pinned control heights — see `docs/vertical-rhythm.md`. Vertical padding
    // is deliberately absent: the height is declared, not derived. The
    // `outline` variant's 1px border sits *inside* the pinned box under
    // Preflight's global `box-sizing: border-box`, so outline and solid now
    // measure identically at every size (they used to differ by 2px).
    size: {
      xs: 'px-2 text-xs h-6',
      sm: 'px-3 text-sm h-8',
      md: 'px-4 text-sm h-9',
      lg: 'px-5 text-base h-11',
      xl: 'px-6 text-base h-12',
    },
    disabled: {
      true: 'opacity-50 pointer-events-none',
      false: '',
    },
    loading: {
      true: 'pointer-events-none',
      false: '',
    },
  },
  compoundVariants: [
    // Solid variants use the semantic `${color}-solid` token pair so the
    // theme layer owns the AA-contrast bg/fg pairing for each color. Raw
    // `${color}-600` direct usage was violating CLAUDE.md and producing
    // sub-AA contrast for info / success in light mode.

    // ===== Primary =====
    { variant: 'solid', color: 'primary', class: 'bg-primary-solid text-on-primary hover:bg-primary-solid-hover' },
    { variant: 'outline', color: 'primary', class: 'border-primary-300 text-primary-700 hover:bg-primary-50' },
    { variant: 'ghost', color: 'primary', class: 'text-primary-700 hover:bg-primary-50' },
    { variant: 'soft', color: 'primary', class: 'bg-primary-50 text-primary-800 hover:bg-primary-100' },
    { variant: 'link', color: 'primary', class: 'text-primary-700' },

    // ===== Secondary =====
    { variant: 'solid', color: 'secondary', class: 'bg-secondary-solid text-on-secondary hover:bg-secondary-solid-hover' },
    { variant: 'outline', color: 'secondary', class: 'border-secondary-300 text-secondary-700 hover:bg-secondary-50' },
    { variant: 'ghost', color: 'secondary', class: 'text-secondary-700 hover:bg-secondary-50' },
    { variant: 'soft', color: 'secondary', class: 'bg-secondary-50 text-secondary-800 hover:bg-secondary-100' },
    { variant: 'link', color: 'secondary', class: 'text-secondary-700' },

    // ===== Accent =====
    { variant: 'solid', color: 'accent', class: 'bg-accent-solid text-on-accent hover:bg-accent-solid-hover' },
    { variant: 'outline', color: 'accent', class: 'border-accent-300 text-accent-700 hover:bg-accent-50' },
    { variant: 'ghost', color: 'accent', class: 'text-accent-700 hover:bg-accent-50' },
    { variant: 'soft', color: 'accent', class: 'bg-accent-50 text-accent-800 hover:bg-accent-100' },
    { variant: 'link', color: 'accent', class: 'text-accent-700' },

    // ===== Neutral ===== (subdued solid pairs surface-muted with text-fg; on-neutral is white and would be unreadable here)
    { variant: 'solid', color: 'neutral', class: 'bg-surface-muted text-fg hover:bg-surface-sunken' },
    { variant: 'outline', color: 'neutral', class: 'border-border text-fg hover:bg-surface-muted' },
    { variant: 'ghost', color: 'neutral', class: 'text-fg-muted hover:bg-surface-muted' },
    { variant: 'soft', color: 'neutral', class: 'bg-surface-muted text-fg hover:bg-surface-sunken' },
    { variant: 'link', color: 'neutral', class: 'text-fg-muted' },

    // ===== Info =====
    { variant: 'solid', color: 'info', class: 'bg-info-solid text-on-info hover:bg-info-solid-hover' },
    { variant: 'outline', color: 'info', class: 'border-info-300 text-info-700 hover:bg-info-50' },
    { variant: 'ghost', color: 'info', class: 'text-info-700 hover:bg-info-50' },
    { variant: 'soft', color: 'info', class: 'bg-info-50 text-info-800 hover:bg-info-100' },
    { variant: 'link', color: 'info', class: 'text-info-700' },

    // ===== Success =====
    { variant: 'solid', color: 'success', class: 'bg-success-solid text-on-success hover:bg-success-solid-hover' },
    { variant: 'outline', color: 'success', class: 'border-success-300 text-success-700 hover:bg-success-50' },
    { variant: 'ghost', color: 'success', class: 'text-success-700 hover:bg-success-50' },
    { variant: 'soft', color: 'success', class: 'bg-success-50 text-success-800 hover:bg-success-100' },
    { variant: 'link', color: 'success', class: 'text-success-700' },

    // ===== Warning =====
    { variant: 'solid', color: 'warning', class: 'bg-warning-solid text-on-warning hover:bg-warning-solid-hover' },
    { variant: 'outline', color: 'warning', class: 'border-warning-300 text-warning-700 hover:bg-warning-50' },
    { variant: 'ghost', color: 'warning', class: 'text-warning-700 hover:bg-warning-50' },
    { variant: 'soft', color: 'warning', class: 'bg-warning-50 text-warning-800 hover:bg-warning-100' },
    { variant: 'link', color: 'warning', class: 'text-warning-700' },

    // ===== Error =====
    { variant: 'solid', color: 'error', class: 'bg-error-solid text-on-error hover:bg-error-solid-hover' },
    { variant: 'outline', color: 'error', class: 'border-error-300 text-error-700 hover:bg-error-50' },
    { variant: 'ghost', color: 'error', class: 'text-error-700 hover:bg-error-50' },
    { variant: 'soft', color: 'error', class: 'bg-error-50 text-error-800 hover:bg-error-100' },
    { variant: 'link', color: 'error', class: 'text-error-700' },

    // ===== Link variant: strip padding, and opt out of the pinned height =====
    // `link` has no box — no border, no fill — so it is not part of the
    // form-row cohort in `docs/vertical-rhythm.md` and must stay text-shaped:
    // pinning it to `h-9` would blow out the line box of any paragraph it sits
    // in. `h-auto` collapses the size variant's `h-*` via twMerge (same group,
    // compoundVariants apply last), leaving the height equal to the line box —
    // exactly what `py-0` produced before this migration.
    { variant: 'link', size: 'xs', class: 'px-0 h-auto' },
    { variant: 'link', size: 'sm', class: 'px-0 h-auto' },
    { variant: 'link', size: 'md', class: 'px-0 h-auto' },
    { variant: 'link', size: 'lg', class: 'px-0 h-auto' },
    { variant: 'link', size: 'xl', class: 'px-0 h-auto' },
  ],
  defaultVariants: {
    variant: 'solid',
    color: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
  },
}, {
  twMerge: true,
});

/**
 * Enhances a native `<button>` or `<a>` element with library styling, semantic
 * color/size variants, and disabled/loading states. The directive does not
 * expose a `clicked` output — bind `(click)` directly on the host element. When
 * `disabled` or `loading` is true, the directive intercepts clicks with
 * `preventDefault()` + `stopImmediatePropagation()` so the host handler does
 * not run.
 *
 * The directive owns no template, so visual loading affordances (spinner,
 * status text) are composed by the consumer — see the `loading` input.
 */
@Directive({
  selector: '[twButton]',
  exportAs: 'twButton',
  host: {
    '[class]': 'classes()',
    '[attr.aria-disabled]': 'disabled() || loading() || null',
    '[attr.aria-busy]': 'loading() || null',
    '[attr.disabled]': 'isNativeButton() && (disabled() || loading()) ? true : null',
    '[attr.tabindex]': '!isNativeButton() && (disabled() || loading()) ? -1 : null',
    '(click)': 'handleClick($event)',
  },
})
export class ButtonDirective implements OnInit {
  /** Controls the visual style. Defaults to `'solid'`. */
  readonly variant = input<ButtonVariant>('solid');

  /** Sets the semantic color palette. Defaults to `'primary'`. */
  readonly color = input<TwColor>('primary');

  /** Controls the size (padding, font size, icon size). Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** When true, prevents interaction and applies muted styling. Defaults to `false`. */
  readonly disabled = input(false);

  /**
   * When true, blocks clicks and sets `aria-busy="true"`. Defaults to `false`.
   * The directive does not render a spinner or status text — compose them in
   * the projected content:
   *
   * ```html
   * <button twButton [loading]="saving()">
   *   @if (saving()) {
   *     <tw-spinner twButtonIcon size="sm" />
   *     <span class="sr-only">Saving…</span>
   *   }
   *   Save
   * </button>
   * ```
   *
   * The `sr-only` text gives assistive tech an explicit status announcement
   * to pair with the `aria-busy` attribute.
   */
  readonly loading = input(false);

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly focusMonitor = inject(FocusMonitor);
  private readonly destroyRef = inject(DestroyRef);

  readonly isNativeButton = computed(
    () => this.elementRef.nativeElement.tagName === 'BUTTON',
  );

  readonly classes = computed(() =>
    buttonVariants({
      variant: this.variant(),
      color: this.color(),
      size: this.size(),
      disabled: this.disabled() || this.loading(),
      loading: this.loading(),
    }),
  );

  ngOnInit(): void {
    this.focusMonitor.monitor(this.elementRef);
    this.destroyRef.onDestroy(() => {
      this.focusMonitor.stopMonitoring(this.elementRef);
    });
  }

  /** @internal Swallows clicks while the button is disabled or loading, so neither navigation nor consumer handlers run. */
  handleClick(event: MouseEvent): void {
    if (this.disabled() || this.loading()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
}

@Directive({
  selector: '[twButtonIcon]',
  host: {
    '[class]': 'classes()',
  },
})
export class ButtonIconDirective {
  /**
   * Position of the icon relative to the button label. Defaults to `'leading'`.
   *
   * The empty-string member of the union is load-bearing: Angular binds `''` to
   * the input when the selector is used as a bare attribute (`<svg twButtonIcon>`),
   * which is the canonical "leading" usage. Templates that omit a value still
   * have the directive attached and resolve to leading placement at runtime via
   * the `=== 'trailing'` check below.
   */
  readonly twButtonIcon = input<'' | 'leading' | 'trailing'>('leading');

  private readonly button = inject(ButtonDirective);

  readonly classes = computed(() => {
    const size = this.button.size();
    const iconSize = size === 'xs' || size === 'sm' ? 'size-4' : 'size-5';
    // `order-last` only takes effect when the button host is a flex container —
    // `ButtonDirective`'s base class includes `inline-flex`, which is the
    // contract this directive relies on for trailing-icon placement.
    const order = this.twButtonIcon() === 'trailing' ? 'order-last' : '';
    return [iconSize, 'shrink-0', order].filter(Boolean).join(' ');
  });
}
