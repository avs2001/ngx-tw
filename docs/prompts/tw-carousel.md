# Prompt: Build `tw-carousel` for ngx-tw

## Context

Before writing code, read these files in full. The requirements doc is normative — when this prompt and the requirements doc disagree, the requirements doc wins, and you must surface the conflict in a code comment rather than silently picking.

- `.claude/CLAUDE.md` — conventions, semantic tokens, surface/fg/border tokens, focus-ring policy, visual design system (typography, icon sub-scales, transitions, opacity), animation rules (no `@angular/animations`; `animate.enter` references named classes in the theme CSS), input-cap exceptions. Pay particular attention to the "structural-layout primitive" exception — the carousel qualifies and the prompt must say so (canonical precedent: `split`).
- `docs/requirements/carousel.requirements.md` — **the source of truth**. Inputs, defaults, slot names, behavior matrix, autoplay state machine, ARIA wiring, scroll-snap rules, drag math, RTL handling, edge cases, and acceptance criteria all come from this document. Do not redesign the API.
- `projects/ngx-tw/tabs/tabs.ts` — closest behavioral peer. Copy the `viewChild` viewport + `ResizeObserver` + scroll-state signals pattern; the `tv()` slot composition; the orientation-flipping compound variants; the `setupScrollDetection` cleanup wiring via `DestroyRef`.
- `projects/ngx-tw/paginator/paginator.ts` — closest peer for prev/next semantics, page-count math, template-variable label interpolation (`{page}`, `{total}`), `formatLabel()` helper, dev-mode warning gating via `isDevMode()` + `afterNextRender`. Note: the carousel does **NOT** use `LiveAnnouncer` — its live region is the `aria-live="polite"` attribute toggled on the viewport itself per requirements § 5.5.
- `projects/ngx-tw/stepper/stepper.ts` — canonical precedent for the **static exhaustive `Record<TwColor, string>` lookup maps** (`INDICATOR_ACTIVE`, `INDICATOR_COMPLETED`, `CONNECTOR_REACHED`). Tailwind v4 cannot resolve interpolated class names like `` `bg-${color}-500` `` at build time, so color × state combinations must be enumerated. Also study `contentChildren()` reactivity and `inject(ParentComponent)` access for children.
- `projects/ngx-tw/avatar/avatar.ts` — canonical `inject(ParentComponent)` pattern for child→parent context propagation. The carousel's slide injects the carousel directly to read `activeIndex`, the slide's `index`, total slide count, and visibility state — analogous to how `tw-avatar` reads `AVATAR_GROUP_SIZE` from its parent group. (Carousel uses direct `inject(CarouselComponent)` rather than an injection token — see Internal architecture.)
- `projects/ngx-tw/split/split.ts` — canonical structural-layout-primitive precedent. Cite this when documenting why the carousel exceeds the 5–6 input cap. Also study its CDK `Directionality` usage if you need RTL detection beyond `getComputedStyle(viewport).direction`.
- `projects/ngx-tw/timeline/timeline.ts` — parent/child component pair structure with slot directives, `tv()` config with slot composition, static lookup maps, and `inject(ParentComponent)` from the child. The carousel's projection model is different (slides are siblings of indicators/prev/next inside the carousel host) but the parent/child injection idiom is identical.
- `projects/ngx-tw/core/types.ts` — `TwColor`, `TwSize`, `TwOrientation`. The carousel reuses all three. Do NOT add new shared types.
- `projects/ngx-tw/theme/_base.css` — animation keyframes live here, NOT in `theme/default.css`. The requirements doc references "`theme/_base.css`" (correct) and in some passages "the theme CSS"; treat `_base.css` as authoritative. **Note**: this file already defines `.tw-scrollbar-none` (lines 20–22) doing exactly what the requirements doc asks for under the name `.tw-scrollbar-hidden`. See Pitfalls #1 for how to handle this duplicate-name conflict.

CDK modules required: none of CDK's overlay/portal/dialog primitives apply. CDK `Directionality` from `@angular/cdk/bidi` is OPTIONAL — `getComputedStyle(viewport).direction` is sufficient per requirements § 7.3. Do NOT use `CdkScrollable` / `ScrollDispatcher` — the carousel owns its own scroll viewport (requirements § 1.3).

---

## What to build

A **slide / swipe gallery** primitive built on **native CSS scroll-snap**. The container `<tw-carousel>` owns geometry (axis, slidesPerView, gap, snap alignment), behavior (loop, autoplay, drag, keyboard), and the active index (a two-way `model()`). `<tw-carousel-slide>` children project arbitrary content and report visibility back to the container via a shared `IntersectionObserver`. The browser handles smooth scrolling, snap targets, and native touch momentum; the component augments this with programmatic navigation (prev/next directives, indicators, autoplay, keyboard), pointer drag for mouse, loop-jump masking, and an integrated WCAG 2.2.2 pause control. The carousel is **declarative and content-projected** — consumers do not write a track wrapper or position-management code.

The component pair (plus an indicators companion and two directives) sits between a static figure list (no behavior) and a fully-bespoke drag-physics carousel like Embla or Material's carousel (heavy, opinionated, not Tailwind-native). It deliberately does **not** implement: 3D / coverflow transitions; virtualization; per-slide custom easing; gestures beyond one-axis drag; multi-row layouts.

Scope decisions already locked by the requirements doc (do not revisit):

- `CarouselComponent` exceeds the 5–6 input cap (17 inputs). Codified exception: **structural-layout primitive** — precedent `SplitComponent`. Document the exception with an inline comment at the top of `carousel.ts` per the `split` convention.
- Prev/Next are **directives** (`[twCarouselPrev]`, `[twCarouselNext]`) applied to consumer-provided focusable elements — not pre-styled component buttons.
- Indicators are an **element** (`<tw-carousel-indicators>`) because they have internal DOM the consumer should not have to author. Indicators carry `role="group"`, **not** `role="tablist"`, and the buttons inside are plain `<button>` elements (no `role="tab"`).
- The autoplay pause control is **rendered by the component**, not projectable. WCAG 2.2.2 compliance depends on its presence; making it consumer-controlled would risk non-compliance.
- Slides are always in the DOM (no virtualization). All N slides mount at construction.
- The library does NOT use `LiveAnnouncer`. The live region is `aria-live="polite"` on the viewport, toggled to `"off"` when `autoplay === true`.
- Loop implementation MUST be **jump-on-arrival**, not cloned-slide. A class-toggle opacity flash masks the instant scroll position reset.
- Pointer drag activates for mouse pointers only (`pointerType !== 'touch'`); touch uses native scroll.
- `slidesPerView` is a `number` and MAY be fractional (e.g. `1.2` for "peek"). Responsive breakpoint-keyed `slidesPerView` is v1.5.
- `aria-roledescription="carousel"` on the host; `aria-roledescription="slide"` on each slide. Per W3C APG carousel pattern.

---

## File layout

Create under `projects/ngx-tw/carousel/`:

| File | Role |
|---|---|
| `carousel.ts` | `CarouselComponent`, `CarouselSlideComponent`, `CarouselIndicatorsComponent`, `CarouselPrevDirective`, `CarouselNextDirective`, slot directives if any, `tv()` config, static color × state lookup maps, `TwCarouselLabels` interface, `DEFAULT_CAROUSEL_LABELS` constant, event/payload types. |
| `carousel.spec.ts` | Vitest suite — see Test plan. No `fakeAsync` / `tick`. Use `vi.useFakeTimers()` / `vi.advanceTimersByTime()` for autoplay; `async/await` + `fixture.whenStable()` for change detection. |
| `index.ts` | Re-exports the three components, the two directives, and all public types/constants. |
| `ng-package.json` | `{ "lib": { "entryFile": "index.ts" } }`. |

Modify (matching the timeline/breadcrumbs/sheet wiring pattern):

- `projects/ngx-tw/src/public-api.ts` — append `export * from 'ngx-tw/carousel';` (currently the file ends with `timeline`; group with the other layout primitives or at the end — keep the existing rough grouping consistent).
- `projects/ngx-tw/tsconfig.lib.json` — add `"carousel/**/*.ts"` to the alphabetised `include` array (between `calendar` and `card`).
- `projects/ngx-tw/tsconfig.spec.json` — add `"carousel/**/*.spec.ts"` to `include`.
- `angular.json` — add `"../carousel/**/*.spec.ts"` to `projects.ngx-tw.architect.test.options.include` (the file currently lists these around lines 113–161; insert between existing entries).
- `projects/ngx-tw/theme/_base.css` — add the `tw-carousel-loop-jump` keyframe + class alongside the existing animation blocks (around the timeline / stepper section). Add the reduced-motion override to the existing `@media (prefers-reduced-motion: reduce)` block at the bottom of the file (this block already overrides `timeline-item-enter` etc.). See "CSS additions" below for verbatim CSS and Pitfall #1 for the `.tw-scrollbar-hidden` vs `.tw-scrollbar-none` question.

