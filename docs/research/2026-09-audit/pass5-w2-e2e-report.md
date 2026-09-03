# Pass 5 — W2 e2e report

Owner: `e2e/**` only. No library or demo source landed.

## Files touched (all landed changes)

| File | Change |
|---|---|
| `e2e/specs/02-cross-cutting/theme-matrix.spec.ts` | +1 test (`@theme scoped [twTheme] panes …`), +2 module-level helpers (`backgroundRgb`, `relativeLuminance`), `Locator` type import |
| `e2e/specs/02-cross-cutting/rtl.spec.ts` | +1 test (`@rtl paginator: ArrowLeft/ArrowRight follow visual order …`), `Locator` type import |
| `e2e/specs/01-components/dialog.spec.ts` | `test.fixme` at :92 promoted to a live `test` |

`git status` at end of work shows exactly these three files modified. Nothing else.

---

## Task 1 — guard for the `[twTheme]="'light'"` subtree-scoping fix

**Landed:** `theme-matrix.spec.ts` → `@theme scoped [twTheme] panes re-resolve tokens inside a dark document`.

Storage key **verified, not trusted**: `DEFAULT_TW_THEME_CONFIG.storageKey === 'ngx-tw-theme'` at
`projects/ngx-tw/theme/theme.types.ts:70`. Reuses the file's existing `seedTheme()` helper.
Route is `/services/theme/examples` (`app.routes.ts:231`), which is **not** under `/components/`
and so is not in `e2e/support/routes.ts` — consistent with the brief's point that this page had
no coverage.

### Correction to the brief: the specified assertion target is unsatisfiable

The brief asks for "three different `background-color` values" on the three panes. **The panes
cannot produce three.** They carry `bg-surface`, and `--color-surface` is `var(--color-white)` in
*both* `_light.css:41` and `_high-contrast.css:3` — identical by design. A strict three-way-distinct
check on the pane background would fail on correct code.

I moved the three-way check to the `bg-primary-600` chip inside each pane, which is the nearest
element whose token genuinely differs across all three schemes: blue-600 / blue-400 / blue-700.
That still captures exactly the failure the brief describes — under the bug the *light* chip
collapses onto the *dark* chip. The pane's own `bg-surface` is kept for the absolute check.

### Three independent assertions

1. **Mechanism.** The light pane's computed `--color-surface` / `--color-fg` / `--color-primary-600`
   must differ from `<html>`'s. Under the bug they were byte-identical — that inheritance *is* the
   defect, stated as an assertion.
2. **Relative.** The three chips must compute three distinct backgrounds.
3. **Absolute.** Light pane background luminance > 0.8, dark pane < 0.2. Uses WCAG relative
   luminance over sRGB bytes obtained by painting the computed colour onto a 1×1 canvas —
   `getComputedStyle().backgroundColor` serialises Tailwind v4 as `oklch(…)`, so a string compare
   can't answer "is this light?", and thresholds (not a hardcoded `rgb(255,255,255)`) mean a future
   near-white surface token won't break the guard while a *dark* one will.

Everything asserted is **computed style**. An attribute/class assertion would have passed with the
bug present — `ThemeDirective` always wrote `data-theme` correctly; the CSS had nothing to match.

### How I convinced myself it is non-vacuous — [measured], not reasoned

I reproduced the pre-fix state without touching library source: the demo loads
`dist/ngx-tw/theme/index.css` (`projects/demo/src/styles.css:3`), so I temporarily commented out its
`@import "./_light.css";` line (a gitignored build artifact, restored immediately after) and re-ran.
Then I temporarily inverted each assertion in turn to let execution reach the next one.

| Assertion | Result with the fix neutralised | Observed value |
|---|---|---|
| 1 Mechanism | **FAIL** | light pane tokens `["oklch(13% 0.028 261.692)", "oklch(98.5% 0.002 247.839)", "oklch(70.7% 0.165 254.624)"]` — identical to `<html>`'s dark set |
| 2 Relative | **FAIL** | chips `80,162,255 \| 80,162,255 \| 20,71,230` — light and dark literally collapsed, `Set.size` 2 not 3 |
| 3 Absolute | **FAIL** | light-pane luminance `0.00215`, required `> 0.8` |

