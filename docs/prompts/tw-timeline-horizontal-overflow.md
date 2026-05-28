# Prompt addendum: `tw-timeline` horizontal-overflow navigation

This document **extends** the original `tw-timeline` prompt at `docs/prompts/tw-timeline.md`. The component is already shipped — see `projects/ngx-tw/timeline/timeline.ts` and its spec. Everything in the original prompt still applies; this addendum only describes the deltas required to add horizontal-overflow navigation.

When this document and the original prompt disagree on the same surface, **this document wins** (it is the more recent design).

---

## Context (read before changing anything)

- `projects/ngx-tw/timeline/timeline.ts` — current implementation. Note especially: the `tv()` `root` slot already carries `overflow-x-auto` in the horizontal branch (line 70), the item carries `flex-1 basis-0` in the horizontal branch (line 71), and the item template renders `<ng-content />` directly with no inner wrapper.
- `projects/ngx-tw/timeline/timeline.spec.ts` — every test in here must continue to pass (with the noted edits in § 8).
- `projects/ngx-tw/timeline/index.ts` — current re-exports. The addendum extends this surface.
- `docs/prompts/tw-timeline.md` — the original prompt. Read § "Public API", § "DOM structure", § "tv() variant plan", § "Static color × state class lookups" — those sections are **unchanged**. The "Input cap" line for the container is the only API constraint that this addendum revises.
- `docs/requirements/timeline.requirements.md` — § 11.2 reserves `TW_TIMELINE_I18N`; this addendum lands the first concrete token under that reservation (`TW_TIMELINE_SCROLL_LABELS`) without unlocking the rest.
- `.claude/CLAUDE.md` — focus rings, semantic tokens, icon sub-scales, input-cap exception rules.
- `projects/ngx-tw/tabs/tabs.ts` — canonical example of `ResizeObserver` + `scrollLeft` / `scrollWidth - clientWidth` + chevron pagination buttons. Copy the wiring pattern (`updateScrollState`, `setupScrollDetection`, `afterNextRender`, `destroyRef.onDestroy`).
- `projects/ngx-tw/split/split.ts` — canonical example of `inject(Directionality, { optional: true })` plus a `_cdkDir` signal driven by the directionality `change` subject. Mirror this exactly for RTL handling.
- `projects/ngx-tw/theme/_base.css` — the `.tw-scrollbar-none` utility is already defined at lines 19-22 (no CSS changes are needed).

No new CDK imports beyond `Directionality` (from `@angular/cdk/bidi`) are required. No new icons need to be registered.

---

## What changes

Two real problems the original implementation does not solve:

1. **Item widths are container-fractioned in horizontal mode.** Today every `<tw-timeline-item>` carries `flex-1 basis-0`, so each item is squeezed to `container-width / N`. With 8+ items each becomes too narrow to read; the model also produces the cosmetic artefact where the last marker visually anchors to the right edge of its column.
2. **No overflow navigation.** The root has `overflow-x-auto` but no chevron controls — a long horizontal timeline shows a native scrollbar (which we hide elsewhere with `tw-scrollbar-none`) and asks the user to figure it out.

This addendum:

- Switches horizontal items from `flex-1 basis-0` to **content-driven width with a per-density `min-w-*` floor**. The previous spacer pattern (leading-spacer on the first item, trailing-spacer on the last) is kept — that's already how the markers stay centred.
- Wraps the projected items in an **inner scroll element** in horizontal orientation only. Vertical orientation is untouched.
- Adds two **prev/next chevron buttons** absolutely positioned at the host's left/right edges, outside the scroll region, with reactive disabled state driven by `scrollLeft` / `scrollWidth - clientWidth`.
- Adds one container input (`scrollControls`) and one injection token (`TW_TIMELINE_SCROLL_LABELS`) plus a `provideTwTimelineScrollLabels` helper.
- Codifies a **new input-cap exception** for the container: the horizontal-overflow behavioural axis is independent of the existing layout axes, justifying a 5th input.

---

## New input-cap exception (document, then apply)

Today's cap is `≤ 5–6 inputs per component` (CLAUDE.md "Input count cap"), with a codified set of exceptions (overlay, form-control, structural-layout, data-primitive). The timeline container does not fit any of those. We add a fifth narrow exception:

> **Overflow-control axis on layout primitives.** A layout primitive whose primary axes (orientation, alignment, size, line/style) already saturate ≤ 4 inputs MAY add a single additional input that toggles overflow-navigation affordances when overflow is a real concern for at least one axis value. The added input MUST be a single tri-state (`'auto' | 'always' | 'never'`) and MUST be inert on axis values where overflow cannot occur (e.g., timeline vertical). Today this applies only to `tw-timeline` (container = 4 layout axes + 1 overflow axis = 5).

The implementer MUST mirror this paragraph into `.claude/CLAUDE.md` § "Input count cap" → "Boolean defaults" → after the existing four-row exception table, as a new fifth row:

| Exception | Why the surface is wide | Canonical example |
|---|---|---|
| **Overflow-control axis** | The orientation/align/size/lineStyle axes already saturate the cap; conditional overflow navigation is a behavioural axis distinct from layout. | `timeline` (container goes from 4 → 5 inputs with `scrollControls`) |

If the CLAUDE.md update is felt to be out of scope for this PR, that's acceptable — but the JSDoc on `scrollControls` MUST quote the exception paragraph above in full so the rationale lives in the source.

---

## Container input addition

Append a fifth input to `TimelineComponent`:

| Name | Type | Default | JSDoc (paste verbatim) |
|---|---|---|---|
| `scrollControls` | `TimelineScrollControls` | `'auto'` | `Visibility policy for the horizontal-overflow chevron buttons. 'auto' shows them only when the inner scroll region can scroll in that direction; 'always' renders both regardless of scroll state (disabled when at an edge); 'never' hides them entirely (consumer manages overflow externally). Ignored when orientation is 'vertical'. Defaults to 'auto'.` |

