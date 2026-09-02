import {
  Directive,
  computed,
  input,
} from '@angular/core';
import { tv } from 'tailwind-variants';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';

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
    // Dot-indicator sub-scale, 2px per step: 8 / 10 / 12 / 14 / 16 px.
    //
    // xs / sm / md are CLAUDE.md's documented dot table verbatim (`size-2` / `size-2.5` /
    // `size-3`). The table stops at md, so lg and xl continue its own 2px progression. They
    // are NOT free choices: CLAUDE.md forbids `size-5` for a dot outright ("never size-5 for
    // a dot indicator"), which caps the scale at 16px, and five distinct steps ending at 16
    // with a 2px cadence admits exactly one assignment.
    //
    // Was 6 / 6 / 8 / 10 / 10 — an entire step below the documented scale, with dead steps at
    // both ends (xs === sm, lg === xl).
    size: {
      xs: 'size-2',
      sm: 'size-2.5',
      md: 'size-3',
      // `size-3.5` (14px) and `size-4` (16px) extend the dot table past its documented md
      // row; both keep the 2px cadence rather than jumping to the glyph scale.
      lg: 'size-3.5',
      xl: 'size-4',
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
