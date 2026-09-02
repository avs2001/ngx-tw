// `CarouselComponent` is the canonical "structural-layout primitive" exception
// to CLAUDE.md's 5–6 input cap (precedent: `SplitComponent`). The 17 inputs
// here are each an independent geometry/behavior axis (orientation, slides
// math, gap, loop, autoplay knobs, drag, keyboard, snap, active index, ARIA
// label sources, i18n) — removing any would force consumers to coordinate two
// carousels or replicate logic externally. Documented in
// docs/requirements/carousel.requirements.md § 2.2 and § 12.

import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  isDevMode,
  model,
  output,
  signal,
  type Signal,
  untracked,
  viewChild,
} from '@angular/core';
import { tv } from 'tailwind-variants';
import type { TwColor, TwOrientation, TwSize } from '@cdevhub/ngx-tw/core';

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

// ── Helpers ────────────────────────────────────────────────────────

/** Replaces `{key}` placeholders in `template` with values from `vars`. Ported from paginator. */
function formatLabel(
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

/** Pixel value of the inter-slide gap, used to compute the slide-basis CSS variable. */
const GAP_PX: Record<TwSize, number> = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

// ── Static color × state class lookups ──
// Tailwind v4 only resolves statically-written class names. Per the stepper
// precedent, every color × active/inactive indicator combination is enumerated.
// Active indicators are also distinguishable by more than color (WCAG 1.4.1):
// `dots` scale 1.5×; `lines` widen to w-12; `numbers` gain a filled background.

const INDICATOR_ACTIVE_DOTS: Record<TwColor, string> = {
  primary: 'bg-primary-solid scale-150',
  secondary: 'bg-secondary-solid scale-150',
  accent: 'bg-accent-solid scale-150',
  neutral: 'bg-neutral-solid scale-150',
  info: 'bg-info-solid scale-150',
  success: 'bg-success-solid scale-150',
  warning: 'bg-warning-solid scale-150',
  error: 'bg-error-solid scale-150',
};

const INDICATOR_ACTIVE_LINES: Record<TwColor, string> = {
  primary: 'bg-primary-solid w-12',
  secondary: 'bg-secondary-solid w-12',
  accent: 'bg-accent-solid w-12',
  neutral: 'bg-neutral-solid w-12',
  info: 'bg-info-solid w-12',
  success: 'bg-success-solid w-12',
  warning: 'bg-warning-solid w-12',
  error: 'bg-error-solid w-12',
};

const INDICATOR_ACTIVE_NUMBERS: Record<TwColor, string> = {
  primary: 'bg-primary-solid text-primary-solid-fg',
  secondary: 'bg-secondary-solid text-secondary-solid-fg',
  accent: 'bg-accent-solid text-accent-solid-fg',
  neutral: 'bg-neutral-solid text-neutral-solid-fg',
  info: 'bg-info-solid text-info-solid-fg',
  success: 'bg-success-solid text-success-solid-fg',
  warning: 'bg-warning-solid text-warning-solid-fg',
  error: 'bg-error-solid text-error-solid-fg',
};

const INDICATOR_INACTIVE_DOTS = 'bg-fg-muted opacity-50 hover:opacity-100';
const INDICATOR_INACTIVE_LINES = 'bg-fg-muted opacity-50 hover:opacity-100';
const INDICATOR_INACTIVE_NUMBERS = 'bg-surface-muted text-fg hover:bg-surface-sunken';

function resolveIndicatorActiveClasses(
  variant: TwCarouselIndicatorVariant,
  color: TwColor,
): string {
  switch (variant) {
    case 'dots':
      return INDICATOR_ACTIVE_DOTS[color];
    case 'lines':
      return INDICATOR_ACTIVE_LINES[color];
    case 'numbers':
      return INDICATOR_ACTIVE_NUMBERS[color];
  }
}

function resolveIndicatorInactiveClasses(variant: TwCarouselIndicatorVariant): string {
  switch (variant) {
    case 'dots':
      return INDICATOR_INACTIVE_DOTS;
    case 'lines':
      return INDICATOR_INACTIVE_LINES;
    case 'numbers':
      return INDICATOR_INACTIVE_NUMBERS;
  }
}

// ── tv() config ───────────────────────────────────────────────────

const carouselVariants = tv(
  {
    slots: {
      // `relative` anchors the absolutely-positioned pause control and the
      // overlay-position indicators.
      root: 'relative flex w-full',
      // The scrollable viewport. `tw-scrollbar-none` is the existing utility in
      // theme/_base.css (the requirements doc names this `.tw-scrollbar-hidden`
      // but the codebase ships `.tw-scrollbar-none` — reusing it).
      viewport:
        'flex min-w-0 w-full snap-mandatory scroll-smooth motion-reduce:scroll-auto tw-scrollbar-none ' +
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
      // Per-slide. `flex-basis` is applied via host style binding on
      // `CarouselSlideComponent` (reads `carousel.slideBasis()`).
      slide:
        'flex-none snap-always min-w-0 transition-opacity duration-150 motion-reduce:transition-none',
      // Component-rendered pause control. `bg-overlay-control` /
      // `hover:bg-overlay-control-hover` resolve through
      // `--color-overlay-control{,-hover}` in `theme/_semantic.css`: a fixed
      // translucent dark capsule whose contrast contract is against the
      // *consumer's slide content underneath*, not the surface palette. See
      // requirements § 12.
      pauseControl:
        'absolute z-10 inline-flex items-center justify-center size-6 rounded-full bg-overlay-control ' +
        'text-white hover:bg-overlay-control-hover transition-colors duration-200 motion-reduce:transition-none ' +
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
      indicators: 'flex items-center justify-center',
      // The indicator <button> — the pointer/keyboard target. WCAG 2.2
      // SC 2.5.8 wants 24x24 CSS px and the spacing exception is unavailable
      // (indicators sit in a row, a 24px circle on each would intersect its
      // neighbour). A 12px dot cannot be the target, so the target and the
      // painted mark are two elements: this one is floored at 24x24 at every
      // size and stays transparent; `indicator` below is the visible mark and
      // keeps the whole size axis. Targets wider than the floor (numbers at
      // lg/xl, an active line at `w-12`) grow from the mark inside.
      indicatorTarget:
        'inline-flex shrink-0 items-center justify-center min-h-6 min-w-6 cursor-pointer ' +
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
      // The painted mark inside the target. Never focusable — the focus ring
      // lives on `indicatorTarget`, the color transition lives here because
      // this is the element whose `bg-*` changes.
      indicator: 'block transition-colors duration-200 motion-reduce:transition-none',
    },
    variants: {
      orientation: {
        horizontal: {
          root: 'flex-col',
          viewport: 'flex-row overflow-x-auto overflow-y-hidden snap-x',
          indicators: 'flex-row',
          pauseControl: 'bottom-2 start-2',
        },
        vertical: {
          root: 'flex-row',
          viewport: 'flex-col overflow-y-auto overflow-x-hidden snap-y',
          indicators: 'flex-col',
          pauseControl: 'top-2 start-2',
        },
      },
      snapAlign: {
        start: { slide: 'snap-start' },
        center: { slide: 'snap-center' },
        end: { slide: 'snap-end' },
      },
      gap: {
        xs: {},
        sm: {},
        md: {},
        lg: {},
        xl: {},
      },
      variant: {
        dots: { indicator: 'rounded-full' },
        lines: { indicator: 'rounded-full' },
        numbers: {
          indicator: 'rounded-md inline-flex items-center justify-center font-medium',
        },
      },
      size: {
        xs: {},
        sm: {},
        md: {},
        lg: {},
        xl: {},
      },
      position: {
        below: {},
        overlay: {
          // `bg-overlay-control` capsule — same translucent dark token as the
          // pause control. See the `pauseControl` slot above for the rationale.
          indicators: 'absolute z-10 px-2 py-1 rounded-full bg-overlay-control',
        },
      },
    },
    compoundVariants: [
      // Indicator geometry per variant × size.
      //
      // `dots` follows CLAUDE.md's **dot indicator** sub-scale — 2 / 2.5 / 3 /
      // 3.5 / 4, the five-step 2px cadence `badge-dot` was corrected onto. It
      // previously rendered 2/2.5/3/3/3, freezing md/lg/xl at 12px so two of
      // the five advertised steps were dead on the *default* indicator
      // variant. The active-state `scale-150` is a CSS transform, so it
      // composes multiplicatively with every base value here.
      { variant: 'dots', size: 'xs', class: { indicator: 'size-2' } },
      { variant: 'dots', size: 'sm', class: { indicator: 'size-2.5' } },
      { variant: 'dots', size: 'md', class: { indicator: 'size-3' } },
      { variant: 'dots', size: 'lg', class: { indicator: 'size-3.5' } },
      { variant: 'dots', size: 'xl', class: { indicator: 'size-4' } },

      { variant: 'lines', size: 'xs', class: { indicator: 'h-1 w-4' } },
      { variant: 'lines', size: 'sm', class: { indicator: 'h-1 w-5' } },
      { variant: 'lines', size: 'md', class: { indicator: 'h-1.5 w-6' } },
      { variant: 'lines', size: 'lg', class: { indicator: 'h-1.5 w-8' } },
      { variant: 'lines', size: 'xl', class: { indicator: 'h-2 w-10' } },

      { variant: 'numbers', size: 'xs', class: { indicator: 'size-5 text-2xs' } },
      { variant: 'numbers', size: 'sm', class: { indicator: 'size-6 text-xs' } },
      { variant: 'numbers', size: 'md', class: { indicator: 'size-7 text-xs' } },
      { variant: 'numbers', size: 'lg', class: { indicator: 'size-8 text-sm' } },
      { variant: 'numbers', size: 'xl', class: { indicator: 'size-9 text-sm' } },

      // Indicator gap per size — flex-direction is set by the orientation
      // variant so plain `gap-*` works for both row and column.
      { size: 'xs', class: { indicators: 'gap-1' } },
      { size: 'sm', class: { indicators: 'gap-1.5' } },
      { size: 'md', class: { indicators: 'gap-2' } },
      { size: 'lg', class: { indicators: 'gap-2' } },
      { size: 'xl', class: { indicators: 'gap-3' } },

      // "below" position spacing for indicators relative to the viewport.
      { orientation: 'horizontal', position: 'below', class: { indicators: 'mt-3' } },
      { orientation: 'vertical', position: 'below', class: { indicators: 'ms-3' } },

      // Overlay placement — centered along the axis, offset from the edge.
      {
        orientation: 'horizontal',
        position: 'overlay',
        class: { indicators: 'bottom-3 start-1/2 -translate-x-1/2' },
      },
      {
        orientation: 'vertical',
        position: 'overlay',
        class: { indicators: 'top-1/2 -translate-y-1/2 end-3' },
      },

      // Per-orientation flex gap on the viewport (slide spacing).
      { orientation: 'horizontal', gap: 'xs', class: { viewport: 'gap-x-2' } },
      { orientation: 'horizontal', gap: 'sm', class: { viewport: 'gap-x-3' } },
      { orientation: 'horizontal', gap: 'md', class: { viewport: 'gap-x-4' } },
      { orientation: 'horizontal', gap: 'lg', class: { viewport: 'gap-x-6' } },
      { orientation: 'horizontal', gap: 'xl', class: { viewport: 'gap-x-8' } },
      { orientation: 'vertical', gap: 'xs', class: { viewport: 'gap-y-2' } },
      { orientation: 'vertical', gap: 'sm', class: { viewport: 'gap-y-3' } },
      { orientation: 'vertical', gap: 'md', class: { viewport: 'gap-y-4' } },
      { orientation: 'vertical', gap: 'lg', class: { viewport: 'gap-y-6' } },
      { orientation: 'vertical', gap: 'xl', class: { viewport: 'gap-y-8' } },
    ],
    defaultVariants: {
      orientation: 'horizontal',
      snapAlign: 'start',
      gap: 'md',
      variant: 'dots',
      size: 'md',
      position: 'below',
    },
  },
  { twMerge: true },
);

// ── CarouselSlideComponent ────────────────────────────────────────

/**
 * A single slide inside a `<tw-carousel>`. Projects arbitrary content via its
 * default slot. Reports its visibility back to the carousel container via a
 * shared `IntersectionObserver`; hidden slides receive `aria-hidden="true"` and
 * the `inert` attribute so their focusable descendants are removed from the tab
 * order.
 */
@Component({
  selector: 'tw-carousel-slide',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'group',
    '[attr.aria-roledescription]': '"slide"',
    '[attr.aria-label]': 'accessibleName()',
    '[attr.aria-hidden]': '_isHidden() ? "true" : null',
    '[attr.inert]': '_isHidden() ? "" : null',
    '[class]': 'slideClasses()',
    '[style.flex-basis]': '_basis()',
  },
  template: `<ng-content />`,
})
export class CarouselSlideComponent {
  /** Optional human-readable label for the slide. When provided, used in the slide's `aria-label` as `"{index + 1} of {total}: {label}"`. When `null`, uses `"{index + 1} of {total}"` only. Defaults to `null`. */
  readonly label = input<string | null>(null);

