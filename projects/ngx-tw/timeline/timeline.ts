import {
  type AfterContentInit,
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  DestroyRef,
  Directive,
  type ElementRef,
  type EnvironmentProviders,
  inject,
  InjectionToken,
  input,
  makeEnvironmentProviders,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Directionality } from '@angular/cdk/bidi';
import { tv } from 'tailwind-variants';
import type { TwColor, TwOrientation, TwSize } from '@cdevhub/ngx-tw/core';

// `ngDevMode` is a globalThis flag set by Angular's build tooling — true in dev,
// `false` in production builds. The `typeof` guard keeps the warning path safe
// in environments (SSR, ad-hoc test harnesses) where the global is undeclared.
declare const ngDevMode: boolean | undefined;

/** Marker geometry of a `tw-timeline-item`. */
export type TimelineMarker = 'dot' | 'circle';

/** Semantic state of a `tw-timeline-item`. Drives marker fill, ring, and trailing-connector color. */
export type TimelineState = 'reached' | 'pending' | 'current' | 'error';

/** Vertical layout strategy of a `tw-timeline`. Ignored for `orientation: 'horizontal'`. */
export type TimelineAlign = 'left' | 'right' | 'alternate' | 'split';

/** Connector line style. */
export type TimelineLineStyle = 'solid' | 'dashed';

/** Visibility policy for the horizontal-overflow chevron buttons. */
export type TimelineScrollControls = 'auto' | 'always' | 'never';

/** Localisable labels for the horizontal-overflow chevron buttons on `tw-timeline`. */
export interface TwTimelineScrollLabels {
  /** Accessible label for the previous-scroll chevron. Used as `aria-label`. Defaults to `'Scroll to previous events'`. */
  scrollPrevious: string;
  /** Accessible label for the next-scroll chevron. Used as `aria-label`. Defaults to `'Scroll to next events'`. */
  scrollNext: string;
}

/** Default English labels used when `TW_TIMELINE_SCROLL_LABELS` is not provided. */
export const DEFAULT_TW_TIMELINE_SCROLL_LABELS: TwTimelineScrollLabels = {
  scrollPrevious: 'Scroll to previous events',
  scrollNext: 'Scroll to next events',
};

/**
 * Injection token carrying localisable `aria-label` strings for the timeline's
 * horizontal-overflow chevron buttons. The container uses these labels exclusively
 * on the prev/next buttons; they do not affect any other rendered text.
 *
 * Provide via `provideTwTimelineScrollLabels({ ... })` at the root or feature level.
 * If both keys are present they override the English defaults; if only one is present
 * the other falls back to the English default.
 *
 * First concrete token under the `TW_TIMELINE_I18N` reservation in
 * `docs/requirements/timeline.requirements.md` § 11.2.
 */
export const TW_TIMELINE_SCROLL_LABELS = new InjectionToken<Partial<TwTimelineScrollLabels>>(
  'TW_TIMELINE_SCROLL_LABELS',
);

/**
 * Configures the localised labels used by `tw-timeline` overflow chevrons.
 * Add to `bootstrapApplication`'s `providers` (or any feature/route provider array).
 *
 * @example
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [
 *     provideTwTimelineScrollLabels({
 *       scrollPrevious: 'Vorherige Ereignisse',
 *       scrollNext: 'Nächste Ereignisse',
 *     }),
 *   ],
 * });
 * ```
 */
export function provideTwTimelineScrollLabels(
  labels: Partial<TwTimelineScrollLabels>,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: TW_TIMELINE_SCROLL_LABELS, useValue: labels },
  ]);
}

// ── tv() config ──

