# Prompt: Refactor `tw-carousel` for ngx-tw

This is a **refactor** of an already-implemented component. The component lives at
`projects/ngx-tw/carousel/carousel.ts` and ships in the `ngx-tw/carousel` entry point.
The original greenfield spec is `docs/prompts/tw-carousel.md`; the normative behavioral
spec is `docs/requirements/carousel.requirements.md`. **Do not re-derive the full API
from those documents.** Read them for context only. The API surface — selectors, class
names, inputs, outputs, types, slot directives — stays as it is. This document
enumerates only what must change.

---

## Context to read before starting

1. `.claude/CLAUDE.md` — conventions, semantic tokens, focus-ring policy, no
   `@angular/animations`, OnPush, signal APIs, JSDoc requirements, Vitest test rules
   (no `fakeAsync` / `tick`).
2. `docs/prompts/tw-carousel.md` — the existing implementation prompt. Reference only.
   Anything in this refactor prompt overrides anything there.
3. `docs/requirements/carousel.requirements.md` — normative behavior. The section
   numbers referenced below (§ 4.5, § 5.5, § 9, etc.) point into this doc.
4. `projects/ngx-tw/carousel/carousel.ts` — the file being refactored. Line numbers
   in this prompt refer to this file as it stands today.
5. `projects/ngx-tw/carousel/carousel.spec.ts` — the existing Vitest suite. Add to
   it; do not rewrite it.
6. `projects/ngx-tw/theme/_base.css` — the loop-jump keyframe already exists at
   lines 250–256, with a reduced-motion override at line 361. See issue B(e) for
   the sequencing problem with how the component currently uses it.

---

## Summary of issues to fix

The current implementation has correctness, accessibility, and lifecycle defects
that the user has observed in production. Each issue below is grouped with a
directive ("what must be true after the refactor") rather than a code template —
the implementer chooses how to get there. Where the user has stated a preference
(A1, B(h), B(j)), it is recorded as the directive.

### A. User-reported behavioral defects

#### A1. Indicators are conceptually broken when `slidesPerView !== 1` (issue #1)

When more than one slide is visible at a time, "one indicator per page" does not
match what the user sees in the viewport. A dot can never match a viewport that
shows two or more slides.

**Directive.** `<tw-carousel-indicators>` MUST render no `<button>` children when
`carousel.slidesPerView() !== 1`. Implement by making the `_pages` computed
return `[]` (or by guarding the `@for` template) when that condition is true.
The host element MAY remain in the DOM (so layout stays consistent and the
component re-renders when `slidesPerView` returns to `1`) but the buttons MUST
NOT.

In dev mode (`isDevMode()`), log a one-time `console.warn` from the indicators
component the first time it observes `slidesPerView !== 1`:

> `[tw-carousel-indicators] Indicators are only shown when slidesPerView === 1. Got slidesPerView=<n>; indicators are hidden until slidesPerView returns to 1.`

Production builds MUST NOT log.

This is a **behavior change, not an API change.** No inputs added or removed.
Update any demo pages that pair `<tw-carousel-indicators>` with
`slidesPerView > 1` (e.g., a testimonials-with-peek example) — either remove
the indicators from those examples or change them to use a Prev/Next directive
pair. Surface the affected demo pages in the PR description.

#### A2. `activeIndex` desyncs from the front-of-viewport slide (issue #2)

Screenshot evidence: 4 slides, `slidesPerView = 1`, the *last* slide is centred
in the viewport, but the *third* indicator dot is highlighted. The math in
`_handleScrollSettled` clamps to `slides().length - 1` instead of the last
*reachable* index, and the resulting `activeIndex` then yields an `activePage`
that lies outside the indicators array. The same defect surfaces in
`_scrollToIndex` (line ~1012) where `step = (dimension + gapPx) / perView` is a
synthesized value rather than the actually-rendered geometry, and in `isAtEnd`
(line ~588) where `activeIndex >= count - perView` produces a fractional
comparator.

