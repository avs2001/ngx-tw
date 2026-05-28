# `tw-carousel` — Component Requirements

Status: draft for implementation.
Entry point: `ngx-tw/carousel` (standalone; new component).
Shared types reused from `ngx-tw/core`: `TwSize`, `TwColor`, `TwOrientation`.

This document is the build-time specification. It describes **what** the component does, **how** it must behave, and **what** its public surface looks like. Implementation details (DOM structure choices, exact class strings, internal CSS class names) are suggestions, not mandates, unless explicitly marked **MUST**.

Normative language follows RFC 2119: **MUST** / **MUST NOT** are hard rules, **SHOULD** / **SHOULD NOT** are strong defaults with justified exceptions, **MAY** is permitted.

---

## 1. Scope and goals

### 1.1 What this component is

A **slide / swipe gallery** primitive that renders a horizontal (or vertical) sequence of content panes with one or more panes visible at a time, paging behavior driven by user interaction (pointer drag, touch swipe, keyboard, indicator clicks, prev/next buttons) or by an optional autoplay loop. The carousel is **declarative and content-projected**: consumers write `<tw-carousel-slide>` children inside `<tw-carousel>`. The container owns geometry (axis, slidesPerView, gap, snap alignment), behavior (loop, autoplay, drag, keyboard), and the active index (as a two-way `model()`). Slides project arbitrary content.

The carousel is built on **native CSS scroll-snap** — the browser does the heavy lifting of smooth scrolling, snap targets, and momentum/inertia on touch devices. Programmatic navigation (buttons, indicators, autoplay, keyboard) is implemented by setting `scrollLeft` / `scrollTop` on the viewport. This is the same pattern used by GitHub Primer Carousel, Embla Carousel, and (in part) Material's carousel — it is dramatically simpler and more performant than reimplementing a drag-physics engine, and it inherits accessibility and gesture-handling defaults that match the platform.

### 1.2 Use cases

| Use case | Shape |
|---|---|
| Hero image gallery on a marketing page | Horizontal, `slidesPerView=1`, dots indicator, autoplay, loop, large image slides |
| Product image viewer on an e-commerce page | Horizontal, `slidesPerView=1`, prev/next buttons, indicators below, no autoplay, drag enabled |
| Testimonial cards | Horizontal, `slidesPerView=3` (responsive), `slidesToScroll=1`, no autoplay |
| Onboarding step deck | Horizontal, `slidesPerView=1`, dots indicator, no loop, keyboard nav |
| Photo gallery with thumbnails | Horizontal, `slidesPerView=1` on main, thumbnails via a second carousel synced via two-way `[(activeIndex)]` |
| Compact vertical news ticker | Vertical, `slidesPerView=1`, autoplay, loop, pause on hover |
| Multi-row card grid that snaps as the user swipes (mobile-first) | Horizontal, `slidesPerView=1.2` (peek), drag enabled, no autoplay |

### 1.3 What this component is not

- **Not a tabs widget.** Tabs have one of many panels visible based on an explicit selection; the carousel always shows a contiguous range of slides and is designed to be paged through linearly. Tabs use `role="tablist"` / `role="tab"` / `role="tabpanel"`; carousel uses `role="region"` + `aria-roledescription="carousel"` per the W3C APG carousel pattern.
- **Not a stepper.** A stepper drives a multi-step wizard with completion state and form integration. The carousel has no completion semantics, no panels with form fields, and no per-slide validation.
- **Not a virtualized list.** All slides are rendered into the DOM at mount. Consumers with hundreds of slides MUST use windowing externally (the carousel is unaware of viewport-vs-data distinction).
- **Not a lightbox.** The carousel does not open in an overlay, does not trap focus, and does not own dimming/backdrop. A consumer wanting a lightbox composes a `<tw-dialog>` around a `<tw-carousel>`.
- **Not a CDK `CdkScrollable` consumer.** The carousel owns its own scroll viewport and does not register with `ScrollDispatcher`. Consumers needing to coordinate carousel scroll with global scroll behavior must do so externally.

### 1.4 Non-goals (explicit)

- **3D / coverflow / cube transitions.** v1 ships flat translate-only slide transitions. Cards with subtle scale variants are permitted, but pseudo-3D coverflow is out of scope.
- **Infinite virtualization for thousands of slides.** All projected slides are in the DOM.
- **Server-side data fetching, pagination, infinite-load.** The carousel is presentational; data shape is the consumer's problem.
- **Parallax / scroll-driven external animation.** No coupling to outside elements via `IntersectionObserver` beyond what is needed for the carousel's own active-index detection.
- **Per-slide custom transition curves.** All slides share the same easing.
- **Gestures beyond horizontal/vertical drag and swipe.** No pinch, no two-finger pan.
- **Multi-row layouts (Embla-style "rows" mode).** Out of scope for v1.

---

## 2. Public API

### 2.1 Anatomy

```
<tw-carousel>                          ← container; owns axis, slidesPerView, gap, loop, autoplay, drag, activeIndex, etc.
  <tw-carousel-slide>                  ← single slide; arbitrary projected content
    <ng-content/>                      ← default slot: anything (image, card, paragraph, custom DOM)
  </tw-carousel-slide>
  …more slides…

  <button twCarouselPrev>…</button>    ← optional: prev directive applied to any element (auto-disabled when at start and !loop)
  <button twCarouselNext>…</button>    ← optional: next directive
  <tw-carousel-indicators/>            ← optional: dot/line/number indicators projected anywhere in the container
</tw-carousel>
```

Design choices baked into the anatomy:

- **No `tw-carousel-track` element.** The track (the scroll viewport that holds slides side-by-side) is internal to `<tw-carousel>` and rendered automatically. Consumers do NOT wrap slides in a track wrapper. This keeps the DOM flat and the API ergonomic.
- **Prev/next are directives, not elements.** Consumers attach `twCarouselPrev` / `twCarouselNext` to their own `<button>`, `<tw-button>`, or anchor. The directive applies a single host listener (`click`) and binds `aria-label` + `disabled` based on container state. Consumers retain full control over the button's appearance.
- **Indicators are an element.** `<tw-carousel-indicators>` is an element selector because it has internal DOM (a list of buttons / dots / numbers) that the consumer should not have to write. Consumers MAY also use the imperative API (`activeIndex` model + a custom indicator UI) and omit `<tw-carousel-indicators>` entirely.

### 2.2 `CarouselComponent` — `tw-carousel`

#### Inputs (cap-exempt — structural-layout primitive)

Per CLAUDE.md's codified exceptions, **structural-layout primitives** may exceed the 5–6 input cap when each input is an independent axis. The carousel is the geometry + behavior bundle for the slide deck; every input below is independent from the others and removing any would force consumers into manual coordination of two carousels. The split component (`SplitComponent` 10 inputs) is the precedent.