All three fail independently. `dist/ngx-tw/theme/index.css` was restored and re-verified
(`@import "./_light.css";` present at line 98).

---

## Task 2 — RTL keyboard case

### Correction to the brief: RTL e2e coverage already existed

The brief states "there is zero RTL e2e coverage in this repo." That is **wrong**.
`e2e/specs/02-cross-cutting/rtl.spec.ts` already existed with 8 mount-and-overflow cases
(accordion, menu, select, date-picker, paginator, slider, split, tabs) plus a slider
`ArrowRight`-under-`Directionality` keyboard case.

I therefore **appended** the paginator case to that file rather than creating a second
`rtl.spec.ts`, which would have collided.

### No demo source change was needed

The brief said to stop and report if `dir="rtl"` required demo changes. It does not: the file's
existing `beforeEach` sets `document.documentElement.dir = 'rtl'` from a `DOMContentLoaded`
listener registered via `addInitScript`, i.e. after parsing but before Angular bootstraps, so CDK's
`Directionality` reads `rtl` at construction. The mechanism was already proven by the passing
slider case; my measurements below confirm it end-to-end.

### The test

Targets the "Colors" section's first `<tw-paginator>` (80 items → pages 1–8 all rendered).
Three assertions, because **position alone is vacuous**:

1. **Layout precondition (hard):** page "1"'s `boundingBox().x` **>** page "2"'s. This is what
   proves `dir=rtl` actually landed. Without it, a silently-LTR page would make ArrowLeft move to
   page "1" — which is *also* leftwards — and a position-only test would pass for the wrong reason.
2. **Identity:** after ArrowLeft, focus is on page **"3"** (the DOM-*next* item), not "1".
3. **Position:** the newly focused control's `x` decreased. ArrowRight then mirrors it back to "2"
   with `x` increasing.

### How I convinced myself it is non-vacuous — [measured]

I ran a throwaway probe spec (created, run, deleted — not landed) that performed the identical
keystroke in both directions and printed the resulting focus target:

```
PROBE-LTR reversedLayout=false arrowLeftFocuses=1
PROBE-RTL reversedLayout=true  arrowLeftFocuses=3
```

The ArrowLeft target is genuinely direction-dependent, which can only come from
`Directionality.valueSignal()` reaching `withHorizontalOrientation()` (`paginator.ts:895–903`).
Under the old hard-coded `.withHorizontalOrientation('ltr')` the RTL row would have read
`arrowLeftFocuses=1`, so assertion 2 fails and assertion 3 inverts. This is the first
`[measured]` evidence for the paginator RTL fix; the existing guards are unit specs under a
mocked `Directionality`.

---

## Task 3 — the stale `test.fixme`

**Verified stale, then promoted to a live test** (rather than deleted, so the coverage is kept).

- `projects/ngx-tw/dialog/dialog-config.ts:56` — `override ariaModal?: boolean = true;`
- `dialog-renderer.ts:60` forwards `merged.ariaModal`; `dialog-container.ts:82` binds
  `'[attr.aria-modal]': '_config.ariaModal'`.
- Ran it: **passes**.

**Correction worth recording:** the brief says "three unit tests assert it". None of them asserts
the *default*. `dialog.spec.ts:428`, `:440` and `:658` each pass an **explicit** `ariaModal` value,
so they pin the plumbing but would all stay green if the field initializer at `dialog-config.ts:56`
regressed to `false`. The promoted e2e case is now the only guard that *asserts the default reaches
`aria-modal` in the DOM*. (Stated precisely: `ariaModal` is a field initializer, so any unit test
opening a dialog without `ariaModal` in its config does exercise the default value — it just never
asserts on it. I did not grep for how many such tests exist.) Noted in a comment on the test.