  /** When `true`, the slide is rendered but skipped by Prev/Next, Indicators, keyboard nav, and autoplay. Programmatic `scrollTo` still lands on it. Visually muted (`opacity-50`, `cursor-not-allowed`). Defaults to `false`. */
  readonly disabled = input<boolean>(false);

  /** @internal Direct parent carousel. A `tw-carousel-slide` outside a `tw-carousel` is a programmer error — the DI failure throws naturally. */
  readonly carousel = inject(CarouselComponent);

  /** @internal Host element reference used by the carousel's `IntersectionObserver`. */
  readonly _hostEl = inject(ElementRef<HTMLElement>).nativeElement;

  /** @internal Visibility flag set by the carousel's IntersectionObserver. Initial value is `true` so the first paint does not flash `inert` on every slide. */
  readonly _isVisible = signal(true);

  readonly _isHidden = computed(() => !this._isVisible());

  /** @internal 0-based index in the parent carousel's slide content. -1 until contentChildren materialises. */
  readonly index = computed(() => this.carousel.slides().indexOf(this));

  /** @internal Resolved `aria-label` per the `slideOf` / `slideOfWithLabel` template. */
  readonly accessibleName = computed<string>(() => {
    const labels = this.carousel.resolvedLabels();
    const idx = this.index();
    const total = this.carousel.slides().length;
    const oneBasedIndex = idx < 0 ? 1 : idx + 1;
    const label = this.label();
    if (label !== null && label !== '') {
      return formatLabel(labels.slideOfWithLabel, {
        index: oneBasedIndex,
        total,
        label,
      });
    }
    return formatLabel(labels.slideOf, {
      index: oneBasedIndex,
      total,
    });
  });

  readonly slideClasses = computed(() => {
    const base = this.carousel._slotClasses().slide();
    return this.disabled() ? `${base} opacity-50 cursor-not-allowed` : base;
  });

  /** @internal Per-slide `flex-basis`. Reads from the carousel so each slide sizes along the viewport's main axis (width for horizontal, height for vertical via `flex-direction`). */
  readonly _basis = computed<string>(() => this.carousel.slideBasis());
}

// ── CarouselComponent ─────────────────────────────────────────────

/**
 * Slide / swipe gallery primitive. Renders projected `<tw-carousel-slide>`
 * children in a horizontally (or vertically) scrolling viewport with native
 * CSS scroll-snap, optional autoplay, mouse-pointer drag, keyboard navigation,
 * prev/next directive hosts, and an `<tw-carousel-indicators>` companion.
 * Implements the W3C APG carousel pattern: `role="region"` +
 * `aria-roledescription="carousel"` on the host; the inner viewport carries
 * `tabindex="0"` and a polite `aria-live` region when autoplay is off.
 */