| Name | Type | Default | Description |
|---|---|---|---|
| `orientation` | `TwOrientation` | `'horizontal'` | Axis along which slides flow. Horizontal is the canonical case; vertical is supported for tickers and feature lists. |
| `slidesPerView` | `number` | `1` | Number of slides visible in the viewport. May be fractional (e.g. `1.2` for a "peek" of the next slide). Values < 0.5 are clamped to 0.5; values larger than the slide count are clamped to the slide count. |
| `slidesToScroll` | `number` | `1` | Number of slides advanced per navigation action (button click, keyboard, indicator). MUST be a positive integer; non-integer values are floored. |
| `gap` | `TwSize` | `'md'` | Inter-slide gap on the scroll axis. Mapped via the canonical spacing scale (§ 4.4). |
| `loop` | `boolean` | `false` | When `true`, navigation wraps around at the boundaries. Prev at slide 0 jumps to the last page; Next at the last page jumps to slide 0. Implementation MUST be jumpless (no visible scroll-to-far-edge animation). See § 4.6. |
| `autoplay` | `boolean` | `false` | When `true`, the carousel auto-advances by `slidesToScroll` every `autoplayInterval` ms. Pauses per the rules in § 4.7. |
| `autoplayInterval` | `number` | `5000` | Milliseconds between autoplay advances. Values < `1000` are clamped to `1000` (per WCAG 2.2.2). |
| `pauseOnHover` | `boolean` | `true` | Pauses autoplay while pointer is over the container. Defaults to `true` because losing autoplay on hover is the expected behavior in galleries — opting out is the special case. Inline-comment justification required on the input declaration. |
| `pauseOnFocusIn` | `boolean` | `true` | Pauses autoplay while keyboard focus is anywhere inside the container. Defaults to `true` for WCAG 2.2.2 compliance. Inline-comment justification required. |
| `draggable` | `boolean` | `true` | When `true`, the user may pan the slides via pointer drag (mouse drag-and-release; touch is handled by native scroll). Pointer events are intercepted only when the drag exceeds a 6-pixel threshold so clicks inside slides still work. Defaults to `true` because galleries are draggable by user expectation; opt-out is the special case. Inline-comment justification required. |
| `keyboard` | `boolean` | `true` | When `true`, the container responds to Arrow keys / Home / End / PageUp / PageDown per § 5.3 when focus is inside the carousel. Defaults to `true` for keyboard accessibility. Inline-comment justification required. |
| `snapAlign` | `'start' \| 'center' \| 'end'` | `'start'` | CSS `scroll-snap-align` value applied to each slide. `start` is the standard gallery behavior; `center` is used for peek/preview layouts. |
| `activeIndex` | `model<number>` | `0` | Two-way bound. The 0-based index of the **first visible slide** in the current page. Setting this from the parent scrolls the viewport to align that slide (using `behavior: 'smooth'` unless `prefers-reduced-motion: reduce` is set). Reading reflects the user's manual scroll position, debounced via `scrollend` (with a `scroll` + setTimeout fallback). See § 4.5. |
| `ariaLabel` | `string \| null` | `null` | Accessible name for the carousel region. If `null` AND `ariaLabelledBy` is null, dev mode logs a one-time `console.warn` advising the consumer to provide a label (WCAG 4.1.2). Production builds MUST NOT log. |
| `ariaLabelledBy` | `string \| null` | `null` | ID of an element labeling the carousel. Either `ariaLabel` or `ariaLabelledBy` SHOULD be provided. |
| `labels` | `Partial<TwCarouselLabels>` | `{}` | Localizable strings (prev-button label, next-button label, slide-of-total template, autoplay pause/resume control, indicator button labels). Defaults are English; see § 7. |

#### Outputs

| Name | Type | When it fires |
|---|---|---|
| `activeIndexChange` | `output<number>` | Synthesized by the `model()` two-way binding. Fires after the user scrolls or after a programmatic advance settles. The payload is the new 0-based active index. |
| `slideChange` | `output<TwCarouselSlideChangeEvent>` | Fires when the active index changes for any reason. Payload includes `from`, `to`, and `trigger` (`'pointer' \| 'keyboard' \| 'autoplay' \| 'indicator' \| 'button' \| 'programmatic'`). Does NOT fire when the index is unchanged (i.e., when the user begins a drag and releases without crossing the snap threshold). |
| `autoplayPaused` | `output<TwCarouselAutoplayReason>` | Fires when autoplay pauses. Payload is the reason: `'hover' \| 'focus' \| 'interaction' \| 'visibility' \| 'manual'`. |
| `autoplayResumed` | `output<void>` | Fires when autoplay resumes after a pause. |

The `slideChange` payload is distinct from `activeIndexChange` because consumers often want to know **why** the index changed (e.g., to suppress an analytics event on autoplay but log it on user interaction). The two events are complementary and BOTH MUST fire on every real change (in the order: `slideChange` → `activeIndexChange` is not required; emit them in whatever order falls out of the implementation, but each must fire exactly once per change).

#### Imperative API (exposed via component instance)

| Method | Returns | Description |
|---|---|---|
| `next()` | `void` | Advance by `slidesToScroll`. Wraps if `loop`. No-op if already at the last page and `!loop`. Emits `slideChange` with `trigger: 'programmatic'` if called externally; the prev/next directives emit `'button'`. |
| `prev()` | `void` | Symmetric. |
| `scrollTo(index, opts?)` | `void` | Jump to a specific 0-based index. `opts.behavior` may be `'smooth' \| 'instant'`; default is `'smooth'` unless `prefers-reduced-motion: reduce`. |
| `pause(reason?)` | `void` | Pause autoplay. `reason` defaults to `'manual'`. |
| `resume()` | `void` | Resume autoplay if `autoplay` is `true`. |
| `pageCount` | `Signal<number>` | Number of distinct **pages** (groups of `slidesToScroll` slides) the carousel can land on. See § 4.5. |
| `activePage` | `Signal<number>` | 0-based page index that contains `activeIndex`. Used by `<tw-carousel-indicators>` to render one dot per page (not per slide). |

#### Host attributes

- **MUST** apply `role="region"`.
- **MUST** apply `aria-roledescription="carousel"` (per W3C APG carousel pattern).
- **MUST** apply `aria-label` from `ariaLabel` input, OR `aria-labelledby` from `ariaLabelledBy`, OR — if neither is set — log the dev warning above. The component MUST NOT auto-generate a label.
- **MUST NOT** set `tabindex` on the region container itself. The internal **viewport** (the scrollable element) MUST receive `tabindex="0"` so keyboard users can focus the scroller and use arrow keys.
- **MUST** apply `aria-live="polite"` to the **viewport** when `autoplay === false` (manual mode); MUST apply `aria-live="off"` when `autoplay === true` (auto mode prevents constant announcements). This matches the APG carousel pattern.

### 2.3 `CarouselSlideComponent` — `tw-carousel-slide`

Class name: `CarouselSlideComponent` (no `Tw` prefix). Selector: `tw-carousel-slide`.

#### Inputs (2)

| Name | Type | Default | Description |
|---|---|---|---|
| `label` | `string \| null` | `null` | Optional human-readable label for the slide (e.g., the title of the image). When provided, used in the slide's `aria-label` as `"{index + 1} of {total}: {label}"`. When `null`, uses `"{index + 1} of {total}"` only. |
| `disabled` | `boolean` | `false` | Slide is rendered but skipped by Prev/Next navigation, Indicators, keyboard nav, and autoplay. Programmatic `scrollTo(disabledIndex)` MUST still land on it (consumer override). Visually muted (`opacity-50 cursor-not-allowed`). Useful for "out of stock" or "coming soon" placeholders. |