### Fixme inventory (reported, not fixed)

The brief's count of 37 is **correct** and matches `scratchpad/pass5-gaps.md` F-04:
`grep -rnE "test\.fixme\(" e2e | wc -l` returned **37 before** my change and **36 after** promoting
the dialog one. Caveat for whoever re-counts: a naive `grep -rn "test.fixme"` returns **50** — the
unescaped `.` plus prose mentions inside comments inflate it. Use the escaped form.

Remaining 36 by file:

| Count | File |
|---|---|
| 6 | `01-components/split.spec.ts` |
| 4 | `01-components/calendar.spec.ts` |
| 4 | `02-cross-cutting/concurrent-overlays.spec.ts` |
| 2 | `01-components/date-range-picker.spec.ts` |
| 2 | `01-components/tab-nav.spec.ts` |
| 2 | `02-cross-cutting/focus-restoration.spec.ts` |
| 2 | `02-cross-cutting/forms-three-strategies/date-range-picker.spec.ts` |
| 2 | `02-cross-cutting/mobile.spec.ts` |
| 2 | `03-accessibility/explicit-assertions.spec.ts` |
| 1 each | `command-palette`, `date-picker`, `table`, `time-picker`, `keyboard-journey`, `forms-three-strategies/{calendar,date-picker,input,time-picker}` |

Per instructions I did not attempt the rest; the mechanism proposal is F-04 in `pass5-gaps.md`.

---

## BLOCKER for another owner — the demo does not compile at HEAD (078e17d)

This is the single most important thing in this report.

```
projects/demo/src/app/routes/segmented-control/examples/segmented-control-examples.component.ts(501,22):
error TS2741: Property 'solid' is missing in type
  '{ surface: …; filled: …; outline: … }'
but required in type 'Record<SegmentedControlVariant, WritableSignal<string | null>>'.
```

It is the **only** demo type error (`npx tsc --noEmit -p projects/demo/tsconfig.app.json` reports
exactly one), and it is **committed in 078e17d**, not in-flight working-tree state — neither that
file nor `projects/ngx-tw/segmented-control/segmented-control.ts` appears in `git status`.

Cause: the variant rename landed asymmetrically. `VARIANTS` at line 10 was updated to
`['surface', 'solid', 'outline']`, but the `variantValues` record at line 501 still keys on
`filled`.

**Impact, and why it must be fixed before anything else:**
- `npm start` never becomes ready → **every local Playwright run dies with
  `Timed out waiting for config.webServer`**, which is exactly the brief's trap 2 (the message
  never names the file). Local e2e is 100% blocked at HEAD.
- It is also a **runtime** demo defect, not just a type error: the template indexes
  `variantValues[v]` with `v = 'solid'`, which is `undefined`.
- `ng test demo` compiles the same program, so the drift guard in `app.routes.spec.ts` is likely
  down too.