@Component({
  selector: 'tw-carousel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'region',
    '[attr.aria-roledescription]': '"carousel"',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-labelledby]': 'ariaLabelledBy()',
    '[class]': 'rootClasses()',
    '(pointerenter)': '_onPointerEnter()',
    '(pointerleave)': '_onPointerLeave()',
    '(focusin)': '_onFocusIn()',
    '(focusout)': '_onFocusOut($event)',
  },
  template: `
    <div
      #viewport
      data-tw-carousel-viewport
      tabindex="0"
      [class]="viewportClasses()"
      [attr.aria-live]="autoplay() ? 'off' : 'polite'"
      (pointerdown)="_onPointerDown($event)"
      (keydown)="_onKeydown($event)"
    >
      <ng-content select="tw-carousel-slide" />
    </div>

    <!--
      Pause/play glyphs are inline SVG (not <tw-icon>) to avoid coupling the
      carousel entry point to ngx-tw/icon's registry. The carousel must work
      without consumer icon registration; two structural primitives should
      not couple through an icon registry (audit (h)).
    -->
    @if (autoplay()) {
      <button
        type="button"
        [class]="pauseControlClasses()"
        [attr.aria-label]="_pauseControlAriaLabel()"
        (click)="_togglePauseControl()"
      >
        @if (_isManuallyPausedView()) {
          <svg viewBox="0 0 24 24" class="size-3 shrink-0" aria-hidden="true">
            <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
          </svg>
        } @else {
          <svg viewBox="0 0 24 24" class="size-3 shrink-0" aria-hidden="true">
            <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" fill="currentColor" />
          </svg>
        }
      </button>
    }

    <ng-content select="[twCarouselPrev], [twCarouselNext], tw-carousel-indicators" />
    <!-- Default slot: catches arbitrary footer content (custom control rows,
         captions, secondary buttons). Render after the named-selector slot so
         dedicated controls keep their canonical position. -->
    <ng-content />
  `,
})
export class CarouselComponent {
  // ── Inputs (17, cap-exempt: structural-layout primitive — precedent SplitComponent) ──

  /** Axis along which slides flow. `'horizontal'` is the canonical case; `'vertical'` is supported for tickers and feature lists. Defaults to `'horizontal'`. */
  readonly orientation = input<TwOrientation>('horizontal');

  /** Number of slides visible in the viewport. May be fractional (e.g. `1.2` for a "peek" of the next slide). Values below `0.5` are clamped to `0.5`; values above the slide count are clamped to the slide count. Defaults to `1`. */
  readonly slidesPerView = input<number>(1);

  /** Number of slides advanced per navigation action (button click, keyboard, indicator). Non-integer values are floored. Defaults to `1`. */
  readonly slidesToScroll = input<number>(1);

  /** Inter-slide gap on the scroll axis. Mapped via the canonical spacing scale. Defaults to `'md'`. */
  readonly gap = input<TwSize>('md');

  /** When `true`, navigation wraps around at the boundaries. Prev at slide 0 jumps to the last page; Next at the last page jumps to slide 0. Implementation is jumpless via a brief opacity mask. Defaults to `false`. */
  readonly loop = input<boolean>(false);

  /** When `true`, the carousel auto-advances by `slidesToScroll` every `autoplayInterval` ms. Pauses on hover, focus-in, drag, document hidden, or user interaction. Defaults to `false`. */
  readonly autoplay = input<boolean>(false);

  /** Milliseconds between autoplay advances. Values below `1000` are clamped to `1000` per WCAG 2.2.2. Defaults to `5000`. */
  readonly autoplayInterval = input<number>(5000);

  /** Pauses autoplay while the pointer is over the container. Defaults to `true` because losing autoplay on hover is the expected gallery behavior — opt-out is the special case. */
  readonly pauseOnHover = input<boolean>(true);

  /** Pauses autoplay while keyboard focus is anywhere inside the container. Defaults to `true` for WCAG 2.2.2 compliance — opt-out is the special case. */
  readonly pauseOnFocusIn = input<boolean>(true);

  /** When `true`, the user may pan the slides via mouse pointer drag; touch is left to native scroll. Pointer events are intercepted only when the drag exceeds a 6-pixel threshold so clicks inside slides still work. Defaults to `true` because galleries are draggable by user expectation — opt-out is the special case. */
  readonly draggable = input<boolean>(true);

  /** When `true`, the viewport responds to Arrow / Home / End / PageUp / PageDown when focus is inside it. Defaults to `true` for keyboard accessibility — opt-out is the special case. */
  readonly keyboard = input<boolean>(true);

  /** CSS `scroll-snap-align` value applied to each slide. `'start'` is the standard gallery behavior; `'center'` is used for peek/preview layouts. Defaults to `'start'`. */
  readonly snapAlign = input<'start' | 'center' | 'end'>('start');

  /** Two-way bound 0-based index of the first visible slide in the current page. Setting from the parent scrolls the viewport smoothly to align that slide; reading reflects user-driven scroll position after `scrollend`. Defaults to `0`. */
  readonly activeIndex = model<number>(0);

  /** Accessible name for the carousel region. Mirrored to `aria-label`. If both this and `aria-labelledby` are `null`, a one-time dev-mode `console.warn` is logged (production builds never log). Defaults to `null`. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  /** ID of an element labeling the carousel. Mirrored to `aria-labelledby`. Either `aria-label` or `aria-labelledby` SHOULD be provided. Defaults to `null`. */
  readonly ariaLabelledBy = input<string | null>(null, { alias: 'aria-labelledby' });

  /** Localizable strings for prev/next/pause/resume/indicator/slide-of templates. Unset keys fall back to the English defaults in `DEFAULT_CAROUSEL_LABELS`. Defaults to `{}`. */
  readonly labels = input<Partial<TwCarouselLabels>>({});

  // ── Outputs ───────────────────────────────────────────────────

  /** Fires when the active index changes. Payload identifies the previous and new index plus the trigger source. */
  readonly slideChange = output<TwCarouselSlideChangeEvent>();

  /** Fires when autoplay transitions from running to paused. Payload is the pause reason. */
  readonly autoplayPaused = output<TwCarouselAutoplayReason>();

  /** Fires when autoplay transitions from paused to running. */
  readonly autoplayResumed = output<void>();

  // ── Internal references ────────────────────────────────────────

  private readonly _destroyRef = inject(DestroyRef);

  /** @internal The scrollable viewport element. */
  readonly _viewportRef = viewChild.required<ElementRef<HTMLDivElement>>('viewport');

  /** @internal Projected slides in DOM order. */
  readonly slides = contentChildren(CarouselSlideComponent, { descendants: false });

  // ── Resolved configuration ─────────────────────────────────────

  /**
   * @internal Resolved label record with English defaults filled in.
   *
   * Explicitly-undefined keys are dropped before merging. Root `tsconfig.json`
   * does not set `exactOptionalPropertyTypes`, so `[labels]="{ indicator:
   * t('carousel.indicator') }"` type-checks even when `t()` returns
   * `string | undefined` — and a plain spread would then overwrite the default
   * with `undefined`, which reaches `formatLabel()` and throws
   * `Cannot read properties of undefined (reading 'replace')` inside a
   * `computed`, taking the whole render down. Same filter `table.ts` and
   * `timeline.ts` already use; `Required<>` then guarantees a string per key.
   */
  readonly resolvedLabels = computed<Required<TwCarouselLabels>>(() => {
    const overrides = Object.fromEntries(
      Object.entries(this.labels() ?? {}).filter(([, value]) => value !== undefined),
    );
    return { ...DEFAULT_CAROUSEL_LABELS, ...overrides } as Required<TwCarouselLabels>;
  });

  /** @internal Effective `slidesPerView` clamped to `[0.5, slideCount]`. */
  readonly _effectiveSlidesPerView = computed<number>(() => {
    const count = this.slides().length;
    const raw = this.slidesPerView();
    if (count === 0) return Math.max(0.5, raw);
    return Math.max(0.5, Math.min(raw, count));
  });