const timelineVariants = tv(
  {
    slots: {
      // Container host.
      root: 'flex w-full',
      // Item host.
      item: 'relative flex min-w-0',
      // The marker column (vertical) or marker row (horizontal). Carries the bubble plus
      // its leading + trailing connector segments.
      markerSide: 'relative flex shrink-0',
      // The bubble itself. Color × state styling is applied via static lookup, not tv().
      marker:
        'relative z-[1] inline-flex items-center justify-center shrink-0 rounded-full transition-[color,background-color,border-color,box-shadow] duration-200 motion-reduce:transition-none',
      // Connector segments. Geometry comes from compound variants; color is applied via static lookup.
      connectorLeading: 'shrink-0',
      connectorTrailing: 'shrink-0',
      // Body wrapper next to the marker. min-w-0 so flex children can truncate.
      body: 'relative min-w-0 flex flex-col',
      // Opposite wrapper for align="alternate" / align="split". Same min-width constraints as body.
      opposite: 'min-w-0 flex flex-col',
      // Auto-number / single-glyph slot inside a circle marker.
      number: 'leading-none font-semibold',
      // Timestamp element (whether <time> or <span>).
      timestamp: 'text-fg-muted',
    },
    variants: {
      orientation: {
        vertical: {
          root: 'flex-col',
          // `items-stretch` (the flex default) lets the marker column stretch to
          // the body's full height — required for the trailing connector to
          // physically reach the next item's marker.
          item: 'flex-row',
          markerSide: 'flex-col items-center',
        },
        horizontal: {
          // `relative` anchors the absolutely-positioned chevron buttons. The
          // `overflow-x-auto` lives on the inner viewport (see template) so the
          // chevrons stay fixed against the host while content scrolls.
          root: 'flex-row items-start relative',
          // Grid-row participation: each item spans both rows of the viewport's
          // `grid-template-rows: minmax(0, 1fr) auto`. `grid-rows-subgrid`
          // inherits the parent grid's row tracks so every item's marker-side
          // lands on a shared row-2 baseline regardless of body height in row 1.
          // Without this, per-item body-height variance pushes each marker to a
          // different y-coordinate and the horizontal connector breaks across
          // item boundaries. Row placement (body → row 1, markerSide → row 2)
          // is applied via the horizontal compoundVariant below.
          item: 'grid grid-rows-subgrid row-span-2 items-center text-center',
          markerSide: 'flex-row items-center w-full',
          body: 'items-center',
        },
      },
      size: {
        // The trailing `pb-*` on body provides inter-item visual separation in
        // vertical orientation. The trailing connector lives inside the marker
        // column and stretches through this padding to touch the next item's
        // marker — items butt against each other with no container `gap-*` so
        // the line stays continuous.
        xs: { item: 'gap-3', body: 'text-xs gap-1 pb-3', timestamp: 'text-2xs', number: 'text-2xs' },
        sm: { item: 'gap-4', body: 'text-sm gap-1 pb-4', timestamp: 'text-xs', number: 'text-xs' },
        md: { item: 'gap-5', body: 'text-sm gap-1.5 pb-6', timestamp: 'text-xs', number: 'text-xs' },
        lg: { item: 'gap-6', body: 'text-sm gap-1.5 pb-8', timestamp: 'text-xs', number: 'text-sm' },
        // `xl` density holds at text-sm — `text-base` is reserved for the codified
        // tw-item lg exception and does not apply to timeline (per requirements § 4.3).
        xl: { item: 'gap-8', body: 'text-sm gap-2 pb-10', timestamp: 'text-xs', number: 'text-sm' },
      },
      marker: {
        dot: {},
        circle: {},
      },
      lineStyle: {
        solid: {},
        dashed: {
          // Dashed connectors replace the solid bg fill with a CSS border. The base
          // `connectorLeading`/`connectorTrailing` classes still apply; `bg-transparent`
          // is forced so twMerge doesn't end up with both a `bg-*` and a `border-*` fill.
          connectorLeading: 'border-dashed bg-transparent',
          connectorTrailing: 'border-dashed bg-transparent',
        },
      },
      state: {
        // The `state` axis exists in `tv()` only to control the auto-number's text
        // color step — color × state combinations on the marker itself are applied
        // via static lookup tables (Tailwind v4 cannot resolve interpolated class names).
        reached: { number: 'text-fg' },
        pending: { number: 'text-fg-muted' },
        current: { number: 'text-fg' },
        error: { number: 'text-fg' },
      },
    },
    compoundVariants: [
      // ── Horizontal item min-width per density. Values chosen so a marker
      // plus ~16–24 chars of body text fit without truncation at each step;
      // the lower bound is the diameter of the corresponding circle marker
      // (size-6 → 24px) plus a comfortable ~120px text gutter, scaling up to
      // leave room for richer descriptions at xl. Once any item's content
      // exceeds the floor the items expand naturally; the inner scroll
      // viewport handles overflow beyond the host's width.
      { orientation: 'horizontal', size: 'xs', class: { item: 'min-w-32' } },
      { orientation: 'horizontal', size: 'sm', class: { item: 'min-w-36' } },
      { orientation: 'horizontal', size: 'md', class: { item: 'min-w-40' } },
      { orientation: 'horizontal', size: 'lg', class: { item: 'min-w-44' } },
      { orientation: 'horizontal', size: 'xl', class: { item: 'min-w-48' } },

      // Subgrid row placement (horizontal only). Body occupies row 1 with
      // `self-end` so short bodies hang at the row's bottom edge — sitting
      // close to the marker row directly below — instead of floating at the
      // top and opening a visible gap. Marker-side occupies the shared row 2.
      {
        orientation: 'horizontal',
        class: { body: 'row-start-1 self-end', markerSide: 'row-start-2' },
      },

      // ── Marker geometry per size × marker variant (requirements § 4.3) ──
      // Diameter is orientation-agnostic.
      { marker: 'dot', size: 'xs', class: { marker: 'size-2' } },
      { marker: 'dot', size: 'sm', class: { marker: 'size-2.5' } },
      { marker: 'dot', size: 'md', class: { marker: 'size-3' } },
      { marker: 'dot', size: 'lg', class: { marker: 'size-3' } },
      { marker: 'dot', size: 'xl', class: { marker: 'size-3' } },
      { marker: 'circle', size: 'xs', class: { marker: 'size-6' } },
      { marker: 'circle', size: 'sm', class: { marker: 'size-7' } },
      { marker: 'circle', size: 'md', class: { marker: 'size-8' } },
      { marker: 'circle', size: 'lg', class: { marker: 'size-10' } },
      { marker: 'circle', size: 'xl', class: { marker: 'size-12' } },

      // Vertical-only: `mt-*` nudges the small dot down so its vertical center
      // aligns with the title's first-line optical center (text sits to the
      // side of the marker in vertical layout). Circle markers are large
      // enough that no nudge is needed — the bubble visually wraps the title's
      // first line. In horizontal layout the dot must NOT carry margin-top:
      // the marker-side is `flex-row items-center` and the connector segments
      // sit on the same vertical axis, so margin-top would push the dot below
      // the connector line.
      { orientation: 'vertical', marker: 'dot', size: 'xs', class: { marker: 'mt-1.5' } },
      { orientation: 'vertical', marker: 'dot', size: 'sm', class: { marker: 'mt-1.5' } },
      { orientation: 'vertical', marker: 'dot', size: 'md', class: { marker: 'mt-1.5' } },
      { orientation: 'vertical', marker: 'dot', size: 'lg', class: { marker: 'mt-2' } },
      { orientation: 'vertical', marker: 'dot', size: 'xl', class: { marker: 'mt-2' } },

      // ── Vertical connector geometry: thin line that runs through the marker column.
      // `flex-1` stretches the segment to fill the gap between adjacent markers.
      {
        orientation: 'vertical',
        lineStyle: 'solid',
        class: { connectorLeading: 'w-px flex-1', connectorTrailing: 'w-px flex-1' },
      },
      {
        orientation: 'vertical',
        lineStyle: 'dashed',
        class: { connectorLeading: 'border-l flex-1 min-h-2', connectorTrailing: 'border-l flex-1 min-h-2' },
      },
      {
        orientation: 'vertical',
        size: 'lg',
        lineStyle: 'solid',
        class: { connectorLeading: 'w-0.5', connectorTrailing: 'w-0.5' },
      },
      {
        orientation: 'vertical',
        size: 'xl',
        lineStyle: 'solid',
        class: { connectorLeading: 'w-0.5', connectorTrailing: 'w-0.5' },
      },

      // ── Horizontal connector geometry ──
      {
        orientation: 'horizontal',
        lineStyle: 'solid',
        class: { connectorLeading: 'h-px flex-1', connectorTrailing: 'h-px flex-1' },
      },
      {
        orientation: 'horizontal',
        lineStyle: 'dashed',
        class: { connectorLeading: 'border-t flex-1 min-w-2', connectorTrailing: 'border-t flex-1 min-w-2' },
      },
      {
        orientation: 'horizontal',
        size: 'lg',
        lineStyle: 'solid',
        class: { connectorLeading: 'h-0.5', connectorTrailing: 'h-0.5' },
      },
      {
        orientation: 'horizontal',
        size: 'xl',
        lineStyle: 'solid',
        class: { connectorLeading: 'h-0.5', connectorTrailing: 'h-0.5' },
      },
    ],
    defaultVariants: {
      orientation: 'vertical',
      size: 'md',
      marker: 'dot',
      state: 'reached',
      lineStyle: 'solid',
    },
  },
  { twMerge: true },
);