#### Outputs

None on the slide. Slide content emits its own events.

#### Slots / projection

| Slot | Selector | Required? | Purpose |
|---|---|---|---|
| Default | (no selector) | Yes | Free-form slide body. Can be any content: image, card, multi-paragraph text, custom component. |

#### Host attributes

- **MUST** apply `role="group"`.
- **MUST** apply `aria-roledescription="slide"` (per W3C APG carousel pattern).
- **MUST** apply `aria-label` computed from `label` and the slide's index/total (per § 5.4).
- **MUST** apply `aria-hidden="true"` to slides that are NOT currently in the visible page (so AT skips them). Slides that are partially visible (peek) MUST also be marked `aria-hidden="true"` if their visibility is less than 50% of their width/height — the carousel computes visibility via `IntersectionObserver` with a single threshold of 0.5 on the viewport.
- **MUST** apply `inert` (the native HTML attribute) to slides marked `aria-hidden="true"` so their focusable descendants are removed from tab order automatically. This is essential — without `inert`, a hidden slide containing a `<button>` is still tab-reachable and breaks keyboard navigation.
- **MUST NOT** set `tabindex` on the slide host. Focusable descendants inside the slide retain their normal tab order (when not hidden).

### 2.4 `CarouselIndicatorsComponent` — `tw-carousel-indicators`

Renders a horizontal (or vertical, matching the carousel axis) row of buttons — one per **page** (not per slide; see § 4.5) — that each scroll to their corresponding page when clicked.

#### Inputs (4)

| Name | Type | Default | Description |
|---|---|---|---|
| `variant` | `'dots' \| 'lines' \| 'numbers'` | `'dots'` | Visual style. `dots` = small filled circles; `lines` = short horizontal/vertical bars; `numbers` = text 1, 2, 3… inside small pills. |
| `color` | `TwColor` | `'primary'` | Color of the active indicator. Inactive indicators use neutral tokens. |
| `size` | `TwSize` | `'md'` | Indicator size (diameter/length and gap between indicators). |
| `position` | `'overlay' \| 'below'` | `'below'` | When `'overlay'`, the indicators float absolutely-positioned over the carousel (with a `bg-black/40` capsule backdrop for contrast). When `'below'`, they sit below the carousel as a normal block. `'overlay'` is appropriate for image hero carousels; `'below'` is appropriate for content carousels. |

#### Outputs

None.

#### Host attributes

- **MUST** render a `<div>` with `role="tablist"` if the indicators are intended to act like tabs — **but the APG carousel pattern explicitly uses plain `<button>` elements inside a non-`tablist` container** to avoid implying a tab/tabpanel relationship (which the carousel does not have). The indicators container therefore MUST use `role="group"` (NOT `tablist`), and each button MUST be a plain `<button>` with no `role` override.
- Each indicator button MUST carry:
  - `aria-label` = `labels.indicator` interpolated with the 1-based page number (default English: `"Go to slide {page}"`).
  - `aria-current="true"` on the active page; absent on others.
  - Focus ring follows the canonical `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` pattern.

### 2.5 `CarouselPrevDirective` — `[twCarouselPrev]` & `CarouselNextDirective` — `[twCarouselNext]`

Apply to any focusable element (typically `<button>` or `<tw-button>`). The directive:

1. Injects `CarouselComponent` via `inject(CarouselComponent)`.
2. Listens to `click` on its host and calls `carousel.prev()` / `carousel.next()`. The event is recorded as `trigger: 'button'` on the resulting `slideChange` emission.
3. Sets `aria-label` on the host to `labels.previous` / `labels.next` (defaults `"Previous slide"` / `"Next slide"`) **unless the host already has `aria-label` or `aria-labelledby` set** (consumer override wins).
4. Sets the `disabled` property on the host to `true` when the carousel cannot advance in that direction (i.e., at the first/last page AND `!loop`). When disabled, the host MUST apply `aria-disabled="true"` and `disabled` (for `<button>` elements). For non-`button` hosts, the directive applies only `aria-disabled="true"` and `tabindex="-1"`. Click handlers MUST be no-ops when disabled.
5. Does NOT impose any visual styling. Consumers style the host themselves (typically a `<tw-button variant="ghost">` or icon button).

These are **directives**, not components, by design. The library does not ship "Carousel.PrevButton" with built-in styling because consumers always want to use their own button primitive.

#### Inputs

None.

#### Outputs

None. (The button's own native `click` event still fires; the directive's listener runs in addition.)

---

## 3. Composition examples

### 3.1 Hero image carousel (canonical case)

```html
<tw-carousel
  ariaLabel="Featured promotions"
  [autoplay]="true"
  [autoplayInterval]="6000"
  [loop]="true"
>
  <tw-carousel-slide label="Spring sale">
    <img src="/hero-spring.jpg" alt="Spring sale: 30% off everything" />
  </tw-carousel-slide>
  <tw-carousel-slide label="New collection">
    <img src="/hero-collection.jpg" alt="..." />
  </tw-carousel-slide>
  <tw-carousel-slide label="Free shipping">
    <img src="/hero-shipping.jpg" alt="..." />
  </tw-carousel-slide>

  <button twCarouselPrev tw-icon-button variant="ghost" aria-label="Previous">
    <tw-icon name="chevron-left" />
  </button>
  <button twCarouselNext tw-icon-button variant="ghost" aria-label="Next">
    <tw-icon name="chevron-right" />
  </button>
  <tw-carousel-indicators position="overlay" />
</tw-carousel>
```

### 3.2 Product gallery with thumbnail strip (two carousels synced)

```html
@let active = signal(0);

<tw-carousel ariaLabel="Product images" [(activeIndex)]="active">
  @for (img of productImages; track img.id) {
    <tw-carousel-slide [label]="img.alt">
      <img [src]="img.url" [alt]="img.alt" class="w-full" />
    </tw-carousel-slide>
  }
  <button twCarouselPrev>‹</button>
  <button twCarouselNext>›</button>
</tw-carousel>

<tw-carousel
  ariaLabel="Image thumbnails"
  [(activeIndex)]="active"
  [slidesPerView]="5"
  [slidesToScroll]="1"
  gap="xs"
  [keyboard]="false"
  [draggable]="false"
>
  @for (img of productImages; track img.id) {
    <tw-carousel-slide>
      <button (click)="active.set($index)" class="size-16 overflow-hidden rounded-md">
        <img [src]="img.thumb" alt="" />
      </button>
    </tw-carousel-slide>
  }
</tw-carousel>
```

### 3.3 Testimonial cards with peek

```html
<tw-carousel
  ariaLabel="Customer testimonials"
  [slidesPerView]="3.2"
  [slidesToScroll]="1"
  gap="lg"
  snapAlign="start"
>
  @for (t of testimonials; track t.id) {
    <tw-carousel-slide [label]="t.author">
      <tw-card>
        <div *twCardBody>
          <p class="text-sm italic">{{ t.quote }}</p>
          <p class="text-xs font-semibold mt-3">{{ t.author }}</p>
        </div>
      </tw-card>
    </tw-carousel-slide>
  }
  <button twCarouselPrev>‹</button>
  <button twCarouselNext>›</button>
</tw-carousel>
```