**Directive.** Introduce a single private computed on the carousel:

```
_lastReachableIndex = max(0, slideCount - ceil(effectiveSlidesPerView))
```

Every site that today asks "where is the last legal landing position?" MUST go
through this signal:

- `isAtEnd` reads `activeIndex() >= _lastReachableIndex()`.
- The clamp in `_handleScrollSettled` reads `Math.min(newIndex, _lastReachableIndex())`.
- The past-last-page check in `next()` (line ~926) compares against
  `_lastReachableIndex()` rather than `count - perView + 1`.

This single helper resolves audit items (b) and (c) at the same time.

#### A3. Programmatic scroll lands between snap points (issue #3)

`_scrollToIndex` computes the target pixel position arithmetically from
`clamped * step`. When `slidesPerView` is fractional, when the consumer resizes
the container, or when gap rendering differs slightly from the `GAP_PX` table,
the computed pixel can fall between two snap points and the browser snaps back
to the previously-visible tile.

**Directive.** Reading and writing the viewport scroll position MUST use the
*actually rendered* slide geometry, not arithmetic from `slidesPerView × gap`.

- `_scrollToIndex(index, behavior)` MUST resolve the target slide element via
  `slides()[clamped]._hostEl` and use `slide.offsetLeft` (horizontal) or
  `slide.offsetTop` (vertical), then `viewport.scrollTo({ left|top, behavior })`.
  For RTL, apply `_rtlSign()` as the existing code does (after fixing audit (a)).
- `_handleScrollSettled` MUST identify the new active index by finding the
  slide whose `offsetLeft` / `offsetTop` is closest to `viewport.scrollLeft` /
  `viewport.scrollTop` (after RTL normalization). This eliminates the
  `step = (clientWidth + gap) / perView` synthesis entirely and aligns the
  read-back with the same geometry the browser snapped to.

Both directions (programmatic write and user-scroll read) MUST consult the same
DOM-resolved offsets so they cannot diverge.

`scrollIntoView` is rejected: it has cross-browser inconsistencies around
scroll-snap interaction and obscures the index attribution we still need for
`slideChange` triggers.

### B. Code-audit defects

#### B(a). RTL sign is a no-op (line ~891)

`currentScroll = Math.abs(viewport.scrollLeft) * this._rtlSign() * this._rtlSign()`
multiplies by `_rtlSign()` twice. `(-1) * (-1) === 1` for RTL; `1 * 1 === 1` for
LTR. The sign cancels itself.

**Directive.** After issue A3 lands (offset-based reading), reduce the RTL math
to a single, explicit normalization step: read `viewport.scrollLeft`, take its
absolute value for browsers that report negative scroll values in RTL, then
compare to slide `offsetLeft` values. The single-multiplication idiom is
acceptable for `_scrollToIndex` writes (`viewport.scrollTo({ left: target *
_rtlSign() })`). No double-multiplication anywhere.

#### B(b) + B(c). `isAtEnd` and `next()` past-last-page checks (lines ~588 and ~926)

Both subsumed by issue A2's `_lastReachableIndex` helper. Once that helper
exists and is consulted in both sites, the audit items resolve.

#### B(d). `scrollTo` ignores `prefers-reduced-motion` (line ~967)

The JSDoc claims `scrollTo` defaults to `'smooth'` "unless prefers-reduced-motion:
reduce" but the implementation hardcodes `'smooth'`.

**Directive.** Honor the JSDoc. `scrollTo(index)` (no explicit `behavior`) MUST
resolve to `'auto'` (instant) when `window.matchMedia('(prefers-reduced-motion:
reduce)').matches` is true, and `'smooth'` otherwise. When the caller passes an
explicit `behavior`, respect it verbatim.

Keep the public `opts.behavior` signature as `'smooth' | 'instant'` (no API
change). Internally, map `'instant'` to the `'auto'` value when passing to
`ScrollToOptions` (the standard spec literal; `'instant'` is non-standard but
widely supported and may be passed through verbatim — either works, document
the choice inline).