// ── Static color × state class lookups ──
// Tailwind v4 only resolves statically-written class names. Per the stepper
// precedent (`INDICATOR_ACTIVE`, `INDICATOR_COMPLETED`, `CONNECTOR_REACHED`),
// all color × state combinations are enumerated as exhaustive maps.

const MARKER_PENDING = 'bg-surface border-2 border-border text-fg-muted';
const MARKER_ERROR =
  'bg-error-solid text-error-solid-fg border border-error-border-strong';

const MARKER_REACHED: Record<TwColor, string> = {
  primary: 'bg-primary-solid text-primary-solid-fg border border-primary-border-strong',
  secondary: 'bg-secondary-solid text-secondary-solid-fg border border-secondary-border-strong',
  accent: 'bg-accent-solid text-accent-solid-fg border border-accent-border-strong',
  neutral: 'bg-neutral-solid text-neutral-solid-fg border border-neutral-border-strong',
  info: 'bg-info-solid text-info-solid-fg border border-info-border-strong',
  success: 'bg-success-solid text-success-solid-fg border border-success-border-strong',
  warning: 'bg-warning-solid text-warning-solid-fg border border-warning-border-strong',
  error: 'bg-error-solid text-error-solid-fg border border-error-border-strong',
};

const MARKER_CURRENT: Record<TwColor, string> = {
  primary:
    'bg-primary-solid text-primary-solid-fg border border-primary-border-strong ring-4 ring-primary-soft',
  secondary:
    'bg-secondary-solid text-secondary-solid-fg border border-secondary-border-strong ring-4 ring-secondary-soft',
  accent:
    'bg-accent-solid text-accent-solid-fg border border-accent-border-strong ring-4 ring-accent-soft',
  neutral:
    'bg-neutral-solid text-neutral-solid-fg border border-neutral-border-strong ring-4 ring-neutral-soft',
  info: 'bg-info-solid text-info-solid-fg border border-info-border-strong ring-4 ring-info-soft',
  success:
    'bg-success-solid text-success-solid-fg border border-success-border-strong ring-4 ring-success-soft',
  warning:
    'bg-warning-solid text-warning-solid-fg border border-warning-border-strong ring-4 ring-warning-soft',
  error: 'bg-error-solid text-error-solid-fg border border-error-border-strong ring-4 ring-error-soft',
};

// When marker='circle' AND a `[twTimelineMarker]` slot is projected, the bubble
// switches to a SOFT background so the projected glyph/avatar reads against a
// tinted surface rather than competing with a solid fill.
const MARKER_REACHED_SOFT: Record<TwColor, string> = {
  primary: 'bg-primary-soft text-primary-fg border border-primary-border-strong',
  secondary: 'bg-secondary-soft text-secondary-fg border border-secondary-border-strong',
  accent: 'bg-accent-soft text-accent-fg border border-accent-border-strong',
  neutral: 'bg-surface-muted text-fg border border-border',
  info: 'bg-info-soft text-info-fg border border-info-border-strong',
  success: 'bg-success-soft text-success-fg border border-success-border-strong',
  warning: 'bg-warning-soft text-warning-fg border border-warning-border-strong',
  error: 'bg-error-soft text-error-fg border border-error-border-strong',
};

const MARKER_CURRENT_SOFT: Record<TwColor, string> = {
  primary:
    'bg-primary-soft text-primary-fg border border-primary-border-strong ring-4 ring-primary-soft',
  secondary:
    'bg-secondary-soft text-secondary-fg border border-secondary-border-strong ring-4 ring-secondary-soft',
  accent:
    'bg-accent-soft text-accent-fg border border-accent-border-strong ring-4 ring-accent-soft',
  neutral: 'bg-surface-muted text-fg border border-border ring-4 ring-border',
  info: 'bg-info-soft text-info-fg border border-info-border-strong ring-4 ring-info-soft',
  success:
    'bg-success-soft text-success-fg border border-success-border-strong ring-4 ring-success-soft',
  warning:
    'bg-warning-soft text-warning-fg border border-warning-border-strong ring-4 ring-warning-soft',
  error: 'bg-error-soft text-error-fg border border-error-border-strong ring-4 ring-error-soft',
};

// ── Connector color ──
// The trailing connector takes its color from the item the connector leaves;
// the leading connector takes its color from the *previous* item so a single
// physical line between two items reads as one consistent color.

const CONNECTOR_DEFAULT = 'bg-border';
const CONNECTOR_ERROR = 'bg-error-border-strong';
const CONNECTOR_DASHED_DEFAULT = 'border-border';
const CONNECTOR_DASHED_ERROR = 'border-error-border-strong';

const CONNECTOR_REACHED: Record<TwColor, string> = {
  primary: 'bg-primary-border-strong',
  secondary: 'bg-secondary-border-strong',
  accent: 'bg-accent-border-strong',
  neutral: 'bg-neutral-border-strong',
  info: 'bg-info-border-strong',
  success: 'bg-success-border-strong',
  warning: 'bg-warning-border-strong',
  error: 'bg-error-border-strong',
};