  /** @internal Effective `slidesToScroll` floored to a positive integer. Read by child indicators directive (`CarouselIndicatorsComponent._onClick`) as a signal. */
  readonly _effectiveSlidesToScroll = computed<number>(() => {
    return Math.max(1, Math.floor(this.slidesToScroll()));
  });

  /** @internal Autoplay interval clamped to ≥ 1000 ms per WCAG 2.2.2. */
  readonly _effectiveAutoplayInterval = computed<number>(() => {
    return Math.max(1000, this.autoplayInterval());
  });

  /** Number of distinct pages (groups of `slidesToScroll` slides) the carousel can land on. Reactive. */
  readonly pageCount: Signal<number> = computed<number>(() => {
    const count = this.slides().length;
    if (count === 0) return 1;
    const perView = this._effectiveSlidesPerView();
    const toScroll = this._effectiveSlidesToScroll();
    return Math.max(1, Math.ceil((count - perView) / toScroll) + 1);
  });

  /** 0-based page index that contains `activeIndex`. Reactive. */
  readonly activePage: Signal<number> = computed<number>(() => {
    return Math.floor(this.activeIndex() / this._effectiveSlidesToScroll());
  });

  /** The highest slide index the carousel can land on given the current `slidesPerView`. Equals `max(0, slideCount - ceil(effectiveSlidesPerView))`. Reactive. Every site that asks "where is the last legal landing position?" goes through this signal. */
  readonly lastReachableIndex: Signal<number> = computed<number>(() => {
    const count = this.slides().length;
    if (count === 0) return 0;
    return Math.max(0, count - Math.ceil(this._effectiveSlidesPerView()));
  });

  /** @internal `true` when the carousel is at slide 0 (drives prev directive `disabled`). */
  readonly isAtStart: Signal<boolean> = computed<boolean>(() => this.activeIndex() <= 0);

  /** @internal `true` when the carousel is at the last reachable slide (drives next directive `disabled`). */
  readonly isAtEnd: Signal<boolean> = computed<boolean>(
    () => this.activeIndex() >= this.lastReachableIndex(),
  );

  /** @internal Per-slide `flex-basis`. Read by each `CarouselSlideComponent` host style binding to size slides along the viewport's main axis. Reactive. */
  readonly slideBasis = computed<string>(() => {
    const perView = this._effectiveSlidesPerView();
    const gapPx = GAP_PX[this.gap()];
    // calc((100% - ((perView - 1) * gap-px)) / perView)
    return `calc((100% - ${(perView - 1) * gapPx}px) / ${perView})`;
  });

  // ── tv() resolution ────────────────────────────────────────────

  private readonly _variantResult = computed(() =>
    carouselVariants({
      orientation: this.orientation(),
      snapAlign: this.snapAlign(),
      gap: this.gap(),
    }),
  );

  /** @internal Slot-class accessor used by child slides and indicators. */
  readonly _slotClasses = computed(() => this._variantResult());

  readonly rootClasses = computed(() => this._variantResult().root());
  readonly viewportClasses = computed(() => this._variantResult().viewport());
  readonly pauseControlClasses = computed(() => this._variantResult().pauseControl());

  // ── State signals ──────────────────────────────────────────────

  /** @internal Last interaction source — written before any navigation triggers scroll, read by the settle handler. */
  private readonly _lastInteractionSource = signal<TwCarouselSlideChangeTrigger | null>(
    null,
  );

  /** @internal Suppresses the scroll-end recompute during a loop-jump. */
  private readonly _isLoopJumping = signal(false);

  private readonly _isHovered = signal(false);
  private readonly _hasFocusInside = signal(false);
  private readonly _isTabVisible = signal(true);
  private readonly _isDragging = signal(false);
  private readonly _isManuallyPaused = signal(false);
  private readonly _postInteractionPauseUntil = signal<number | null>(null);

  /** @internal RTL sign factor applied to scroll-position math. `+1` LTR, `-1` RTL. */
  private readonly _rtlSign = signal<1 | -1>(1);

  // ── Resolved pause-control labels ──────────────────────────────

  readonly _pauseControlAriaLabel = computed<string>(() => {
    const labels = this.resolvedLabels();
    return this._isManuallyPaused() ? labels.resumeAutoplay : labels.pauseAutoplay;
  });

  /** @internal Public accessor for the template. */
  readonly _isManuallyPausedView = this._isManuallyPaused.asReadonly();

  // ── Internal API used by child directives / indicators ─────────

  /**
   * @internal Sets the "last interaction source" signal so the upcoming
   * navigation call emits `slideChange` with the correct trigger. Called by
   * `[twCarouselPrev]`, `[twCarouselNext]`, and the indicators before they
   * invoke `next()` / `prev()` / `scrollTo()`.
   */
  _setLastInteractionSource(source: TwCarouselSlideChangeTrigger): void {
    this._lastInteractionSource.set(source);
  }

  // ── Lifecycle ──────────────────────────────────────────────────

  constructor() {
    // One-time dev warnings.
    afterNextRender(() => {
      this._setupViewport();
    });

    // Dev-mode warnings. Each one is deduped per component instance so they
    // re-evaluate when consumer inputs change but never spam the console. The
    // earlier implementation used `afterNextRender` which fires once at
    // construction — if a consumer later set `slidesPerView = 0.1`, the
    // threshold warning never surfaced (audit (i)).
    if (isDevMode()) {
      let warnedMissingLabel = false;
      let warnedLowInterval = false;
      let warnedLowPerView = false;
      effect(() => {
        if (
          !warnedMissingLabel &&
          this.ariaLabel() === null &&
          this.ariaLabelledBy() === null
        ) {
          warnedMissingLabel = true;
          console.warn(
            '[tw-carousel] Provide either `aria-label` or `aria-labelledby` so the carousel region has an accessible name (WCAG 4.1.2).',
          );
        }
        if (!warnedLowInterval && this.autoplayInterval() < 1000) {
          warnedLowInterval = true;
          console.warn(
            `[tw-carousel] autoplayInterval=${this.autoplayInterval()} is below the 1000 ms WCAG 2.2.2 floor; clamped to 1000.`,
          );
        }
        if (!warnedLowPerView && this.slidesPerView() < 0.5) {
          warnedLowPerView = true;
          console.warn(
            `[tw-carousel] slidesPerView=${this.slidesPerView()} is below the 0.5 floor; clamped.`,
          );
        }
      });
    }

    // Autoplay state machine — start/stop the interval based on inputs + pause state.
    effect((onCleanup) => {
      const autoplay = this.autoplay();
      const paused = this._isPaused();
      const interval = this._effectiveAutoplayInterval();

      if (!autoplay || paused) return;

      const handle = setInterval(() => {
        this._lastInteractionSource.set('autoplay');
        this.next();
      }, interval);
      onCleanup(() => clearInterval(handle));
    });

    // Pause/resume transition emissions. Track previous state across effect
    // invocations and emit on actual transitions while autoplay is on.
    // The initial `false` is correct ONLY because `autoplay` defaults to
    // `false`: the first effect run sees `autoplay=false` and short-circuits
    // without emitting, regardless of the pause state. If the default ever
    // flips to `true`, this needs rethinking (audit (f)).
    let prevPaused = false;
    effect(() => {
      const autoplay = this.autoplay();
      const paused = this._isPaused();
      if (autoplay) {
        if (paused && !prevPaused) {
          const reason = this._currentPauseReason();
          if (reason !== null) this.autoplayPaused.emit(reason);
        } else if (!paused && prevPaused) {
          this.autoplayResumed.emit();
        }
      }
      prevPaused = paused;
    });

    // Slide-set changes: re-observe with IntersectionObserver, clamp activeIndex.
    // Only `slides()` is a reactive trigger. The activeIndex read+write is wrapped
    // in `untracked` so the clamp does not register `activeIndex` as a dependency —
    // otherwise the `.set` would re-trigger this effect (read→write signal cycle).
    effect(() => {
      const slides = this.slides();
      this._reobserveSlides(slides);
      const count = slides.length;
      untracked(() => {
        if (count > 0 && this.activeIndex() > count - 1) {
          this.activeIndex.set(count - 1);
        }
      });
    });

    this._destroyRef.onDestroy(() => {
      this._teardownViewport();
    });
  }