#### B(e). Loop-jump opacity mask is mis-timed (lines ~1039–1056)

The user's audit asserted "no CSS rule defines what that class does." That is
incorrect — `theme/_base.css:250-256` defines the keyframe (1 → 0.55 → 1 over
200ms) with the reduced-motion override at line 361. The real bug is sequencing:
`_loopJumpTo` adds the class, then immediately calls `_scrollToIndex(index,
'instant')`. The keyframe is at frame 0 (opacity 1.0) when the instant scroll
fires, so the user sees the jump *before* the opacity dip.

**Directive.** Defer the instant scroll until the opacity dip is on-screen so
the swap happens under the mask. Keep the existing keyframe (1 → 0.55 → 1)
unchanged — the visual contract of "brief dip across the jump" is correct; only
the sequencing is wrong. The implementer chooses the deferral mechanism
(double-`requestAnimationFrame`, `setTimeout(~80ms)` aligned with the keyframe's
40% point, or another approach), but the end state MUST be: the old content
remains visible at opacity 1, fades toward opacity ≈ 0.55, the instant scroll
happens at that low point, then the new content fades back to opacity 1. Do
NOT restructure the keyframe to start at opacity 0 — that introduces a
visible blank-flash on every wrap.

Restore the class on `animationend` as today. Verify the reduced-motion
override at `_base.css:361` still zeroes the animation duration (it should,
unchanged).

#### B(f). `prevPaused` initial value is fragile (lines ~704–717)

The user's walkthrough confirmed this is not a runtime bug today, only fragile
under future changes.

**Directive.** Do not change runtime behavior. Add an inline comment above the
`let prevPaused = false;` declaration explaining that the initial `false` is
correct only because `autoplay` defaults to `false`; if that default ever
changes, this needs rethinking. No code change required, just the comment.

#### B(g). Pointer-drag tear-down race (lines ~1091–1111)

`_onPointerDown` adds `pointermove`/`pointerup`/`pointercancel` listeners to
`window` inside closures. If the component is destroyed mid-drag, these
listeners leak. The current destroy path tears down viewport-attached
listeners only.

**Directive.** Wire the drag listeners through `DestroyRef`. The cleanest
shape: store the active drag's cleanup closure on a private field
(`private _dragCleanup: (() => void) | null = null`), assign it inside
`_onPointerDown`, invoke from `_onPointerUp` *and* from a `DestroyRef.onDestroy`
hook (idempotent — second call is a no-op when the field is `null`).

#### B(h). Inline pause-control SVG vs `<tw-icon>` (lines ~448–456)

The pause-control button renders inline `<svg>` markup. The library ships
`<tw-icon>` in the `ngx-tw/icon` entry point.

**Directive.** Keep the inline SVG. Reason: `ngx-tw/carousel` would otherwise
take a hard runtime dependency on `ngx-tw/icon` plus its icon-registration
provider, which the consumer app may or may not have wired. Two structural
primitives should not couple through an icon registry. Replace the existing
two-line `<!-- Play glyph -->` / `<!-- Pause glyph -->` comments with one
explicit JSDoc paragraph above the `<button>` block explaining the deliberate
decision:

> Pause/play glyphs are inline SVG (not `<tw-icon>`) to avoid coupling the
> carousel entry point to `ngx-tw/icon`'s registry. The carousel must work
> without consumer icon registration.

No code change required beyond the comment.

#### B(i). Dev-mode warnings only fire once at construction (lines ~664–685)

`afterNextRender` runs once. If a consumer flips `slidesPerView` to `0.1` after
mount, the threshold warning never fires.

**Directive.** Move all three dev warnings (missing label, low autoplay
interval, low `slidesPerView`) into an `effect()` so they re-evaluate when the
inputs change. Guard each warning with a per-warning "already emitted" flag
(closure-scoped booleans or a `Set<string>`) so each fires at most once per
component instance. Keep the `isDevMode()` gate. Production builds MUST NOT
log.