const CONNECTOR_DASHED_REACHED: Record<TwColor, string> = {
  primary: 'border-primary-border-strong',
  secondary: 'border-secondary-border-strong',
  accent: 'border-accent-border-strong',
  neutral: 'border-neutral-border-strong',
  info: 'border-info-border-strong',
  success: 'border-success-border-strong',
  warning: 'border-warning-border-strong',
  error: 'border-error-border-strong',
};

function resolveMarkerClasses(
  state: TimelineState,
  color: TwColor,
  hasMarkerSlot: boolean,
): string {
  switch (state) {
    case 'pending':
      return MARKER_PENDING;
    case 'error':
      return MARKER_ERROR;
    case 'reached':
      return hasMarkerSlot ? MARKER_REACHED_SOFT[color] : MARKER_REACHED[color];
    case 'current':
      return hasMarkerSlot ? MARKER_CURRENT_SOFT[color] : MARKER_CURRENT[color];
  }
}

function resolveConnectorClasses(
  state: TimelineState,
  color: TwColor,
  lineStyle: TimelineLineStyle,
): string {
  // 'current' and 'pending' both render the neutral default — a connector that
  // leaves a 'current' item points into territory that has not been reached yet.
  if (lineStyle === 'dashed') {
    if (state === 'error') return CONNECTOR_DASHED_ERROR;
    if (state === 'reached') return CONNECTOR_DASHED_REACHED[color];
    return CONNECTOR_DASHED_DEFAULT;
  }
  if (state === 'error') return CONNECTOR_ERROR;
  if (state === 'reached') return CONNECTOR_REACHED[color];
  return CONNECTOR_DEFAULT;
}

// ── Horizontal viewport class string ──
// CSS grid (not flex-row): rows are minmax(0, 1fr) / auto. Row 1 absorbs every
// item's body, row 2 carries the marker-side. Items participate via
// `grid-rows-subgrid row-span-2`, so every marker lands on a shared row-2
// baseline regardless of body-height variance — fixing the prior flex layout
// where shorter bodies pushed their marker bubble off the connector row.
//
// `auto-cols-max` is load-bearing: columns size to max-content so the grid's
// scrollWidth can exceed clientWidth and the chevron-overflow contract
// (docs/prompts/tw-timeline-horizontal-overflow.md) keeps working. DO NOT
// switch to `auto-cols-fr` or `auto-cols-[1fr]` — those collapse scrollWidth
// to clientWidth, the overflow check fails permanently, and the chevrons
// never enable. The per-density min-w-* on each item still establishes the
// floor.
const HORIZONTAL_VIEWPORT_CLASSES =
  'tw-scrollbar-none grid grid-flow-col auto-cols-max ' +
  '[grid-template-rows:minmax(0,1fr)_auto] ' +
  'overflow-x-auto scroll-smooth motion-reduce:scroll-auto w-full';

// ── Chevron button class string ──
// Shared by both overflow chevron buttons. Positioned absolutely against the
// timeline host (which carries `relative` in horizontal orientation via the
// tv() config) so `left-0` / `right-0` anchor correctly.
// `top-1/2 -translate-y-1/2` centres the button vertically — a pragmatic
// approximation for the canonical horizontal layout where the marker row sits
// roughly mid-host. `size-8` matches the canonical "square interactive target"
// md size; the inner chevron glyph is `size-4` (glyph-icon sub-scale).
// The disabled hover overrides suppress the hover state when disabled, otherwise
// twMerge would unify them.
const CHEVRON_CLASSES =
  'absolute top-1/2 -translate-y-1/2 z-10 inline-flex items-center justify-center ' +
  'size-8 rounded-full bg-surface-raised border border-border shadow-sm ' +
  'text-fg-muted hover:text-fg hover:bg-surface-muted ' +
  'transition-colors duration-200 motion-reduce:transition-none ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ' +
  'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-raised disabled:hover:text-fg-muted';

// ── Slot directives ──

/**
 * Marker-slot directive. Apply on any element projected inside a `<tw-timeline-item>`
 * to render that element inside the marker bubble (only when `marker="circle"`).
 *
 * @example
 * ```html
 * <tw-timeline-item marker="circle" color="success">
 *   <tw-icon twTimelineMarker name="check" />
 *   <p class="text-sm">Done</p>
 * </tw-timeline-item>
 * ```
 */
@Directive({
  selector: '[twTimelineMarker]',
})
export class TimelineMarkerDirective {}

/**
 * Timestamp-slot directive. Replaces the rendered `timestamp` / `dateTime`
 * output. Use for relative-time components ("2 hours ago").
 */
@Directive({
  selector: '[twTimelineTimestamp]',
})
export class TimelineTimestampDirective {}

/**
 * Opposite-slot directive. Renders on the side opposite the body in
 * `align="alternate"` / `align="split"` (vertical orientation only).
 */
@Directive({
  selector: '[twTimelineOpposite]',
})
export class TimelineOppositeDirective {}

// ── TimelineComponent ──

/**
 * Presentational chronological-sequence layout primitive. Renders a list of
 * `<tw-timeline-item>` children connected by a line that runs through their
 * markers. The container owns orientation, alignment, density, and line-style
 * decisions; items style their own marker, state, and connector colors.
 *
 * **Not interactive.** Unlike `tw-stepper`, the timeline does not install a
 * keyboard map, does not own panels, does not trap focus, and item hosts are
 * not focusable. Consumers needing row-level activation project an
 * interactive primitive (`<tw-item interactive>`, `<button>`, an anchor) inside
 * the default slot.
 */
