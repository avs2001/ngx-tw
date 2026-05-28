import {
  Directive,
  computed,
  input,
} from '@angular/core';
import { tv } from 'tailwind-variants';
import type { TwColor, TwSize } from 'ngx-tw/core';

/**
 * Dot indicator styling and color tokens for `[twBadgeDot]`. Mirrors the
 * `dot` slot rules previously embedded in the badge component but lives in
 * its own variant table because the dot has no text content, no padding,
 * and no border / variant axis.
 */
const badgeDotVariants = tv({
  base: 'inline-block rounded-full shrink-0',
  variants: {
    color: {
      primary: 'bg-primary-500',
      secondary: 'bg-secondary-500',
      accent: 'bg-accent-500',
      neutral: 'bg-fg-muted',
      info: 'bg-info-500',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      error: 'bg-error-500',
    },
    size: {
      xs: 'size-1.5',
      sm: 'size-1.5',
      md: 'size-2',
      lg: 'size-2.5',
      xl: 'size-2.5',
    },
  },
  defaultVariants: {
    color: 'neutral',
    size: 'md',
  },
}, {
  twMerge: true,
});

/**
 * Compact colored dot used as a presence indicator, unread marker, or status
 * pip. Applies as an attribute selector so the host element controls the
 * structure — wrap in a `<span>`, `<div>`, list item, or any inline element.
 *
 * The dot has no text content; pair it with a visible label adjacent in the
 * DOM, or set `aria-label` on the host so assistive technology can announce
 * the state. Opt in to `live` to expose the dot as an ARIA live region when
 * the indicator state actually changes (e.g. "new messages received").
 *
 * @example
 * ```html
 * <span twBadgeDot color="success" size="sm"></span>
 * <span twBadgeDot color="error" [live]="true" aria-label="3 unread"></span>
 * ```
 */
@Directive({
  selector: '[twBadgeDot]',
  exportAs: 'twBadgeDot',
  host: {
    '[class]': 'classes()',
    '[attr.role]': 'live() ? "status" : null',
  },
})
export class BadgeDotDirective {
  /** Sets the semantic color palette. Defaults to `'neutral'`. */
  readonly color = input<TwColor>('neutral');

  /** Controls dot dimensions. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /**
   * When true, exposes the dot as an ARIA live region (`role="status"`) so
   * assistive technology announces state changes (e.g. an unread indicator
   * appearing). Defaults to `false` because most dots are decorative pips
   * paired with a visible label.
   */
  readonly live = input(false);

  readonly classes = computed(() =>
    badgeDotVariants({ color: this.color(), size: this.size() }),
  );
}
