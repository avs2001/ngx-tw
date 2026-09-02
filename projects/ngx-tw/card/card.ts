import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  inject,
  input,
} from '@angular/core';
import { tv } from 'tailwind-variants';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';

/** Visual style of the card container. */
export type CardVariant = 'elevated' | 'outline' | 'ghost' | CardVariantLegacy;

/**
 * Legacy `variant` spellings, kept so existing templates keep compiling.
 * @deprecated `'outlined'` is an alias for `'outline'` and renders identically.
 * It will be removed in the next major — prefer `'outline'`.
 */
export type CardVariantLegacy = 'outlined';

/** Canonical `variant` spellings — the set `tv()` actually keys on. */
type CardVariantCanonical = Exclude<CardVariant, CardVariantLegacy>;

/** Maps every legacy spelling onto its canonical replacement. */
const VARIANT_ALIASES: Readonly<Record<CardVariantLegacy, CardVariantCanonical>> = {
  outlined: 'outline',
};

const cardVariants = tv({
  slots: {
    root: 'rounded-lg text-fg overflow-hidden',
    header: 'text-sm font-semibold text-fg border-b border-border',
    body: 'text-sm text-fg',
    footer: 'text-xs text-fg-muted border-t border-border',
    media: 'w-full overflow-hidden',
  },
  variants: {
    variant: {
      elevated: {
        root: 'bg-surface-raised shadow hover:shadow-md transition-shadow duration-normal motion-reduce:transition-none',
      },
      outline: {
        root: 'bg-surface border border-border',
      },
      ghost: {
        root: 'bg-transparent',
      },
    },
    size: {
      xs: { header: 'p-2', body: 'p-2', footer: 'p-2' },
      sm: { header: 'p-3', body: 'p-3', footer: 'p-3' },
      md: { header: 'p-4', body: 'p-4', footer: 'p-4' },
      lg: { header: 'p-6', body: 'p-6', footer: 'p-6' },
      xl: { header: 'p-8', body: 'p-8', footer: 'p-8' },
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
  },
  compoundVariants: [
    { variant: 'outline', color: 'primary', class: { root: 'border-primary-300' } },
    { variant: 'outline', color: 'secondary', class: { root: 'border-secondary-300' } },
    { variant: 'outline', color: 'accent', class: { root: 'border-accent-300' } },
    { variant: 'outline', color: 'info', class: { root: 'border-info-300' } },
    { variant: 'outline', color: 'success', class: { root: 'border-success-300' } },
    { variant: 'outline', color: 'warning', class: { root: 'border-warning-300' } },
    { variant: 'outline', color: 'error', class: { root: 'border-error-300' } },
  ],
  defaultVariants: {
    variant: 'elevated',
    color: 'neutral',
    size: 'md',
  },
}, {
  twMerge: true,
});

@Component({
  selector: 'tw-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'rootClasses()',
  },
  template: `<ng-content />`,
})
export class CardComponent {
  /** Controls the visual elevation style. Defaults to `'elevated'`. `'outlined'` is a deprecated alias for `'outline'` and renders identically. */
  readonly variant = input<CardVariant>('elevated');

  /** Sets the semantic color for bordered regions. Only applies to `outline` variant borders. Defaults to `'neutral'`. */
  readonly color = input<TwColor>('neutral');

  /** Controls padding of header, body, and footer sections. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** @internal Canonical variant with legacy spellings folded in. */
  private readonly resolvedVariant = computed<CardVariantCanonical>(() => {
    const v = this.variant();
    return (VARIANT_ALIASES as Record<string, CardVariantCanonical | undefined>)[v] ?? (v as CardVariantCanonical);
  });

  private readonly variantResult = computed(() =>
    cardVariants({
      variant: this.resolvedVariant(),
      color: this.color(),
      size: this.size(),
    }),
  );

  readonly rootClasses = computed(() => this.variantResult().root());
  readonly headerClasses = computed(() => this.variantResult().header());
  readonly bodyClasses = computed(() => this.variantResult().body());
  readonly footerClasses = computed(() => this.variantResult().footer());
  readonly mediaClasses = computed(() => this.variantResult().media());
}

@Directive({
  selector: '[twCardHeader]',
  host: {
    '[class]': 'classes()',
  },
})
export class CardHeaderDirective {
  private readonly card = inject(CardComponent);
  readonly classes = this.card.headerClasses;
}

@Directive({
  selector: '[twCardBody]',
  host: {
    '[class]': 'classes()',
  },
})
export class CardBodyDirective {
  private readonly card = inject(CardComponent);
  readonly classes = this.card.bodyClasses;
}

@Directive({
  selector: '[twCardFooter]',
  host: {
    '[class]': 'classes()',
  },
})
export class CardFooterDirective {
  private readonly card = inject(CardComponent);
  readonly classes = this.card.footerClasses;
}

@Directive({
  selector: '[twCardMedia]',
  host: {
    '[class]': 'classes()',
  },
})
export class CardMediaDirective {
  private readonly card = inject(CardComponent);
  readonly classes = this.card.mediaClasses;
}