@Component({
  selector: 'tw-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  host: {
    role: 'list',
    '[class]': 'rootClasses()',
    '[attr.aria-orientation]':
      'orientation() === "horizontal" ? "horizontal" : null',
  },
  // The projected items live inside a single `<ng-template #itemsTpl>` and are
  // outletted into either the horizontal viewport or the vertical pass-through.
  // Placing two `<ng-content />` slots directly inside `@if/@else` would drop
  // the projection — Angular resolves content projection at component creation
  // and only the first matching slot fills, even if the `@if` flips later.
  // Wrapping in an `<ng-template>` defers the `<ng-content />` materialisation
  // to the outlet's view-instantiation, which works correctly across flips.
  template: `
    <ng-template #itemsTpl>
      <ng-content />
    </ng-template>

    @if (orientation() === 'horizontal') {
      <button
        type="button"
        [class]="prevChevronClasses()"
        [attr.aria-label]="scrollLabels().scrollPrevious"
        [attr.aria-hidden]="_prevButtonHidden() ? 'true' : null"
        [disabled]="_prevButtonDisabled()"
        (click)="_scrollPrev()"
      >
        @if (_isRtl()) {
          <svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
          </svg>
        } @else {
          <svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        }
      </button>
      <div
        #scrollViewport
        [class]="horizontalViewportClasses"
        (scroll)="_onScroll()"
      >
        <ng-container [ngTemplateOutlet]="itemsTpl" />
      </div>
      <button
        type="button"
        [class]="nextChevronClasses()"
        [attr.aria-label]="scrollLabels().scrollNext"
        [attr.aria-hidden]="_nextButtonHidden() ? 'true' : null"
        [disabled]="_nextButtonDisabled()"
        (click)="_scrollNext()"
      >
        @if (_isRtl()) {
          <svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        } @else {
          <svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
          </svg>
        }
      </button>
    } @else {
      <ng-container [ngTemplateOutlet]="itemsTpl" />
    }
  `,
})
export class TimelineComponent {
  /** Axis along which items are laid out. `'vertical'` stacks items top-to-bottom; `'horizontal'` lays them out left-to-right (RTL-aware). Defaults to `'vertical'`. */
  readonly orientation = input<TwOrientation>('vertical');

  /** Vertical layout strategy. `'left'` / `'right'` place the marker on that side; `'alternate'` centers the marker and flips the body left ↔ right per item; `'split'` centers the marker with body on the right and the opposite slot on the left. Ignored when orientation is `'horizontal'`. Defaults to `'left'`. */
  readonly align = input<TimelineAlign>('left');

  /** Density and typography scale. Controls marker diameter, gap between items, and body typography step. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** Connector line style applied to every gap between items. Defaults to `'solid'`. */
  readonly lineStyle = input<TimelineLineStyle>('solid');

  /**
   * Visibility policy for the horizontal-overflow chevron buttons. `'auto'`
   * shows them only when the inner scroll region can scroll in that direction;
   * `'always'` renders both regardless of scroll state (disabled when at an
   * edge); `'never'` hides them entirely (consumer manages overflow
   * externally). Ignored when orientation is `'vertical'`. Defaults to
   * `'auto'`.
   *
   * Counts as the 5th container input, justified by the "Overflow-control axis
   * on layout primitives" cap exception: a layout primitive whose primary axes
   * (orientation, alignment, size, line/style) already saturate ≤ 4 inputs MAY
   * add a single additional input that toggles overflow-navigation
   * affordances when overflow is a real concern for at least one axis value.
   * The added input MUST be a single tri-state and MUST be inert on axis
   * values where overflow cannot occur (here: `orientation === 'vertical'`).
   */
  readonly scrollControls = input<TimelineScrollControls>('auto');

  /** @internal Static class string for the horizontal scroll viewport — see `HORIZONTAL_VIEWPORT_CLASSES`. */
  protected readonly horizontalViewportClasses = HORIZONTAL_VIEWPORT_CLASSES;

  /** @internal Projected `tw-timeline-item` children in DOM order. */
  readonly items = contentChildren(TimelineItemComponent, { descendants: false });

  // ── Horizontal scroll / chevron wiring ──

  private readonly _destroyRef = inject(DestroyRef);
  private readonly _directionality = inject(Directionality, { optional: true });
  private readonly _viewportRef = viewChild<ElementRef<HTMLDivElement>>('scrollViewport');
  private readonly _scrollLabelsOverride = inject(TW_TIMELINE_SCROLL_LABELS, {
    optional: true,
  });

  /** @internal Live `dir` from CDK `Directionality`. */
  private readonly _cdkDir = signal<'ltr' | 'rtl'>(this._directionality?.value ?? 'ltr');

  /** @internal True when the host renders inside a `dir="rtl"` ancestor. */
  readonly _isRtl = computed(() => this._cdkDir() === 'rtl');

  /**
   * @internal Defaults to `false` until the first measurement runs in
   * `afterNextRender`. This avoids a one-frame "enabled-then-disabled" flash
   * where the buttons appear live before the scroll state has been read.
   */
  readonly _canScrollPrev = signal(false);
  readonly _canScrollNext = signal(false);

  /** @internal Resolved label record. Falls back to English defaults for any missing key. */
  readonly scrollLabels = computed<TwTimelineScrollLabels>(() => ({
    ...DEFAULT_TW_TIMELINE_SCROLL_LABELS,
    ...(this._scrollLabelsOverride ?? {}),
  }));

  /** @internal True when the prev button should be aria-hidden + visually suppressed. */
  readonly _prevButtonHidden = computed(() => {
    const policy = this.scrollControls();
    if (policy === 'never') return true;
    if (policy === 'always') return false;
    return !this._canScrollPrev();
  });

  /** @internal True when the next button should be aria-hidden + visually suppressed. */
  readonly _nextButtonHidden = computed(() => {
    const policy = this.scrollControls();
    if (policy === 'never') return true;
    if (policy === 'always') return false;
    return !this._canScrollNext();
  });

  /** @internal Native `disabled` attribute. Always true for hidden buttons (defensive); also true for `'always'` policy when can't scroll. */
  readonly _prevButtonDisabled = computed(
    () => this._prevButtonHidden() || !this._canScrollPrev(),
  );
  readonly _nextButtonDisabled = computed(
    () => this._nextButtonHidden() || !this._canScrollNext(),
  );

  /**
   * @internal Final class string for the prev chevron — combines the shared
   * `CHEVRON_CLASSES`, the directional anchor (`left-0` in LTR, `right-0` in
   * RTL), and the visibility variant driven by `scrollControls`.
   */
  readonly prevChevronClasses = computed(() => this._chevronClasses('prev'));
  readonly nextChevronClasses = computed(() => this._chevronClasses('next'));