### 3.4 Onboarding step deck (no loop, no autoplay)

```html
<tw-carousel
  ariaLabel="Onboarding tour"
  [(activeIndex)]="step"
  [loop]="false"
  [autoplay]="false"
>
  <tw-carousel-slide label="Welcome">
    <h2 class="text-xl font-semibold">Welcome to Acme</h2>
    <p class="text-sm text-fg-muted">Let's get you set up in three quick steps.</p>
  </tw-carousel-slide>
  <tw-carousel-slide label="Connect your data">
    <h2 class="text-xl font-semibold">Connect your data</h2>
    <p class="text-sm text-fg-muted">Pick a source to import.</p>
  </tw-carousel-slide>
  <tw-carousel-slide label="Invite teammates">
    <h2 class="text-xl font-semibold">Invite teammates</h2>
    <p class="text-sm text-fg-muted">Send an invite or skip for now.</p>
  </tw-carousel-slide>

  <div class="flex justify-between mt-4">
    <button twCarouselPrev tw-button variant="ghost">Back</button>
    <tw-carousel-indicators variant="lines" />
    <button twCarouselNext tw-button>Next</button>
  </div>
</tw-carousel>
```

### 3.5 Vertical news ticker

```html
<tw-carousel
  ariaLabel="Latest news"
  orientation="vertical"
  [autoplay]="true"
  [autoplayInterval]="3000"
  [loop]="true"
  class="h-12"
>
  @for (headline of headlines; track headline.id) {
    <tw-carousel-slide [label]="headline.title">
      <p class="text-sm">{{ headline.title }}</p>
    </tw-carousel-slide>
  }
</tw-carousel>
```

---

## 4. Behavior

### 4.1 Internal DOM structure

The carousel renders the following internal structure (consumer DOES NOT write any of this):

```
<tw-carousel role="region" aria-roledescription="carousel" aria-label="…">
  <div class="…" data-tw-carousel-viewport tabindex="0">           ← the scroll container; receives keyboard focus
    <ng-content/>                                                  ← slides projected here
  </div>
  <!-- prev/next directives and indicators are projected anywhere; they are NOT part of the viewport -->
</tw-carousel>
```

The viewport MUST be the focus-receiving element (NOT the host). The viewport applies:

- `overflow-{x|y}-auto` based on `orientation`
- `scroll-snap-type: {x|y} mandatory`
- `scroll-behavior: smooth` (overridden to `auto` when `prefers-reduced-motion: reduce`)
- A custom CSS class that hides the scrollbar (`scrollbar-width: none`, `&::-webkit-scrollbar { display: none }`) defined in `theme/_base.css` as `.tw-scrollbar-hidden`.

The slide container is the same element as the viewport — the slides themselves are flex items along the orientation axis, with `flex: 0 0 var(--slide-basis)` where `--slide-basis` is `calc((100% - (slidesPerView - 1) * gap) / slidesPerView)` horizontally, and analogous for vertical.

> Implementation tradeoff: this means **prev/next directives and indicators must be siblings of the viewport, not children**. Children of the viewport would scroll with the slides. The component template must render the viewport as one DOM region and project `ng-content` only inside it (slides), while reading `contentChildren(CarouselPrevDirective)` etc. to know which buttons to wire up. Use a `<ng-content select="tw-carousel-slide">` inside the viewport and `<ng-content/>` outside it (or `<ng-content select="tw-carousel-indicators, [twCarouselPrev], [twCarouselNext]">`). The exact slot strategy is implementation discretion.

### 4.2 Scroll-snap behavior

- Each slide MUST set `scroll-snap-align: {snapAlign}` where `{snapAlign}` is the container's `snapAlign` input.
- Each slide MUST set `scroll-snap-stop: always` so rapid swipes do not skip past intermediate slides. (Without this, momentum scrolling on touch devices can fly past 5+ slides on a single swipe, which is the wrong UX for a deliberate paging interaction.)
- Disabled slides (`disabled === true`) MUST still participate in scroll-snap so the scroll position is stable, but navigation methods (`next`, `prev`, indicator click, autoplay) MUST skip them.

### 4.3 Pointer drag (mouse drag)

When `draggable === true`:

- The viewport listens to `pointerdown` on itself. On primary-button pointerdown:
  1. Record `startX` / `startY` and `startScrollLeft` / `startScrollTop`.
  2. Set `scroll-snap-type: none` temporarily so the user can drag freely. Apply `cursor-grabbing` to the viewport.
  3. Capture the pointer (`setPointerCapture`).
- On `pointermove`, set `scrollLeft = startScrollLeft - (e.clientX - startX)` (or vertical analogue). The 6-pixel **drag activation threshold** MUST be crossed before any scroll change is applied — under threshold, the gesture is treated as a potential click and slide content (links, buttons) MUST still receive `click` events.
- On `pointerup` / `pointercancel`:
  1. Restore `scroll-snap-type: {x|y} mandatory`. The browser snaps to the nearest slide automatically.
  2. Release pointer capture.
  3. If the drag exceeded the threshold, mark the next `click` event on a slide descendant as cancelled via a one-time capture listener — preventing accidental clicks on slide content after a drag-release.

The implementation MUST NOT use CDK `DragDrop` for this — CDK's drag is heavy and is built for free-form dragging, not for one-axis scroll augmentation. A small custom pointer handler (estimated < 80 lines) is the right shape.

On touch devices, pointer drag handling SHOULD be **disabled** (native touch scroll already provides momentum + snap, and intercepting it causes janky behavior). The pointer drag handler MUST therefore check `event.pointerType !== 'touch'` before activating.

### 4.4 Gap and spacing

The `gap` input maps to the canonical Tailwind spacing scale:

| `gap` | Horizontal | Vertical |
|---|---|---|
| `xs` | `gap-x-2` (0.5rem / 8px) | `gap-y-2` |
| `sm` | `gap-x-3` (0.75rem / 12px) | `gap-y-3` |
| `md` | `gap-x-4` (1rem / 16px) | `gap-y-4` |
| `lg` | `gap-x-6` (1.5rem / 24px) | `gap-y-6` |
| `xl` | `gap-x-8` (2rem / 32px) | `gap-y-8` |

The gap is rendered via Flexbox `gap` (NOT margin-right on slides) so it is symmetric and does not require subtracting from the first/last slide.

### 4.5 Pages vs slides

A **page** is a group of `slidesToScroll` slides that the carousel lands on. The number of pages is:

```
pageCount = max(1, ceil((slideCount - slidesPerView) / slidesToScroll) + 1)
```

Indicators render `pageCount` dots, not `slideCount` dots. This matches the user's mental model: when `slidesPerView=3` and `slidesToScroll=3` over 9 slides, there are 3 dots (3 pages), not 9.

`activeIndex` is the **slide index** of the first visible slide in the active page. `activePage` is the page index that contains it.

