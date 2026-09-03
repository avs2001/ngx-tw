# Pass 6 — `carousel.ts` decomposition (register item 5, F-06)

**Agent:** p6-carousel · **Scope owned:** `projects/ngx-tw/carousel/` only
**Result:** landed. Behaviour-preserving. Public API byte-identical. All 44 carousel tests green.

---

## 1. Line delta per file

| File | Before | After | Δ | Status |
|---|---:|---:|---:|---|
| `carousel/carousel.ts` | 1695 | **1147** | **−548** | modified |
| `carousel/carousel.types.ts` | — | 72 | +72 | **new** |
| `carousel/carousel-labels.ts` | — | 42 | +42 | **new** |
| `carousel/carousel-variants.ts` | — | 197 | +197 | **new** |
| `carousel/carousel-indicators.ts` | — | 215 | +215 | **new** |
| `carousel/carousel-nav.ts` | — | 122 | +122 | **new** |
| `carousel/index.ts` | 17 | 16 | −1 | modified (re-export paths only) |
| `carousel/carousel.spec.ts` | 893 | 891 | −2 | modified (**import paths only** — see §5) |
| `carousel/carousel-labels.spec.ts` | — | 41 | +41 | **new** (focused, non-vacuous — see §6) |

Source total 1712 → 1811 (+99). The growth is entirely the six new file headers documenting the
import-graph direction and the two "do not undo this" comments; **zero** lines of logic were added,
rewritten or reordered.

Verbatim-move proof — I diffed every moved region against `git show HEAD:.../carousel.ts`:

```
indicator lookup tables (orig 135–201)  → carousel-indicators.ts 30–96    SAME
CarouselIndicatorsComponent (1467–1584) → carousel-indicators.ts 98–215   SAME
Prev/Next directives        (1586–1695) → carousel-nav.ts 13–122          SAME
tv() config                  (203–371)  → carousel-variants.ts 29–197     1 line: `const` → `export const`
CarouselSlide + Carousel     (375–1465) → carousel.ts 57–1147             SAME
```

## 2. Final class-to-file mapping

| File | Holds | Imports |
|---|---|---|
| `carousel.types.ts` | the 6 public types | **nothing** (graph leaf) |
| `carousel-labels.ts` | `DEFAULT_CAROUSEL_LABELS`, `formatLabel` | `./carousel.types` (type-only) |
| `carousel-variants.ts` | `carouselVariants` (tv), `GAP_PX` | `tailwind-variants`, `core` (`TwSize`) |
| `carousel.ts` | `CarouselSlideComponent`, `CarouselComponent` | the three above + `core` |
| `carousel-indicators.ts` | `INDICATOR_*` tables, `resolveIndicator{Active,Inactive}Classes`, `CarouselIndicatorsComponent` | `./carousel`, `./carousel-variants`, `./carousel-labels`, `./carousel.types`, `core` |
| `carousel-nav.ts` | `CarouselPrevDirective`, `CarouselNextDirective` | `./carousel` |

Import graph is a strict DAG, no cycle, no type-only edge doing load-bearing work:

```
carousel.types.ts
   ├── carousel-labels.ts ──┐
   └────────────────────────┼── carousel.ts ──┬── carousel-indicators.ts
carousel-variants.ts ───────┘                 └── carousel-nav.ts
```

`CarouselSlideComponent` **stayed** in `carousel.ts`, with a 16-line comment above it stating why
(`contentChildren` ↔ `inject` is a two-way *value* edge: neither side is erased at compile time, so
a split is a runtime circular import, and breaking it needs an injection token or base class — a
behavioural change, not a move). The comment also says the three classes below it did *not* have
that problem, so the next reader does not wonder why the split stopped where it did.

## 3. What F-06 got wrong — right conclusion, wrong reason

F-06 said the type move was mandatory because:

> `carousel-variants.ts` will need `TwCarouselIndicatorVariant` (`carousel.ts:35`) and
> `TwCarouselIndicatorPosition` (`:38`) … while `carousel.ts` imports `carouselVariants` back.
> That resolves today only because a type-only edge is erased at compile time.