  // ── Pause state aggregation ────────────────────────────────────

  private readonly _isPaused = computed<boolean>(() => {
    if (this.pauseOnHover() && this._isHovered()) return true;
    if (this.pauseOnFocusIn() && this._hasFocusInside()) return true;
    if (!this._isTabVisible()) return true;
    if (this._isDragging()) return true;
    if (this._isManuallyPaused()) return true;
    const until = this._postInteractionPauseUntil();
    if (until !== null && Date.now() < until) return true;
    return false;
  });

  private _currentPauseReason(): TwCarouselAutoplayReason | null {
    if (this._isManuallyPaused()) return 'manual';
    if (!this._isTabVisible()) return 'visibility';
    if (this._isDragging()) return 'interaction';
    const until = this._postInteractionPauseUntil();
    if (until !== null && Date.now() < until) return 'interaction';
    if (this.pauseOnFocusIn() && this._hasFocusInside()) return 'focus';
    if (this.pauseOnHover() && this._isHovered()) return 'hover';
    return null;
  }

  // ── Viewport / observer setup ───────────────────────────────────

  private _intersectionObserver: IntersectionObserver | null = null;
  private _resizeObserver: ResizeObserver | null = null;
  private _onScrollEndBound: (() => void) | null = null;
  private _onScrollDebouncedBound: (() => void) | null = null;
  private _scrollDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  /** Handle for the post-interaction autoplay-pause expiry (see `_onPointerUp`). */
  private _postInteractionPauseTimer: ReturnType<typeof setTimeout> | null = null;
  private _onVisibilityChangeBound: (() => void) | null = null;