Do **not** create `theme/default.css`. The requirements doc references that filename as a generic alias; in this repo the file is `_base.css` (imported from `theme/index.css`).

---

## Public API

### `CarouselComponent` — selector `tw-carousel`

Class name: `CarouselComponent` (no `Tw` prefix). `ChangeDetection.OnPush`. Inline template OK; extract to `carousel.html` if the template exceeds ~50 lines (it will — extract it).

**Inputs (17 — cap exception: structural-layout primitive; precedent `SplitComponent`):**

| Name | Type | Default | JSDoc (paste verbatim) |
|---|---|---|---|
| `orientation` | `TwOrientation` | `'horizontal'` | `Axis along which slides flow. 'horizontal' is the canonical case; 'vertical' is supported for tickers and feature lists. Defaults to 'horizontal'.` |
| `slidesPerView` | `number` | `1` | `Number of slides visible in the viewport. May be fractional (e.g. 1.2 for a "peek" of the next slide). Values below 0.5 are clamped to 0.5; values above the slide count are clamped to the slide count. Defaults to 1.` |
| `slidesToScroll` | `number` | `1` | `Number of slides advanced per navigation action (button click, keyboard, indicator). Non-integer values are floored. Defaults to 1.` |
| `gap` | `TwSize` | `'md'` | `Inter-slide gap on the scroll axis. Mapped via the canonical spacing scale. Defaults to 'md'.` |
| `loop` | `boolean` | `false` | `When true, navigation wraps around at the boundaries. Prev at slide 0 jumps to the last page; Next at the last page jumps to slide 0. Implementation is jumpless via a brief opacity mask. Defaults to false.` |
| `autoplay` | `boolean` | `false` | `When true, the carousel auto-advances by slidesToScroll every autoplayInterval ms. Pauses on hover, focus-in, drag, document hidden, or user interaction. Defaults to false.` |
| `autoplayInterval` | `number` | `5000` | `Milliseconds between autoplay advances. Values below 1000 are clamped to 1000 per WCAG 2.2.2. Defaults to 5000.` |
| `pauseOnHover` | `boolean` | `true` | `Pauses autoplay while the pointer is over the container. Defaults to true because losing autoplay on hover is the expected gallery behavior — opt-out is the special case. Inline-comment justification required on the input declaration.` |
| `pauseOnFocusIn` | `boolean` | `true` | `Pauses autoplay while keyboard focus is anywhere inside the container. Defaults to true for WCAG 2.2.2 compliance. Inline-comment justification required.` |
| `draggable` | `boolean` | `true` | `When true, the user may pan the slides via mouse pointer drag; touch is left to native scroll. Pointer events are intercepted only when the drag exceeds a 6-pixel threshold so clicks inside slides still work. Defaults to true because galleries are draggable by user expectation; opt-out is the special case. Inline-comment justification required.` |
| `keyboard` | `boolean` | `true` | `When true, the viewport responds to Arrow / Home / End / PageUp / PageDown when focus is inside it. Defaults to true for keyboard accessibility. Inline-comment justification required.` |
| `snapAlign` | `'start' \| 'center' \| 'end'` | `'start'` | `CSS scroll-snap-align value applied to each slide. 'start' is the standard gallery behavior; 'center' is used for peek/preview layouts. Defaults to 'start'.` |
| `activeIndex` | `model<number>` | `0` | `Two-way bound 0-based index of the first visible slide in the current page. Setting from the parent scrolls the viewport smoothly to align that slide; reading reflects user-driven scroll position after scrollend. Defaults to 0.` |
| `ariaLabel` | `string \| null` | `null` | `Accessible name for the carousel region. If both this and ariaLabelledBy are null, a one-time dev-mode console.warn is logged (production builds never log). Defaults to null.` |
| `ariaLabelledBy` | `string \| null` | `null` | `ID of an element labeling the carousel. Either ariaLabel or ariaLabelledBy SHOULD be provided. Defaults to null.` |
| `labels` | `Partial<TwCarouselLabels>` | `{}` | `Localizable strings for prev/next/pause/resume/indicator/slide-of templates. Unset keys fall back to the English defaults in DEFAULT_CAROUSEL_LABELS. Defaults to {}.` |

**Outputs:**

| Name | Type | When it fires |
|---|---|---|
| `activeIndexChange` | `output<number>` (synthesised by `model()`) | After user-driven scroll settles (`scrollend` or debounced fallback), or after a programmatic advance settles. Payload is the new 0-based active slide index. |
| `slideChange` | `output<TwCarouselSlideChangeEvent>` | Fires when the active index changes for any reason. Payload includes `from`, `to`, and `trigger` (`'pointer' \| 'keyboard' \| 'autoplay' \| 'indicator' \| 'button' \| 'programmatic'`). Does NOT fire when the user begins a drag and releases without crossing the snap threshold. |
| `autoplayPaused` | `output<TwCarouselAutoplayReason>` | Fires when autoplay pauses. Payload is `'hover' \| 'focus' \| 'interaction' \| 'visibility' \| 'manual'`. |
| `autoplayResumed` | `output<void>` | Fires when autoplay resumes after a pause. |

JSDoc verbatim for outputs:

```ts
/** Fires after the active slide index changes for any reason. Use [(activeIndex)] for two-way binding; subscribe to slideChange for the rich payload with trigger source. */
readonly activeIndexChange = …; // synthesised by model()

/** Fires when the active index changes. Payload identifies the previous and new index plus the trigger source ('pointer' | 'keyboard' | 'autoplay' | 'indicator' | 'button' | 'programmatic'). */
readonly slideChange = output<TwCarouselSlideChangeEvent>();

/** Fires when autoplay transitions from running to paused. Payload is the pause reason ('hover' | 'focus' | 'interaction' | 'visibility' | 'manual'). */
readonly autoplayPaused = output<TwCarouselAutoplayReason>();

/** Fires when autoplay transitions from paused to running. */
readonly autoplayResumed = output<void>();
```

**Imperative API (exposed via component instance):**

| Member | Type | JSDoc |
|---|---|---|
| `next()` | `void` | `/** Advance by slidesToScroll. Wraps if loop is true; no-op at the last page when loop is false. Emits slideChange with trigger 'programmatic' when called externally. */` |
| `prev()` | `void` | `/** Retreat by slidesToScroll. Wraps if loop is true; no-op at slide 0 when loop is false. Emits slideChange with trigger 'programmatic' when called externally. */` |
| `scrollTo(index, opts?)` | `void` | `/** Jump to a specific 0-based slide index. opts.behavior is 'smooth' \| 'instant'; default is 'smooth' unless prefers-reduced-motion: reduce. */` |
| `pause(reason?)` | `void` | `/** Pause autoplay. reason defaults to 'manual'. */` |
| `resume()` | `void` | `/** Resume autoplay if autoplay input is true. */` |
| `pageCount` | `Signal<number>` (readonly) | `/** Number of distinct pages (groups of slidesToScroll slides) the carousel can land on. Reactive. */` |
| `activePage` | `Signal<number>` (readonly) | `/** 0-based page index that contains activeIndex. Reactive. Used by tw-carousel-indicators to render one dot per page. */` |

`pageCount` and `activePage` MUST be exposed as `readonly` public `Signal<number>` (typed via `Signal<number>`, declared via `computed()`). They are public signals, not methods — consumers may read them inside their own `computed()` calls.

**Host bindings (via `host` object):**

- `role`: `'region'` (static).
- `[attr.aria-roledescription]`: `'carousel'` (static).
- `[attr.aria-label]`: bound to `ariaLabel()` (or omit when `null`).
- `[attr.aria-labelledby]`: bound to `ariaLabelledBy()` (or omit when `null`).
- `[class]`: bound to `rootClasses` (the `tv()` `root` slot).
- Do **NOT** set `tabindex` on the host. Focus belongs to the inner viewport.

### `CarouselSlideComponent` — selector `tw-carousel-slide`

Class name: `CarouselSlideComponent`. `ChangeDetection.OnPush`.

**Inputs (2):**

| Name | Type | Default | JSDoc |
|---|---|---|---|
| `label` | `string \| null` | `null` | `Optional human-readable label for the slide (e.g., the title of the image). When provided, used in the slide's aria-label as "{index + 1} of {total}: {label}". When null, uses "{index + 1} of {total}" only. Defaults to null.` |
| `disabled` | `boolean` | `false` | `When true, the slide is rendered but skipped by Prev/Next, Indicators, keyboard nav, and autoplay. Programmatic scrollTo still lands on it. Visually muted (opacity-50, cursor-not-allowed). Defaults to false.` |

**Outputs:** none.

**Slots:** default `<ng-content />` only. Free-form slide body (image, card, paragraph, custom component).

**Host bindings:**