#### B(j). `activeIndex` semantics: slide index vs page anchor

The JSDoc says "0-based index of the first visible slide in the current page,"
but internal sites occasionally treat it as a page anchor. The user wants this
disambiguated.

**Directive.** `activeIndex` is a **slide index**, full stop. The JSDoc stays
correct. Every site that uses `activeIndex` as a page anchor must instead read
`activePage()` (or compute `activePage * effectiveSlidesToScroll` if it needs
the slide index of the active page's first slide). No input renames. No
breaking changes. The migration is internal.

Specifically audit and resolve any use of `activeIndex` in the indicator
component, the prev/next directives, and the autoplay path. The indicators
component already uses `carousel.activePage()` correctly; verify nothing else
needs to change.

#### B(k). `min-w-0` on slides at `slidesPerView === 1`

Not a defect. The implementer must verify only — add one focused spec line:
mount with `slidesPerView = 1`, assert that the rendered slide's computed
width equals the viewport's `clientWidth` (i.e., `min-w-0` does not override
the `flex-basis: 100%` via the CSS custom property). If the assertion fails,
fix; otherwise leave the class string as-is.

#### B(l). Spec file coverage gaps

The existing `carousel.spec.ts` is ~520 lines and covers most of the
requirements doc's § 10. It MUST be extended with the regression tests called
out in the "Test plan additions" section below. Do not rewrite existing tests.

---

## API impact and migration notes

**No breaking changes to inputs, outputs, types, selectors, or class names.**
Every behavior change in this refactor preserves the existing public surface.

| Surface | Before | After | Migration |
|---|---|---|---|
| `slidesPerView !== 1` + `<tw-carousel-indicators>` | Renders one button per page (broken UX) | Renders zero buttons | Audit demo pages that pair indicators with `slidesPerView > 1`; remove the indicators from those examples or switch to Prev/Next. Document in PR description. |
| `<tw-carousel> isAtEnd` | True when `activeIndex >= count - perView` (off-by-one for fractional `perView`) | True when `activeIndex >= _lastReachableIndex` | None — observable behavior change only at fractional `slidesPerView`. |
| `scrollTo(i)` (no explicit `behavior`) | Always smooth | Smooth unless `prefers-reduced-motion: reduce` is set | None — matches the existing JSDoc claim. |
| Loop-jump visual | Brief opacity dip after the jump (mis-timed) | Brief opacity dip across the jump (correctly sequenced) | Subtle visual difference. No API change. |
| Pointer drag mid-destroy | Listeners leak | Listeners cleaned up | None observable. |

If the user later wants any input renamed (e.g., `activeIndex` → `activeSlideIndex`),
that is a separate PR with a deprecation cycle. This refactor does not change input
names.

---

## Implementation directives (concrete, with file references)

All line numbers refer to `projects/ngx-tw/carousel/carousel.ts` as it stands today.

1. **Add `_lastReachableIndex` computed on `CarouselComponent`.** Place next to
   `pageCount` and `activePage` (around line 580). Public readonly
   `Signal<number>` so the directives can read it without going through a
   `_*` accessor. JSDoc: "The highest slide index the carousel can land on
   given the current `slidesPerView`. Reactive."

2. **Refactor `isAtEnd` (line ~588)** to read `activeIndex() >= _lastReachableIndex()`.

3. **Refactor `_handleScrollSettled` (lines ~878–906)** to:
   - Find the closest slide via `offsetLeft` / `offsetTop` instead of arithmetic.
   - Use `_lastReachableIndex()` as the clamp ceiling.
   - Remove the double `_rtlSign()` multiplication (audit (a)).

4. **Refactor `_scrollToIndex` (lines ~996–1037)** to read the target slide's
   `offsetLeft` / `offsetTop` and pass that directly to `viewport.scrollTo`.
   Remove the `step = (dimension + gapPx) / perView` arithmetic.