**Suggested fix (demo owner's file — I did not land it).** Note `Record<SegmentedControlVariant, …>`
needs **four** keys, because `SegmentedControlVariant` includes the deprecated
`SegmentedControlVariantLegacy = 'filled'`. Adding a dead `filled` entry works but is ugly; better
to key on the canonical set only:

```ts
const VARIANTS = ['surface', 'solid', 'outline'] as const;
…
protected readonly variantValues: Record<
  (typeof VARIANTS)[number],
  WritableSignal<string | null>
> = {
  surface: signal<string | null>('daily'),
  solid: signal<string | null>('weekly'),
  outline: signal<string | null>('monthly'),
};
```

(`SegmentedControlVariantCanonical` in `segmented-control.ts` is not exported, so the demo can't
name it directly. Exporting it would be additive and non-breaking, if preferred.)

**Bundle a guard with the repair.** This pass fixed RTL arrow inversion in three components; I
guarded `paginator` only. `segmented-control` and `tags-input` remain **e2e-unguarded** (unit specs
under a mocked `Directionality` are their only coverage). Since the break above is *in*
`segmented-control-examples.component.ts`, whoever repairs that file is the natural person to also
append a `segmented-control` case to `e2e/specs/02-cross-cutting/rtl.spec.ts` — the pattern is now
established there and the case is a ~20-line copy of the paginator one.

### Disclosure: I temporarily patched that file to run Playwright at all

I could not otherwise satisfy the brief's instruction to run Playwright and demonstrate
non-vacuity. I applied the minimal 4-key patch locally, ran everything, then **reverted it exactly**.
Verified afterwards: `git diff -- projects/demo/src/app/routes/segmented-control/` is empty and
`git status` lists only my three `e2e/` files. **Nothing from that patch is landed.** I killed the
dev server afterwards (`lsof -ti tcp:4600 | xargs kill -9`) precisely so it isn't left in the
compile-error state that trap 1 describes.

---

## Verification run

`npx playwright test e2e/specs/02-cross-cutting/rtl.spec.ts e2e/specs/02-cross-cutting/theme-matrix.spec.ts e2e/specs/01-components/dialog.spec.ts --project=chromium-light`

> **Read this qualifier before quoting the result.** Both runs required the one-line demo patch
> below to be applied, because `npm start` cannot boot at HEAD. So the claim is *"green against a
> tree with the segmented-control demo fix applied"* — **not** *"green at HEAD"*. At HEAD, e2e
> cannot run at all. The tree I hand back has the patch reverted, so it is in the non-booting state.

**39 passed, 1 skipped** (the skip is the unrelated remaining
`dialog.spec.ts` body-scroll-lock fixme, untouched). Includes all three pre-existing theme-matrix
themes, the axe `color-contrast` sweeps, all 8 RTL mount cases and the slider RTL case.

Run **twice**, the second time against the exact final bytes of all three files — the RTL locators
were renamed `page1/2/3` → `btn1/2/3` after the first run, because
eslint-plugin-playwright's `prefer-locator` rule matches any identifier starting with `page` and
flagged `pageBtn2.focus()` as a Page method. Re-running rather than trusting the rename is
deliberate: a landed guard that was never executed in its final form is the failure mode the brief
warns about.

`npx eslint` on the three files: **0 errors, 0 new warnings** (two pre-existing warnings remain,
`dialog.spec.ts:66` expect-expect and `theme-matrix.spec.ts:132` no-wait-for-timeout, both
untouched by me). `npx tsc --noEmit -p e2e/tsconfig.json`: clean.

No `e2e:visual` run and no `--update-snapshots`, per the brief.

**End state verified:** `git status -- e2e` lists exactly my three files;
`git status -- projects` does **not** list the demo file I temporarily patched (sibling agents'
in-flight library edits under `projects/ngx-tw/{calendar,combobox,popover,select,time-picker,tooltip}`
are unrelated to me); `dist/ngx-tw/theme/index.css` has its `@import "./_light.css";` restored;
port 4600 is clear.

## Things I deliberately did not do

- Did not fix the `segmented-control-examples` break permanently — demo source, another owner.
- Did not touch the other 36 `test.fixme` entries — F-04 owns the mechanism.
- Did not sweep RTL across components. The brief asked for one component; the pattern is now
  established in `rtl.spec.ts` and `segmented-control` / `tags-input` (the other two RTL fixes this
  pass) remain **unguarded at e2e level** — worth a follow-up, now cheap to add.
- Did not add the theme page to `e2e/support/routes.ts`. That constant is documented as *derived*
  from `/components/<slug>` routes and is checked by a Vitest drift guard; `/services/theme` is
  outside its shape and adding it would break that guard.

## Residual risk

- The theme guard asserts against the **demo's** "Scoped Subtrees" section. If that section is
  restructured or its `h2` renamed, the test fails as a false positive rather than silently
  skipping — an acceptable trade (loud, not silent), but worth knowing.
- The RTL paginator case depends on the "Colors" section rendering ≥3 numbered page controls. It
  asserts `page3` is visible up front, so a layout change surfaces as a clear failure.