  private _setupViewport(): void {
    const viewport = this._viewportRef().nativeElement;

    // RTL detection (read once; consumers needing dynamic dir changes can
    // re-render the host).
    try {
      const direction = getComputedStyle(viewport).direction;
      this._rtlSign.set(direction === 'rtl' ? -1 : 1);
    } catch {
      this._rtlSign.set(1);
    }

    // Active-index detection: scrollend if available, debounced scroll fallback.
    const hasScrollEnd = 'onscrollend' in window;
    if (hasScrollEnd) {
      this._onScrollEndBound = () => this._handleScrollSettled();
      viewport.addEventListener('scrollend', this._onScrollEndBound, { passive: true });
    } else {
      this._onScrollDebouncedBound = () => {
        if (this._scrollDebounceTimer !== null) {
          clearTimeout(this._scrollDebounceTimer);
        }
        this._scrollDebounceTimer = setTimeout(() => {
          this._scrollDebounceTimer = null;
          this._handleScrollSettled();
        }, 150);
      };
      viewport.addEventListener('scroll', this._onScrollDebouncedBound, {
        passive: true,
      });
    }

    // Tab visibility for autoplay gating.
    if (typeof document !== 'undefined') {
      this._isTabVisible.set(document.visibilityState !== 'hidden');
      this._onVisibilityChangeBound = () => {
        this._isTabVisible.set(document.visibilityState !== 'hidden');
      };
      document.addEventListener('visibilitychange', this._onVisibilityChangeBound, {
        passive: true,
      });
    }

    // Observers for slide visibility and viewport-size changes.
    if (typeof IntersectionObserver !== 'undefined') {
      this._intersectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const slide = (entry.target as HTMLElement & { _twSlide?: CarouselSlideComponent })
              ._twSlide;
            if (slide) {
              slide._isVisible.set(
                entry.isIntersecting && entry.intersectionRatio >= 0.5,
              );
            }
          }
        },
        { root: viewport, threshold: 0.5 },
      );
      this._reobserveSlides(this.slides());
    }

    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => {
        // Reflow: keep activeIndex aligned to its slide position.
        this._scrollToIndex(this.activeIndex(), 'instant');
      });
      this._resizeObserver.observe(viewport);
    }
  }

  private _teardownViewport(): void {
    const viewport = this._viewportRef()?.nativeElement;
    if (viewport && this._onScrollEndBound) {
      viewport.removeEventListener('scrollend', this._onScrollEndBound);
    }
    if (viewport && this._onScrollDebouncedBound) {
      viewport.removeEventListener('scroll', this._onScrollDebouncedBound);
    }
    if (this._scrollDebounceTimer !== null) {
      clearTimeout(this._scrollDebounceTimer);
      this._scrollDebounceTimer = null;
    }
    if (typeof document !== 'undefined' && this._onVisibilityChangeBound) {
      document.removeEventListener('visibilitychange', this._onVisibilityChangeBound);
    }
    this._intersectionObserver?.disconnect();
    this._intersectionObserver = null;
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    if (this._postInteractionPauseTimer !== null) {
      clearTimeout(this._postInteractionPauseTimer);
      this._postInteractionPauseTimer = null;
    }
    if (this._loopJumpHandle !== null) {
      clearTimeout(this._loopJumpHandle);
      this._loopJumpHandle = null;
    }
    if (this._loopJumpSafetyHandle !== null) {
      clearTimeout(this._loopJumpSafetyHandle);
      this._loopJumpSafetyHandle = null;
    }
    if (this._dragCleanup !== null) {
      this._dragCleanup();
      this._dragCleanup = null;
    }
  }

  private _reobserveSlides(slides: readonly CarouselSlideComponent[]): void {
    const observer = this._intersectionObserver;
    if (!observer) return;
    observer.disconnect();
    for (const slide of slides) {
      // Locate the slide host element via document inspection. The host element
      // is the first ancestor with the `tw-carousel-slide` tag — but with
      // `contentChildren` we don't have direct ElementRef access on each slide.
      // Use the public `_hostEl` set in the slide constructor.
      const el = (slide as unknown as { _hostEl: HTMLElement | null })._hostEl;
      if (el) {
        (el as HTMLElement & { _twSlide?: CarouselSlideComponent })._twSlide = slide;
        observer.observe(el);
      }
    }
  }

  // ── Scroll/active-index logic ───────────────────────────────────

  // The scroll-math contract: both reads (`_handleScrollSettled`) and writes
  // (`_scrollToIndex`) consult the actually-rendered slide geometry via each
  // slide host's `offsetLeft` / `offsetTop`. The synthetic
  // `step = (dimension + gap) / perView` from earlier revisions has been
  // removed — fractional `slidesPerView`, container resize, or sub-pixel gap
  // rounding could cause that step to land between snap points and the
  // browser would snap back to the previously-visible tile. Offsets are
  // authoritative.
  //
  // RTL: in modern browsers (negative-scroll model) `viewport.scrollLeft` is
  // 0 at the logical start and decreases toward `-(scrollWidth - clientWidth)`
  // as the user scrolls toward the logical end. Slide DOM order is preserved
  // but layout is mirrored: `slide[0].offsetLeft` is the largest, not zero.
  // We normalize by transforming each slide's offset into a "logical offset"
  // that increases monotonically along the scroll axis, and read the current
  // scroll as `Math.abs(scrollLeft)`. `_rtlSign()` is applied **at most once**
  // — on writes (`viewport.scrollTo({ left: -logicalOffset })`).

  private _logicalOffset(slideEl: HTMLElement): number {
    const viewport = this._viewportRef().nativeElement;
    if (this.orientation() === 'horizontal') {
      const isRtl = this._rtlSign() === -1;
      return isRtl
        ? viewport.scrollWidth - slideEl.offsetLeft - slideEl.offsetWidth
        : slideEl.offsetLeft;
    }
    return slideEl.offsetTop;
  }

  private _currentLogicalScroll(): number {
    const viewport = this._viewportRef().nativeElement;
    if (this.orientation() === 'horizontal') {
      // `Math.abs` is the single sign normalization on reads. Works for both
      // LTR (scrollLeft ≥ 0) and RTL negative-scroll (scrollLeft ≤ 0).
      return Math.abs(viewport.scrollLeft);
    }
    return viewport.scrollTop;
  }

  private _findClosestSlideIndex(targetLogicalScroll: number): number {
    const slides = this.slides();
    if (slides.length === 0) return 0;
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let i = 0; i < slides.length; i++) {
      const el = (slides[i] as unknown as { _hostEl: HTMLElement | null })._hostEl;
      if (!el) continue;
      const distance = Math.abs(this._logicalOffset(el) - targetLogicalScroll);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i;
      }
    }
    return bestIndex;
  }

  private _handleScrollSettled(): void {
    if (this._isLoopJumping()) return;
    if (this.slides().length === 0) {
      this._lastInteractionSource.set(null);
      return;
    }
    const closest = this._findClosestSlideIndex(this._currentLogicalScroll());
    const clamped = Math.max(0, Math.min(closest, this.lastReachableIndex()));
    const from = this.activeIndex();
    if (clamped !== from) {
      this._emitSlideChange(from, clamped, this._lastInteractionSource() ?? 'pointer');
      this.activeIndex.set(clamped);
    }
    this._lastInteractionSource.set(null);
  }

  private _emitSlideChange(
    from: number,
    to: number,
    trigger: TwCarouselSlideChangeTrigger,
  ): void {
    this.slideChange.emit({ from, to, trigger });
  }

  // ── Navigation methods (imperative API) ─────────────────────────

  /** Advance by `slidesToScroll`. Wraps if `loop` is `true`; no-op at the last page when `loop` is `false`. Emits `slideChange` with trigger `'programmatic'` when called externally. */
  next(): void {
    const trigger = this._lastInteractionSource() ?? 'programmatic';
    this._lastInteractionSource.set(trigger);
    const count = this.slides().length;
    if (count === 0) return;
    const toScroll = this._effectiveSlidesToScroll();
    const lastReachable = this.lastReachableIndex();
    let target = this._findNextEnabled(this.activeIndex() + toScroll, +1);
    if (target > lastReachable) {
      // Past the last reachable index.
      if (this.loop()) {
        this._loopJumpTo(0);
        return;
      }
      target = lastReachable;
      if (target === this.activeIndex()) {
        this._lastInteractionSource.set(null);
        return;
      }
    }
    this._scrollToIndex(target);
  }

  /** Retreat by `slidesToScroll`. Wraps if `loop` is `true`; no-op at slide 0 when `loop` is `false`. Emits `slideChange` with trigger `'programmatic'` when called externally. */
  prev(): void {
    const trigger = this._lastInteractionSource() ?? 'programmatic';
    this._lastInteractionSource.set(trigger);
    const count = this.slides().length;
    if (count === 0) return;
    const toScroll = this._effectiveSlidesToScroll();
    let target = this._findNextEnabled(this.activeIndex() - toScroll, -1);
    if (target < 0) {
      if (this.loop()) {
        this._loopJumpTo(this.lastReachableIndex());
        return;
      }
      target = 0;
      if (target === this.activeIndex()) {
        this._lastInteractionSource.set(null);
        return;
      }
    }
    this._scrollToIndex(target);
  }

  /** Jump to a specific 0-based slide index. `opts.behavior` is `'smooth' | 'instant'`; default is `'smooth'` unless `prefers-reduced-motion: reduce` is set, in which case the default is `'instant'`. */
  scrollTo(index: number, opts?: { behavior?: 'smooth' | 'instant' }): void {
    const trigger = this._lastInteractionSource() ?? 'programmatic';
    this._lastInteractionSource.set(trigger);
    this._scrollToIndex(index, this._resolveBehavior(opts));
  }

  /** Pause autoplay. `reason` defaults to `'manual'`. */
  pause(_reason: TwCarouselAutoplayReason = 'manual'): void {
    this._isManuallyPaused.set(true);
  }

  /** Resume autoplay if `autoplay` input is `true`. */
  resume(): void {
    this._isManuallyPaused.set(false);
  }

  private _findNextEnabled(start: number, direction: 1 | -1): number {
    const slides = this.slides();
    const count = slides.length;
    if (count === 0) return 0;
    let idx = start;
    while (idx >= 0 && idx < count) {
      if (!slides[idx].disabled()) return idx;
      idx += direction;
    }
    return start;
  }

  private _scrollToIndex(
    index: number,
    behavior: 'smooth' | 'instant' = 'smooth',
  ): void {
    const viewport = this._viewportRef()?.nativeElement;
    if (!viewport) return;
    const slides = this.slides();
    const count = slides.length;
    if (count === 0) return;
    const clamped = Math.max(0, Math.min(index, count - 1));
    const from = this.activeIndex();

    const targetEl = (slides[clamped] as unknown as { _hostEl: HTMLElement | null })
      ._hostEl;
    const horizontal = this.orientation() === 'horizontal';
    // Map our public `'instant'` to the DOM-standard `'auto'` literal.
    const domBehavior: ScrollBehavior = behavior === 'instant' ? 'auto' : 'smooth';

    if (targetEl) {
      const logicalOffset = this._logicalOffset(targetEl);
      if (typeof viewport.scrollTo === 'function') {
        // RTL writes apply `_rtlSign()` exactly once — no double-multiplication
        // anywhere on the read/write paths (see audit (a)).
        const opts: ScrollToOptions = horizontal
          ? { left: logicalOffset * this._rtlSign(), behavior: domBehavior }
          : { top: logicalOffset, behavior: domBehavior };
        viewport.scrollTo(opts);
      } else if (horizontal) {
        viewport.scrollLeft = logicalOffset * this._rtlSign();
      } else {
        viewport.scrollTop = logicalOffset;
      }
    }

    if (clamped !== from) {
      this._emitSlideChange(
        from,
        clamped,
        this._lastInteractionSource() ?? 'programmatic',
      );
      this.activeIndex.set(clamped);
    }
    // Clear the source — `_handleScrollSettled` will not re-emit because the
    // index already matches.
    this._lastInteractionSource.set(null);
  }

  /**
   * @internal Resolves the effective scroll behavior. Explicit caller-supplied
   * values are honoured verbatim; otherwise checks
   * `matchMedia('(prefers-reduced-motion: reduce)')` and returns `'instant'`
   * when the user has reduced-motion enabled, `'smooth'` otherwise. See B(d).
   */
  private _resolveBehavior(
    opts?: { behavior?: 'smooth' | 'instant' },
  ): 'smooth' | 'instant' {
    if (opts?.behavior) return opts.behavior;
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      try {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          return 'instant';
        }
      } catch {
        // matchMedia may throw in non-browser environments; fall through.
      }
    }
    return 'smooth';
  }

  private _loopJumpHandle: ReturnType<typeof setTimeout> | null = null;
  private _loopJumpSafetyHandle: ReturnType<typeof setTimeout> | null = null;

  private _loopJumpTo(index: number): void {
    this._isLoopJumping.set(true);
    const viewport = this._viewportRef().nativeElement;
    viewport.classList.add('tw-carousel-loop-jump');

    // If a previous loop-jump is still pending, drop its timers — the new
    // jump supersedes it.
    if (this._loopJumpHandle !== null) clearTimeout(this._loopJumpHandle);
    if (this._loopJumpSafetyHandle !== null) clearTimeout(this._loopJumpSafetyHandle);

    // Sequencing the opacity mask. The keyframe in `theme/_base.css`
    // (`tw-carousel-loop-jump`) runs 0% → 40% → 100% over 200ms with the
    // opacity nadir (0.55) at 40% — i.e. 80ms in. We defer the instant scroll
    // until ~80ms after class-add so the swap happens at peak occlusion,
    // *under* the mask, rather than before the dip starts (audit (e)). Under
    // `prefers-reduced-motion: reduce`, `_base.css:361` zeroes the animation
    // duration; the scroll still fires at +80ms, which is a negligible delay
    // and avoids a code branch.
    this._loopJumpHandle = setTimeout(() => {
      this._loopJumpHandle = null;
      // _scrollToIndex handles the slideChange emission and the activeIndex
      // update; we just need the loop-jump flag set so the scrollend
      // recompute does not re-emit.
      this._scrollToIndex(index, 'instant');
    }, 80);

    const cleanup = () => {
      viewport.classList.remove('tw-carousel-loop-jump');
      this._isLoopJumping.set(false);
      viewport.removeEventListener('animationend', cleanup);
      if (this._loopJumpSafetyHandle !== null) {
        clearTimeout(this._loopJumpSafetyHandle);
        this._loopJumpSafetyHandle = null;
      }
    };
    viewport.addEventListener('animationend', cleanup, { once: true });
    // Safety net — if the animation never fires (reduced-motion override,
    // jsdom environment), clear after the keyframe duration.
    this._loopJumpSafetyHandle = setTimeout(cleanup, 220);
  }

  // ── Host event handlers ─────────────────────────────────────────

  _onPointerEnter(): void {
    this._isHovered.set(true);
  }

  _onPointerLeave(): void {
    this._isHovered.set(false);
  }

  _onFocusIn(): void {
    this._hasFocusInside.set(true);
  }

  _onFocusOut(event: FocusEvent): void {
    const root = (event.currentTarget as HTMLElement) ?? null;
    const next = event.relatedTarget as Node | null;
    if (root && next && root.contains(next)) {
      return;
    }
    this._hasFocusInside.set(false);
  }

  // ── Pointer drag handler ───────────────────────────────────────

  private _dragStart: {
    x: number;
    y: number;
    scrollLeft: number;
    scrollTop: number;
    pointerId: number;
  } | null = null;

  // Per-drag cleanup closure. Set in `_onPointerDown`, invoked from
  // `_onPointerUp` AND from `_teardownViewport` (the DestroyRef hook) — that
  // covers the destroy-mid-drag race where the component is torn down before
  // the `pointerup`/`pointercancel` listeners fire (audit (g)). The closure
  // nulls the field itself so a second invocation is a no-op.
  private _dragCleanup: (() => void) | null = null;

  _onPointerDown(event: PointerEvent): void {
    if (!this.draggable()) return;
    if (!event.isPrimary || event.pointerType === 'touch') return;
    const viewport = this._viewportRef().nativeElement;
    this._dragStart = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
      pointerId: event.pointerId,
    };
    const moveHandler = (e: PointerEvent) => this._onPointerMove(e);
    const upHandler = (e: PointerEvent) => {
      // Invoke the unified cleanup so the destroy path and the natural-up
      // path go through the same code.
      if (this._dragCleanup !== null) this._dragCleanup();
      this._onPointerUp(e);
    };
    window.addEventListener('pointermove', moveHandler);
    window.addEventListener('pointerup', upHandler);
    window.addEventListener('pointercancel', upHandler);
    this._dragCleanup = () => {
      window.removeEventListener('pointermove', moveHandler);
      window.removeEventListener('pointerup', upHandler);
      window.removeEventListener('pointercancel', upHandler);
      this._dragCleanup = null;
    };
  }

  private _onPointerMove(event: PointerEvent): void {
    const start = this._dragStart;
    if (!start) return;
    const horizontal = this.orientation() === 'horizontal';
    const delta = horizontal ? event.clientX - start.x : event.clientY - start.y;
    if (!this._isDragging() && Math.abs(delta) <= 6) return;
    const viewport = this._viewportRef().nativeElement;
    if (!this._isDragging()) {
      this._isDragging.set(true);
      viewport.style.scrollSnapType = 'none';
      viewport.classList.add('cursor-grabbing');
      try {
        viewport.setPointerCapture(start.pointerId);
      } catch {
        // setPointerCapture may throw if the element isn't focusable in some browsers.
      }
    }
    if (horizontal) {
      viewport.scrollLeft = start.scrollLeft - delta * this._rtlSign();
    } else {
      viewport.scrollTop = start.scrollTop - delta;
    }
  }

  private _onPointerUp(_event: PointerEvent): void {
    // Capture `_dragStart` into a local *before* nulling the field so the
    // `releasePointerCapture` call below still has the pointerId. Order
    // matters: a re-entrant pointer event (some browsers fire `pointercancel`
    // synchronously inside `releasePointerCapture`) must see `_dragStart === null`
    // and bail at the `!this._isDragging()` guard or via `_dragCleanup` no-op.
    const start = this._dragStart;
    this._dragStart = null;
    if (!this._isDragging()) return;
    const viewport = this._viewportRef().nativeElement;
    viewport.style.scrollSnapType = '';
    viewport.classList.remove('cursor-grabbing');
    try {
      if (start) viewport.releasePointerCapture(start.pointerId);
    } catch {
      // ignore
    }
    this._isDragging.set(false);
    this._lastInteractionSource.set('pointer');
    // Suppress the click that immediately follows a drag-release.
    const swallowClick = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      viewport.removeEventListener('click', swallowClick, true);
    };
    viewport.addEventListener('click', swallowClick, true);
    queueMicrotask(() => {
      viewport.removeEventListener('click', swallowClick, true);
    });
    // Post-interaction autoplay pause.
    this._postInteractionPauseUntil.set(
      Date.now() + this._effectiveAutoplayInterval() * 2,
    );
    // Held in a field so `_teardownViewport` can clear it. Unstored, this
    // fires at least two autoplay intervals after destroy and writes a signal
    // on a torn-down component.
    if (this._postInteractionPauseTimer !== null) {
      clearTimeout(this._postInteractionPauseTimer);
    }
    this._postInteractionPauseTimer = setTimeout(() => {
      this._postInteractionPauseTimer = null;
      if (
        this._postInteractionPauseUntil() !== null &&
        Date.now() >= (this._postInteractionPauseUntil() ?? 0)
      ) {
        this._postInteractionPauseUntil.set(null);
      }
    }, this._effectiveAutoplayInterval() * 2 + 16);
  }

  // ── Keyboard handler ───────────────────────────────────────────

  _onKeydown(event: KeyboardEvent): void {
    if (!this.keyboard()) return;
    const horizontal = this.orientation() === 'horizontal';
    const rtl = this._rtlSign() === -1;
    let handled = false;
    switch (event.key) {
      case 'ArrowLeft':
        if (horizontal) {
          this._lastInteractionSource.set('keyboard');
          if (rtl) this.next();
          else this.prev();
          handled = true;
        }
        break;
      case 'ArrowRight':
        if (horizontal) {
          this._lastInteractionSource.set('keyboard');
          if (rtl) this.prev();
          else this.next();
          handled = true;
        }
        break;
      case 'ArrowUp':
        this._lastInteractionSource.set('keyboard');
        this.prev();
        handled = true;
        break;
      case 'ArrowDown':
        this._lastInteractionSource.set('keyboard');
        this.next();
        handled = true;
        break;
      case 'Home':
        this._lastInteractionSource.set('keyboard');
        this.scrollTo(0);
        handled = true;
        break;
      case 'End': {
        this._lastInteractionSource.set('keyboard');
        const lastIndex = Math.max(0, this.slides().length - 1);
        this.scrollTo(lastIndex);
        handled = true;
        break;
      }
      case 'PageUp':
        this._lastInteractionSource.set('keyboard');
        this.prev();
        handled = true;
        break;
      case 'PageDown':
        this._lastInteractionSource.set('keyboard');
        this.next();
        handled = true;
        break;
    }
    if (handled) {
      event.preventDefault();
    }
  }

  // ── Pause control toggle ───────────────────────────────────────

  _togglePauseControl(): void {
    const next = !this._isManuallyPaused();
    this._isManuallyPaused.set(next);
  }
}