5. **Refactor `next()` (lines ~919–939)** to compare the candidate target
   against `_lastReachableIndex()` rather than the existing
   `count - effectiveSlidesPerView() + 1` expression.

6. **Refactor `scrollTo` (line ~967)** to honor reduced-motion. Add a private
   helper `_resolveBehavior(opts?: { behavior?: 'smooth' | 'instant' })` that
   returns the explicit value when provided, otherwise checks
   `matchMedia('(prefers-reduced-motion: reduce)').matches` and returns the
   instant value when true, `'smooth'` otherwise. Internal sites that pass
   `'instant'` (the `_loopJumpTo` call, the `ResizeObserver` callback)
   continue to pass it explicitly.

7. **Refactor `_loopJumpTo` (lines ~1039–1056)** so the instant scroll is
   deferred into the opacity-dip frame of the existing keyframe. Implementer's
   choice of deferral mechanism (double-rAF or aligned `setTimeout`). Do NOT
   change the keyframe in `theme/_base.css` — the existing
   `1 → 0.55 → 1` shape is correct; only the JS sequencing is wrong.

8. **Refactor dev warnings (lines ~666–685)** from `afterNextRender` to a
   single `effect()` with per-warning suppression flags. Keep the
   `isDevMode()` gate.

9. **Refactor `_onPointerDown` (lines ~1091–1112)** to store the per-drag
   cleanup function on a private field and invoke it from `_onPointerUp` and
   from a `DestroyRef.onDestroy` hook. Install the hook in the constructor
   next to the existing `_teardownViewport` registration (line ~729).

10. **Add the inline comment for `prevPaused` initial value (line ~704)** —
    one sentence noting the autoplay-defaults-to-false dependency.

11. **Add the JSDoc comment block for the inline pause SVG (above line ~440)**
    explaining the no-`<tw-icon>` decision.

12. **Refactor `<tw-carousel-indicators>` (lines ~1304–1331)** so:
    - The `_pages` computed returns `[]` when
      `carousel.slidesPerView() !== 1`.
    - A dev-mode effect logs the warning once per component instance when
      the condition first becomes true.
    - The component MUST still resolve `tv()` classes (consumers may toggle
      `slidesPerView` back to 1, at which point indicators reappear without
      remounting).

13. **Verify the new `activeIndex`-as-slide-index discipline (issue B(j))** —
    grep the file for `activeIndex()` and confirm every consumer treats it
    as a slide index, not a page anchor.

---

## Test plan additions (`carousel.spec.ts`)

Add the following to the existing suite. Do not rewrite existing passing tests.
Vitest only — no `fakeAsync` / `tick`. Use `vi.useFakeTimers()` /
`vi.advanceTimersByTime()` for timer-driven assertions; `async/await` +
`fixture.whenStable()` for change detection.

**Settle-math correctness (issue A2):**
- With 4 slides, `slidesPerView = 1`, `slidesToScroll = 1`: scroll the viewport
  to the last slide's `offsetLeft`, dispatch `scrollend`, assert
  `activeIndex() === 3` and that the indicators' fourth button (index 3) has
  `aria-current="true"`.
- With 4 slides, `slidesPerView = 2`: scroll to the last reachable position,
  assert `activeIndex() === 2` (not 3) and `isAtEnd() === true`.
- Verify `_lastReachableIndex()` equals `max(0, count - ceil(perView))` for
  three matrix cases: `(count=4, perView=1) → 3`, `(count=4, perView=2) → 2`,
  `(count=4, perView=2.5) → 1`.

**Indicators auto-hide (issue A1):**
- With `slidesPerView = 1`: `<tw-carousel-indicators>` renders N buttons.
- With `slidesPerView = 2`: `<tw-carousel-indicators>` host renders but its
  `<button>` children's count is 0.