  private _chevronClasses(side: 'prev' | 'next'): string {
    const isRtl = this._isRtl();
    // In LTR the prev arrow anchors to the host's left, next to the right.
    // RTL flips: prev anchors right, next anchors left. The arrow glyph also
    // flips (handled in the template).
    const anchor =
      side === 'prev' ? (isRtl ? 'right-0' : 'left-0') : isRtl ? 'left-0' : 'right-0';
    const policy = this.scrollControls();
    const hidden = side === 'prev' ? this._prevButtonHidden() : this._nextButtonHidden();
    // `'never'` → wholly hidden (no layout space, ignored by AT).
    // `'auto'` + can't scroll that way → invisible but still occupies space
    //   (prevents the chevron from popping into view and shifting layout when
    //   scroll becomes possible mid-interaction).
    // `'always'` → always visible; native `disabled` styling handles edges.
    let visibility = '';
    if (policy === 'never') visibility = 'hidden';
    else if (policy === 'auto' && hidden) visibility = 'invisible';
    return `${CHEVRON_CLASSES} ${anchor} ${visibility}`.trim();
  }

  private _resizeObserver: ResizeObserver | null = null;

  constructor() {
    // The viewport materialises on the first frame after horizontal
    // orientation is committed; afterNextRender hooks into that point.
    afterNextRender(() => this._setupScrollDetection());

    this._destroyRef.onDestroy(() => {
      this._resizeObserver?.disconnect();
      this._resizeObserver = null;
    });

    if (this._directionality) {
      const sub = this._directionality.change.subscribe((value) => {
        this._cdkDir.set(value);
      });
      this._destroyRef.onDestroy(() => sub.unsubscribe());
    }
  }

  private _setupScrollDetection(): void {
    // Vertical orientation never renders the viewport — nothing to do.
    if (this.orientation() !== 'horizontal') return;
    const el = this._viewportRef()?.nativeElement;
    if (!el) return;

    this._updateScrollState();

    // ResizeObserver fires when items are appended/removed (the viewport's
    // scrollWidth changes), so a separate items-change effect is not needed.
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => this._updateScrollState());
      this._resizeObserver.observe(el);
    }
  }

  /** @internal Wired to the viewport's `(scroll)` event. */
  _onScroll(): void {
    this._updateScrollState();
  }

  private _updateScrollState(): void {
    const el = this._viewportRef()?.nativeElement;
    if (!el) return;
    // `> 1` thresholds handle sub-pixel scroll positions on retina displays —
    // smooth-scroll landings can settle at scrollLeft = 0.5 and would flicker
    // an enabled/disabled boundary without the guard.
    this._canScrollPrev.set(el.scrollLeft > 1);
    this._canScrollNext.set(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }

  /** Page-scroll amount: 75% of the visible width, leaving ~25% overlap for context. */
  private _pageScrollAmount(): number {
    const el = this._viewportRef()?.nativeElement;
    if (!el) return 0;
    return Math.floor(el.clientWidth * 0.75);
  }

  /** @internal Click handler for the prev chevron. */
  _scrollPrev(): void {
    const el = this._viewportRef()?.nativeElement;
    if (!el) return;
    // In RTL "previous" (the visual left button) maps to a positive scrollLeft
    // delta; in LTR it's a negative delta toward 0.
    const direction = this._isRtl() ? 1 : -1;
    el.scrollBy({ left: direction * this._pageScrollAmount(), behavior: 'smooth' });
  }

  /** @internal Click handler for the next chevron. */
  _scrollNext(): void {
    const el = this._viewportRef()?.nativeElement;
    if (!el) return;
    const direction = this._isRtl() ? -1 : 1;
    el.scrollBy({ left: direction * this._pageScrollAmount(), behavior: 'smooth' });
  }

  private readonly variantResult = computed(() =>
    timelineVariants({
      orientation: this.orientation(),
      size: this.size(),
      lineStyle: this.lineStyle(),
    }),
  );

  readonly rootClasses = computed(() => this.variantResult().root());

  /** @internal Item slot classes shared with `TimelineItemComponent`. */
  readonly itemSlotClasses = computed(() => this.variantResult().item());
  readonly markerSideSlotClasses = computed(() => this.variantResult().markerSide());
  readonly markerSlotClasses = computed(() => this.variantResult().marker());
  readonly connectorLeadingSlotClasses = computed(() =>
    this.variantResult().connectorLeading(),
  );
  readonly connectorTrailingSlotClasses = computed(() =>
    this.variantResult().connectorTrailing(),
  );
  readonly bodySlotClasses = computed(() => this.variantResult().body());
  readonly oppositeSlotClasses = computed(() => this.variantResult().opposite());
  readonly numberSlotClasses = computed(() => this.variantResult().number());
  readonly timestampSlotClasses = computed(() => this.variantResult().timestamp());

  /** @internal Variant builder reused by items so per-item state can recompose without rebuilding the base tv() result. */
  readonly itemMarkerVariant = (
    state: TimelineState,
    marker: TimelineMarker,
  ): string =>
    timelineVariants({
      orientation: this.orientation(),
      size: this.size(),
      lineStyle: this.lineStyle(),
      marker,
      state,
    }).marker();

  /** @internal Variant builder for the auto-number slot (state drives text color). */
  readonly itemNumberVariant = (state: TimelineState): string =>
    timelineVariants({
      orientation: this.orientation(),
      size: this.size(),
      lineStyle: this.lineStyle(),
      state,
    }).number();
}

// ── TimelineItemComponent ──

/**
 * A single event in a `tw-timeline`. Renders a marker (dot or circle) plus
 * content. Connectors leading into and out of the marker are emitted by this
 * component and conditionally elided when the item is first or last in the
 * timeline. The item is not focusable — row activation belongs to projected
 * interactive children.
 */
