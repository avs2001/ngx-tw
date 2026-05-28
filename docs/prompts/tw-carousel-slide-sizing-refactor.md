# Prompt: Fix `tw-carousel` slide sizing wiring

This is a **small, focused** follow-up refactor of `projects/ngx-tw/carousel/carousel.ts`.
It is NOT a rewrite. The carousel is mature (~1600 lines) and its API surface,
autoplay logic, drag/keyboard/RTL handling, loop-jump sequencing, indicator
auto-hide, and ARIA wiring all stay exactly as they are. The work here is to wire
the per-slide `flex-basis` from the existing `slideBasis()` computed onto the
slide host so the viewport actually paginates one slide at a time when
`slidesPerView = 1`.

## Cross-reference to the prior refactor

This document is a follow-up to `docs/prompts/tw-carousel-refactor.md` (mostly
implemented). That spec's § B(k) asked the implementer to verify "the rendered
slide's computed width equals the viewport's `clientWidth`" at
`slidesPerView = 1`, but the corresponding regression test ran in **jsdom** (the
project's Vitest setup at `projects/ngx-tw/test-setup.ts`). jsdom does not
compute layout — `getComputedStyle(el).flexBasis` returns the literal CSS string
but `el.clientWidth` is always `0` regardless of whether `flex-basis` actually
resolves. The assertion passed vacuously, the bug shipped, and the wiring gap
described below has been in production since the prior refactor merged. The new
test plan in this spec **must** run in a browser (Playwright against the demo)
so layout is real.

## Bug reproduction

Reproduce against the running demo (`npm start`, port 4600) at
`/components/carousel`, "Hero gallery" example —
`projects/demo/src/app/routes/carousel/examples/carousel-examples.component.ts:188-208`.

Expected at `slidesPerView = 1` (the default): exactly one hero card fills the
viewport at a time; autoplay or indicator clicks scroll the viewport so the
previously visible card slides out and the next one slides in.

Observed: all four hero cards (Spring sale / New collection / Free shipping /
Members get more) render side-by-side in a single row inside the viewport.
Setting `activeIndex` from 0 to 3 (via autoplay tick or a programmatic
`scrollTo(3)`) updates the highlighted indicator dot but the viewport content
does not move — the user perceives only the dot changing. Screenshots provided
by the reporter show this state at activeIndex 0 and activeIndex 3 with
**identical** viewport content.

## Root cause

Confirmed by reading the code, not hypothesised.

`projects/ngx-tw/carousel/carousel.ts`:

- **Line 603–609** — `slideBasis` correctly computes
  `calc((100% - ((perView - 1) * gapPx)px) / perView)`. At `perView = 1` this
  resolves to `100%`. The value is right.
- **Line 431** — the viewport element has
  `[style.--tw-carousel-slide-basis]="slideBasis()"`. The variable is set on
  the viewport host.
- **Line 200–201** — the slide slot in the `tv()` config is
  `'flex-none snap-always min-w-0 ...'`. The accompanying comment claims
  `flex-basis` is "set inline from a CSS custom property", but no class in that
  string reads `var(--tw-carousel-slide-basis)`.
- **Line 343–350** — the slide component's host bindings include
  `[class]="slideClasses()"` only. There is **no** `[style.flex-basis]` and
  **no** `[style.--tw-carousel-slide-basis]` binding on the slide host.
- `projects/ngx-tw/theme/_base.css` greps clean for both `flex-basis` and
  `slide-basis` — no global CSS rule consumes the variable either.

Net effect: every slide receives `flex: none` (= `flex: 0 0 auto`), so the
slide's main-axis size collapses to its content's intrinsic width. When four
hero cards happen to fit in the viewport simultaneously, the user sees them all
at once and the programmatic `scrollTo({ left: slides[3].offsetLeft })` is a
no-op against the visual state (the target slide is already on-screen).

The viewport's CSS custom property is set but inherited by **nothing** that
applies it.

## Fix directive

The implementer chooses one of two options. **Option (a) is recommended.**

### Option (a) — recommended: slide host reads `slideBasis()` directly via host style binding

Add a host style binding on `CarouselSlideComponent` that resolves
`carousel.slideBasis()` and applies it as inline `flex-basis`. The slide already
holds a `carousel` reference via DI (line 361), so the access is free.

Concretely (directive, not code):

1. On `CarouselSlideComponent`'s `host` object (lines 343–350), add a
   `[style.flex-basis]` binding wired to a private computed that returns
   `this.carousel.slideBasis()`. JSDoc the computed in one line.
2. Remove the misleading comment on lines 198–201 of the `tv()` `slide` slot.
   Replace with: `// Per-slide. flex-basis is applied via host style binding on CarouselSlideComponent (reads carousel.slideBasis()).`
3. Remove the `[style.--tw-carousel-slide-basis]="slideBasis()"` binding from
   the viewport element (line 431). It is no longer consumed by anything.
4. Mark the `slideBasis()` computed (line 603–609) as still `@internal` but
   update its JSDoc one-liner to: "Per-slide `flex-basis`. Read by each
   `CarouselSlideComponent` host style binding to size slides along the
   viewport's main axis. Reactive."

Why this is the recommended path: zero coupling to `theme/_base.css`, no CSS
selector touching component-internal markup, all sizing logic lives in TS where
the spec tests can exercise it directly.

### Option (b) — alternative: keep the CSS variable, add a theme rule

Keep the viewport's `[style.--tw-carousel-slide-basis]` binding. Add a CSS rule
in `projects/ngx-tw/theme/_base.css` that targets the slide as a child of the
viewport and applies `flex-basis: var(--tw-carousel-slide-basis)`. Reasonable
selector: `[data-tw-carousel-viewport] > tw-carousel-slide`.

Allowed if the implementer prefers it. Two costs vs option (a):
- The library now owns a structural CSS rule outside the `tv()` slot, which the
  rest of the carousel deliberately avoids.
- The selector pins the component's DOM relationship (slide must be a direct
  child of the `data-tw-carousel-viewport` element); option (a) does not.

