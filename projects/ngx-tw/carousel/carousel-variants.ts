/**
 * Carousel styling source of truth — the `tv()` slot config plus the pixel
 * mirror of its gap scale.
 *
 * Shared by `carousel.ts` and `carousel-indicators.ts`, which is the only
 * reason it is a separate file; it is **not** exported from `index.ts` and is
 * not consumer API (CLAUDE.md: "Do not export variant configs").
 *
 * `GAP_PX` lives here rather than beside `slideBasis()` because it is the
 * numeric mirror of the `gap-x-*` / `gap-y-*` compound variants below —
 * editing the `md` row from `gap-x-4` to `gap-x-5` without editing `GAP_PX`
 * from 16 to 20 silently miscomputes every slide's `flex-basis`. Co-locating
 * them makes this file the single place a reviewer edits carousel gap
 * geometry.
 */

import { tv } from 'tailwind-variants';
import type { TwSize } from '@cdevhub/ngx-tw/core';

/** @internal Pixel value of the inter-slide gap, used to compute the slide-basis CSS variable. */
export const GAP_PX: Record<TwSize, number> = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

// ── tv() config ───────────────────────────────────────────────────

export const carouselVariants = tv(
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