Setting `activeIndex` to a value not aligned to a page boundary (e.g., `activeIndex = 2` when `slidesToScroll = 3`) MUST still work — the carousel scrolls to put slide 2 at the snapAlign position. The active page is then `floor(2 / 3) = 0`. Indicators show page 0 as active. This is a deliberate decision: indicators show pages, but the imperative API operates on slide indices.

### 4.6 Looping

When `loop === true`:

- Calling `next()` past the last page wraps to slide 0.
- Calling `prev()` before slide 0 wraps to the last page.

**Implementation strategy** — **the v1 implementation MUST use the "jump-on-arrival" approach, NOT the cloned-slide approach.** When the carousel wraps, the scroll position is set instantly (`behavior: 'instant'`) to the new index, then a brief CSS opacity flash (200ms, `motion-reduce:opacity-100`) on the viewport masks the jump. Cloned-slide looping (where the first slide is duplicated at the end and vice versa) is rejected because it doubles DOM and confuses screen readers with duplicate content.

The jump-on-arrival approach MUST NOT trigger `scroll` events that the scroll-end debouncer would interpret as a new active index. Use a transient flag (`isLoopJumping = signal(false)`) that the scroll handler checks before recomputing the active index.

When `loop === false`:

- `next()` at the last page is a no-op.
- `prev()` at slide 0 is a no-op.
- Prev/next directive hosts MUST be marked `disabled` in the no-op state (§ 2.5).

### 4.7 Autoplay rules

When `autoplay === true`:

1. Start a `setInterval` of `autoplayInterval` ms that calls `this.next()` on each tick (NOT `setTimeout` chains — `setInterval` is simpler and the small drift on tab-blur is acceptable).
2. **Pause** when ANY of the following is true:
   - `pauseOnHover && isHovered` (pointer is over the container).
   - `pauseOnFocusIn && hasFocusInside` (any descendant has focus).
   - `document.visibilityState === 'hidden'` (tab is in the background).
   - The user is actively dragging.
   - The user just interacted (button click, indicator click, keyboard) — pause for `autoplayInterval * 2` then resume. This matches Embla and Material's pause-after-interaction default.
   - `pause()` was called imperatively (`autoplayPaused` reason `'manual'`).
3. **Resume** when none of the above is true.
4. Emit `autoplayPaused` with the appropriate reason on every transition from running → paused.
5. Emit `autoplayResumed` on every transition from paused → running.

**WCAG 2.2.2** mandates a pause control for any content that auto-updates and lasts more than 5 seconds. The carousel MUST therefore render an autoplay pause/resume control when `autoplay === true`. This control is rendered automatically by the component:

- It is a small `<button>` element positioned in the bottom-left of the viewport (or top-left in vertical orientation), with `aria-label` set from `labels.pauseAutoplay` / `labels.resumeAutoplay`.
- It toggles a `manual` pause/resume reason.
- It is rendered ONLY when `autoplay === true`. When the user manually pauses, the button switches to the resume state.
- Visual styling: 24×24 button with a play/pause icon (use the library `<tw-icon>`), on a `bg-black/40` capsule backdrop similar to the overlay indicators. This MUST follow the same focus-ring policy as any other interactive control.

The autoplay control is intentionally NOT projectable — making it consumer-controlled would expose the pause/resume API directly via the imperative methods and risk WCAG non-compliance if consumers forget to render it. The trade-off is a fixed visual; consumers needing a custom control can disable autoplay and drive it externally via `next()` on a timer.

### 4.8 Active-index detection from user scroll

After user-driven scroll (drag, swipe, touch flick, keyboard, indicator click), the component MUST update `activeIndex` to reflect the new position.

- Listen to `scrollend` on the viewport. When `scrollend` fires, compute the active index from `scrollLeft` / `scrollTop` divided by per-slide step.
- Fallback for browsers without `scrollend` (Safari < 17.4): listen to `scroll` and debounce via `setTimeout(150ms)`. The library MUST feature-detect `'onscrollend' in window` and pick the appropriate strategy at construction time. Both implementations MUST be tested.
- After computing the new index, emit `slideChange` with `trigger: 'pointer'` (touch swipe or mouse drag) or `trigger: 'keyboard'` (if the last navigation source was keyboard). Use a small "last interaction source" signal that prev/next/keyboard handlers set before triggering scroll.

The component MUST NOT use `IntersectionObserver` for active-index detection because IO is asynchronous and can produce stale readings during rapid scroll. IO IS used for the `aria-hidden`/`inert` toggling on individual slides (§ 2.3) — a separate concern.

---

## 5. Accessibility

### 5.1 Roles and structure

- **Container**: `role="region"` + `aria-roledescription="carousel"` + accessible name (via `ariaLabel` / `ariaLabelledBy`).
- **Viewport**: `tabindex="0"`. MUST receive keyboard focus when the user tabs into the carousel. MUST have `aria-live="polite"` when `autoplay === false`, `aria-live="off"` when `autoplay === true`.
- **Slides**: `role="group"` + `aria-roledescription="slide"` + per-slide `aria-label` per § 5.4. Non-visible slides MUST have `aria-hidden="true"` and `inert`.
- **Prev/Next directive hosts**: native `<button>` semantics; `aria-label` set from `labels.previous` / `labels.next` unless the consumer provided one. When at boundary AND `!loop`: `disabled` + `aria-disabled="true"`.
- **Indicators**: plain `<button>` elements inside a `role="group"` container. Each button has `aria-label` per § 7 and `aria-current="true"` when active.
- **Autoplay pause control**: native `<button>` with `aria-label` from `labels.pauseAutoplay` / `labels.resumeAutoplay`.

### 5.2 Color contrast and state conveyance

- Active indicator MUST be distinguishable from inactive indicators by more than color alone. The `dots` variant MUST scale the active dot ~1.5× larger; the `lines` variant MUST widen the active line; the `numbers` variant MUST apply a filled background (not only a color change). This satisfies WCAG 1.4.1.
- Overlay indicators MUST use a `bg-black/40` backdrop capsule to ensure indicator contrast against arbitrary slide content (most galleries have light and dark slides; the backdrop guarantees ≥3:1 contrast against the indicator color).

### 5.3 Keyboard

When the viewport (the focus-receiving inner element) has focus:

| Key | Action |
|---|---|
| `ArrowLeft` / `ArrowUp` (horizontal) / `ArrowUp` (vertical) | Equivalent to `prev()`. Trigger source `'keyboard'`. |
| `ArrowRight` / `ArrowDown` (horizontal) / `ArrowDown` (vertical) | Equivalent to `next()`. Trigger source `'keyboard'`. |
| `Home` | Scroll to slide 0. |
| `End` | Scroll to last slide (start of last page). |
| `PageUp` / `PageDown` | Same as Arrow keys but advance/retreat by a full page (`slidesToScroll`). For `slidesToScroll === 1` this is identical to Arrow keys. |
| `Space` / `Enter` | Pass through to slide content. The viewport itself MUST NOT consume these. |

In RTL mode, `ArrowLeft` and `ArrowRight` semantics swap (Left = next, Right = prev) for horizontal orientation. Vertical orientation is unaffected by RTL.