Public type to export from `index.ts`:

```ts
/** Visibility policy for the horizontal-overflow chevron buttons. */
export type TimelineScrollControls = 'auto' | 'always' | 'never';
```

The container's input count goes from 4 to 5. This is the only API change to the container.

The item is **unchanged** — still 5 inputs, still `color`, `marker`, `state`, `timestamp`, `dateTime`. No new item input.

---

## i18n token: `TW_TIMELINE_SCROLL_LABELS`

Add to `timeline.ts` (top-level, exported):

```ts
import { InjectionToken, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';

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
 * This token is the first concrete token under the `TW_TIMELINE_I18N` reservation
 * documented in `docs/requirements/timeline.requirements.md` § 11.2.
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
```

Resolution inside `TimelineComponent`:

```ts
private readonly _scrollLabelsOverride = inject(TW_TIMELINE_SCROLL_LABELS, { optional: true });

readonly scrollLabels = computed<TwTimelineScrollLabels>(() => ({
  ...DEFAULT_TW_TIMELINE_SCROLL_LABELS,
  ...(this._scrollLabelsOverride ?? {}),
}));
```

`scrollLabels` is `@internal` — only template/host bindings consume it. Do **not** expose it as a public method.

---

## Item-width model (horizontal only)

Replace the `item` slot's horizontal-variant class string in the `tv()` config:

```diff
   horizontal: {
     root: 'flex-row items-start overflow-x-auto',
-    item: 'flex-col items-center text-center flex-1 basis-0',
+    item: 'flex-col items-center text-center',
     markerSide: 'flex-row items-center w-full',
     body: 'items-center',
   },
```

The `flex-1 basis-0` is removed — items take their content's natural width. Add a new compound-variant block to inject a per-density `min-w-*` floor (the canonical example for size × orientation compound variants is already in the file):

```ts
// Horizontal item min-width per density.
// Values chosen so a marker plus ~16-24 chars of body text fit without truncation
// at each step; lower-bound is the diameter of the corresponding circle marker
// (size-6 → 24px) plus a comfortable ~120px text gutter, scaling up to leave
// room for richer descriptions at xl.
{ orientation: 'horizontal', size: 'xs', class: { item: 'min-w-32' } }, // 128px
{ orientation: 'horizontal', size: 'sm', class: { item: 'min-w-36' } }, // 144px
{ orientation: 'horizontal', size: 'md', class: { item: 'min-w-40' } }, // 160px
{ orientation: 'horizontal', size: 'lg', class: { item: 'min-w-44' } }, // 176px
{ orientation: 'horizontal', size: 'xl', class: { item: 'min-w-48' } }, // 192px
```

The leading/trailing connector spacer pattern from the current implementation (`renderLeadingConnector` always-true horizontally, `renderTrailingConnector` always-true horizontally) is unchanged. Markers stay centred in their item because the marker row already has `markerSide: 'flex-row items-center w-full'` and the leading/trailing segments are `flex-1`. Now that the item width is content-driven plus a `min-w-*` floor, the rightmost marker no longer visually pegs to the column edge.