// ── CarouselIndicatorsComponent ───────────────────────────────────

/**
 * Renders one button per **page** (not per slide) inside a `<tw-carousel>`.
 * The active button is marked with `aria-current="true"` and a distinguishing
 * scale / width / fill so it is identifiable beyond color alone (WCAG 1.4.1).
 */
@Component({
  selector: 'tw-carousel-indicators',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'group',
    '[class]': 'rootClasses()',
  },
  template: `
    @for (page of _pages(); track page) {
      <button
        type="button"
        [class]="_buttonClasses()"
        [attr.aria-label]="_buttonLabel(page)"
        [attr.aria-current]="page === carousel.activePage() ? 'true' : null"
        (click)="_onClick(page)"
      >
        <span [class]="_indicatorClasses(page)">
          @if (variant() === 'numbers') {
            {{ page + 1 }}
          }
        </span>
      </button>
    }
  `,
})
export class CarouselIndicatorsComponent {
  /** Visual style. `'dots'` = small filled circles; `'lines'` = short horizontal/vertical bars; `'numbers'` = text 1, 2, 3 inside small pills. Defaults to `'dots'`. */
  readonly variant = input<TwCarouselIndicatorVariant>('dots');

  /** Color of the active indicator. Inactive indicators use neutral `fg-muted` tokens. Defaults to `'primary'`. */
  readonly color = input<TwColor>('primary');

