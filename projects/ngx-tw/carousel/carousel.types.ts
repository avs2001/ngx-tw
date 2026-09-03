/**
 * Carousel public types.
 *
 * This file is the leaf of the carousel entry point's import graph: it holds
 * only type declarations and imports nothing, so every other file in the
 * directory can read from it without creating a cycle. Concretely,
 * `carousel-labels.ts` needs `TwCarouselLabels` while `carousel.ts` needs
 * `DEFAULT_CAROUSEL_LABELS` back from it — with both declared in `carousel.ts`
 * that pair is a genuine import cycle. Mirrors the `calendar/calendar.types.ts`
 * precedent.
 */

// ── Public types ──────────────────────────────────────────────────

/** Visual style of the indicators row rendered by `<tw-carousel-indicators>`. */
export type TwCarouselIndicatorVariant = 'dots' | 'lines' | 'numbers';

/** Where the indicators sit relative to the carousel viewport. */
export type TwCarouselIndicatorPosition = 'overlay' | 'below';

/** What triggered an `activeIndex` change. */
export type TwCarouselSlideChangeTrigger =
  | 'pointer'
  | 'keyboard'
  | 'autoplay'
  | 'indicator'
  | 'button'
  | 'programmatic';

/** Payload emitted by `CarouselComponent.slideChange`. */
export interface TwCarouselSlideChangeEvent {
  /** Previous active slide index (0-based). */
  from: number;
  /** New active slide index (0-based). */
  to: number;
  /** What triggered the change. */
  trigger: TwCarouselSlideChangeTrigger;
}

/** Reason emitted when autoplay transitions running → paused. */
export type TwCarouselAutoplayReason =
  | 'hover'
  | 'focus'
  | 'interaction'
  | 'visibility'
  | 'manual';

/**
 * Localizable strings for the carousel.
 *
 * Every member is optional. This interface only ever reaches consumers through
 * `input<Partial<TwCarouselLabels>>`, and unset keys fall back to
 * {@link DEFAULT_CAROUSEL_LABELS} — so a consumer holding an i18n bundle typed
 * as `TwCarouselLabels` must not be forced to restate every key, and adding a
 * label in a future minor must not break them on a non-major release.
 */
export interface TwCarouselLabels {
  /** Accessible label for the Previous-slide directive host. Default: `'Previous slide'`. */
  previous?: string;
  /** Accessible label for the Next-slide directive host. Default: `'Next slide'`. */
  next?: string;
  /** Accessible label for the autoplay pause control. Default: `'Pause autoplay'`. */
  pauseAutoplay?: string;
  /** Accessible label for the autoplay resume control. Default: `'Resume autoplay'`. */
  resumeAutoplay?: string;
  /** Template for indicator-button accessible names. Variable: `{page}` (1-based). Default: `'Go to slide {page}'`. */
  indicator?: string;
  /** Template for per-slide accessible names with a custom label. Variables: `{index}` (1-based), `{total}`, `{label}`. Default: `'{index} of {total}: {label}'`. */
  slideOfWithLabel?: string;
  /** Template for per-slide accessible names without a custom label. Variables: `{index}` (1-based), `{total}`. Default: `'{index} of {total}'`. */
  slideOf?: string;
}