**That pairing does not exist.** The `tv()` config (orig 203–371) carries no type annotations at
all — `dots`/`lines`/`numbers` and `below`/`overlay` are bare object keys in the `variants` block,
inferred, never referencing the exported union types. `carousel-variants.ts` as landed imports
exactly one carousel-adjacent symbol: `TwSize`, from `core`, for `GAP_PX`. Had I moved only the tv
config and left the types in `carousel.ts`, there would have been **no** edge back at all.

The two functions that *do* need `TwCarouselIndicatorVariant` — `resolveIndicatorActiveClasses` /
`resolveIndicatorInactiveClasses` — are read only by `CarouselIndicatorsComponent` (orig 1567–1568,
nowhere else), so they travelled with it into `carousel-indicators.ts`, which already imports
`./carousel`.

**The type move is still required, for a pair F-06 did not name:** `carousel-labels.ts` needs
`TwCarouselLabels` (for `DEFAULT_CAROUSEL_LABELS`'s `Readonly<Required<…>>`) while `carousel.ts`
needs `DEFAULT_CAROUSEL_LABELS` and `formatLabel` back from it. Types in `carousel.ts` ⇒ that is a
genuine cycle — and unlike F-06's hypothetical it is *half a value edge*, so it would not be erased.
`carousel.types.ts` as an import-nothing leaf is what dissolves it. Same fix, sound reason.

**Everything else in F-06 verified as stated.** Lines 1467–1695 (shifted 0 — the file had not moved
since the finding) were exactly the three movable classes; the dependency is one-way (`grep` for the
three class names inside `carousel.ts` returns the two section markers, the three `export class`
lines, and one JSDoc mention at `:617`, which I left in place because it is still accurate prose);
`carouselVariants` is genuinely shared by `carousel.ts` and the indicators; `CarouselSlideComponent`
is genuinely uncuttable.

## 4. Deliberate additions beyond F-06's list

- **`GAP_PX` moved into `carousel-variants.ts`** (F-06 did not mention it). It is the numeric mirror
  of the `gap-x-*` / `gap-y-*` compound variants — editing the `md` row from `gap-x-4` to `gap-x-5`
  without editing `GAP_PX` from 16 to 20 silently miscomputes every slide's `flex-basis`. The file
  header states this so the co-location is not read as arbitrary.
- **`formatLabel` split out with `DEFAULT_CAROUSEL_LABELS`** rather than left in `carousel.ts`. It
  is the one runtime helper genuinely shared by a class that stayed (`CarouselSlideComponent`) and a
  class that moved (`CarouselIndicatorsComponent`); leaving it behind would have made
  `carousel-indicators.ts` import a private helper out of `carousel.ts`, i.e. the same
  reach-into-internals shape the entry-point rule forbids across entry points.
- No `carousel-utils.ts`. Each file is named for what it does: types, labels, variants, indicators,
  nav.

## 5. Public API — unchanged, verified against the built `.d.ts`

`index.ts` still exports the same six values and six types under the same names, just from new
paths. Confirmed against `dist/ngx-tw/types/cdevhub-ngx-tw-carousel.d.ts` after a clean
`npm run build:lib`:

```
export { CarouselComponent, CarouselIndicatorsComponent, CarouselNextDirective,
         CarouselPrevDirective, CarouselSlideComponent, DEFAULT_CAROUSEL_LABELS };
export type { TwCarouselAutoplayReason, TwCarouselIndicatorPosition, TwCarouselIndicatorVariant,
              TwCarouselLabels, TwCarouselSlideChangeEvent, TwCarouselSlideChangeTrigger };
```

Identical to the pre-change surface. `carouselVariants`, `GAP_PX`, `formatLabel` and the
`INDICATOR_*` tables are `export`ed from their files (so siblings in the same entry point can read
them) but are **not** in `index.ts` and do **not** appear in the emitted `.d.ts` — so
"do not export variant configs" holds and no new compatibility promise was minted. `index.ts` uses
named re-exports throughout; I deliberately did not use `export *`, which would have leaked all four.

`projects/ngx-tw/src/public-api.ts:56` is `export * from '@cdevhub/ngx-tw/carousel'` — unchanged and
unaffected. No semver event of any kind. Demo pages import from the barrel and were not touched
(`ng build demo` passes).

## 6. Tests

**`carousel.spec.ts` passes unchanged, except its import block.** The only edit is the path split:

```ts
import { CarouselComponent, CarouselSlideComponent } from './carousel';
import { CarouselIndicatorsComponent } from './carousel-indicators';
import { CarouselNextDirective, CarouselPrevDirective } from './carousel-nav';
import { DEFAULT_CAROUSEL_LABELS } from './carousel-labels';
```

`git diff` on the file is those 6 lines in / 8 lines out and nothing else — no assertion, no
scaffolding, no expectation changed. This is the legitimate exception the task named; flagging it
explicitly as required. (Same shape as `calendar.spec.ts`, which already imports from four sibling
files by relative path.) All 40 of its tests pass.

**One new focused spec: `carousel-labels.spec.ts` (4 tests).** Extraction is what makes it possible —
two of its four branches are unreachable through the component API, which is precisely why they had
no coverage before:

- the `typeof template !== 'string'` guard is dead from outside, because `resolvedLabels()` filters
  explicitly-undefined keys before `formatLabel` ever sees them;
- the unknown-placeholder path never fires, because every shipped default template supplies exactly
  the variables its call site passes.

**Non-vacuity confirmed empirically, not by reasoning.** I deleted the guard line, rebuilt, and ran
the carousel specs: `carousel-labels.spec.ts > returns an empty string for a non-string template`
failed with `TypeError: Cannot read properties of undefined (reading 'replace')` — the exact
render-killing throw the guard's comment describes. Guard restored; 44/44 green.

**I deliberately did NOT add `carousel-indicators.spec.ts` or `carousel-nav.spec.ts.`** Both classes
are already exercised through the parent in `carousel.spec.ts` (prev/next `aria-label` defaults at
`:306–309`, indicator rendering and paging, slide `aria-label` templating at `:699`), and a
directive that only injects its parent and forwards two calls has no isolated behaviour left to
assert once that DOM-level coverage exists. Writing them would have added exactly the ~7% ceremonial
mass pass 1 measured. This extraction is a **file-organisation** win, not a testability win — that
is worth stating plainly rather than manufacturing evidence for the stronger claim.

## 7. Verification run

| Check | Result |
|---|---|
| `npx tsc --noEmit -p projects/ngx-tw/tsconfig.lib.json` | clean |
| `npm run build:lib` | exit 0, no errors/warnings |
| `npx eslint projects/ngx-tw/carousel` | exit 0 |
| `npx ng test ngx-tw --include='../carousel/**/*.spec.ts'` | **44 passed** (40 existing + 4 new) |
| `npx ng build demo` | exit 0 |
| `npm run verify:mcp-index` | ✓ all checks passed (6 pre-existing warnings, none carousel) |
| `npm run verify:package` | PASS — 59 entry points exported, theme resolves, 177 KB compiled |
| `npx ng test ngx-tw` (full) | 3363 passed, 4 skipped, **1 failed — not mine**, see below |

**Demo pages: no change required, and I checked the right thing.** `routes/carousel/` holds the
canonical four (`carousel.routes.ts`, `overview/`, `examples/`, `api/`). The api page
(`carousel-api.component.ts`) is hand-authored and keyed by **selector** — `Selector:
tw-carousel-indicators` at `:259` — not by source file path. Grepping the whole demo carousel
directory for `carousel.ts`, `carousel/carousel`, `carousel-indicators`, `carousel-nav` and
`carousel.types` returns only `<tw-carousel-indicators>` element usages in templates. Nothing in the
demo is keyed to a library file path, so the split cannot empty an API table. `verify:mcp-index`
independently reparsed the entry point (56 entry points, 745 snippets) and raised nothing for
carousel.

Logs: `scratchpad/p6-carousel-build.log`, `p6-carousel-test.log`, `p6-carousel-demo.log`.

**Timing caveat — every row above was green at the moment it ran.** A later re-run of the carousel
specs no longer reaches the test phase: the build now fails in
`projects/ngx-tw/transfer/transfer.ts:622` on `wireErrorState(...)` from a sibling's in-flight
`core/error-state-wiring.ts` (untracked at the time of writing). That is exactly the cross-agent
interference `pass5-fix-brief.md` warns about, it is outside `carousel/`, and it is not mine to fix.
`npx tsc --noEmit -p projects/ngx-tw/tsconfig.lib.json` over the carousel sources is clean, and the
44/44 carousel run above happened after all my edits were final — nothing in `carousel/` changed
between that run and now (`git status` confirms the six new files plus the three modified ones and
nothing else).

## 8. Not mine — for the orchestrator

- **`projects/ngx-tw/theme/theme.service.spec.ts > ThemeService > should cycle through all themes in
  order` fails.** `theme/` is a sibling's file per my prompt; I did not touch it and carousel imports
  nothing from `theme`. Measured, not assumed: between my two full-suite runs the counts went
  **81 → 82 test files and 3355 → 3368 tests** while `carousel-labels.spec.ts` was already present in
  the first (fully green) run — so a sibling landed a spec mid-session and the regression arrived
  with it. My new spec is a bare pure-function test with no TestBed, no globals and no DI, so it
  cannot perturb `ThemeService`. Reported, not fixed.
- **Nothing found that belongs in `core/`.** `formatLabel` is described in its own comment as
  "ported from paginator", so there are now two near-identical implementations in the library. It is
  a plausible `core/` candidate — but a sibling is actively editing `core/` this pass, and promoting
  it would be an additive barrel export (a compatibility promise) rather than a move. **Deferred, not
  done**; worth one line in a later pass's brief.
- **No bugs found while moving.** Every moved region diffs byte-identical against `HEAD`, so nothing
  was silently corrected in flight. Two things I *noticed* but explicitly left alone, per the
  report-don't-fix rule:
  *(Anchors below are **post-move** line numbers in the new 1147-line `carousel.ts`, each verified by
  grep after the split — not arithmetic on the old file.)*
  - `_reobserveSlides` (**`carousel.ts:647`**, was `:965`) reaches the slide host via
    `(slide as unknown as { _hostEl: HTMLElement | null })._hostEl` even though `_hostEl` is a
    plainly-declared public field on `CarouselSlideComponent` in the same file — the cast and its
    three-line comment about "we don't have direct ElementRef access" are stale. Same cast recurs at
    `_findClosestSlideIndex` (**`:705`**) and `_scrollToIndex` (**`:823`**). Cosmetic, zero
    behavioural effect, and removing it is a separate change.
  - `pause(_reason: TwCarouselAutoplayReason = 'manual')` (**`carousel.ts:802`**, was `:1120`) does
    not read its parameter, so `pause('hover')` and `pause()` behave identically while the JSDoc says
    `reason` defaults to `'manual'`. **This may well be deliberate:** the leading underscore is this
    repo's intentionally-unused marker, and `_currentPauseReason()` derives the emitted reason from
    component state rather than from the caller — so the parameter may exist purely to keep the
    public signature stable. Needs a decision (tighten the JSDoc, or wire the argument through), not
    an assumed fix; either way it is behavioural and changes `autoplayPaused` payloads.

## 9. Residual size of `carousel.ts` is intended, not unfinished

`carousel.ts` lands at **1147 lines**. That is the *designed* stopping point, not a job left half
done. F-06 explicitly held the remaining seams — the observer lifecycle (`_setupViewport` /
`_teardownViewport` / `_reobserveSlides`), the scroll↔index derivation, the pointer-drag state
machine and the keyboard router — out as NEEDS-ITS-OWN-PASS, because each reads *and writes* roughly
ten of `CarouselComponent`'s private signals (`_rtlSign`, `_isDragging`, `_isLoopJumping`,
`_lastInteractionSource`, `_postInteractionPauseUntil`, `_isTabVisible`, `activeIndex`, …). Pulling
them out is a reactive-graph redesign, not a move, and mixing it into this change would have made any
regression un-attributable — which is the stated reason this refactor was held out of passes 1–5.
The next pass should treat 1147 lines as the current correct floor.