- With `slidesPerView = 3.2`: same — zero `<button>` children.
- Toggling `slidesPerView` from `1` to `2` and back to `1` re-renders the
  indicator buttons (no destroy/remount of the host).
- Dev-mode `console.warn` fires once per instance the first time
  `slidesPerView !== 1`. Spy on `console.warn`.

**RTL `_rtlSign` applied exactly once (audit (a)):**
- Wrap the carousel host in `<div dir="rtl">` (or set the direction via
  `Object.defineProperty(getComputedStyle(viewport), 'direction', ...)` if the
  attribute approach doesn't take in jsdom).
- Programmatically scroll to slide 1 via `carousel.scrollTo(1)`, dispatch
  `scrollend`, assert `activeIndex() === 1`.
- Regression assertion: the new offset-based `_handleScrollSettled` produces a
  result consistent with the slide's `offsetLeft` after a single sign
  normalization — not after two.

**`scrollTo` reduced-motion (audit (d)):**
- Mock `window.matchMedia('(prefers-reduced-motion: reduce)')` to return
  `matches: true` via
  `vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true, ... } as MediaQueryList)`.
- Call `carousel.scrollTo(1)` (no `behavior`), spy on `viewport.scrollTo`,
  assert the call's `behavior` is the instant value (whichever literal the
  implementer chose internally — assert what is passed to `scrollTo`).
- Without the matchMedia mock (default), the same call uses `behavior: 'smooth'`.
- Explicit `carousel.scrollTo(1, { behavior: 'instant' })` always uses the
  instant behavior, regardless of the media query.

**Pointer-drag cleanup on destroy (audit (g)):**
- Mount the fixture, dispatch a `pointerdown` with `pointerType: 'mouse'` on
  the viewport, dispatch a `pointermove` that crosses the 6px threshold.
- Spy on `window.removeEventListener`. Destroy the fixture
  (`fixture.destroy()`).
- Assert `removeEventListener` was called for `pointermove`, `pointerup`, and
  `pointercancel`.

**Loop-jump mask sequencing (audit (e)):**
- With `loop: true`, `count = 3`, `activeIndex = 2`, call `carousel.next()`.
- Assert the `tw-carousel-loop-jump` class is on the viewport synchronously
  after the call. (Implementer's choice whether to also expose an
  `_isLoopJumping()` accessor for the test; the class itself is the
  observable signal.)
- Verify the instant `viewport.scrollTo` call happens AFTER the next
  animation frame, not synchronously with the class-add. Easiest path: spy
  on `viewport.scrollTo` and on `requestAnimationFrame`; assert ordering.
- Dispatch `animationend` on the viewport; assert the class is removed.

**`min-w-0` does not collapse single-slide width (issue B(k)):**
- Mount with `slidesPerView = 1` and a single slide containing a long line of
  text. Assert the slide's computed `clientWidth` equals the viewport's
  `clientWidth` (allow 1px tolerance for sub-pixel rounding in jsdom).

**Dev warnings re-evaluate on input change (audit (i)):**
- Mount with `slidesPerView = 1`. Assert no `console.warn` for the
  `slidesPerView` floor.
- Set `slidesPerView = 0.1` via `fixture.componentRef.setInput(...)`.
- Assert `console.warn` fires once for the `slidesPerView` floor.
- Set `slidesPerView = 0.05`. Assert it does NOT fire again (de-duplicated).

---

## No-regressions list

The following existing behaviors MUST remain green after the refactor. The spec
already covers most of them — re-run the full suite and verify zero
regressions.

- Autoplay starts/stops correctly when `autoplay` toggles.
- Autoplay pauses on hover, focus-in, drag, document hidden, manual.
- Autoplay resumes from each pause condition with the correct
  `autoplayResumed` emission.
- `slideChange` fires with the correct `trigger` for every navigation source:
  `pointer`, `keyboard`, `autoplay`, `indicator`, `button`, `programmatic`.
  The "last interaction source" signal contract is unchanged.