When `keyboard === false`, no keyboard handling is installed on the viewport. The viewport still has `tabindex="0"` (so users can tab into it to perceive its presence), but Arrow keys do nothing.

### 5.4 Slide accessible names

Each slide's `aria-label` is computed via the `labels.slideOf` template (default English: `"{index} of {total}"`):

- If `slide.label` is null: `aria-label="{n} of {N}"` where `n` is 1-based.
- If `slide.label` is provided: `aria-label="{n} of {N}: {slide.label}"`.

The implementation MUST recompute slide labels reactively when slides are added or removed at runtime.

### 5.5 Live region announcements

When `autoplay === false`, the viewport's `aria-live="polite"` setting causes screen readers to announce the visible slide content as the active index changes. This is the W3C APG carousel pattern for "manual rotation" mode.

When `autoplay === true`, `aria-live="off"` suppresses these announcements (so the screen reader is not constantly interrupted). This matches the APG "auto rotation" pattern.

The component MUST NOT use `LiveAnnouncer` from CDK — the live-region semantics are delivered via the `aria-live` attribute on the viewport itself.

### 5.6 Reduced motion

When `prefers-reduced-motion: reduce`:

- The viewport's `scroll-behavior` MUST be `auto` (instant scroll, not smooth). Apply via `motion-reduce:scroll-auto`.
- Any opacity-based transitions used for loop-jump masking MUST have `animation-duration: 0ms`. Define in `theme/_base.css`.
- Indicator and pause-control hover transitions MUST drop to 0ms (the standard `motion-reduce:transition-none` rule).

### 5.7 AXE conformance

The component MUST pass `@axe-core/playwright` automated checks at default configuration with no violations. Demo pages MUST carry an `<h1>` and proper landmark structure so the AXE harness can run.

### 5.8 W3C APG compliance

The component implements the W3C APG **"Carousel with Buttons for Rotation Control"** pattern with these explicit deviations documented:

- Indicators use `role="group"` not `role="tablist"`. The APG offers both patterns; we pick the simpler (non-tab) one to avoid implying panel selection semantics that don't exist here.
- The carousel does not provide a "rotation control" separate from the autoplay-pause control. The single pause/resume button per § 4.7 satisfies the APG requirement.

---

## 6. Animation

### 6.1 Slide transitions

Slide transitions are CSS-driven via `scroll-behavior: smooth`. No `@angular/animations` and no `animate.enter` / `animate.leave` are used for the slides themselves (slides remain in the DOM at all times; only the scroll position changes).

### 6.2 Loop-jump mask

The opacity flash that masks loop-jumps MUST be defined in `theme/_base.css`:

```css
@keyframes tw-carousel-loop-jump {
  0%   { opacity: 1; }
  40%  { opacity: 0.55; }
  100% { opacity: 1; }
}
.tw-carousel-loop-jump { animation: tw-carousel-loop-jump 200ms ease-in-out; }

@media (prefers-reduced-motion: reduce) {
  .tw-carousel-loop-jump { animation-duration: 0ms; }
}
```

The component applies and then removes the class after `animationend`. Implementation MUST clean up the class to allow re-triggering.

### 6.3 Hover/focus transitions

Prev/next/indicator/pause-control hover states use the standard `transition-colors duration-200 motion-reduce:transition-none` pattern.

### 6.4 No enter/leave for slides

Slides are not animated when added/removed at runtime in v1. Adding a slide simply extends the viewport; the carousel does not reflow its active position. (If consumers add a slide before the current `activeIndex`, the active position shifts — this is acknowledged and not auto-corrected in v1. Document in the API table.)

---

## 7. Internationalization

### 7.1 `TwCarouselLabels` interface

```typescript
export interface TwCarouselLabels {
  /** Accessible label for the Previous-slide button when the directive provides one. */
  previous: string;
  /** Accessible label for the Next-slide button. */
  next: string;
  /** Accessible label for the autoplay pause control. */
  pauseAutoplay: string;
  /** Accessible label for the autoplay resume control. */
  resumeAutoplay: string;
  /**
   * Template for indicator-button accessible names. Variable: {page} (1-based).
   * Default English: "Go to slide {page}".
   */
  indicator: string;
  /**
   * Template for per-slide accessible names with a custom label.
   * Variables: {index} (1-based), {total}, {label}.
   * Default English: "{index} of {total}: {label}".
   */
  slideOfWithLabel: string;
  /**
   * Template for per-slide accessible names without a custom label.
   * Variables: {index} (1-based), {total}.
   * Default English: "{index} of {total}".
   */
  slideOf: string;
}
```

### 7.2 Defaults and overrides

All keys are optional on the `labels` input — unset keys fall back to English defaults defined in a `DEFAULT_CAROUSEL_LABELS` constant. The component MUST resolve labels via a `computed()` that merges defaults with the input.

Consumers wanting global localization for all carousels in their app SHOULD use a `TW_CAROUSEL_LABELS` injection token (defined in `core/`) that provides default labels at the app level. The `labels` input takes precedence over the token.

### 7.3 RTL

When `document.dir === 'rtl'`:

- Horizontal orientation: prev/next semantics flip (visual right = previous slide; visual left = next slide). This is automatic with `direction: rtl` on a scrolled flex container in modern browsers, but the component MUST verify by manually mirroring scroll math in `prev()` / `next()` if needed. **Implementation note**: rather than fight the browser, the safest approach is to read `getComputedStyle(viewport).direction` once and invert the scroll-delta math when RTL.
- Indicator order MUST mirror (first indicator on the right).
- Vertical orientation: RTL has no effect.

The component MUST use logical CSS properties (`ms-*`, `me-*`, `ps-*`, `pe-*`) for any directional padding/margin that crosses the axis.

---

## 8. Performance

- Render is O(N) on slide count. All slides are mounted into the DOM at all times.
- `IntersectionObserver` is used **once per carousel** (a single observer instance watches all slides). The observer MUST be destroyed in `ngOnDestroy` via `DestroyRef`.
- `ResizeObserver` is used **once per carousel** to recompute slide widths when the viewport resizes (changing the effective `slidesPerView` math). Also destroyed via `DestroyRef`.
- The autoplay `setInterval` MUST be cancelled when `autoplay` transitions to `false` and when the component is destroyed.
- Scroll handlers MUST be installed with `{ passive: true }`.
- The `slideChange` and `activeIndexChange` events MUST NOT fire on every `scroll` event — only on `scrollend` (or the debounced fallback).
- The component MUST use `OnPush` change detection.
- The component MUST NOT trigger global state updates when its `activeIndex` changes — only its own outputs.

---

## 9. States and edge cases

