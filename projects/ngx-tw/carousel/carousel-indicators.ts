/**
 * `<tw-carousel-indicators>` — the per-page indicator row companion to
 * `<tw-carousel>`.
 *
 * Depends on `CarouselComponent` one-way (it injects the parent; the parent
 * never references this class), so this file imports `./carousel` and never
 * the reverse. The static color x state class tables live here because nothing
 * outside the indicators reads them.
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  isDevMode,
} from '@angular/core';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';

import { CarouselComponent } from './carousel';
import { formatLabel } from './carousel-labels';
import { carouselVariants } from './carousel-variants';
import type {
  TwCarouselIndicatorPosition,
  TwCarouselIndicatorVariant,
} from './carousel.types';

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