- `role`: `'group'` (static).
- `[attr.aria-roledescription]`: `'slide'` (static).
- `[attr.aria-label]`: bound to a `accessibleName` computed (see § Internal architecture).
- `[attr.aria-hidden]`: `'true'` when the slide is not currently visible per the IntersectionObserver visibility map; `null` when visible.
- `[attr.inert]`: `''` when the slide is `aria-hidden`; `null` when visible. (`inert` is a boolean HTML attribute — present-or-absent, no value semantics.)
- `[class]`: bound to `slideClasses` (the `tv()` `slide` slot, plus `opacity-50 cursor-not-allowed` when `disabled()`).
- Do **NOT** set `tabindex`. Focusable descendants inside slides retain normal tab order when visible; `inert` removes them when hidden.

### `CarouselIndicatorsComponent` — selector `tw-carousel-indicators`

Class name: `CarouselIndicatorsComponent`. `ChangeDetection.OnPush`. Inline template.

**Inputs (4):**

| Name | Type | Default | JSDoc |
|---|---|---|---|
| `variant` | `'dots' \| 'lines' \| 'numbers'` | `'dots'` | `Visual style. 'dots' = small filled circles; 'lines' = short horizontal/vertical bars; 'numbers' = text 1, 2, 3 inside small pills. Defaults to 'dots'.` |
| `color` | `TwColor` | `'primary'` | `Color of the active indicator. Inactive indicators use neutral fg-muted tokens. Defaults to 'primary'.` |
| `size` | `TwSize` | `'md'` | `Indicator size (diameter/length and gap between indicators). Defaults to 'md'.` |
| `position` | `'overlay' \| 'below'` | `'below'` | `When 'overlay', the indicators float absolutely-positioned over the carousel with a bg-black/40 capsule backdrop for contrast. When 'below', they sit below the carousel as a normal block. Defaults to 'below'.` |

**Outputs:** none.

**Host bindings:**

- `role`: `'group'` (static — NOT `tablist`).
- `[attr.aria-label]`: optional; default to omitting it. Parent `<tw-carousel>` already has `aria-label` / `aria-labelledby` covering the region semantics.
- `[class]`: bound to the indicators-root `tv()` slot.

The component injects `inject(CarouselComponent)` to read `pageCount()` and `activePage()` and to call `scrollTo(pageStartIndex)`. Each button is a native `<button>` with:

- `aria-label` = `labels.indicator` interpolated with the 1-based page number.
- `aria-current="true"` on the active page (omit attribute otherwise).
- Click handler calls `carousel.scrollTo(pageStartIndex)` and the parent emits `slideChange` with `trigger: 'indicator'` (see "last interaction source" in Internal architecture).
- Canonical focus ring (`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`).

### `CarouselPrevDirective` — `[twCarouselPrev]` & `CarouselNextDirective` — `[twCarouselNext]`