@Component({
  selector: 'tw-timeline-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'listitem',
    '[class]': 'itemClasses()',
    '[attr.aria-current]': 'state() === "current" ? "step" : null',
    '[animate.enter]': 'enterAnimationClass()',
  },
  template: `
    <div [class]="markerSideClasses()">
      @if (renderLeadingConnector()) {
        <span [class]="leadingConnectorClasses()" aria-hidden="true"></span>
      }
      <div [class]="markerClasses()" aria-hidden="true">
        @if (marker() === 'circle') {
          @if (hasMarkerSlot()) {
            <ng-content select="[twTimelineMarker]" />
          } @else if (state() === 'error') {
            <svg
              class="size-3/5 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v4.5a.75.75 0 0 0 1.5 0v-4.5ZM10 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                clip-rule="evenodd"
              />
            </svg>
          } @else {
            <span [class]="numberClasses()">{{ index() + 1 }}</span>
          }
        }
      </div>
      @if (renderTrailingConnector()) {
        <span [class]="trailingConnectorClasses()" aria-hidden="true"></span>
      }
    </div>
    <div [class]="bodyClasses()">
      @if (stateLabel(); as label) {
        <span class="sr-only">{{ label }}</span>
      }
      <ng-content />
      @if (hasTimestampSlot()) {
        <ng-content select="[twTimelineTimestamp]" />
      } @else if (timestamp() !== null) {
        @let dt = resolvedDateTime();
        @if (dt !== null) {
          <time [attr.datetime]="dt" [class]="timestampClasses()">{{ formattedTimestamp() }}</time>
        } @else {
          <span [class]="timestampClasses()">{{ formattedTimestamp() }}</span>
        }
      }
    </div>
    @if (hasOppositeColumn()) {
      <div [class]="oppositeClasses()">
        <ng-content select="[twTimelineOpposite]" />
      </div>
    }
  `,
})
export class TimelineItemComponent implements AfterContentInit {
  /** Semantic color for the marker fill and the trailing connector when the item is in a reached state. Ignored when state is `'error'` (which forces the error palette). Defaults to `'primary'`. */
  readonly color = input<TwColor>('primary');

  /** Marker geometry. `'dot'` is a small filled circle. `'circle'` is a larger ring that may contain a projected icon, avatar, or an auto-computed 1-based index. Defaults to `'dot'`. */
  readonly marker = input<TimelineMarker>('dot');

  /** Semantic state of the event. Drives marker fill, ring, and trailing-connector color, and applies `aria-current="step"` when `'current'`. Defaults to `'reached'`. */
  readonly state = input<TimelineState>('reached');

  /** Timestamp shown in the timestamp slot. A `Date` is formatted via `Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })`; a string is rendered verbatim; `null` omits the timestamp element. Overridden by projected `[twTimelineTimestamp]` content when present. Defaults to `null`. */
  readonly timestamp = input<string | Date | null>(null);

  /** Machine-readable ISO 8601 datetime for the rendered `<time datetime="…">` attribute. Derived from `timestamp` when it is a `Date` and this input is `null`; required (explicit) when `timestamp` is a string and machine-readability is desired. When `null` with a string timestamp, the timestamp renders as a `<span>` instead. Defaults to `null`. */
  readonly dateTime = input<string | null>(null);

  /** @internal Direct parent timeline. A `tw-timeline-item` outside a `tw-timeline` is a programmer error — the DI failure throws naturally. */
  readonly timeline = inject(TimelineComponent);

  /** @internal */
  readonly markerSlot = contentChild(TimelineMarkerDirective);
  /** @internal */
  readonly timestampSlot = contentChild(TimelineTimestampDirective);
  /** @internal */
  readonly oppositeSlot = contentChild(TimelineOppositeDirective);

  readonly hasMarkerSlot = computed(() => !!this.markerSlot());
  readonly hasTimestampSlot = computed(() => !!this.timestampSlot());
  readonly hasOppositeSlot = computed(() => !!this.oppositeSlot());

  /** @internal 0-based index in the parent timeline's content. -1 until contentChildren materialises. */
  readonly index = computed(() => this.timeline.items().indexOf(this));

  readonly isFirst = computed(() => this.index() === 0);

  readonly isLast = computed(() => {
    const idx = this.index();
    if (idx < 0) return false;
    return idx === this.timeline.items().length - 1;
  });

  /**
   * Leading-connector visibility. In vertical orientation the marker sits at
   * the top of the body and only the trailing segment is rendered. In
   * horizontal orientation the marker must stay centered in its row even at
   * the ends of the timeline, so the leading segment is always rendered — as a
   * coloured line for non-first items, as an invisible spacer for the first.
   */
  readonly renderLeadingConnector = computed(
    () => this.timeline.orientation() === 'horizontal',
  );

  /**
   * Trailing-connector visibility. Rendered for every item in horizontal
   * orientation (as a spacer on the last item) so all markers stay centered.
   * In vertical orientation it is suppressed on the last item — the timeline
   * ends with the marker, no trailing segment.
   */
  readonly renderTrailingConnector = computed(() => {
    if (this.timeline.orientation() === 'horizontal') return true;
    return !this.isLast();
  });

  /** @internal `error` state forces the error palette regardless of the color input. */
  readonly resolvedColor = computed<TwColor>(() =>
    this.state() === 'error' ? 'error' : this.color(),
  );

  /** @internal Previous item's state (drives the leading connector color so a line between two items reads as one color). */
  readonly previousState = computed<TimelineState>(() => {
    const idx = this.index();
    if (idx <= 0) return 'reached';
    const prev = this.timeline.items()[idx - 1];
    return prev.state();
  });

  /** @internal Previous item's resolved color, for the same reason as `previousState`. */
  readonly previousColor = computed<TwColor>(() => {
    const idx = this.index();
    if (idx <= 0) return 'primary';
    const prev = this.timeline.items()[idx - 1];
    return prev.resolvedColor();
  });

  readonly stateLabel = computed<string | null>(() => {
    switch (this.state()) {
      case 'pending':
        return 'Pending: ';
      case 'current':
        return 'Current: ';
      case 'error':
        return 'Error: ';
      default:
        return null;
    }
  });

  readonly formattedTimestamp = computed<string>(() => {
    const ts = this.timestamp();
    if (ts === null) return '';
    if (ts instanceof Date) {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(ts);
    }
    return ts;
  });

  readonly resolvedDateTime = computed<string | null>(() => {
    const dt = this.dateTime();
    if (dt !== null) return dt;
    const ts = this.timestamp();
    if (ts instanceof Date) return ts.toISOString();
    return null;
  });