  /** Indicator size (diameter/length and gap between indicators). Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** When `'overlay'`, the indicators float absolutely-positioned over the carousel with a `bg-overlay-control` translucent capsule backdrop for contrast. When `'below'`, they sit below the carousel as a normal block. Defaults to `'below'`. */
  readonly position = input<TwCarouselIndicatorPosition>('below');

  /** @internal Direct parent carousel. */
  readonly carousel = inject(CarouselComponent);

  private readonly _variantResult = computed(() =>
    carouselVariants({
      orientation: this.carousel.orientation(),
      variant: this.variant(),
      size: this.size(),
      position: this.position(),
      gap: this.carousel.gap(),
      snapAlign: this.carousel.snapAlign(),
    }),
  );

  readonly rootClasses = computed(() => this._variantResult().indicators());

  /**
   * @internal Sequence of page indices to render. Returns `[]` when the
   * parent carousel's `slidesPerView` is not `1` — a single dot can never
   * match a viewport that shows two or more slides, so the indicator UX is
   * unambiguously broken at multi-item display (issue A1). The host element
   * stays mounted so layout doesn't reflow if the consumer toggles
   * `slidesPerView` back to `1` — the buttons reappear at that point without
   * a remount.
   */
  readonly _pages = computed<number[]>(() => {
    if (this.carousel.slidesPerView() !== 1) return [];
    const count = this.carousel.pageCount();
    const out: number[] = new Array(count);
    for (let i = 0; i < count; i++) out[i] = i;
    return out;
  });

  constructor() {
    if (isDevMode()) {
      let warned = false;
      effect(() => {
        if (!warned && this.carousel.slidesPerView() !== 1) {
          warned = true;
          console.warn(
            `[tw-carousel-indicators] Indicators are only shown when slidesPerView === 1. Got slidesPerView=${this.carousel.slidesPerView()}; indicators are hidden until slidesPerView returns to 1.`,
          );
        }
      });
    }
  }

  /** @internal Classes for the indicator `<button>` — the 24x24-floored hit target (SC 2.5.8). Identical for every page, so it is a computed rather than a per-page call. */
  readonly _buttonClasses = computed(() => this._variantResult().indicatorTarget());

  /** @internal Classes for the painted mark inside the target: geometry from the `variant` × `size` compound variants, fill from the active/inactive lookup. */
  _indicatorClasses(page: number): string {
    const base = this._variantResult().indicator();
    const active = page === this.carousel.activePage();
    const stateClasses = active
      ? resolveIndicatorActiveClasses(this.variant(), this.color())
      : resolveIndicatorInactiveClasses(this.variant());
    return `${base} ${stateClasses}`;
  }

  _buttonLabel(page: number): string {
    return formatLabel(this.carousel.resolvedLabels().indicator, {
      page: page + 1,
    });
  }

  _onClick(page: number): void {
    const toScroll = this.carousel._effectiveSlidesToScroll();
    const targetIndex = page * toScroll;
    this.carousel._setLastInteractionSource('indicator');
    this.carousel.scrollTo(targetIndex);
  }
}

// ── Prev / Next directives ────────────────────────────────────────

/**
 * Apply to any focusable element (typically `<button>`) inside a `<tw-carousel>`
 * to navigate to the previous page. Auto-disables at the first slide when the
 * carousel is not looping. Sets `aria-label` to `labels.previous` unless the
 * host already carries `aria-label` or `aria-labelledby`.
 */
@Directive({
  selector: '[twCarouselPrev]',
  host: {
    '(click)': '_onClick($event)',
    '[attr.aria-label]': '_ariaLabel()',
    '[attr.disabled]': '_isButtonDisabled()',
    '[attr.aria-disabled]': '_isDisabled() ? "true" : null',
    '[attr.tabindex]': '_isTabindex()',
  },
})
export class CarouselPrevDirective {
  /** @internal Parent carousel. */
  readonly carousel = inject(CarouselComponent);

  private readonly _hostEl = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly _consumerLabel = this._hostEl.getAttribute('aria-label');
  private readonly _hasLabelledBy = this._hostEl.hasAttribute('aria-labelledby');
  private readonly _isButton = this._hostEl.tagName === 'BUTTON';

  /** @internal True when prev is unavailable (at start and !loop). */
  readonly _isDisabled = computed<boolean>(
    () => !this.carousel.loop() && this.carousel.isAtStart(),
  );

  _ariaLabel(): string | null {
    // Consumer-provided aria-label wins outright. Consumer-provided
    // aria-labelledby suppresses our binding so the two labels don't compete.
    if (this._consumerLabel !== null) return this._consumerLabel;
    if (this._hasLabelledBy) return null;
    return this.carousel.resolvedLabels().previous;
  }

  _isButtonDisabled(): string | null {
    return this._isButton && this._isDisabled() ? '' : null;
  }

  _isTabindex(): string | null {
    return !this._isButton && this._isDisabled() ? '-1' : null;
  }

  _onClick(event: Event): void {
    if (this._isDisabled()) {
      event.preventDefault();
      return;
    }
    this.carousel._setLastInteractionSource('button');
    this.carousel.prev();
  }
}

/**
 * Apply to any focusable element (typically `<button>`) inside a `<tw-carousel>`
 * to navigate to the next page. Auto-disables at the last page when the
 * carousel is not looping. Sets `aria-label` to `labels.next` unless the host
 * already carries `aria-label` or `aria-labelledby`.
 */
@Directive({
  selector: '[twCarouselNext]',
  host: {
    '(click)': '_onClick($event)',
    '[attr.aria-label]': '_ariaLabel()',
    '[attr.disabled]': '_isButtonDisabled()',
    '[attr.aria-disabled]': '_isDisabled() ? "true" : null',
    '[attr.tabindex]': '_isTabindex()',
  },
})
export class CarouselNextDirective {
  /** @internal Parent carousel. */
  readonly carousel = inject(CarouselComponent);

  private readonly _hostEl = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly _consumerLabel = this._hostEl.getAttribute('aria-label');
  private readonly _hasLabelledBy = this._hostEl.hasAttribute('aria-labelledby');
  private readonly _isButton = this._hostEl.tagName === 'BUTTON';

  readonly _isDisabled = computed<boolean>(
    () => !this.carousel.loop() && this.carousel.isAtEnd(),
  );

  _ariaLabel(): string | null {
    if (this._consumerLabel !== null) return this._consumerLabel;
    if (this._hasLabelledBy) return null;
    return this.carousel.resolvedLabels().next;
  }

  _isButtonDisabled(): string | null {
    return this._isButton && this._isDisabled() ? '' : null;
  }

  _isTabindex(): string | null {
    return !this._isButton && this._isDisabled() ? '-1' : null;
  }

  _onClick(event: Event): void {
    if (this._isDisabled()) {
      event.preventDefault();
      return;
    }
    this.carousel._setLastInteractionSource('button');
    this.carousel.next();
  }
}
