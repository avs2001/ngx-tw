import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { tv } from 'tailwind-variants';
import type { TwColor } from '@cdevhub/ngx-tw/core';

/** Line style of the separator. */
export type SeparatorVariant = 'solid' | 'dashed' | 'dotted';

/** Line thickness of the separator. */
export type SeparatorWeight = 'thin' | 'medium' | 'thick';

const separatorVariants = tv({
  slots: {
    root: '',
    line: 'border-solid',
    label: 'px-3 text-sm text-fg-muted shrink-0 whitespace-nowrap empty:hidden',
  },
  variants: {
    orientation: {
      horizontal: {
        root: 'flex items-center w-full',
        line: 'flex-1 border-t',
      },
      vertical: {
        root: 'flex flex-col items-center self-stretch',
        line: 'flex-1 border-l',
      },
    },
    variant: {
      solid: { line: 'border-solid' },
      dashed: { line: 'border-dashed' },
      dotted: { line: 'border-dotted' },
    },
    weight: {
      thin: {},
      medium: {},
      thick: {},
    },
    color: {
      primary: { line: 'border-primary-300' },
      secondary: { line: 'border-secondary-300' },
      accent: { line: 'border-accent-300' },
      neutral: { line: 'border-border' },
      info: { line: 'border-info-300' },
      success: { line: 'border-success-300' },
      warning: { line: 'border-warning-300' },
      error: { line: 'border-error-300' },
    },
  },
  compoundVariants: [
    // Horizontal weight
    { orientation: 'horizontal', weight: 'medium', class: { line: 'border-t-2' } },
    { orientation: 'horizontal', weight: 'thick', class: { line: 'border-t-[3px]' } },
    // Vertical weight
    { orientation: 'vertical', weight: 'medium', class: { line: 'border-l-2' } },
    { orientation: 'vertical', weight: 'thick', class: { line: 'border-l-[3px]' } },
  ],
  defaultVariants: {
    orientation: 'horizontal',
    variant: 'solid',
    weight: 'thin',
    color: 'neutral',
  },
}, {
  twMerge: true,
});

@Component({
  selector: 'tw-separator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'rootClasses()',
    '[attr.role]': 'decorative() ? "none" : "separator"',
    '[attr.aria-orientation]': 'decorative() ? null : orientation()',
    '[attr.aria-hidden]': 'decorative() ? "true" : null',
  },
  template: `
    <span [class]="lineClasses()"></span>
    @if (orientation() === 'horizontal') {
      <span [class]="labelClasses()"><ng-content /></span>
    }
    <span [class]="lineClasses()"></span>
  `,
})
export class SeparatorComponent {
  /** Controls layout direction. Defaults to `'horizontal'`. */
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');

  /** Controls the line style. Defaults to `'solid'`. */
  readonly variant = input<SeparatorVariant>('solid');

  /** Controls line thickness. Defaults to `'thin'`. */
  readonly weight = input<SeparatorWeight>('thin');

  /** Sets the semantic color of the line. Defaults to `'neutral'`. */
  readonly color = input<TwColor>('neutral');

  /** When true, hides the separator from assistive technology. Defaults to `false`. */
  readonly decorative = input(false);

  private readonly variantResult = computed(() =>
    separatorVariants({
      orientation: this.orientation(),
      variant: this.variant(),
      weight: this.weight(),
      color: this.color(),
    }),
  );

  readonly rootClasses = computed(() => this.variantResult().root());
  readonly lineClasses = computed(() => this.variantResult().line());
  readonly labelClasses = computed(() => this.variantResult().label());
}