| Scenario | Expected behavior |
|---|---|
| Empty carousel (no slides projected) | Viewport renders empty. Prev/next directives apply `disabled`. Indicators render empty list. No autoplay tick fires. No errors logged. |
| Single slide | Prev/next directives apply `disabled` (no navigation possible). Indicators render a single dot (active). Autoplay is a no-op (the single slide is always "current"). |
| `slidesPerView` larger than slide count | Effective `slidesPerView` is clamped to `slideCount`. `pageCount === 1`. Prev/next disabled. |
| Fractional `slidesPerView` (e.g., 1.2) | Slides flex to `calc((100% - 0.2 * gap) / 1.2)` so 1.2 slides are visible. The next slide "peeks" into view. Active index reflects the leftmost fully-visible slide. |
| `slidesToScroll > slidesPerView` | Allowed but unusual. The carousel jumps `slidesToScroll` per Next click — visible slides change wholesale. Document in API but do not warn. |
| `loop === true` with one slide | `next()` and `prev()` are no-ops (no wrap-target distinct from current). |
| Disabled slide in the middle | Skipped by next/prev/indicators/autoplay. Visually rendered at 50% opacity with `cursor-not-allowed`. Scroll-snap still includes it. |
| All slides disabled | Carousel is a no-op. No errors. |
| `autoplayInterval < 1000` | Clamped to `1000`. Logged once in dev mode. |
| `slidesPerView < 0.5` | Clamped to `0.5`. Logged once in dev mode. |
| Slides added at runtime (signal updates) | `contentChildren` reactivity picks up the new slides. `pageCount` recomputes. `activeIndex` is preserved if still valid (i.e., < new slide count), else clamped. |
| Slides removed at runtime such that `activeIndex >= slideCount` | `activeIndex` clamps to `slideCount - 1`. `activeIndexChange` fires with the new value. |
| `orientation` toggled at runtime | Layout reflows. Viewport switches between `overflow-x-auto` and `overflow-y-auto`. Scroll position is preserved as an index, not a pixel value: the new `scrollLeft` / `scrollTop` is computed from `activeIndex × step` after reflow. |
| User drags during autoplay tick | Autoplay pauses for `autoplayInterval * 2` then resumes (per § 4.7). The pause-control button does NOT toggle to "paused" visual state — that state is reserved for manual pauses. |
| Tab is hidden (page in background) | Autoplay pauses (`visibilityState`). Resumes on `visibilitychange` → `visible`. |
| Browser does not support `scrollend` | Falls back to debounced `scroll`. Behavior is identical at user-perceptible scale. |
| Browser does not support `IntersectionObserver` | The library MAY assume support (IO is baseline-supported in all Angular-supported browsers). If consumers target older browsers, they must polyfill IO themselves. |
| Container width is 0 (zero-width parent) | Carousel renders but cannot determine slide sizes. No errors. When the parent gains width, the `ResizeObserver` triggers and sizes settle. |
| Consumer projects multiple `<tw-carousel-indicators>` | Both render — both reflect the same active page. Not an error. |
| Consumer projects `[twCarouselPrev]` AND `[twCarouselNext]` on the same element | Logged once in dev mode; the element responds to `prev()` (alphabetical order of directive resolution is undefined; document the constraint). |
| Consumer omits `ariaLabel` and `ariaLabelledBy` | Dev-mode `console.warn` once per instance. Production builds MUST NOT log. |

---

## 10. Testing requirements

Per CLAUDE.md, tests use Vitest. Test files live next to source (`carousel.spec.ts`).

The spec MUST cover:

### 10.1 Rendering

- Default render of container with no children: `role="region"`, `aria-roledescription="carousel"`, viewport has `tabindex="0"`, no slides.
- Container with N slides renders the viewport plus N `<tw-carousel-slide>` children.
- Each `orientation` value (`horizontal`, `vertical`) renders the correct scroll axis.
- Each `gap` value applies the correct gap utility (assert by class presence).
- Each `snapAlign` value applies the correct `scroll-snap-align` on slides.
- `slidesPerView` (integer and fractional) sizes slides correctly (assert by computed style on a representative slide).

### 10.2 Inputs and outputs

- Setting `activeIndex` from the parent scrolls the viewport to the corresponding position.
- User-driven scroll updates `activeIndex` after `scrollend` (or debounced fallback). Use `vi.useFakeTimers()` to advance the debounce.
- `slideChange` fires exactly once per index change with the correct `trigger`:
  - Calling `next()` on the component instance → `trigger: 'programmatic'`.
  - Clicking a `[twCarouselNext]` host → `trigger: 'button'`.
  - Pressing ArrowRight on the focused viewport → `trigger: 'keyboard'`.
  - Clicking an indicator → `trigger: 'indicator'`.
  - Autoplay tick → `trigger: 'autoplay'`.
  - User scroll (simulated via `scrollLeft = value` + `scrollend`) → `trigger: 'pointer'`.
- `activeIndexChange` fires with the new index payload on the same triggers above.
- `autoplayPaused` fires with the correct reason on hover (`'hover'`), focus-in (`'focus'`), drag (`'interaction'`), visibility-hidden (`'visibility'`), and imperative `pause()` (`'manual'`).
- `autoplayResumed` fires when the pause condition clears.

### 10.3 Navigation

- `next()` advances by `slidesToScroll`.
- `prev()` retreats by `slidesToScroll`.
- At the last page with `loop === false`, `next()` is a no-op and `[twCarouselNext]` host has `disabled`.
- At slide 0 with `loop === false`, `prev()` is a no-op and `[twCarouselPrev]` host has `disabled`.
- With `loop === true`, `next()` past the last wraps to slide 0 (test by reading `activeIndex` after the call) and the loop-jump mask class is applied then removed after `animationend`.
- `scrollTo(index, { behavior: 'instant' })` jumps without smooth scroll.
- Disabled slides are skipped by `next()` / `prev()`.

### 10.4 Indicators

- `<tw-carousel-indicators>` renders `pageCount` buttons.
- Active button has `aria-current="true"`; others do not.
- Clicking a button calls `scrollTo` with the start-of-page index. `slideChange` fires with `trigger: 'indicator'`.
- Each `variant` (`dots`, `lines`, `numbers`) renders the correct DOM (assert by class or text content).
- Each `position` (`overlay`, `below`) applies the correct positioning class.

### 10.5 Keyboard

- ArrowRight on focused viewport → `next()` (with horizontal orientation).
- ArrowLeft → `prev()`.
- Home → `activeIndex === 0`.
- End → `activeIndex === slideCount - 1` (or start of last page).
- PageDown advances by a page; PageUp retreats by a page.
- ArrowUp/ArrowDown drive vertical orientation analogously.
- RTL mode: ArrowLeft → next; ArrowRight → prev (horizontal only). Use `document.dir = 'rtl'` in the test setup or apply via host element attribute.
- `keyboard === false` disables all key handlers (verify by asserting `next` is NOT called on ArrowRight).

### 10.6 Autoplay

- `autoplay === true` calls `next()` every `autoplayInterval` ms (use `vi.useFakeTimers()` + `vi.advanceTimersByTime`).
- `autoplayInterval < 1000` is clamped to 1000.
- `pauseOnHover === true` + pointer-over container → no advance.
- `pauseOnFocusIn === true` + descendant focused → no advance.
- `document.visibilityState = 'hidden'` (mock) → no advance.
- After user interaction (button click), autoplay pauses for `autoplayInterval * 2` then resumes.
- Imperative `pause()` halts indefinitely; `resume()` restarts.
- The pause-control button toggles between play and pause aria-labels; click triggers manual pause/resume.