- Pointer drag preserves click semantics inside slides when the drag is below
  the 6px threshold.
- Pointer drag ignores `pointerType === 'touch'`.
- Keyboard handlers (Arrow keys, Home, End, PageUp, PageDown) drive
  navigation as today.
- Loop wraps in both directions.
- Prev/Next directive `disabled` state matches `loop` + boundary state.
- Prev/Next directives respect consumer-provided `aria-label` /
  `aria-labelledby`.
- Slide `aria-hidden` + `inert` toggling continues to work via the shared
  `IntersectionObserver`.
- The component-rendered pause control is present whenever `autoplay() ===
  true` and toggles between play / pause glyphs via the inline SVG.
- AXE: zero violations on the existing demo pages.
- Compodoc API tables remain non-empty.

---

## Constraints (recap — non-negotiable)

Standard CLAUDE.md rules apply unchanged. Highlights specific to this refactor:

- Cap exception remains: `CarouselComponent` (17 inputs) is a structural-layout
  primitive; the inline comment at the top of `carousel.ts` (lines 1–7) MUST
  stay.
- `tv()` config stays — twMerge enabled. No new variants required.
- The single CSS modification site is `theme/_base.css` — but only if the
  implementer chooses to adjust the keyframe (the current directive in B(e) is
  to leave the keyframe alone and fix sequencing in JS instead).
- No `fakeAsync` / `tick`. No `@angular/animations`. No
  `@HostBinding` / `@HostListener` / `ngClass` / `ngStyle`.
- JSDoc one-liner on every new public signal / method (`_lastReachableIndex`
  if exposed publicly, the `_resolveBehavior` helper if hoisted to public,
  etc.).

---

## Acceptance checklist

The refactor is "done" when every box below is checked.

- [ ] `_lastReachableIndex` exists as a public readonly `Signal<number>` with
      JSDoc; `isAtEnd`, the `_handleScrollSettled` clamp, and `next()`'s
      past-last check all read from it.
- [ ] `_scrollToIndex` and `_handleScrollSettled` use slide `offsetLeft` /
      `offsetTop` for both write and read; the synthetic `step = (dimension +
      gap) / perView` is removed.
- [ ] RTL `_rtlSign()` appears at most once per multiplication site; the
      double-multiply in `_handleScrollSettled` is gone.
- [ ] `scrollTo` (no explicit behavior) honors `prefers-reduced-motion:
      reduce`.
- [ ] Loop-jump opacity mask is correctly sequenced (instant scroll deferred
      into the keyframe's low-opacity frame); existing keyframe in
      `theme/_base.css` is unchanged.
- [ ] Dev warnings live in an `effect()` and re-fire (once each, deduped) on
      input changes.
- [ ] Pointer-drag listeners cleaned up via `DestroyRef.onDestroy`; spec
      asserts the cleanup.
- [ ] Pause-control SVG keeps the inline implementation; new JSDoc block
      documents the no-`<tw-icon>` decision.
- [ ] `prevPaused` initial-value comment added.
- [ ] `<tw-carousel-indicators>` renders zero `<button>` children when
      `slidesPerView !== 1`; dev warning fires once per instance.
- [ ] `activeIndex` consistently treated as a slide index throughout the
      file; no internal site treats it as a page anchor.
- [ ] All existing spec tests still pass.
- [ ] New spec tests cover: settle-math correctness, indicators auto-hide,
      RTL single-sign math, reduced-motion `scrollTo`, drag cleanup on
      destroy, loop-jump sequencing, single-slide width, dev warning
      re-evaluation.
- [ ] AXE zero violations on demo pages (existing demo pages updated where
      they paired indicators with `slidesPerView > 1`).
- [ ] `public-api.ts`, `tsconfig.lib.json`, `tsconfig.spec.json`,
      `angular.json` unchanged (no entry-point shape change).
- [ ] Compodoc still generates non-empty API tables (no JSDoc lost in the
      refactor).
