/**
 * Carousel label resolution — the English defaults and the `{placeholder}`
 * interpolation both `CarouselSlideComponent` (per-slide `aria-label`) and
 * `CarouselIndicatorsComponent` (per-page `aria-label`) read.
 *
 * `formatLabel` is exported so those two files can share one implementation;
 * it is deliberately **not** re-exported from `index.ts` and carries no
 * compatibility promise.
 */

import type { TwCarouselLabels } from './carousel.types';

/**
 * Default English labels used when consumers do not override via the `labels`
 * input. Typed `Required<TwCarouselLabels>` so readers keep a non-optional
 * `string` for every key even though the interface itself is all-optional.
 */
export const DEFAULT_CAROUSEL_LABELS: Readonly<Required<TwCarouselLabels>> = {
  previous: 'Previous slide',
  next: 'Next slide',
  pauseAutoplay: 'Pause autoplay',
  resumeAutoplay: 'Resume autoplay',
  indicator: 'Go to slide {page}',
  slideOfWithLabel: '{index} of {total}: {label}',
  slideOf: '{index} of {total}',
};

/** @internal Replaces `{key}` placeholders in `template` with values from `vars`. Ported from paginator. */
export function formatLabel(
  template: string,
  vars: Readonly<Record<string, string | number>>,
): string {
  // Defence in depth. `resolvedLabels()` already filters explicitly-undefined
  // consumer keys, so a non-string cannot reach here through the public
  // `labels` input today. The guard exists so a future regression in that
  // merge degrades to a missing label instead of throwing inside a `computed`
  // and taking the render down.
  if (typeof template !== 'string') return '';
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match,
  );
}