**Continuous-connector guarantee:** the trailing-half of item N and the leading-half of item N+1 abut with no gap because (a) the item host carries no horizontal padding in the horizontal `tv()` row, (b) the container has no `gap-*` between items (the existing horizontal-variant `tv()` config sets `gap-*` only on the `item`'s own internal layout, never between siblings), and (c) the markerSide spans `w-full` of the item. Verify this visually but it follows from the current geometry.

---

## DOM structure delta — inner scroll wrapper

The container template currently reads `template: '<ng-content />'`. Replace it with:

```html
@if (orientation() === 'horizontal') {
  <button
    type="button"
    class="<chevronClasses>"
    [class.left-0]="!_isRtl()"
    [class.right-0]="_isRtl()"
    [attr.aria-label]="scrollLabels().scrollPrevious"
    [attr.aria-hidden]="_prevButtonHidden() ? 'true' : null"
    [disabled]="!_canScrollPrev() || _prevButtonHidden()"
    [class.pointer-events-none]="_prevButtonHidden()"
    (click)="_scrollPrev()"
    tabindex="0"
  >
    <!-- inline chevron-left svg, see "Chevron buttons" section below -->
  </button>
  <div
    #scrollViewport
    class="tw-scrollbar-none flex flex-row items-start overflow-x-auto scroll-smooth motion-reduce:scroll-auto w-full"
    (scroll)="_onScroll()"
  >
    <ng-content />
  </div>
  <button
    type="button"
    class="<chevronClasses>"
    [class.right-0]="!_isRtl()"
    [class.left-0]="_isRtl()"
    [attr.aria-label]="scrollLabels().scrollNext"
    [attr.aria-hidden]="_nextButtonHidden() ? 'true' : null"
    [disabled]="!_canScrollNext() || _nextButtonHidden()"
    [class.pointer-events-none]="_nextButtonHidden()"
    (click)="_scrollNext()"
    tabindex="0"
  >
    <!-- inline chevron-right svg -->
  </button>
} @else {
  <ng-content />
}
```

Three structural consequences of this change:

1. The `root` slot in `tv()` loses its `overflow-x-auto` for the horizontal variant — the scroll now lives on the inner wrapper. Adjust the `tv()` horizontal `root` to `'flex-row items-start relative'` (the `relative` is required so the chevron buttons can use `absolute left-0` / `right-0`).
2. In vertical orientation nothing changes — the `@else` branch projects `<ng-content />` directly, matching the current behaviour.
3. The host CSS `position: relative` (via `relative` class) is needed only in horizontal orientation; the existing vertical class set (`flex flex-col`) is unaffected.

Adjusted `tv()` excerpt:

```diff
   variants: {
     orientation: {
       vertical: {
         root: 'flex-col',
         item: 'flex-row',
         markerSide: 'flex-col items-center',
       },
       horizontal: {
-        root: 'flex-row items-start overflow-x-auto',
+        root: 'flex-row items-start relative',
         item: 'flex-col items-center text-center',
         markerSide: 'flex-row items-center w-full',
         body: 'items-center',
       },
     },
```

---

## Chevron buttons

Both buttons share a single class string. Define once at the top of the file (outside `tv()` — it has no variants):

```ts
// Class string shared by both overflow chevron buttons.
// Positioned absolutely against the host; the host carries `relative` in horizontal
// orientation (via the tv() config) so left-0 / right-0 anchor correctly.
// Vertical centring is `top-1/2 -translate-y-1/2` so the button aligns with the
// marker row regardless of body height above/below.
// `size-8` (32px) matches the canonical "square interactive target" md size
// from CLAUDE.md § Icon Sizing → Square interactive targets.
const CHEVRON_CLASSES =
  'absolute top-1/2 -translate-y-1/2 z-10 inline-flex items-center justify-center ' +
  'size-8 rounded-full bg-surface-raised border border-border shadow-sm ' +
  'text-fg-muted hover:text-fg hover:bg-surface-muted ' +
  'transition-colors duration-200 motion-reduce:transition-none ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ' +
  'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-raised disabled:hover:text-fg-muted';
```

Notes:

- `size-8` rounded-full sits within the canonical "square interactive target" sub-scale at md density. The chevron-glyph inside is `size-4` (16px), within the canonical "glyph icon" sub-scale.
- `top-1/2 -translate-y-1/2` centres the button vertically against the host. Because the marker row sits at a known vertical position (above the body in `align="left"`-style horizontal, with `items-center` on `markerSide`) and the host is `flex-row items-start`, the host's vertical extent equals the tallest item's extent, and the marker rows of all items share the same y. The `top-1/2` is a pragmatic approximation; if a maintainer later wants pixel-perfect alignment to the marker row specifically, they can refactor to use `position: sticky` on the buttons against the marker row — but `top-1/2` is acceptable for v1 because the body content above/below the marker is symmetric for the canonical "horizontal ribbon" use case.
- The button uses the **canonical focus ring** (`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`) from CLAUDE.md § Focus Rings.
- The disabled hover overrides (`disabled:hover:bg-surface-raised disabled:hover:text-fg-muted`) suppress the hover state when disabled, otherwise twMerge would unify them.
- The `bg-surface-raised` background plus a small `border border-border` and `shadow-sm` lifts the chevron above the scrolled content so items scrolling under it remain visually distinct. There is intentionally **no gradient fade mask** — relying on the chevron's own background + 2px of overlap against the scroll region is simpler than a CSS mask and reads cleanly against any consumer theme. (Decision recorded — a fade mask was an option but rejected as adding complexity disproportionate to value.)

Inline chevron SVGs (hand-authored, no registry dependency — matches the timeline's existing error glyph pattern at lines 477-488 of `timeline.ts`):

```html
<!-- chevron-left -->
<svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"
     stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M15 18l-6-6 6-6" />
</svg>

<!-- chevron-right -->
<svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"
     stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M9 18l6-6-6-6" />
</svg>
```

Click handlers:

```ts
private readonly _viewportRef = viewChild<ElementRef<HTMLDivElement>>('scrollViewport');

/** Page-scroll amount: 75% of the visible width, leaving ~25% overlap for context. */
private _pageScrollAmount(): number {
  const el = this._viewportRef()?.nativeElement;
  if (!el) return 0;
  return Math.floor(el.clientWidth * 0.75);
}

_scrollPrev(): void {
  const el = this._viewportRef()?.nativeElement;
  if (!el) return;
  // In RTL the visual "previous" (left arrow) means scrolling toward positive
  // scrollLeft; in LTR it means scrolling toward zero. The Directionality-derived
  // _isRtl() signal flips the sign.
  const direction = this._isRtl() ? 1 : -1;
  el.scrollBy({ left: direction * this._pageScrollAmount(), behavior: 'smooth' });
}

_scrollNext(): void {
  const el = this._viewportRef()?.nativeElement;
  if (!el) return;
  const direction = this._isRtl() ? -1 : 1;
  el.scrollBy({ left: direction * this._pageScrollAmount(), behavior: 'smooth' });
}
```

Note: in RTL, `scrollLeft` semantics are normalised by modern evergreen browsers — positive `scrollLeft` means scrolled-toward-the-end (visually leftward in RTL). The `_canScrollPrev` / `_canScrollNext` signals below use `> 1` / `< scrollWidth - clientWidth - 1` thresholds that work identically in both directions; only the `scrollBy` call needs the sign flip above to translate "previous" / "next" into the right scrollLeft delta.

---

## Reactive overflow detection

Mirror the tabs pattern (`tabs.ts` lines 567-636) with these adjustments. Add to `TimelineComponent`:

```ts
import {
  afterNextRender,
  DestroyRef,
  ElementRef,
  viewChild,
} from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';

// inside class:
private readonly _destroyRef = inject(DestroyRef);
private readonly _directionality = inject(Directionality, { optional: true });

/** Tracks live `dir` via CDK Directionality. */
private readonly _cdkDir = signal<'ltr' | 'rtl'>(this._directionality?.value ?? 'ltr');

/** @internal True when the host renders inside a `dir="rtl"` ancestor. */
readonly _isRtl = computed(() => this._cdkDir() === 'rtl');

/**
 * Initial values are FALSE. The first measurement happens inside
 * `afterNextRender` → both buttons render disabled until the viewport reports
 * its dimensions. This avoids a single-frame "enabled-then-disabled" flash on
 * mount where the buttons appear live before the scroll state has been read.
 */
readonly _canScrollPrev = signal(false);
readonly _canScrollNext = signal(false);

/** @internal Whether the prev button should be aria-hidden + pointer-events-none. */
readonly _prevButtonHidden = computed(() => {
  const policy = this.scrollControls();
  if (policy === 'never') return true;
  if (policy === 'always') return false;
  return !this._canScrollPrev();
});

readonly _nextButtonHidden = computed(() => {
  const policy = this.scrollControls();
  if (policy === 'never') return true;
  if (policy === 'always') return false;
  return !this._canScrollNext();
});

private _resizeObserver: ResizeObserver | null = null;

constructor() {
  afterNextRender(() => this._setupScrollDetection());

  this._destroyRef.onDestroy(() => {
    this._resizeObserver?.disconnect();
  });

  if (this._directionality) {
    const sub = this._directionality.change.subscribe(value => {
      this._cdkDir.set(value);
    });
    this._destroyRef.onDestroy(() => sub.unsubscribe());
  }
}

private _setupScrollDetection(): void {
  // Vertical orientation never renders the viewport — no setup required, and
  // the viewChild will be undefined.
  if (this.orientation() !== 'horizontal') return;
  const el = this._viewportRef()?.nativeElement;
  if (!el) return;

  this._updateScrollState();

  // `ResizeObserver` is undefined under some SSR runtimes; the typeof check
  // matches the guard used in tabs.ts (line 625) and is the canonical pattern.
  if (typeof ResizeObserver !== 'undefined') {
    this._resizeObserver = new ResizeObserver(() => this._updateScrollState());
    this._resizeObserver.observe(el);
  }
}

_onScroll(): void {
  this._updateScrollState();
}

private _updateScrollState(): void {
  const el = this._viewportRef()?.nativeElement;
  if (!el) return;
  // `> 1` thresholds handle sub-pixel scroll positions on retina displays.
  // Without this, scrollLeft can settle at 0.5 after a smooth-scroll lands and
  // the prev button would flicker between enabled/disabled.
  this._canScrollPrev.set(el.scrollLeft > 1);
  this._canScrollNext.set(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
}
```

**Why also recompute when items change?** The original framing called this out explicitly. The `ResizeObserver` on the viewport already fires when items are appended/removed because the viewport's `scrollWidth` changes (which changes the viewport's content box — observed). So `afterRenderEffect(items)` is **not** required. If, in practice, an item changes its own width without affecting the viewport's content box (impossible in normal flow but theoretically possible with absolute children), the implementer MAY add an `effect(() => { this.items(); queueMicrotask(() => this._updateScrollState()); })` — but only if a real-world failure surfaces. Default: don't add the effect.

---

## `scrollControls` behaviour matrix

| `scrollControls` | `_canScrollPrev` | `_canScrollNext` | Prev button | Next button |
|---|---|---|---|---|
| `'auto'` (default) | `true` | `true` | Rendered, enabled | Rendered, enabled |
| `'auto'` | `true` | `false` | Rendered, enabled | Rendered, `aria-hidden="true"`, `pointer-events-none` |
| `'auto'` | `false` | `true` | Rendered, `aria-hidden="true"`, `pointer-events-none` | Rendered, enabled |
| `'auto'` | `false` | `false` | Both `aria-hidden` + `pointer-events-none` (no scroll possible at all) |
| `'always'` | any | any | Always rendered; uses the native `disabled` attribute (and `disabled:` Tailwind classes) when `!_canScroll*` |
| `'never'` | any | any | Both rendered with `aria-hidden="true"` + `pointer-events-none` AND `disabled` |

Implementation note: the template **does not** wrap the chevrons in `@if` based on `scrollControls`. The buttons always render (when orientation is horizontal); their `aria-hidden` + `pointer-events-none` + `disabled` attributes do the work. This keeps the DOM stable across state changes — no element churn when scroll state flips — and lets a screen reader's virtual cursor still ignore them when hidden.

Visually, when `'auto'` and not scrollable, the buttons should also be visually hidden (not just aria-hidden) — extend the template binding:

```html
[class.invisible]="_prevButtonHidden() && scrollControls() === 'auto'"
```

(Use `invisible` rather than `hidden` so the button still occupies space — preventing a layout shift when scroll becomes possible mid-interaction.)

For `scrollControls="always"`, the buttons stay visible but disabled (`disabled:opacity-40` already in the class string handles the visual).

For `scrollControls="never"`, the buttons are hidden entirely:

```html
[class.hidden]="scrollControls() === 'never'"
```

---

## A11y contract

- Both chevron buttons are native `<button type="button">` elements.
- Each carries `aria-label` from `scrollLabels()` — `aria-label="Scroll to previous events"` / `aria-label="Scroll to next events"` by default.
- The inline chevron `<svg>`s carry `aria-hidden="true"` (the accessible name lives on the button itself).
- When a button is "auto-hidden" (no scroll possible in that direction): `aria-hidden="true"` + `pointer-events-none`. This removes the button from AT's accessibility tree and the document tab order entirely — no "scroll to next" announcement when there's nothing to scroll to.
- When `scrollControls="always"` and a direction can't scroll: native `disabled` attribute. Screen readers announce "dimmed" / "unavailable"; the button stays in the tab order but Enter/Space are no-ops.
- The inner scroll viewport (`<div #scrollViewport>`) is **not** focusable — no `tabindex`. Focus belongs to (a) the chevron buttons and (b) any interactive children projected into items. (Note: this is a small UX trade-off — a keyboard-only user with no chevrons visible cannot pan the viewport directly. Mitigation: `scrollControls="always"` gives them persistent chevrons.)
- The timeline host's `role="list"` is unchanged. No new role on the viewport (`<div>` is presentational).
- The chevron icons are `aria-hidden="true"`; the button name comes from `aria-label`.

WCAG AA + AXE: no new failures expected because (a) the canonical focus ring is used, (b) `aria-label` is present on every button, (c) the disabled state uses the native attribute, and (d) hidden buttons use `aria-hidden` and `pointer-events-none`. Run the existing AXE harness against a horizontal-overflow demo case before declaring done.

---

## Vertical orientation: unchanged

Make this explicit:

- No inner scroll wrapper in vertical mode — the `@if (orientation() === 'horizontal')` branch in the template's outer-most flow ensures vertical projects `<ng-content />` directly, identical to today.
- The viewport `viewChild` resolves to `undefined` in vertical mode. `_setupScrollDetection` early-returns. `_canScrollPrev` / `_canScrollNext` stay at their initial `false` value and are unused by any rendered DOM.
- The `scrollControls` input has no visual effect in vertical mode (no chevrons exist). The JSDoc states "Ignored when orientation is 'vertical'."
- No new vertical-orientation tests required.

---

## Spec deltas (`timeline.spec.ts`)

Keep every existing test. Add the following.

**Imports** — add at the top of the file:

```ts
import { DOCUMENT } from '@angular/common';
import { Directionality } from '@angular/cdk/bidi';
import {
  TW_TIMELINE_SCROLL_LABELS,
  provideTwTimelineScrollLabels,
} from './timeline';
import type { TwTimelineScrollLabels } from './timeline';
```

**New test host** for horizontal scrolling:

```ts
@Component({
  imports: [TimelineComponent, TimelineItemComponent],
  template: `
    <tw-timeline
      orientation="horizontal"
      [size]="size()"
      [scrollControls]="scrollControls()"
    >
      @for (id of ids(); track id) {
        <tw-timeline-item color="primary" state="reached" marker="dot">
          <p class="text-xs">Item {{ id }}</p>
        </tw-timeline-item>
      }
    </tw-timeline>
  `,
})
class HorizontalScrollHost {
  readonly size = input<TwSize>('md');
  readonly scrollControls = input<'auto' | 'always' | 'never'>('auto');
  readonly ids = signal<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
}
```

**Edits to existing tests:**

1. The `'renders each align value in vertical orientation'` test is unaffected.
2. The horizontal-orientation test in the "Connectors" `describe` block does NOT assert `flex-1 basis-0` today — search and confirm. If any test asserts `flex-1` against a horizontal item, replace with an assertion on the new `min-w-*` class:

   ```ts
   it('horizontal items use a per-density min-w floor, not flex-1 basis-0', () => {
     const fixture = TestBed.createComponent(BasicTimelineHost);
     fixture.componentRef.setInput('orientation', 'horizontal');
     fixture.componentRef.setInput('size', 'md');
     fixture.detectChanges();
     const first = items(fixture)[0];
     expect(first.className).toContain('min-w-40');
     expect(first.className).not.toContain('flex-1');
     expect(first.className).not.toContain('basis-0');
   });
   ```

**New tests** in a new `describe('Horizontal overflow', () => { ... })` block:

```ts
describe('Horizontal overflow', () => {
  function viewport(fixture: ComponentFixture<unknown>): HTMLDivElement | null {
    return fixture.nativeElement.querySelector('tw-timeline div.overflow-x-auto');
  }
  function chevrons(fixture: ComponentFixture<unknown>): HTMLButtonElement[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('tw-timeline > button'),
    ) as HTMLButtonElement[];
  }

  it('renders an inner scroll wrapper only in horizontal orientation', () => {
    const fixture = TestBed.createComponent(BasicTimelineHost);
    fixture.detectChanges();
    expect(viewport(fixture)).toBeNull();

    fixture.componentRef.setInput('orientation', 'horizontal');
    fixture.detectChanges();
    const vp = viewport(fixture);
    expect(vp).not.toBeNull();
    expect(vp!.className).toContain('overflow-x-auto');
    expect(vp!.className).toContain('tw-scrollbar-none');
    expect(vp!.className).toContain('scroll-smooth');
    expect(vp!.className).toContain('motion-reduce:scroll-auto');
  });

  it('renders prev/next chevron buttons in horizontal orientation', () => {
    const fixture = TestBed.createComponent(HorizontalScrollHost);
    fixture.detectChanges();
    const btns = chevrons(fixture);
    expect(btns.length).toBe(2);
    expect(btns[0].getAttribute('aria-label')).toBe('Scroll to previous events');
    expect(btns[1].getAttribute('aria-label')).toBe('Scroll to next events');
    expect(btns[0].getAttribute('type')).toBe('button');
    expect(btns[1].getAttribute('type')).toBe('button');
  });

  it('does not render chevron buttons in vertical orientation', () => {
    const fixture = TestBed.createComponent(BasicTimelineHost);
    fixture.detectChanges();
    expect(chevrons(fixture).length).toBe(0);
  });

  it('uses labels from TW_TIMELINE_SCROLL_LABELS when provided', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTwTimelineScrollLabels({
          scrollPrevious: 'Vorherige',
          scrollNext: 'Nächste',
        }),
      ],
    });
    const fixture = TestBed.createComponent(HorizontalScrollHost);
    fixture.detectChanges();
    const btns = chevrons(fixture);
    expect(btns[0].getAttribute('aria-label')).toBe('Vorherige');
    expect(btns[1].getAttribute('aria-label')).toBe('Nächste');
  });

  it('falls back to English defaults for missing label keys', () => {
    TestBed.configureTestingModule({
      providers: [provideTwTimelineScrollLabels({ scrollPrevious: 'Voriger' })],
    });
    const fixture = TestBed.createComponent(HorizontalScrollHost);
    fixture.detectChanges();
    const btns = chevrons(fixture);
    expect(btns[0].getAttribute('aria-label')).toBe('Voriger');
    expect(btns[1].getAttribute('aria-label')).toBe('Scroll to next events');
  });

  it('reflects scrollControls="never" by hiding both chevrons', () => {
    const fixture = TestBed.createComponent(HorizontalScrollHost);
    fixture.componentRef.setInput('scrollControls', 'never');
    fixture.detectChanges();
    const btns = chevrons(fixture);
    // The buttons render but carry `class="hidden"` and aria-hidden.
    expect(btns.length).toBe(2);
    for (const b of btns) {
      expect(b.className).toContain('hidden');
      expect(b.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('reflects scrollControls="always" by rendering both chevrons regardless of scroll state', () => {
    const fixture = TestBed.createComponent(HorizontalScrollHost);
    fixture.componentRef.setInput('scrollControls', 'always');
    fixture.detectChanges();
    const btns = chevrons(fixture);
    // Both visible; neither aria-hidden; disabled until scrolled.
    expect(btns.length).toBe(2);
    for (const b of btns) {
      expect(b.getAttribute('aria-hidden')).toBeNull();
      expect(b.className).not.toContain('hidden');
      expect(b.className).not.toContain('invisible');
    }
    // Without scroll possible, both should be disabled.
    expect(btns[0].disabled).toBe(true);
  });

  it('updates _canScrollPrev / _canScrollNext when the viewport scrolls', () => {
    const fixture = TestBed.createComponent(HorizontalScrollHost);
    fixture.detectChanges();
    const vp = viewport(fixture)!;
    const btns = chevrons(fixture);

    // Force a synthetic overflow on the viewport.
    Object.defineProperty(vp, 'scrollWidth', { value: 1000, configurable: true });
    Object.defineProperty(vp, 'clientWidth', { value: 400, configurable: true });
    Object.defineProperty(vp, 'scrollLeft', { value: 0, configurable: true, writable: true });

    vp.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    // At scrollLeft=0 the prev button is auto-hidden; the next button is visible.
    expect(btns[0].getAttribute('aria-hidden')).toBe('true');
    expect(btns[1].getAttribute('aria-hidden')).toBeNull();

    (vp as any).scrollLeft = 300;
    vp.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    // Mid-scroll: both visible.
    expect(btns[0].getAttribute('aria-hidden')).toBeNull();
    expect(btns[1].getAttribute('aria-hidden')).toBeNull();

    (vp as any).scrollLeft = 600; // 600 + 400 = 1000 = scrollWidth → no more next.
    vp.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(btns[0].getAttribute('aria-hidden')).toBeNull();
    expect(btns[1].getAttribute('aria-hidden')).toBe('true');
  });

  it('clicking the next chevron calls scrollBy on the viewport', () => {
    const fixture = TestBed.createComponent(HorizontalScrollHost);
    fixture.detectChanges();
    const vp = viewport(fixture)!;
    Object.defineProperty(vp, 'scrollWidth', { value: 1000, configurable: true });
    Object.defineProperty(vp, 'clientWidth', { value: 400, configurable: true });
    Object.defineProperty(vp, 'scrollLeft', { value: 0, configurable: true, writable: true });
    vp.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    const spy = vi.spyOn(vp, 'scrollBy');
    chevrons(fixture)[1].click();
    // 75% of clientWidth = 300, floored.
    expect(spy).toHaveBeenCalledWith({ left: 300, behavior: 'smooth' });
  });

  it('uses negative scrollBy delta in LTR previous direction', () => {
    const fixture = TestBed.createComponent(HorizontalScrollHost);
    fixture.detectChanges();
    const vp = viewport(fixture)!;
    Object.defineProperty(vp, 'scrollWidth', { value: 1000, configurable: true });
    Object.defineProperty(vp, 'clientWidth', { value: 400, configurable: true });
    Object.defineProperty(vp, 'scrollLeft', { value: 300, configurable: true, writable: true });
    vp.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    const spy = vi.spyOn(vp, 'scrollBy');
    chevrons(fixture)[0].click();
    expect(spy).toHaveBeenCalledWith({ left: -300, behavior: 'smooth' });
  });

  it('respects Directionality: in RTL, scroll directions flip on the same buttons', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Directionality,
          useValue: { value: 'rtl', change: { subscribe: () => ({ unsubscribe: () => {} }) } },
        },
      ],
    });
    const fixture = TestBed.createComponent(HorizontalScrollHost);
    fixture.detectChanges();
    const vp = viewport(fixture)!;
    Object.defineProperty(vp, 'scrollWidth', { value: 1000, configurable: true });
    Object.defineProperty(vp, 'clientWidth', { value: 400, configurable: true });
    Object.defineProperty(vp, 'scrollLeft', { value: 300, configurable: true, writable: true });
    vp.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    const spy = vi.spyOn(vp, 'scrollBy');
    // The first button (DOM order) is still the "previous" semantic, but in RTL
    // its scroll delta is positive (toward larger scrollLeft).
    chevrons(fixture)[0].click();
    expect(spy).toHaveBeenCalledWith({ left: 300, behavior: 'smooth' });
  });

  it('chevron buttons carry the canonical focus-ring classes', () => {
    const fixture = TestBed.createComponent(HorizontalScrollHost);
    fixture.detectChanges();
    for (const b of chevrons(fixture)) {
      expect(b.className).toContain('focus-visible:outline-2');
      expect(b.className).toContain('focus-visible:outline-offset-2');
      expect(b.className).toContain('focus-visible:outline-primary-500');
    }
  });
});
```

Notes for the implementer running the spec:

- The synthetic `Object.defineProperty(vp, 'scrollWidth', ...)` pattern is how the tabs spec mocks scroll dimensions in JSDOM, where layout doesn't compute real values. If the existing repo uses a different idiom (e.g., a `setScrollDimensions(el, { scrollWidth, clientWidth, scrollLeft })` helper), prefer that for consistency.
- The `Directionality` mock in the RTL test is minimal — `value: 'rtl'` and a no-op `change.subscribe`. If a richer test helper exists in the repo for CDK Directionality (search `provide: Directionality` across `*.spec.ts`), use it.
- No `fakeAsync` / no `tick` — every test runs synchronously via `dispatchEvent` + `detectChanges`. The smooth-scroll behaviour is not actually exercised in JSDOM; we only assert the `scrollBy` call was made with the right arguments.

---

## Files to modify / create

**MODIFY:**

- `projects/ngx-tw/timeline/timeline.ts` —
  - Add the imports (`afterNextRender`, `DestroyRef`, `ElementRef`, `viewChild`, `InjectionToken`, `makeEnvironmentProviders`, `EnvironmentProviders`, `Directionality`).
  - Add the `TimelineScrollControls` type export.
  - Add the `TwTimelineScrollLabels` interface, `DEFAULT_TW_TIMELINE_SCROLL_LABELS` const, `TW_TIMELINE_SCROLL_LABELS` token, and `provideTwTimelineScrollLabels` helper at the top of the file (after the existing type exports).
  - Add the `CHEVRON_CLASSES` const after the existing static lookup maps.
  - Add the `scrollControls` input to `TimelineComponent`.
  - Inject `Directionality` (optional) and `DestroyRef` on the container.
  - Add the `_viewportRef`, `_cdkDir`, `_isRtl`, `_canScrollPrev`, `_canScrollNext`, `_prevButtonHidden`, `_nextButtonHidden`, `scrollLabels` signals/computeds.
  - Add `_setupScrollDetection`, `_updateScrollState`, `_onScroll`, `_scrollPrev`, `_scrollNext`, `_pageScrollAmount` methods.
  - Replace the container template (single `<ng-content />`) with the conditional structure described in "DOM structure delta".
  - Update the `tv()` config: drop `overflow-x-auto` from horizontal `root` (move to inner wrapper class string); add `relative` to horizontal `root`; remove `flex-1 basis-0` from horizontal `item`; add the horizontal-orientation × size compound-variant block for `min-w-*`.

- `projects/ngx-tw/timeline/index.ts` — add to the exports:

  ```ts
  export {
    TW_TIMELINE_SCROLL_LABELS,
    DEFAULT_TW_TIMELINE_SCROLL_LABELS,
    provideTwTimelineScrollLabels,
  } from './timeline';
  export type { TwTimelineScrollLabels, TimelineScrollControls } from './timeline';
  ```

- `projects/ngx-tw/timeline/timeline.spec.ts` — add the imports, the new `HorizontalScrollHost`, the new `describe('Horizontal overflow', ...)` block, and the edit to any test that asserts `flex-1` / `basis-0` on horizontal items (see "Edits to existing tests" above — search for the strings and replace).

**NO CHANGE NEEDED:**

- `projects/ngx-tw/theme/_base.css` — `.tw-scrollbar-none` already exists (lines 19-22). No keyframes to add.
- `projects/ngx-tw/src/public-api.ts` — already re-exports `ngx-tw/timeline` via the entry-point system.
- `projects/ngx-tw/tsconfig.lib.json`, `tsconfig.spec.json`, `angular.json` — already include the timeline directory.
- The demo pages — existing demos continue to work; the visual changes appear automatically. Optionally extend `projects/demo/src/app/routes/timeline/examples/timeline-examples.ts` with a "horizontal overflow" example containing 12+ items inside a 600px-wide container, and a "scrollControls='always'" example. This is OPTIONAL polish, not part of the contract.

---

## Risk areas (call out explicitly)

1. **`ResizeObserver` availability.** Standard in all evergreen browsers since 2020. Guard with `typeof ResizeObserver !== 'undefined'` (the tabs.ts pattern at line 625). This avoids breakage under SSR runtimes that don't provide the global. When the guard fails, the buttons stay in their initial-disabled state (acceptable degradation — server-rendered HTML has no scroll position anyway).

2. **`scroll-smooth` + reduced-motion.** Use the Tailwind utility `motion-reduce:scroll-auto` on the inner wrapper — NOT a JS branch. This guarantees that consumers' `prefers-reduced-motion: reduce` preference always wins, even if the system preference changes mid-session.

3. **Sub-pixel scroll values on retina.** Both `_canScrollPrev` and `_canScrollNext` use a 1-px threshold (`> 1`, `< scrollWidth - 1`). Without this guard, smooth-scrolled landings at `scrollLeft = 0.5` flicker the button between enabled/disabled.

4. **Initial-measurement timing flash.** `_canScrollPrev` and `_canScrollNext` default to `false`. In `scrollControls="auto"` this means both buttons start auto-hidden — the user sees "no buttons" for the first frame, then the next/prev appears once `afterNextRender` runs `_setupScrollDetection`. This is INTENTIONAL — better than the inverse (buttons appearing live and immediately disabling, which reads as a glitch). In `scrollControls="always"` the buttons render visible-but-disabled until the first measurement, which is the correct final state for non-scrollable content anyway.

5. **`viewChild` resolution.** `viewChild<ElementRef<HTMLDivElement>>('scrollViewport')` is undefined until the conditional `@if (orientation() === 'horizontal')` block materialises the wrapper. `_setupScrollDetection` reads the viewport inside `afterNextRender` — by then it's resolved. If orientation flips at runtime (horizontal → vertical → horizontal), the existing `_resizeObserver` is disconnected on the first horizontal teardown via `_destroyRef.onDestroy` — but that only fires on component destroy, not on orientation flip. **MAY** require a refinement: re-setup detection when `orientation()` flips back to horizontal. Implement via `effect(() => { this.orientation(); queueMicrotask(() => this._setupScrollDetection()); })` ONLY if a real-world failure surfaces. Default: don't add. Most consumers don't toggle orientation at runtime.

6. **RTL `scrollLeft` semantics.** Modern evergreen browsers normalised `scrollLeft` in RTL: positive `scrollLeft` always means scrolled-toward-the-end (visually leftward in RTL). The threshold comparisons (`> 1`, `< scrollWidth - clientWidth - 1`) work identically in LTR and RTL. Only the `scrollBy` deltas need a sign flip in `_scrollPrev` / `_scrollNext` to translate "visual previous" / "visual next" into the right `scrollLeft` delta — that's the `direction = this._isRtl() ? 1 : -1` line.

---

## Constraints (recap of the parts that bind this addendum)

- Angular v21, signals, `OnPush`, `host` object, no `@HostBinding` / `@HostListener`, no `@angular/animations`.
- Tailwind v4 utilities only, no component CSS files. Semantic tokens — surface-raised, border, fg, fg-muted, primary-500 for the focus ring outline.
- The 5th container input is justified by the new "overflow-control axis on layout primitives" exception. The JSDoc must quote the exception paragraph in full so the rationale lives in source.
- Vitest, no `fakeAsync`, no `tick`. Use `dispatchEvent('scroll')` + `fixture.detectChanges()` for scroll-event tests; `vi.spyOn(el, 'scrollBy')` for click tests.
- `inject(Directionality, { optional: true })` — mirror the split-pane wiring (`split.ts` line 155).
- Icon sub-scales: `size-8` for the button (square interactive target md), `size-4` for the chevron glyph (glyph icon — body / small button).
- Focus ring: canonical `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`.

---

## Acceptance criteria

The addendum is "done" when:

1. The container input count is 5 (`orientation`, `align`, `size`, `lineStyle`, `scrollControls`). The JSDoc on `scrollControls` quotes the new input-cap exception in full.
2. The `TW_TIMELINE_SCROLL_LABELS` token, `TwTimelineScrollLabels` interface, `DEFAULT_TW_TIMELINE_SCROLL_LABELS` const, and `provideTwTimelineScrollLabels` helper are exported from `index.ts`.
3. In horizontal orientation, horizontal items use a per-density `min-w-*` (`min-w-32` … `min-w-48`) and do NOT carry `flex-1` or `basis-0`.
4. In horizontal orientation, an inner `<div>` carries `overflow-x-auto tw-scrollbar-none scroll-smooth motion-reduce:scroll-auto`. The container host carries `relative` (so the chevron buttons' `absolute left-0` / `right-0` anchors work).
5. Two `<button type="button">` chevrons render in horizontal orientation; their accessible name comes from `scrollLabels()`; they use the canonical focus-ring classes; they carry `size-8 rounded-full bg-surface-raised border border-border shadow-sm`.
6. `_canScrollPrev` / `_canScrollNext` reflect `scrollLeft > 1` / `scrollLeft + clientWidth < scrollWidth - 1` and update on `(scroll)` events and `ResizeObserver` entries.
7. `scrollControls="auto"` (default) auto-hides each chevron when scroll is impossible in that direction; `"always"` keeps both rendered (disabled at edges via native `disabled`); `"never"` hides both entirely.
8. Clicking a chevron calls `scrollBy({ left: ±clientWidth * 0.75, behavior: 'smooth' })` with the sign flipped under RTL.
9. RTL handling: `inject(Directionality, { optional: true })` is wired, the `_isRtl` signal drives the button positioning (`left-0` / `right-0` swap) and the scroll-delta sign.
10. Vertical orientation is unchanged — no inner wrapper, no chevrons, no scroll detection, no `scrollControls` effect.
11. All existing tests in `timeline.spec.ts` still pass. New `describe('Horizontal overflow', ...)` block covers the deltas above.
12. AXE: zero violations on a horizontal-overflow demo case (10+ items in a constrained-width container, all `scrollControls` values exercised).

---

## Open questions (surface to maintainer before implementation)

1. **Chevron position relative to marker row.** This addendum places the chevrons at `top-1/2 -translate-y-1/2` (vertical centre of the host's flex extent). For the canonical horizontal layout — body above the marker row, both with comparable height — this lands roughly on the marker row. If a consumer ships an asymmetric layout (e.g., a long body block above and only the marker row below, no body below), the chevron may visually float above the marker. The pixel-perfect alternative is `position: sticky` on the buttons against the marker row, which requires extra wiring. **Recommend** shipping `top-1/2` first and revisiting if a real consumer reports misalignment.

2. **`scrollControls="never"` semantic.** The framing said `"never"` "hides them entirely (consumer manages overflow externally — e.g., wraps the timeline in their own scroll container with custom controls)." With `"never"`, the inner scroll wrapper IS still rendered — only the chevrons are hidden. If the consumer wants to bypass the inner wrapper entirely, they need an additional input (`disableInnerScroll: boolean`?). This addendum does NOT support that path — `"never"` only hides the chevrons. **Confirm** this is what was intended; if not, the design needs a sixth input or a different policy value.

3. **Single-item timeline edge case.** With one item, the prev button is permanently hidden (no scroll possible). The trailing-spacer pattern from the existing implementation already centres the lone item, but the chevrons would visually float at the edges of a one-item timeline if `scrollControls="always"` is set. **Recommend** treating this as a consumer error — a one-item timeline doesn't need overflow chevrons at all. Document but don't special-case.

4. **CLAUDE.md update for the new exception.** This addendum names a new input-cap exception ("Overflow-control axis on layout primitives") that today exists only in this prompt's text. The implementer should either (a) update CLAUDE.md in the same PR with the new exception row, or (b) ship the JSDoc-quoted version on `scrollControls` and defer the CLAUDE.md update to a follow-up. **Recommend** (a) — keeps the canon honest.