  /** @internal True when the layout needs a third (opposite) column. */
  readonly hasOppositeColumn = computed(() => {
    if (this.timeline.orientation() === 'horizontal') return false;
    const align = this.timeline.align();
    return align === 'alternate' || align === 'split';
  });

  /** @internal Order of the marker side wrapper. Always center column (2) in three-column layouts; in two-column vertical layouts the order varies. Horizontal layouts use CSS grid placement (`row-start-*`) instead, so flex-order utilities are noise — return ''. */
  private readonly markerOrderClass = computed(() => {
    if (this.timeline.orientation() === 'horizontal') return '';
    const align = this.timeline.align();
    if (this.hasOppositeColumn()) return 'order-2';
    if (align === 'right') return 'order-2';
    return 'order-1';
  });

  /** @internal Order of the body wrapper. Alternate flips body left/right per item. Horizontal layouts use CSS grid placement (`row-start-*`) instead, so flex-order utilities are noise — return ''. */
  private readonly bodyOrderClass = computed(() => {
    if (this.timeline.orientation() === 'horizontal') return '';
    const align = this.timeline.align();
    if (align === 'right') return 'order-1';
    if (align === 'alternate' && this.index() % 2 === 1) return 'order-1';
    if (this.hasOppositeColumn()) return 'order-3';
    return 'order-2';
  });

  /** @internal Order of the opposite wrapper. Always left of the marker except on odd-indexed alternate items. */
  private readonly oppositeOrderClass = computed(() => {
    const align = this.timeline.align();
    if (align === 'alternate' && this.index() % 2 === 1) return 'order-3';
    return 'order-1';
  });

  /** @internal Width affordance for the marker side. Vertical needs a fixed-ish column; horizontal needs to span the row. */
  private readonly markerSideSizeClass = computed(() => {
    if (this.timeline.orientation() === 'horizontal') return '';
    // Pin the column to the marker's own width so siblings stay aligned even
    // when items render slightly different bubble content.
    switch (this.timeline.size()) {
      case 'xs':
        return 'w-6';
      case 'sm':
        return 'w-7';
      case 'md':
        return 'w-8';
      case 'lg':
        return 'w-10';
      case 'xl':
        return 'w-12';
    }
  });

  /** @internal Width affordance for the body in alternate/split layouts so the marker stays centered. */
  private readonly bodyFlexClass = computed(() => {
    if (this.timeline.orientation() === 'horizontal') return '';
    if (this.hasOppositeColumn()) return 'flex-1';
    return 'flex-1';
  });

  /** @internal Width affordance for the opposite column (mirrors the body to keep the marker centered). */
  private readonly oppositeFlexClass = computed(() => 'flex-1');

  // ── Composed class outputs ──

  readonly itemClasses = computed(() => this.timeline.itemSlotClasses());

  readonly markerSideClasses = computed(
    () =>
      `${this.timeline.markerSideSlotClasses()} ${this.markerSideSizeClass()} ${this.markerOrderClass()}`,
  );

  readonly markerClasses = computed(
    () =>
      `${this.timeline.itemMarkerVariant(this.state(), this.marker())} ${resolveMarkerClasses(
        this.state(),
        this.resolvedColor(),
        this.hasMarkerSlot(),
      )}`,
  );

  readonly leadingConnectorClasses = computed(() => {
    const base = this.timeline.connectorLeadingSlotClasses();
    // The first horizontal item gets an invisible spacer — same geometry,
    // no colour fill — so the marker still anchors to the row's centre.
    if (this.isFirst()) return base;
    return `${base} ${resolveConnectorClasses(
      this.previousState(),
      this.previousColor(),
      this.timeline.lineStyle(),
    )}`;
  });

  readonly trailingConnectorClasses = computed(() => {
    const base = this.timeline.connectorTrailingSlotClasses();
    // The last horizontal item also gets an invisible spacer; in vertical
    // orientation the trailing connector is not rendered at all for the last
    // item (the marker sits at the body top, nothing to bridge below).
    if (this.isLast() && this.timeline.orientation() === 'horizontal') {
      return base;
    }
    return `${base} ${resolveConnectorClasses(
      this.state(),
      this.resolvedColor(),
      this.timeline.lineStyle(),
    )}`;
  });

  readonly bodyClasses = computed(() => {
    const base = `${this.timeline.bodySlotClasses()} ${this.bodyFlexClass()} ${this.bodyOrderClass()}`;
    // The per-size `pb-*` on the body slot exists only to space adjacent
    // vertical items. Horizontal layouts and the final vertical item don't
    // need it — strip with `!pb-0` so the trailing tone wins (twMerge keeps
    // the last padding-bottom utility and `!` settles tied specificity).
    if (this.timeline.orientation() === 'horizontal') {
      return `${base} !pb-0`;
    }
    if (this.isLast()) {
      return `${base} !pb-0`;
    }
    return base;
  });

  readonly oppositeClasses = computed(
    () =>
      `${this.timeline.oppositeSlotClasses()} ${this.oppositeFlexClass()} ${this.oppositeOrderClass()}`,
  );

  readonly numberClasses = computed(() => this.timeline.itemNumberVariant(this.state()));

  readonly timestampClasses = computed(() => this.timeline.timestampSlotClasses());

  readonly enterAnimationClass = computed(() =>
    this.timeline.orientation() === 'horizontal'
      ? 'timeline-item-enter-horizontal'
      : 'timeline-item-enter',
  );

  ngAfterContentInit(): void {
    // One-shot dev warning when a [twTimelineMarker] slot is projected onto a
    // marker="dot" item. Runs in ngAfterContentInit because contentChild signals
    // are not yet populated during ngOnInit. Not an effect — the warning should
    // fire once at mount, not re-fire on every input change. Production builds
    // skip the warning entirely because ngDevMode is statically `false`.
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      if (this.marker() === 'dot' && this.hasMarkerSlot()) {
        console.warn(
          '[tw-timeline-item] [twTimelineMarker] content is ignored when marker="dot". ' +
            'Set marker="circle" to render projected marker content.',
        );
      }
    }
  }
}
