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
import type { TwColor, TwSize } from 'ngx-tw/core';

/** Visual style of the button. */
export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'soft' | 'link';

const buttonVariants = tv({
  base: 'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors duration-200 motion-reduce:transition-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
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
    size: {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
      xl: 'px-6 py-3 text-base',
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
    // ===== Primary =====
    { variant: 'solid', color: 'primary', class: 'bg-primary-600 text-white hover:bg-primary-700' },
    { variant: 'outline', color: 'primary', class: 'border-primary-300 text-primary-700 hover:bg-primary-50' },
    { variant: 'ghost', color: 'primary', class: 'text-primary-700 hover:bg-primary-50' },
    { variant: 'soft', color: 'primary', class: 'bg-primary-50 text-primary-800 hover:bg-primary-100' },
    { variant: 'link', color: 'primary', class: 'text-primary-700' },

    // ===== Secondary =====
    { variant: 'solid', color: 'secondary', class: 'bg-secondary-600 text-white hover:bg-secondary-700' },
    { variant: 'outline', color: 'secondary', class: 'border-secondary-300 text-secondary-700 hover:bg-secondary-50' },
    { variant: 'ghost', color: 'secondary', class: 'text-secondary-700 hover:bg-secondary-50' },
    { variant: 'soft', color: 'secondary', class: 'bg-secondary-50 text-secondary-800 hover:bg-secondary-100' },
    { variant: 'link', color: 'secondary', class: 'text-secondary-700' },

    // ===== Accent =====
    { variant: 'solid', color: 'accent', class: 'bg-accent-600 text-white hover:bg-accent-700' },
    { variant: 'outline', color: 'accent', class: 'border-accent-300 text-accent-700 hover:bg-accent-50' },
    { variant: 'ghost', color: 'accent', class: 'text-accent-700 hover:bg-accent-50' },
    { variant: 'soft', color: 'accent', class: 'bg-accent-50 text-accent-800 hover:bg-accent-100' },
    { variant: 'link', color: 'accent', class: 'text-accent-700' },

    // ===== Neutral =====
    { variant: 'solid', color: 'neutral', class: 'bg-surface-muted text-fg hover:bg-surface-sunken' },
    { variant: 'outline', color: 'neutral', class: 'border-border text-fg hover:bg-surface-muted' },
    { variant: 'ghost', color: 'neutral', class: 'text-fg-muted hover:bg-surface-muted' },
    { variant: 'soft', color: 'neutral', class: 'bg-surface-muted text-fg hover:bg-surface-sunken' },
    { variant: 'link', color: 'neutral', class: 'text-fg-muted' },

    // ===== Info =====
    { variant: 'solid', color: 'info', class: 'bg-info-600 text-white hover:bg-info-700' },
    { variant: 'outline', color: 'info', class: 'border-info-300 text-info-700 hover:bg-info-50' },
    { variant: 'ghost', color: 'info', class: 'text-info-700 hover:bg-info-50' },
    { variant: 'soft', color: 'info', class: 'bg-info-50 text-info-800 hover:bg-info-100' },
    { variant: 'link', color: 'info', class: 'text-info-700' },

    // ===== Success =====
    { variant: 'solid', color: 'success', class: 'bg-success-600 text-white hover:bg-success-700' },
    { variant: 'outline', color: 'success', class: 'border-success-300 text-success-700 hover:bg-success-50' },
    { variant: 'ghost', color: 'success', class: 'text-success-700 hover:bg-success-50' },
    { variant: 'soft', color: 'success', class: 'bg-success-50 text-success-800 hover:bg-success-100' },
    { variant: 'link', color: 'success', class: 'text-success-700' },

    // ===== Warning =====
    { variant: 'solid', color: 'warning', class: 'bg-warning-500 text-black hover:bg-warning-600' },
    { variant: 'outline', color: 'warning', class: 'border-warning-300 text-warning-700 hover:bg-warning-50' },
    { variant: 'ghost', color: 'warning', class: 'text-warning-700 hover:bg-warning-50' },
    { variant: 'soft', color: 'warning', class: 'bg-warning-50 text-warning-800 hover:bg-warning-100' },
    { variant: 'link', color: 'warning', class: 'text-warning-700' },

    // ===== Error =====
    { variant: 'solid', color: 'error', class: 'bg-error-600 text-white hover:bg-error-700' },
    { variant: 'outline', color: 'error', class: 'border-error-300 text-error-700 hover:bg-error-50' },
    { variant: 'ghost', color: 'error', class: 'text-error-700 hover:bg-error-50' },
    { variant: 'soft', color: 'error', class: 'bg-error-50 text-error-800 hover:bg-error-100' },
    { variant: 'link', color: 'error', class: 'text-error-700' },

    // ===== Link variant: strip padding =====
    { variant: 'link', size: 'xs', class: 'px-0 py-0' },
    { variant: 'link', size: 'sm', class: 'px-0 py-0' },
    { variant: 'link', size: 'md', class: 'px-0 py-0' },
    { variant: 'link', size: 'lg', class: 'px-0 py-0' },
    { variant: 'link', size: 'xl', class: 'px-0 py-0' },
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

  /** When true, shows a loading state and prevents interaction. Defaults to `false`. */
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
  /** Position of the icon relative to the button label. Defaults to `'leading'`. */
  readonly twButtonIcon = input<'' | 'leading' | 'trailing'>('leading');

  private readonly button = inject(ButtonDirective);

  readonly classes = computed(() => {
    const size = this.button.size();
    const iconSize = size === 'xs' || size === 'sm' ? 'size-4' : 'size-5';
    const order = this.twButtonIcon() === 'trailing' ? 'order-last' : '';
    return [iconSize, 'shrink-0', order].filter(Boolean).join(' ');
  });
}