Class names: `CarouselPrevDirective`, `CarouselNextDirective`. `ChangeDetection.OnPush` (directives don't have CD but include for consistency). Apply to any focusable element.

**Inputs:** none.

**Outputs:** none. (The host's native `click` event still fires; the directive's listener runs in addition.)

**Behavior (recap of requirements § 2.5):**

1. Inject `CarouselComponent` via `inject(CarouselComponent)`. **No `{ optional: true }`** — a directive used outside `<tw-carousel>` is a programmer error; let the DI failure throw.
2. Listen to `click` via `host: { '(click)': '_onClick($event)' }`. On click, set the carousel's "last interaction source" to `'button'` and call `carousel.prev()` / `carousel.next()`. The resulting `slideChange` emits with `trigger: 'button'`.
3. `host: { '[attr.aria-label]': '_ariaLabel()' }` — read the resolved label from the carousel. If the host already carries `aria-label` or `aria-labelledby`, the directive must NOT override; detect at construction via `ElementRef` and skip the binding. Implementation: inject `ElementRef`, check `element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby')` in the constructor, store as a boolean, and bind `[attr.aria-label]` to `_overrideAriaLabel ? null : labels.previous` (etc.).
4. `host: { '[attr.disabled]': '_isDisabled() ? "" : null', '[attr.aria-disabled]': '_isDisabled() ? "true" : null', '[attr.tabindex]': '_isDisabled() && !_isButton() ? "-1" : null' }`. `_isDisabled` is a `computed()` that reads `!carousel.loop() && carousel.isAtStart()` (for prev) or `!carousel.loop() && carousel.isAtEnd()` (for next). `_isButton` checks `element.tagName === 'BUTTON'` (in constructor; static).
5. Click handler is a no-op when `_isDisabled()` is true.

The carousel must expose `isAtStart` and `isAtEnd` as readonly public `Signal<boolean>` for the directives to read.

---

## Internal architecture

### Viewport DOM structure

The carousel renders the following internal structure. Consumers do not write any of this.

```html
<!-- host: <tw-carousel role="region" aria-roledescription="carousel" aria-label="..."> -->
<div
  data-tw-carousel-viewport
  tabindex="0"
  [class]="viewportClasses()"
  [attr.aria-live]="autoplay() ? 'off' : 'polite'"
  (pointerdown)="_onPointerDown($event)"
  (keydown)="_onKeydown($event)"
  #viewport
>
  <ng-content select="tw-carousel-slide" />
</div>

<!-- Component-rendered pause control — only when autoplay() is true. -->
@if (autoplay()) {
  <button
    type="button"
    [attr.aria-label]="_pauseControlAriaLabel()"
    [class]="pauseControlClasses()"
    (click)="_togglePauseControl()"
  >
    <tw-icon [name]="_isManuallyPaused() ? 'play' : 'pause'" size="xs" />
  </button>
}

<!-- Prev/Next directives + indicators are projected as siblings of the viewport. -->
<ng-content select="[twCarouselPrev], [twCarouselNext], tw-carousel-indicators" />
```

Critical: **prev/next directive hosts and `<tw-carousel-indicators>` must be siblings of the viewport, not children.** Children of the viewport scroll with the slides. The two `<ng-content>` selects above achieve this — the first projects only slides into the scrolling viewport; the second projects everything else outside the viewport. Slides will fail to project if consumers use a non-`tw-carousel-slide` element selector.

The viewport applies (via the `viewport` slot of `tv()`):

- `overflow-x-auto` (horizontal) or `overflow-y-auto` (vertical).
- `scroll-snap-type: x mandatory` (horizontal) or `scroll-snap-type: y mandatory` (vertical) — applied via Tailwind utilities `snap-x snap-mandatory` / `snap-y snap-mandatory`.
- `scroll-smooth motion-reduce:scroll-auto`.
- The scrollbar-hiding utility (see Pitfall #1 for `tw-scrollbar-hidden` vs reusing existing `tw-scrollbar-none`).
- Canonical focus ring on `focus-visible`.

Each slide carries:

- `scroll-snap-align: {snapAlign}` — applied via Tailwind `snap-start` / `snap-center` / `snap-end` from a static map keyed by `snapAlign()`.
- `scroll-snap-stop: always` — applied via Tailwind `snap-always`.
- `flex: 0 0 var(--tw-carousel-slide-basis)` where the CSS custom property is set on the viewport from a `computed()` that resolves `calc((100% - ((slidesPerView - 1) * gap-px)) / slidesPerView)` for horizontal and analogous for vertical. The gap-px value must be resolved from a static `gap → px` table (e.g. `xs → 8`, `sm → 12`, `md → 16`, `lg → 24`, `xl → 32`) so the basis calc matches the rendered gap.
- `min-w-0` for flex truncation.
- Disabled visuals: `opacity-50 cursor-not-allowed` when `disabled()`.

### Slide visibility — `IntersectionObserver`

A **single** `IntersectionObserver` instance per carousel observes all slides with `threshold: 0.5` and `root: viewportElement`. On each intersection callback:

- For each entry, set the corresponding slide's internal `_isVisible` signal to `entry.isIntersecting && entry.intersectionRatio >= 0.5`.
- The slide host's `aria-hidden` and `inert` bindings read this signal directly.

When slides are added/removed at runtime (`contentChildren` updates), the carousel must disconnect and re-observe. Implement via an `effect()` that reads `this.slides()` and re-establishes the observation list. The observer instance MUST be destroyed in `DestroyRef.onDestroy()`.

The IO is NOT used to compute `activeIndex` — that's computed from scroll position (see "Active-index detection" below). IO is purely for the aria-hidden/inert toggle.

### Slide indexing and parent injection

`CarouselSlideComponent` injects the carousel directly: `private readonly carousel = inject(CarouselComponent)`. No `{ optional: true }`.

The carousel exposes `slides = contentChildren(CarouselSlideComponent, { descendants: false })`. Each slide computes `index = computed(() => this.carousel.slides().indexOf(this))`. The slide's `accessibleName` computed reads `index()`, `slides().length`, `label()`, and `carousel.resolvedLabels()` to interpolate the `slideOf` / `slideOfWithLabel` template.

### Active-index detection from user scroll

Feature-detect `'onscrollend' in window` once at construction. Store the strategy as a private boolean.

- **`scrollend` path:** add `viewport.addEventListener('scrollend', this._onScrollEnd, { passive: true })` in `afterNextRender`.
- **Fallback path:** add `viewport.addEventListener('scroll', this._onScrollDebounced, { passive: true })` and debounce via a 150 ms `setTimeout` (clear the previous timeout on each fire).

Both handlers call the same `_handleScrollSettled()` which:

1. If `_isLoopJumping()` is true, return immediately (the jump-on-arrival mask is in flight).
2. Compute the new active index from `viewport.scrollLeft` / `viewport.scrollTop` divided by the per-slide step (basis + gap). For RTL horizontal, the math inverts — see Pitfall #3.
3. If the computed index differs from `activeIndex()`, set `_lastInteractionSource` (if not already set by a programmatic caller), set `activeIndex.set(newIndex)`, and emit `slideChange` with the resolved trigger.

Both listeners MUST be installed with `{ passive: true }`. Cleanup via `DestroyRef.onDestroy()`.

### "Last interaction source" signal

Critical for correct `slideChange` trigger attribution. Implement as a private `signal<TwCarouselSlideChangeTrigger | null>(null)` on the carousel. Every navigation method writes to it BEFORE triggering the scroll change:

- `next()` / `prev()` (called externally): `_lastInteractionSource.set('programmatic')`.
- Prev/Next directive `_onClick`: sets `_lastInteractionSource.set('button')` then calls `carousel.next()` / `prev()`.
- Indicators button click: sets `'indicator'` then calls `scrollTo`.
- Keyboard handler on viewport: sets `'keyboard'` then calls `next()` / `prev()` / `scrollTo`.
- Autoplay tick: sets `'autoplay'` then calls `next()`.
- Pointer drag release (above threshold): sets `'pointer'` before the browser snaps.
- Native touch scroll: leave as `null`; `_handleScrollSettled` defaults to `'pointer'`.

`_handleScrollSettled` reads `_lastInteractionSource()`, emits `slideChange` with that trigger (or `'pointer'` if `null`), and then clears the source signal to `null`. Easy to get backward — write to the signal BEFORE scroll, read in the settle handler.

### Pointer drag handler

Per requirements § 4.3. On `pointerdown` (primary button, `pointerType !== 'touch'`):

1. Record `startX/startY`, `startScrollLeft/startScrollTop`, set an internal `_isDragging = signal(false)` to `false` (becomes true only once threshold crossed).
2. On `pointermove`, compute `delta = e.clientX - startX` (or vertical). If `Math.abs(delta) <= 6` AND `!_isDragging()`, do nothing (preserves click semantics inside slide content).
3. Once `Math.abs(delta) > 6`: set `_isDragging(true)`, set `viewport.style.scrollSnapType = 'none'` (override Tailwind utility via inline style), add `cursor-grabbing` class, `viewport.setPointerCapture(e.pointerId)`. From this point on, every `pointermove` sets `viewport.scrollLeft = startScrollLeft - delta` (or vertical analogue, with RTL sign flip — see Pitfall #3).
4. On `pointerup` / `pointercancel`:
   - If `_isDragging()`: clear `viewport.style.scrollSnapType` (restore Tailwind class), remove `cursor-grabbing`, release pointer capture, set `_lastInteractionSource('pointer')`. Install a one-shot `click` capture listener on the viewport that calls `event.stopPropagation()` + `event.preventDefault()`, then removes itself on the next microtask (so the click that immediately follows the pointerup doesn't fire on slide content).
   - If `!_isDragging()`: do nothing — let the native click fire.
5. Pause autoplay during drag (`autoplayPaused` with reason `'interaction'`); resume after `autoplayInterval * 2` per requirements § 4.7.

Do NOT use CDK `DragDrop`. The drag handler is a small inline implementation (~80 lines).

### Autoplay state machine

Per requirements § 4.7. State signals on the carousel:

- `_isHovered = signal(false)` — toggled by host `(pointerenter)` / `(pointerleave)`.
- `_hasFocusInside = signal(false)` — toggled by host `(focusin)` / `(focusout)`. Use the FocusIn / FocusOut native events (they bubble).
- `_isVisible = signal(true)` — bound to `document.visibilityState`. Subscribe via `document.addEventListener('visibilitychange', …, { passive: true })` in `afterNextRender`; clean up in `DestroyRef.onDestroy()`.
- `_isDragging = signal(false)` (from drag handler).
- `_isManuallyPaused = signal(false)` — toggled by the pause-control button or `pause()` / `resume()`.
- `_postInteractionPauseUntil = signal<number | null>(null)` — timestamp until which post-interaction pause holds.

`_isPaused = computed(() => …)` reads:

- `(pauseOnHover() && _isHovered())` OR
- `(pauseOnFocusIn() && _hasFocusInside())` OR
- `!_isVisible()` OR
- `_isDragging()` OR
- `_isManuallyPaused()` OR
- `_postInteractionPauseUntil() !== null && Date.now() < _postInteractionPauseUntil()`.

An `effect()` watches `[autoplay, _isPaused, autoplayInterval]`. When `autoplay() && !_isPaused()`, start a `setInterval(autoplayInterval, () => { _lastInteractionSource.set('autoplay'); this.next(); })`. When `_isPaused()` becomes true OR `autoplay()` becomes false, clear the interval. On every pause transition, emit `autoplayPaused` with the highest-priority reason; on every resume, emit `autoplayResumed`. Highest-priority reason is the first true condition in this order: `'manual'`, `'visibility'`, `'interaction'` (drag or post-interaction-pause), `'focus'`, `'hover'`.

Cancel the interval in `DestroyRef.onDestroy()`.

### Pause-control button (component-rendered, not projectable)

Per requirements § 4.7. Rendered inside the carousel template, OUTSIDE the viewport, only when `autoplay()` is true.

- **Visual:** 24×24 button (`size-6`), positioned absolutely. Horizontal orientation: `absolute bottom-2 start-2` (logical-start corner). Vertical orientation: `absolute top-2 start-2`. The component must apply `position: relative` to the host (or to a wrapping container) so absolute positioning resolves correctly — the `tv()` `root` slot includes `relative`.
- **Backdrop:** `bg-black/40` capsule (`rounded-full`) for contrast over arbitrary slide content. This is a deliberate raw `bg-black/40` value (not a semantic token) — document inline with a comment per requirements § 12.
- **Icon:** `<tw-icon>` from `ngx-tw/icon`. Icon name is `'play'` when manually paused, `'pause'` otherwise. Use `size="xs"` to fit the 24×24 button.
- **`aria-label`:** read from `_pauseControlAriaLabel()` computed — when `_isManuallyPaused()` is true, returns `labels.resumeAutoplay`; otherwise returns `labels.pauseAutoplay`.
- **Focus ring:** canonical `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`.
- **Click handler:** toggles `_isManuallyPaused`. When transitioning false → true, emit `autoplayPaused` with reason `'manual'`. When true → false, the `_isPaused` computed re-evaluates and `autoplayResumed` may emit (or not, if another pause condition is active).

The pause control is intentionally NOT projectable — making it consumer-controlled would risk WCAG 2.2.2 non-compliance if consumers forget to render it.

### Loop-jump mask

Per requirements § 4.6. State signal `_isLoopJumping = signal(false)`. When `next()` past the last page (loop) or `prev()` before slide 0 (loop):

1. Set `_isLoopJumping.set(true)`.
2. Add the `tw-carousel-loop-jump` class to the viewport via a transient `_loopJumpClass` signal bound through `[class.tw-carousel-loop-jump]` in the template (or by directly toggling on the element via a `viewChild<ElementRef>('viewport')`).
3. Call `viewport.scrollTo({ left: targetScrollLeft, behavior: 'instant' })` (or `top` for vertical).
4. Listen to the next `animationend` event on the viewport (one-shot `{ once: true }`), then clear `_isLoopJumping.set(false)` and remove the class. Both are required: the flag suppresses the scroll-end recompute, the class removal allows re-triggering on the next loop.

The CSS animation duration is 200 ms; the `scrollend` listener will see the synthetic scroll and try to recompute `activeIndex` — gated by the `_isLoopJumping` flag check at the top of `_handleScrollSettled`.

### Page math

Per requirements § 4.5:

```
pageCount = max(1, ceil((slideCount - slidesPerView) / slidesToScroll) + 1)
activePage = floor(activeIndex / slidesToScroll)
```

Both implemented as `computed()` signals on the carousel. Public readonly. `slideCount` is `slides().length`. Be careful with `slideCount === 0` and `slidesPerView > slideCount` — clamp `slidesPerView` to `slideCount` (or `0.5` minimum) before the math.

### RTL handling

Per requirements § 7.3. Detect once on first scroll/drag: `const isRtl = getComputedStyle(viewportEl).direction === 'rtl'`. Store as a private signal updated in `afterNextRender` (and optionally on a `ResizeObserver` callback to handle dynamic `dir` changes — keep this simple in v1, do not over-engineer).

When `isRtl()` is true AND `orientation() === 'horizontal'`:

- Prev/Next semantics flip: visual ArrowLeft = next; visual ArrowRight = prev. In the keyboard handler, swap the targets when `isRtl() && horizontal`.
- `scrollLeft` math inverts: in modern browsers, RTL flex containers report `scrollLeft` as **negative** (Chrome 85+) or as a mirrored positive value depending on browser. Use a single computed sign factor (`_rtlSign = isRtl ? -1 : 1`) applied to delta math in drag and to active-index computation from scroll position.
- Pointer drag delta sign inverts (drag right = backwards content motion in RTL).

Vertical orientation is unaffected by RTL.

Use **logical properties** for all directional padding/margin: `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`. No `ml-*`/`mr-*`/`left-*`/`right-*` in container or pause-control positioning.

### `slideChange` payload type

```ts
export type TwCarouselSlideChangeTrigger =
  | 'pointer'
  | 'keyboard'
  | 'autoplay'
  | 'indicator'
  | 'button'
  | 'programmatic';

export interface TwCarouselSlideChangeEvent {
  /** Previous active slide index (0-based). */
  from: number;
  /** New active slide index (0-based). */
  to: number;
  /** What triggered the change. */
  trigger: TwCarouselSlideChangeTrigger;
}

export type TwCarouselAutoplayReason =
  | 'hover'
  | 'focus'
  | 'interaction'
  | 'visibility'
  | 'manual';
```

---

## `tv()` config sketch

Single `tv()` config in `carousel.ts`, `twMerge: true`, slot-based. Spans all three components — `root`, `viewport`, `slide`, `pauseControl` for the main carousel; `indicators`, `indicator` for indicators. Wire each via `inject(CarouselComponent)` if needed (indicators) or via component-local signals.

```ts
const carouselVariants = tv(
  {
    slots: {
      // ── Carousel main host & viewport ──
      root: 'relative flex w-full',
      // The scrollable viewport. tabindex=0 + canonical focus ring.
      // Scrollbar hidden via .tw-scrollbar-hidden (see Pitfall #1).
      viewport:
        'flex min-w-0 w-full snap-mandatory scroll-smooth motion-reduce:scroll-auto tw-scrollbar-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
      // Per-slide. Sized via inline `flex-basis` from CSS custom property
      // (computed from slidesPerView × gap × container width).
      slide:
        'flex-none snap-always min-w-0 transition-opacity duration-150 motion-reduce:transition-none',
      // Component-rendered pause control. Absolute positioning + capsule.
      // bg-black/40 is a deliberate raw value (NOT a semantic token) chosen
      // for contrast over arbitrary slide content; see requirements § 12.
      pauseControl:
        'absolute z-10 inline-flex items-center justify-center size-6 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',

      // ── Indicators ──
      indicators: 'flex items-center justify-center',
      indicator:
        'inline-block transition-colors duration-200 motion-reduce:transition-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
    },
    variants: {
      orientation: {
        horizontal: {
          root: 'flex-col',
          viewport: 'flex-row overflow-x-auto overflow-y-hidden snap-x',
          indicators: 'flex-row mt-3',
        },
        vertical: {
          root: 'flex-row',
          viewport: 'flex-col overflow-y-auto overflow-x-hidden snap-y',
          indicators: 'flex-col ms-3',
        },
      },
      snapAlign: {
        start:  { slide: 'snap-start' },
        center: { slide: 'snap-center' },
        end:    { slide: 'snap-end' },
      },
      // gap drives Flexbox gap (NOT slide margins) so the first/last edge math
      // is symmetric. Tailwind v4 gap-x-* / gap-y-* utilities.
      gap: {
        xs: {},
        sm: {},
        md: {},
        lg: {},
        xl: {},
      },

      // ── Indicators-only axes ──
      variant: {
        dots:    { indicator: 'rounded-full' },
        lines:   { indicator: 'rounded-full' },
        numbers: { indicator: 'rounded-md inline-flex items-center justify-center font-medium' },
      },
      size: {
        xs: { indicator: '' },
        sm: { indicator: '' },
        md: { indicator: '' },
        lg: { indicator: '' },
        xl: { indicator: '' },
      },
      position: {
        below: { indicators: '' },
        overlay: {
          // Overlay capsule: bg-black/40 same as pause-control (deliberate fixed
          // value for contrast over arbitrary slide content).
          indicators: 'absolute z-10 px-2 py-1 rounded-full bg-black/40',
        },
      },
      color: {
        primary: {}, secondary: {}, accent: {}, neutral: {},
        info: {}, success: {}, warning: {}, error: {},
      },
    },
    compoundVariants: [
      // Indicator geometry per variant × size — dots use the dot-indicator
      // sub-scale (size-2 / size-2.5 / size-3 per CLAUDE.md), lines use a
      // wider geometry, numbers use text-padded pills.
      { variant: 'dots', size: 'xs', class: { indicator: 'size-2' } },
      { variant: 'dots', size: 'sm', class: { indicator: 'size-2.5' } },
      { variant: 'dots', size: 'md', class: { indicator: 'size-3' } },
      { variant: 'dots', size: 'lg', class: { indicator: 'size-3' } },
      { variant: 'dots', size: 'xl', class: { indicator: 'size-3' } },

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

      // Indicator gap per orientation × size — use the canonical gap-1 / gap-2
      // pattern; vertical uses gap-y, horizontal uses gap-x.
      { orientation: 'horizontal', size: 'xs', class: { indicators: 'gap-1' } },
      { orientation: 'horizontal', size: 'sm', class: { indicators: 'gap-1.5' } },
      { orientation: 'horizontal', size: 'md', class: { indicators: 'gap-2' } },
      { orientation: 'horizontal', size: 'lg', class: { indicators: 'gap-2' } },
      { orientation: 'horizontal', size: 'xl', class: { indicators: 'gap-3' } },
      // Vertical analogues — same scale, gap-y direction is inherited by flex-col.

      // Overlay-position absolute placement per orientation.
      { orientation: 'horizontal', position: 'overlay', class: { indicators: 'bottom-3 start-1/2 -translate-x-1/2' } },
      { orientation: 'vertical',   position: 'overlay', class: { indicators: 'top-1/2 -translate-y-1/2 end-3' } },

      // Gap value applied per orientation (gap-x for horizontal, gap-y for vertical).
      // Use the slide-gap utility on the viewport. NOTE: Tailwind v4 statically
      // resolves these — the strings must appear verbatim somewhere.
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
      color: 'primary',
    },
  },
  { twMerge: true },
);
```

Notes:
- This is a **sketch**. The implementer is expected to refine details (e.g. the indicator gap rows currently duplicate the horizontal sizes — adjust the vertical rows once you've prototyped the actual rendered output) but the slot list and variant axes are fixed.
- Color × active/inactive indicator styling is applied via static lookup maps (next section), not through `tv()` — Tailwind v4 cannot interpolate.
- The `gap` axis appears in the compound variants so Tailwind v4 sees each `gap-x-{n}` / `gap-y-{n}` literal. The base `gap` axis itself has empty objects because all gap utilities are gated by orientation.

---

## Static color × state class lookups

Per the stepper precedent. Tailwind v4 only resolves statically-written class names. Enumerate every color × active/inactive indicator combination.

```ts
// ── Active indicator color, dots variant ──
// Active dot scales 1.5× larger (per WCAG 1.4.1 — distinguishable by more than
// color alone; see requirements § 5.2). The 1.5× is achieved by the dot bg
// becoming a different shade and the dot itself becoming a scaled-up dot — for
// the dots variant we apply a wider size via compound variant on active state.
const INDICATOR_ACTIVE_DOTS: Record<TwColor, string> = {
  primary:   'bg-primary-solid scale-150',
  secondary: 'bg-secondary-solid scale-150',
  accent:    'bg-accent-solid scale-150',
  neutral:   'bg-neutral-solid scale-150',
  info:      'bg-info-solid scale-150',
  success:   'bg-success-solid scale-150',
  warning:   'bg-warning-solid scale-150',
  error:     'bg-error-solid scale-150',
};

const INDICATOR_ACTIVE_LINES: Record<TwColor, string> = {
  primary:   'bg-primary-solid w-12',
  secondary: 'bg-secondary-solid w-12',
  accent:    'bg-accent-solid w-12',
  neutral:   'bg-neutral-solid w-12',
  info:      'bg-info-solid w-12',
  success:   'bg-success-solid w-12',
  warning:   'bg-warning-solid w-12',
  error:     'bg-error-solid w-12',
};

const INDICATOR_ACTIVE_NUMBERS: Record<TwColor, string> = {
  primary:   'bg-primary-solid text-primary-solid-fg',
  secondary: 'bg-secondary-solid text-secondary-solid-fg',
  accent:    'bg-accent-solid text-accent-solid-fg',
  neutral:   'bg-neutral-solid text-neutral-solid-fg',
  info:      'bg-info-solid text-info-solid-fg',
  success:   'bg-success-solid text-success-solid-fg',
  warning:   'bg-warning-solid text-warning-solid-fg',
  error:     'bg-error-solid text-error-solid-fg',
};

// ── Inactive indicator (color-agnostic — uses fg-muted token) ──
const INDICATOR_INACTIVE_DOTS = 'bg-fg-muted opacity-50 hover:opacity-100';
const INDICATOR_INACTIVE_LINES = 'bg-fg-muted opacity-50 hover:opacity-100';
const INDICATOR_INACTIVE_NUMBERS = 'bg-surface-muted text-fg hover:bg-surface-sunken';

function resolveIndicatorActiveClasses(variant: 'dots' | 'lines' | 'numbers', color: TwColor): string {
  switch (variant) {
    case 'dots':    return INDICATOR_ACTIVE_DOTS[color];
    case 'lines':   return INDICATOR_ACTIVE_LINES[color];
    case 'numbers': return INDICATOR_ACTIVE_NUMBERS[color];
  }
}

function resolveIndicatorInactiveClasses(variant: 'dots' | 'lines' | 'numbers'): string {
  switch (variant) {
    case 'dots':    return INDICATOR_INACTIVE_DOTS;
    case 'lines':   return INDICATOR_INACTIVE_LINES;
    case 'numbers': return INDICATOR_INACTIVE_NUMBERS;
  }
}
```

Wiring (inside `CarouselIndicatorsComponent`):
- `indicatorClasses(page: number): string` reads `_variantResult().indicator()` and concatenates `resolveIndicatorActiveClasses(variant, color)` when `page === carousel.activePage()`, else `resolveIndicatorInactiveClasses(variant)`.
- The active scale/width changes are the WCAG 1.4.1 conformance — active state must be distinguishable beyond color alone.

---

## `TwCarouselLabels` interface + defaults

```ts
/** Localizable strings for the carousel. */
export interface TwCarouselLabels {
  /** Accessible label for the Previous-slide directive host. Default: "Previous slide". */
  previous: string;
  /** Accessible label for the Next-slide directive host. Default: "Next slide". */
  next: string;
  /** Accessible label for the autoplay pause control. Default: "Pause autoplay". */
  pauseAutoplay: string;
  /** Accessible label for the autoplay resume control. Default: "Resume autoplay". */
  resumeAutoplay: string;
  /** Template for indicator-button accessible names. Variable: {page} (1-based). Default: "Go to slide {page}". */
  indicator: string;
  /** Template for per-slide accessible names with a custom label. Variables: {index} (1-based), {total}, {label}. Default: "{index} of {total}: {label}". */
  slideOfWithLabel: string;
  /** Template for per-slide accessible names without a custom label. Variables: {index} (1-based), {total}. Default: "{index} of {total}". */
  slideOf: string;
}

export const DEFAULT_CAROUSEL_LABELS: Readonly<TwCarouselLabels> = {
  previous: 'Previous slide',
  next: 'Next slide',
  pauseAutoplay: 'Pause autoplay',
  resumeAutoplay: 'Resume autoplay',
  indicator: 'Go to slide {page}',
  slideOfWithLabel: '{index} of {total}: {label}',
  slideOf: '{index} of {total}',
};
```

Merge defaults with input via `resolvedLabels = computed(() => ({ ...DEFAULT_CAROUSEL_LABELS, ...this.labels() }))` (mirror of paginator's pattern).

Label interpolation uses a small `formatLabel(template, vars)` helper — copy the implementation from `paginator.ts` lines ~236–243.

---

## Accessibility checklist

Recap of requirements § 5. Verify every item.

- **Carousel host:** `role="region"` + `aria-roledescription="carousel"`. `aria-label` from input OR `aria-labelledby` from input. If both are null, log a one-time dev-mode `console.warn` in `afterNextRender` (gated by `isDevMode()` — production builds must not log). Host is **not** focusable (no `tabindex`).
- **Viewport (inner):** `tabindex="0"`. `aria-live="polite"` when `autoplay() === false`; `aria-live="off"` when `autoplay() === true`. Canonical `focus-visible` outline ring.
- **Slides:** `role="group"` + `aria-roledescription="slide"`. `aria-label` from `accessibleName` computed. `aria-hidden="true"` AND `inert` when not visible (via IO threshold 0.5). Slides themselves are not focusable (no `tabindex`).
- **Prev/Next directive hosts:** native `<button>` semantics (consumer-provided element, typically a `<button>` or `<tw-button>`). `aria-label` from `labels.previous` / `labels.next` UNLESS consumer pre-set `aria-label`/`aria-labelledby` (consumer wins). At boundary AND `!loop`: `disabled` (for `<button>`) + `aria-disabled="true"`; for non-`<button>` hosts apply `aria-disabled` + `tabindex="-1"` only.
- **Indicators container:** `role="group"` (NOT `tablist` — see requirements § 5.8). No `aria-label` by default; the parent region carries it.
- **Indicator buttons:** plain `<button>` (no `role` override). `aria-label` from `labels.indicator` template. `aria-current="true"` on the active page; attribute absent otherwise.
- **Pause-control button:** native `<button>`. `aria-label` from `labels.pauseAutoplay` (when running) or `labels.resumeAutoplay` (when manually paused). Canonical focus ring.
- **WCAG 2.2.2:** the pause-control button is present whenever `autoplay() === true`. `autoplayInterval < 1000` is clamped to 1000.
- **WCAG 1.4.1:** active indicator distinguishable by more than color — dots scale 1.5×, lines widen to `w-12`, numbers gain a filled background.
- **Reduced motion:** `scroll-behavior: smooth` becomes `auto` via `motion-reduce:scroll-auto`. Loop-jump mask animation duration drops to 0 ms (theme CSS override). Indicator hover transitions drop via `motion-reduce:transition-none`.
- **AXE:** zero violations on the demo pages. Demo pages MUST carry an `<h1>` and proper landmark structure (the demo skill `demo-doc-page` handles this).
- **RTL:** logical properties for all directional padding/margin. Prev/Next semantics swap when `getComputedStyle(viewport).direction === 'rtl'` AND `orientation === 'horizontal'`. Indicator order mirrors automatically via flex + RTL.

---

## CSS additions to `theme/_base.css`

Two additions. Place both near the existing `step-panel-enter-forward` / `timeline-item-enter` blocks (around lines 212–246). The reduced-motion override goes into the existing `@media (prefers-reduced-motion: reduce)` block (around lines 328–364).

**The `tw-carousel-loop-jump` keyframe:**

```css
/* ── Carousel — loop-jump opacity mask ── */

@keyframes tw-carousel-loop-jump {
  0%   { opacity: 1; }
  40%  { opacity: 0.55; }
  100% { opacity: 1; }
}
.tw-carousel-loop-jump {
  animation: tw-carousel-loop-jump 200ms ease-in-out;
}
```

**The reduced-motion override (append to the existing block):**

```css
.tw-carousel-loop-jump { animation-duration: 0ms; }
```

**The scrollbar-hiding utility — DECIDE-AND-FLAG:** `theme/_base.css` already defines `.tw-scrollbar-none` (lines 20–22) doing exactly what requirements § 4.1 asks for under the name `.tw-scrollbar-hidden`. Resolve as follows: **reuse the existing `.tw-scrollbar-none`** (preferred — avoids parallel utilities), update the `tv()` `viewport` slot string from `tw-scrollbar-hidden` to `tw-scrollbar-none`, AND add an inline `// NOTE: requirements doc § 4.1 names this .tw-scrollbar-hidden but the codebase already ships .tw-scrollbar-none in theme/_base.css — reusing the existing utility.` comment above the slot definition. If the maintainer prefers the requirements doc's name verbatim, alias by adding `.tw-scrollbar-hidden { @apply tw-scrollbar-none; }` — but the inline-comment-and-reuse path is the recommended default. See Pitfalls #1.

---

## Test plan (`carousel.spec.ts`)

Vitest. No `fakeAsync` / `tick`. Set inputs via `fixture.componentRef.setInput()`. Use `vi.useFakeTimers()` + `vi.advanceTimersByTime()` for autoplay and the debounced `scroll` fallback path. Use `vi.spyOn(console, 'warn')` for dev warnings. Mock `IntersectionObserver` and `ResizeObserver` via global stubs at the top of the spec (the Vitest setup can host these — check `projects/ngx-tw/test-setup.ts`; add stubs there if missing).

Organize by the requirements doc's § 10 sub-sections.

**§ 10.1 Rendering**
- [ ] Default render: `role="region"`, `aria-roledescription="carousel"`, viewport carries `tabindex="0"` and `aria-live="polite"` (autoplay false default).
- [ ] N slides project into the viewport; each carries `role="group"`, `aria-roledescription="slide"`, `aria-label` matching the `slideOf` template.
- [ ] Each `orientation` value (`horizontal`, `vertical`) renders correct scroll axis utilities (`overflow-x-auto` vs `overflow-y-auto`; `snap-x` vs `snap-y`).
- [ ] Each `gap` value applies the matching `gap-x-{n}` / `gap-y-{n}` utility on the viewport.
- [ ] Each `snapAlign` value applies `snap-start` / `snap-center` / `snap-end` on slides.
- [ ] `slidesPerView` integer and fractional (1.2): the viewport's CSS custom property `--tw-carousel-slide-basis` is set with the expected `calc(...)` string.
- [ ] `aria-live="off"` when `autoplay === true`; `aria-live="polite"` when `autoplay === false`.

**§ 10.2 Inputs and outputs**
- [ ] Setting `activeIndex` from the parent calls `viewport.scrollTo` with the expected position. Spy on `viewport.scrollTo` via `vi.spyOn(viewportEl, 'scrollTo')` after `viewChild` resolves.
- [ ] User-driven scroll updates `activeIndex` after `scrollend`. Dispatch a `Event('scrollend')` on the viewport and assert `activeIndex` updates. For the fallback path, dispatch `Event('scroll')` and `vi.advanceTimersByTime(150)` to trigger the debounce.
- [ ] `slideChange` trigger attribution:
  - `component.next()` → trigger `'programmatic'`.
  - Prev/Next directive click → trigger `'button'`.
  - ArrowRight on focused viewport → trigger `'keyboard'`.
  - Indicator button click → trigger `'indicator'`.
  - Autoplay tick (advance fake timers) → trigger `'autoplay'`.
  - Simulated scroll + `scrollend` → trigger `'pointer'`.
- [ ] `activeIndexChange` fires on each of the above with the new index payload.
- [ ] `autoplayPaused` fires with the correct reason: hover (`'hover'`), focusin (`'focus'`), simulated drag (`'interaction'`), `document.visibilityState = 'hidden'` mock (`'visibility'`), `component.pause()` (`'manual'`).
- [ ] `autoplayResumed` fires when the pause condition clears.

**§ 10.3 Navigation**
- [ ] `next()` advances by `slidesToScroll`.
- [ ] `prev()` retreats by `slidesToScroll`.
- [ ] At last page, `loop: false`: `next()` is a no-op; prev/next directive host gains `disabled` and `aria-disabled="true"`.
- [ ] At slide 0, `loop: false`: `prev()` is a no-op; directive host disabled.
- [ ] `loop: true`: `next()` past last wraps to slide 0; the `tw-carousel-loop-jump` class is applied to the viewport then removed after `animationend` (dispatch the event manually).
- [ ] `scrollTo(index, { behavior: 'instant' })` calls `viewport.scrollTo` with `behavior: 'instant'`.
- [ ] Disabled slide is skipped by `next()` / `prev()`.

**§ 10.4 Indicators**
- [ ] `<tw-carousel-indicators>` renders `pageCount` buttons.
- [ ] Active button has `aria-current="true"`; others do not have the attribute.
- [ ] Clicking a button calls `scrollTo(pageStartIndex)` and emits `slideChange` with `trigger: 'indicator'`.
- [ ] Each `variant` (`dots`, `lines`, `numbers`) renders the correct DOM (assert via class presence or text content).
- [ ] Each `position` (`overlay`, `below`) applies the correct positioning class.

**§ 10.5 Keyboard**
- [ ] ArrowRight on focused viewport (horizontal) → `next()`.
- [ ] ArrowLeft → `prev()`.
- [ ] Home → `activeIndex === 0`.
- [ ] End → `activeIndex === slideCount - 1` (or start of last page when `slidesToScroll > 1`).
- [ ] PageDown / PageUp advance by a full page.
- [ ] ArrowUp / ArrowDown drive vertical orientation analogously.
- [ ] RTL horizontal: ArrowLeft → next; ArrowRight → prev. Set `document.dir = 'rtl'` (or wrap in `<div dir="rtl">`) before the test.
- [ ] `keyboard === false`: ArrowRight does NOT call `next()` (spy on the method and assert it was not called).

**§ 10.6 Autoplay**
- [ ] `autoplay: true` calls `next()` every `autoplayInterval` ms (use `vi.advanceTimersByTime(autoplayInterval)`).
- [ ] `autoplayInterval: 500` is clamped to `1000`. Dev-mode `console.warn` is called once.
- [ ] `pauseOnHover: true` + dispatched `pointerenter` on host → no advance after timer tick.
- [ ] `pauseOnFocusIn: true` + focusing a focusable descendant → no advance.
- [ ] `document.visibilityState = 'hidden'` (mock via `Object.defineProperty`) + dispatched `visibilitychange` → no advance.
- [ ] After button click, autoplay pauses for `autoplayInterval * 2` then resumes. Verify by advancing timers in two steps.
- [ ] Imperative `pause()` halts; `resume()` restarts (only when `autoplay() === true`).
- [ ] Pause-control button: present when `autoplay: true`, absent when false. Click toggles between play and pause `aria-label` values. Click emits manual pause/resume.

**§ 10.7 Drag**
- [ ] Mouse pointerdown + pointermove > 6px + pointerup adjusts `viewport.scrollLeft` (or `scrollTop` vertical). Use `new PointerEvent('pointerdown', { pointerType: 'mouse', clientX: ..., isPrimary: true })`.
- [ ] Mouse pointerdown + pointermove ≤ 6px + pointerup does NOT change scroll position; subsequent `click` on slide content fires normally.
- [ ] Touch pointer (`pointerType: 'touch'`) is ignored — scroll position unchanged by the drag handler.
- [ ] `draggable === false`: no drag effect.

**§ 10.8 Accessibility**
- [ ] AXE passes on a representative 5-slide carousel with autoplay on, indicators, prev/next. Use the project's existing AXE harness if present, else `@axe-core/playwright` integration.
- [ ] Non-visible slides have `aria-hidden="true"` AND `inert` attribute present (assert via `.hasAttribute('inert')`).
- [ ] Visible slide does NOT have `aria-hidden` or `inert`.
- [ ] Slide `aria-label` matches `slideOf` template ("1 of 3") and `slideOfWithLabel` template ("1 of 3: Spring sale") when `label` is set.
- [ ] Prev/Next host with no consumer `aria-label`: receives `aria-label` from directive default.
- [ ] Prev/Next host with consumer `aria-label="Custom"`: directive does NOT override (consumer wins).
- [ ] `aria-live` on viewport: `polite` when `autoplay: false`, `off` when `autoplay: true`.

**§ 10.9 Edge cases**
- [ ] Empty carousel (no slides): no errors, no autoplay ticks even when `autoplay: true`, prev/next directives report disabled.
- [ ] Single slide: navigation directives disabled; indicators render single dot; autoplay is no-op.
- [ ] Adding a slide at runtime via a host component with a signal array: `pageCount` recomputes; indicators reflect new count.
- [ ] Removing the active slide so `activeIndex >= slideCount`: `activeIndex` clamps to `slideCount - 1` and `activeIndexChange` fires.
- [ ] Toggling `orientation` at runtime: layout reflows; `activeIndex` preserved (the scroll position is recomputed from index × step after reflow).
- [ ] Missing `ariaLabel` AND `ariaLabelledBy`: dev-mode `console.warn` is logged once. Spy on `console.warn`.
- [ ] `slidesPerView: 0.3` clamps to `0.5`; dev-mode warn logged once.

---

## Pitfalls / non-obvious things

The implementer is likely to get these wrong without warning. Read all eight before starting.

1. **`tw-scrollbar-hidden` vs existing `tw-scrollbar-none` (DECIDE-AND-FLAG).** The requirements doc (§ 4.1) asks for `.tw-scrollbar-hidden` in `_base.css`, but the file already ships `.tw-scrollbar-none` (lines 20–22) doing exactly that. Do not add a parallel utility. Reuse `.tw-scrollbar-none` in the `tv()` viewport slot string; leave an inline comment naming the requirements-doc identifier so future readers can match them up. If reviewer feedback demands the requirements name, add an alias rule in `_base.css` — but default to reusing the existing utility.

2. **`theme/default.css` does not exist.** The requirements doc occasionally references "the theme CSS"; the actual file is `theme/_base.css` (imported from `theme/index.css`). All keyframes go in `_base.css`. Do not create a `default.css` file.

3. **Tailwind v4 cannot resolve interpolated class names.** Strings like `` `bg-${color}-solid` `` will be missing at runtime. Every color × state combination must be enumerated as a `Record<TwColor, string>` map and concatenated via `${baseClasses} ${LOOKUP[color]}`. Stepper's `INDICATOR_ACTIVE` / `INDICATOR_COMPLETED` / `CONNECTOR_REACHED` are the canonical pattern — copy it. This applies to: indicator active colors (3 variants × 8 colors = 24 strings minimum) and any color-driven slide accents.

4. **RTL scroll math inverts.** `getComputedStyle(viewport).direction === 'rtl'` causes scroll-position math (drag delta → `scrollLeft`; `scrollLeft` → active index) to use the opposite sign in modern browsers. Read direction once at first scroll (`afterNextRender` is fine; do not over-engineer dynamic `dir` changes in v1) and store as a `_rtlSign = signal<1 | -1>(1)`. Apply the sign to: pointer-drag `delta`, scroll-position-to-index computation, and keyboard ArrowLeft / ArrowRight semantic mapping. Vertical orientation is unaffected.

5. **`inert` on hidden slides is essential.** Without `inert`, a hidden slide containing focusable descendants (links, buttons, form fields) stays tab-reachable and breaks keyboard navigation — users tab "into" invisible content. `inert` is a boolean HTML attribute (presence == on); bind via `[attr.inert]="isHidden() ? '' : null"`. Pair with `aria-hidden="true"` — together they remove the slide from both the accessibility tree and the tab order.

6. **`slidesPerView: 1.2` (and other fractional values) is intentional.** Math must support fractional widths via the `calc((100% - ((slidesPerView - 1) * gap-px)) / slidesPerView)` formula. Do NOT `Math.floor` `slidesPerView`. The "peek" pattern (showing 20% of the next slide) is a documented use case in requirements § 1.2 (testimonials with peek).

7. **The pause-control button is NOT projectable; it IS required by WCAG 2.2.2.** Render the button inline in the component template, only when `autoplay()` is true. Position: `absolute bottom-2 start-2` (horizontal) / `absolute top-2 start-2` (vertical). Size: 24×24 (`size-6`). Visual: `bg-black/40` capsule (`rounded-full`), white `<tw-icon>` (`size="xs"`) toggling between `name="play"` (when manually paused) and `name="pause"` (when running). The `bg-black/40` is a deliberate raw value chosen for contrast over arbitrary slide content — leave an inline comment noting this is intentional per requirements § 12.

8. **"Last interaction source" is easy to wire backward.** Every navigation entrypoint sets the source signal BEFORE triggering scroll change; the `_handleScrollSettled` reads and clears it. If you set after, the scroll-end fires with `null` and every event reports as `'pointer'`. Specifically — directive `_onClick` MUST `_lastInteractionSource.set('button')` before calling `carousel.prev()`/`next()`; keyboard handler must set before calling; autoplay must set before `next()`; indicator click must set before `scrollTo`. Drag-release sets before browser snap.

---

## Open questions / deferred to v1.5

Verbatim from requirements § 11. The implementer must NOT solve these in v1:

1. **Responsive `slidesPerView` (breakpoint-keyed object).** v1 ships a single `number`. v1.5 considers `slidesPerView: number | { sm: number; md: number; lg: number; xl: number }`. The implementation would use CSS container queries.
2. **Custom indicator templates.** v1 ships three built-in variants. v1.5 considers a `*twCarouselIndicator` template directive for fully custom indicators.
3. **Per-slide transition effects (fade, scale).** v1 ships translate-only via scroll. v1.5 considers a `transition` input on the container that swaps the slide layout from a single scrolling track to a stack of absolutely-positioned slides with opacity/scale transitions.
4. **Thumbnail-mode integration helper.** Currently consumers wire two carousels via two-way `[(activeIndex)]`. A `<tw-carousel-thumbs>` companion that auto-renders thumbs of the parent's slides could simplify this.
5. **Drag-to-reorder.** Out of scope. The carousel is presentational.
6. **`role="feed"` mode for infinite-loading content.** Different ARIA contract; would require pagination integration. Deferred.

---

## Acceptance criteria

Per requirements § 13, the component is "done" when all 17 items in that section are satisfied. The implementer must verify each item explicitly — passing the spec is necessary but not sufficient (item 13 requires AXE zero violations on demo pages; item 16 requires Compodoc API tables to be non-empty, which is a JSDoc coverage requirement, not a unit-test outcome).

Verify:

1. All 17 carousel inputs implemented with the exact defaults and JSDoc above. Cap exception is documented inline at the top of `carousel.ts` per the `split` precedent.
2. All 2 slide inputs implemented; all 4 indicators inputs implemented.
3. All outputs from § 2 fire with the documented payloads and triggers.
4. Internal viewport DOM correct (single scrollable element, scroll-snap, `tabindex="0"`, `aria-live` toggle per `autoplay`).
5. Slide `aria-hidden` + `inert` toggling correct via the single shared `IntersectionObserver`.
6. Autoplay obeys all pause conditions and emits `autoplayPaused` / `autoplayResumed`.
7. WCAG 2.2.2 pause control rendered when `autoplay: true`.
8. Prev/Next directives disable at boundaries when `!loop`; set `aria-label` (respecting consumer override).
9. Indicators render `pageCount` buttons (not `slideCount`); reflect `activePage`; navigate via `scrollTo`.
10. Pointer drag works for mouse, ignored for touch, 6 px threshold preserves click semantics.
11. RTL: horizontal prev/next semantics flip; logical properties used throughout.
12. Loop-jump mask applied + cleaned up via `animationend`; scroll-end debounce is suppressed during the jump.
13. Test coverage per § 10 / Test plan above.
14. AXE zero violations on demo pages.
15. `_base.css` carries the `tw-carousel-loop-jump` keyframe + reduced-motion override. Scrollbar utility resolved per Pitfall #1.
16. `public-api.ts`, `tsconfig.lib.json`, `tsconfig.spec.json`, `angular.json` wired.
17. Compodoc generates non-empty API tables for `CarouselComponent`, `CarouselSlideComponent`, `CarouselIndicatorsComponent`, `CarouselPrevDirective`, `CarouselNextDirective` — every public member carries a JSDoc one-liner.
18. Demo routes exist at `projects/demo/src/app/routes/carousel/{overview,examples,api}` and wired into `app.routes.ts` + the sidebar shell, per the `demo-doc-page` skill.

---

## Constraints (from CLAUDE.md — non-negotiable)

- Selectors: `tw-carousel`, `tw-carousel-slide`, `tw-carousel-indicators` (elements); `[twCarouselPrev]`, `[twCarouselNext]` (attribute directives).
- Class names: `CarouselComponent`, `CarouselSlideComponent`, `CarouselIndicatorsComponent`, `CarouselPrevDirective`, `CarouselNextDirective` — no `Tw` prefix on class identifiers. Public **types** carry `Tw*` (`TwCarouselLabels`, `TwCarouselSlideChangeEvent`, `TwCarouselSlideChangeTrigger`, `TwCarouselAutoplayReason`).
- Standalone components — do NOT set `standalone: true` (Angular v21 default).
- `ChangeDetection.OnPush` on every component.
- `host` object for all host bindings — never `@HostBinding`, never `@HostListener`.
- `inject()` for DI — no constructor injection.
- Signal-based inputs (`input()` / `input.required()` / `model()`). `model()` only for `activeIndex`; all other reactive inputs use `input()`.
- `computed()` for derived state. `linkedSignal()` only if you need writable-from-input behavior (none required here for v1).
- Native control flow (`@if`, `@for`, `@switch`). No `ngClass`, no `ngStyle`, no `*ngFor`, no `*ngIf`.
- Semantic color tokens only (`*-solid`, `*-solid-fg`, `surface`, `fg-muted`, `border`). No raw palette colors (no `bg-blue-*`, no `bg-neutral-200`). The two exceptions — `bg-black/40` for the overlay-indicator capsule and the pause-control backdrop — are deliberate and require an inline comment per requirements § 12.
- No `@angular/animations`. Loop-jump mask via class toggle + CSS keyframe + `animationend`.
- No `ngClass` / `ngStyle`. Use `[class]` / `[style]` / `[attr.X]` bindings.
- No `fakeAsync` / `tick` in tests. Use `vi.useFakeTimers()` + `vi.advanceTimersByTime()`.
- No CDK `DragDrop` — custom inline pointer drag handler (~80 lines).
- No CDK `LiveAnnouncer` — live region is `aria-live` on the viewport.
- No `CdkScrollable` / `ScrollDispatcher` — carousel owns its viewport.
- `twMerge: true` on the `tv()` config so consumer class overrides resolve.
- JSDoc one-line description on every `input()` / `output()` / `model()` / public method / public signal. Verbatim strings provided in the API tables above.
- Input cap: `CarouselComponent` exempt (structural-layout primitive; precedent `SplitComponent`). All other components within cap.
