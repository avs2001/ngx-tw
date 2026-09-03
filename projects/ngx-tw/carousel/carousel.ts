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
import type { TwOrientation, TwSize } from '@cdevhub/ngx-tw/core';

import { DEFAULT_CAROUSEL_LABELS, formatLabel } from './carousel-labels';
import { carouselVariants, GAP_PX } from './carousel-variants';
import type {
  TwCarouselAutoplayReason,
  TwCarouselLabels,
  TwCarouselSlideChangeEvent,
  TwCarouselSlideChangeTrigger,
} from './carousel.types';

// ── CarouselSlideComponent ────────────────────────────────────────
//
// This class stays in the same file as `CarouselComponent` **on purpose** —
// do not "finish the split" by moving it out.
//
// The two form a true bidirectional dependency: `CarouselComponent` queries
// the slides with `contentChildren(CarouselSlideComponent)` while every slide
// resolves its parent with `inject(CarouselComponent)`. Both edges are value
// edges (a query token and a DI token), so neither is erased at compile time —
// splitting them across two files produces a circular import at runtime, and
// whichever module the bundler evaluates second sees `undefined` for the other
// class. Breaking it needs an injection token or a shared base class first,
// which is a behavioural change, not a move.
//
// The three classes that used to sit below `CarouselComponent` did NOT have
// this problem — they only inject the parent, never the reverse — and they now
// live in `carousel-indicators.ts` and `carousel-nav.ts`.

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