If option (b) is chosen, **do not also** remove the viewport's variable setter
(item 3 above). Items 1 and 4 from option (a) do not apply.

Pick exactly one option. Do not mix them.

## Vertical orientation

The carousel supports `orientation="vertical"` (line 222–227 of the `tv()`
config). In vertical mode `flex-direction: column` is applied to the viewport,
which means `flex-basis` is interpreted along the column axis (i.e., it sizes
the slide's **height**). A single binding therefore covers both orientations —
do **not** add a parallel `[style.height]` binding for the vertical case. The
existing `slideBasis()` formula uses `100%`-based arithmetic which the browser
resolves against the appropriate dimension for each `flex-direction`. The
vertical regression test below verifies this.

## Test plan

This is the load-bearing section. The prior refactor's verification step ran
in jsdom and missed the bug. **The new regression test must run in a real
browser**, which in this repo means **Playwright against the demo dev server**
(`playwright.config.ts` at the repo root; `webServer` auto-starts
`npm start` on port 4600).

There is no carousel Playwright spec today (greps `e2e/specs/01-components/`
clean for `carousel`). Create
`e2e/specs/01-components/carousel.spec.ts` modelled on the existing per-
component specs (e.g., `e2e/specs/01-components/tabs.spec.ts`). A page object
(`e2e/pages/carousel.page.ts`) is optional — inline locators are fine for the
small assertion set here, but follow whichever convention the implementer
finds in neighbouring component specs.

### Required assertions

**Horizontal `slidesPerView = 1` (the Hero gallery example):**

1. Navigate to `/components/carousel`. Wait for the Hero gallery example
   region (the `<tw-carousel ariaLabel="Featured promotions">` host —
   locate by `[aria-label="Featured promotions"]`).
2. Pause autoplay first (the example renders the pause control because
   `autoplay = true`; click it, or scope the carousel under test by setting
   up a query-param flag in the demo if cleaner — implementer's call as long
   as the tests are not racing autoplay).
3. Read `getBoundingClientRect()` and `clientWidth` on the viewport
   (`[data-tw-carousel-viewport]` within the example region) and on each
   `tw-carousel-slide` element.
4. Assert: each slide's `getBoundingClientRect().width` equals the viewport's
   `clientWidth` within **1px tolerance** for sub-pixel rounding.
5. Drive `activeIndex` from 0 to 3. Easiest path: click the fourth
   indicator dot (`<tw-carousel-indicators>` button with index 3). This
   exercises the same `_scrollToIndex` path autoplay would.
6. Wait for the viewport's `scrollend` event, falling back to a small
   `page.waitForTimeout(200)` poll if `scrollend` is not yet supported in
   the chosen browser project (Playwright's chromium projects support it;
   firefox/webkit projects may need the polling fallback).
7. Assert: `viewport.scrollLeft` equals `slides[3].offsetLeft` within 1px.
8. Assert: `slides[0].getBoundingClientRect().right` is strictly less than
   `viewport.getBoundingClientRect().left` — i.e., slide 0 has scrolled off
   the left edge of the viewport.

**Vertical orientation regression:**

The Hero gallery is horizontal. Add a small dedicated demo region or use an
existing vertical example if one exists (search
`projects/demo/src/app/routes/carousel/examples/` for an `orientation="vertical"`
attribute; if absent, the implementer adds a minimal vertical example to the
page — four slides, fixed viewport height, `slidesPerView = 1`).

9. Repeat the geometry checks against the vertical example: each slide's
   `clientHeight` equals viewport `clientHeight` within 1px, scrolling to
   index 3 leaves slide 0 above the viewport
   (`slides[0].getBoundingClientRect().bottom < viewport.getBoundingClientRect().top`).

### What the existing jsdom spec must (and must not) do

`projects/ngx-tw/carousel/carousel.spec.ts` stays as is. **Do not** add new
geometry assertions to it — jsdom cannot validate them. The single
`min-w-0`-related spec line introduced by the prior refactor (per § B(k)) MAY
remain as a no-op smoke check, but the load-bearing regression coverage now
lives in the Playwright spec above. Do not delete the existing jsdom suite.

Add one targeted jsdom assertion: mount a `<tw-carousel-slide>` inside a
`<tw-carousel>`, query the slide's host element, and assert that
`hostEl.style.flexBasis` is the expected `calc(...)` string returned by
`slideBasis()` (option (a) only — option (b) leaves the inline style empty
and a different jsdom check is appropriate, e.g., assert the
`--tw-carousel-slide-basis` variable on the viewport). This catches the
binding wiring without depending on layout.

### Vitest rules (recap)

No `fakeAsync` / `tick`. Use `async/await` with `fixture.whenStable()` if
change detection needs to settle before reading host styles in the jsdom
assertion.

## Acceptance criteria

The fix is "done" when every box below is checked.

- [ ] **Bug reproduction:** mounting the Hero gallery example
  (`projects/demo/src/app/routes/carousel/examples/carousel-examples.component.ts:188-208`)
  in a browser shows exactly one slide in the viewport at a time. Setting
  `activeIndex` from 0 to 3 (via indicator click or programmatic
  `scrollTo(3)`) visibly scrolls the viewport so only slide 3 is visible.
- [ ] The slide host's resolved `flex-basis` (option a) or the viewport-
  scoped CSS rule (option b) consumes `slideBasis()` and the slide's
  rendered main-axis size matches the viewport's main-axis size within
  1px for `slidesPerView = 1` in **both** horizontal and vertical
  orientations.
- [ ] The misleading comment at `carousel.ts:198–201` is replaced with one
  accurate sentence pointing at the host style binding (option a) or the
  theme CSS rule (option b).
- [ ] If option (a) was chosen, the viewport's
  `[style.--tw-carousel-slide-basis]` binding (line 431) is removed.
- [ ] If option (b) was chosen, the new theme CSS rule lives in
  `projects/ngx-tw/theme/_base.css` and is the only new CSS shipped by the
  fix.
- [ ] A Playwright spec at `e2e/specs/01-components/carousel.spec.ts`
  exercises the horizontal and vertical assertions enumerated in the test
  plan, runs under the existing `chromium-light` project, and fails
  reproducibly on `develop` at the SHA before this fix (the implementer
  verifies this by checking out the prior SHA, running the new spec,
  observing failure, then returning to the fix branch and observing
  success).
- [ ] One added jsdom assertion in `projects/ngx-tw/carousel/carousel.spec.ts`
  proves the host style binding wiring (option a) or the variable
  inheritance setup (option b) without depending on layout.
- [ ] All other existing tests (carousel jsdom suite, neighbouring component
  specs, the full Playwright suite for unrelated components) remain green.

## Out of scope — what NOT to change

- **No** public input / output / model changes on `CarouselComponent`,
  `CarouselSlideComponent`, `CarouselIndicatorsComponent`,
  `CarouselPrevDirective`, or `CarouselNextDirective`.
- **No** selector or class-name changes (`tw-carousel`, `tw-carousel-slide`,
  `tw-carousel-indicators`, `twCarouselPrev`, `twCarouselNext` all stay).
- **No** changes to autoplay logic (start/stop, pause-on-hover/focus/drag/
  document-hidden, resume emissions, the pause control button).
- **No** changes to pointer-drag logic (the 6px threshold, the
  pointerType === 'touch' skip, the `DestroyRef` cleanup added by the prior
  refactor).
- **No** changes to keyboard handlers (Arrow keys, Home, End, PageUp,
  PageDown).
- **No** changes to RTL math (`_rtlSign`, the single-multiplication idiom
  from the prior refactor's § B(a)).
- **No** changes to loop-jump sequencing (`_loopJumpTo`, the
  `tw-carousel-loop-jump` class, the keyframe at `theme/_base.css:250–256`,
  the deferred instant scroll from the prior refactor's § B(e)).
- **No** changes to the indicator auto-hide behaviour for
  `slidesPerView !== 1` (the prior refactor's § A1 is correct and stays).
- **No** changes to `_lastReachableIndex`, `isAtEnd`, `_handleScrollSettled`,
  `_scrollToIndex`, or `next()` — the prior refactor's § A2 / A3 are correct
  and stay.
- **No** changes to dev-mode warnings (the `effect()` + dedupe pattern from
  the prior refactor's § B(i)).
- **No** changes to `docs/requirements/carousel.requirements.md` — this is a
  wiring bug, not a requirements change.
- **No** new component CSS files. Option (b)'s rule lives in
  `theme/_base.css`, alongside the existing `tw-carousel-loop-jump`
  keyframe and the `tw-scrollbar-none` utility. No other CSS file gets
  touched.
- **No** `@HostBinding` / `@HostListener` / `ngClass` / `ngStyle` /
  `@angular/animations` — standard CLAUDE.md rules.