### 10.7 Drag

- Pointer-down + move > 6px + up adjusts scroll position.
- Pointer-down + move < 6px + up does NOT adjust scroll and lets a `click` propagate to slide content.
- Touch pointer (`pointerType === 'touch'`) is ignored by the drag handler (native scroll handles it).
- `draggable === false` disables the drag handler (no scroll change on pointer drag).

### 10.8 Accessibility

- AXE passes on a representative DOM (5+ slides, autoplay on, indicators rendered, prev/next directives) with zero violations.
- Non-visible slides have `aria-hidden="true"` and `inert`.
- Visible slide(s) do NOT have `aria-hidden` or `inert`.
- Slide accessible names match `slideOf` / `slideOfWithLabel` templates.
- Prev/next hosts have `aria-label` set; if at boundary and `!loop`, also `aria-disabled="true"`.
- `aria-live` on viewport is `polite` when `autoplay === false`, `off` when `autoplay === true`.
- Consumer-provided `aria-label` on a prev/next host wins over the directive default.

### 10.9 Edge cases

- Empty carousel: no errors, no autoplay ticks, prev/next disabled.
- Single slide: navigation disabled, indicators show single dot.
- Adding a slide at runtime: `pageCount` recomputes; indicators reflect new count.
- Removing the active slide: `activeIndex` clamps to the new valid range.
- Toggling `orientation` at runtime: layout reflows, `activeIndex` preserved.

### 10.10 What NOT to test (per CLAUDE.md)

- Internal signal values or computed property values.
- Specific class strings beyond what is required to assert observable behavior.
- Implementation details of `IntersectionObserver` / `ResizeObserver` — mock them at the test setup and assert your usage, not their internals.

---

## 11. Open questions / deferred to v1.5

1. **Responsive `slidesPerView` (breakpoint-keyed object).** v1 ships a single `number`. v1.5 considers `slidesPerView: number | { sm: number; md: number; lg: number; xl: number }`. The implementation would use CSS container queries.
2. **Custom indicator templates.** v1 ships three built-in variants. v1.5 considers a `*twCarouselIndicator` template directive for fully custom indicators.
3. **Per-slide transition effects (fade, scale).** v1 ships translate-only via scroll. v1.5 considers a `transition` input on the container that swaps the slide layout from a single scrolling track to a stack of absolutely-positioned slides with opacity/scale transitions.
4. **Thumbnail-mode integration helper.** Currently consumers wire two carousels via two-way `[(activeIndex)]`. A `<tw-carousel-thumbs>` companion that auto-renders thumbs of the parent's slides could simplify this.
5. **Drag-to-reorder.** Out of scope. The carousel is presentational.
6. **`role="feed"` mode for infinite-loading content.** Different ARIA contract; would require pagination integration. Deferred.

---

## 12. Implementation constraints (recap of CLAUDE.md rules that bind this component)

- **Angular v21**: standalone components (no `standalone: true`), signal-based inputs/outputs/`model()`, `OnPush`, `host` object for bindings, native control flow (`@if` / `@for`).
- **Tailwind v4**: no CSS files in component dirs; all styling via `tv()` slots and host class bindings. The only CSS assets added are `.tw-scrollbar-hidden` and the `tw-carousel-loop-jump` keyframe in `theme/_base.css`.
- **Semantic tokens only**: never raw palette colors. Active indicator uses `bg-{color}-solid`. Backdrops for overlay indicators / pause control use `bg-black/40` (a deliberate fixed value for contrast over arbitrary slide content — document inline).
- **Input cap exception**: structural-layout primitive. Document the exception inline at the top of `carousel.ts` per the precedent set by `split`.
- **Selectors**: `tw-carousel`, `tw-carousel-slide`, `tw-carousel-indicators` (elements); `[twCarouselPrev]`, `[twCarouselNext]` (attribute directives).
- **Class names**: `CarouselComponent`, `CarouselSlideComponent`, `CarouselIndicatorsComponent`, `CarouselPrevDirective`, `CarouselNextDirective` — no `Tw*` prefix on class identifiers. Public **types** carry `Tw*` (e.g., `TwCarouselLabels`, `TwCarouselSlideChangeEvent`, `TwCarouselAutoplayReason`).
- **Secondary entry point**: `projects/ngx-tw/carousel/` with `index.ts`, `ng-package.json`, `carousel.ts`, `carousel.spec.ts`.
- **JSDoc**: every public input/output/model/method gets a one-line JSDoc describing purpose and default. No type repetition.
- **No `@angular/animations`**. Use CSS keyframes in `theme/_base.css` + `animate.enter` if any DOM enters/leaves (none in v1; the loop-jump uses a class toggle, not `animate.enter`).
- **No `ngClass` / `ngStyle`**. Use `[class]` / `[style]` bindings.
- **No `fakeAsync` / `tick`** in tests. Use `vi.useFakeTimers()` + `vi.advanceTimersByTime()`.
- **No `@HostBinding` / `@HostListener`**. Use `host` object.
- **No raw `neutral-*`**. Use surface/fg/border tokens for structural styling.
- **Focus-ring policy**: canonical outline ring on indicators, prev/next host (unless consumer overrides), and pause control. Viewport uses the canonical outline ring as well.

---

## 13. Acceptance criteria

The component is "done" when:

1. All inputs from § 2 are implemented with correct defaults and JSDoc.
2. All outputs from § 2 fire with the documented payloads and triggers.
3. The internal viewport DOM is correct (single scrollable element, scroll-snap CSS, `tabindex="0"`, `aria-live` toggling per autoplay).
4. Slide active/inactive `aria-hidden` + `inert` toggling is correct via `IntersectionObserver`.
5. Autoplay obeys all pause conditions and emits `autoplayPaused`/`autoplayResumed`.
6. WCAG 2.2.2 pause control is rendered when `autoplay === true`.
7. Prev/next directives correctly disable at boundaries when `!loop`, set `aria-label`, and respect consumer overrides.
8. Indicators render `pageCount` buttons (not `slideCount`), reflect `activePage`, and navigate on click.
9. Pointer drag works for mouse but not touch, with the 6px threshold preserving click semantics inside slides.
10. RTL works correctly for horizontal orientation (prev/next semantics flip; indicator order mirrors).
11. Loop-jump mask is applied + removed correctly without disturbing the scroll-end debounce.
12. Test coverage per § 10.
13. AXE zero violations on the demo pages (§ 5.7).
14. `theme/_base.css` carries `.tw-scrollbar-hidden` and the `tw-carousel-loop-jump` keyframe (including reduced-motion override).
15. The library's `public-api.ts` re-exports the new entry point. `tsconfig.lib.json`, `tsconfig.spec.json`, and `angular.json` are updated to include the new directory.
16. Compodoc generates non-empty API tables for `CarouselComponent`, `CarouselSlideComponent`, `CarouselIndicatorsComponent`, `CarouselPrevDirective`, `CarouselNextDirective` — every public member has a JSDoc.
17. Demo pages exist at `projects/demo/src/app/routes/carousel/{overview,examples,api}` and are wired into `app.routes.ts`, per the `demo-doc-page` skill.
