# Pass 5 — SRP / decomposition lens (`srp`)

Read-only audit. No file was edited. All anchors are `projects/ngx-tw/…` unless stated.

**Ratio up front, as asked:** of 11 findings, **2 are SAFE-NOW** (one pure-function lift, one
one-line behaviour fix), **1 is SAFE-NOW-with-a-caveat** (a file split whose safe half I bounded
precisely), and **the remaining 8 are NEEDS-ITS-OWN-PASS or documentation-only**. The SRP lens
does not produce landable work this pass. It produces one real bug found *through* the lens, and
a precise map for two future passes.

---

## F-01 `combobox` loses trigger-width tracking permanently after the first close

Severity: HIGH
Anchor: `projects/ngx-tw/combobox/combobox.ts:1332`
Register: not in register
Confidence: [verified]
What: `closeOverlay()` disconnects and nulls the `ResizeObserver` (`combobox.ts:1332-1333`).
The **only** installer is `installResizeObserver()` at `combobox.ts:1363`, called from
`ensureOverlay()` — which early-returns at `combobox.ts:1344-1347` whenever `overlayRef` is
non-null. `overlayRef` is only disposed in the destroy hook (`combobox.ts:903`), never on close.
So on the second and every subsequent open, `ensureOverlay()` takes the early-return branch and
the observer is never re-installed. `SelectComponent`, the component this code was copied from,
deliberately does **not** disconnect on close — its `closeOverlay` (`select.ts:1449-1470`) leaves
the observer alone and only tears it down in the destroy hook (`select.ts:1054-1055`).
Why it matters: `panelWidth="trigger"` (the default) still gets the **correct initial width** on
reopen, because the early-return branch calls `updateOverlaySize()`. What is dead is *live*
tracking: after the first close, resizing the combobox trigger while the panel is open no longer
resizes the panel. In a responsive layout or a resizable container the panel visibly desyncs from
its input. Select does not have this bug — the two copies drifted.
Fix: **SAFE-NOW.** Two lines. Either delete `combobox.ts:1332-1333` from `closeOverlay` (the
destroy hook at `combobox.ts:901-902` already covers teardown), or hoist
`this.installResizeObserver()` above the `if (this.overlayRef)` early-return in `ensureOverlay`.
Prefer the deletion, and the reason is empirical rather than aesthetic: **`select` has shipped
this way**. Its observer stays live between opens and calls `updateOverlaySize()` on a detached
`OverlayRef` — `OverlayRef.updateSize()` is safe in that state, and no defect has been reported
against it. Keeping the observer alive is therefore the already-proven behaviour, not a new risk;
it also restores byte-identity with select, which is the precondition for F-04's extraction. Add a
spec that opens, closes, reopens and asserts the observer is live (spy `updateOverlaySize` via
`vi.spyOn`). No public API change, no semver impact.

---

## F-02 `combobox` accumulates one backdrop + one Escape listener per open

Severity: LOW
Anchor: `projects/ngx-tw/combobox/combobox.ts:1417`
Register: not in register
Confidence: [verified]
What: `subscribeBackdrop()` (`combobox.ts:1417-1423`) and `subscribeOverlayEscape()`
(`combobox.ts:1433-1441`) are called from `openOverlay()` on **every** open, but both scope their
teardown to `destroyRef.onDestroy(...)` rather than to the open lifecycle. Because `overlayRef`
is reused across opens (see F-01), the Nth open leaves N live subscriptions on the same
`OverlayRef`. `SelectComponent` solves this correctly with a per-open `Subscription` aggregate
that is unsubscribed at the top of `subscribePerOpen()` (`select.ts:1537-1553`).
Why it matters: not user-visible today — `closePanel()` is idempotent and the Escape handler's
`inputValue.set(lastCommittedLabel())` is idempotent too. The cost is an unbounded listener leak
for the lifetime of the component and N redundant handler invocations per gesture. Its real value
is as **evidence that the select/combobox copy-paste has already drifted twice** (F-01 is the
other), which is the whole argument for F-06.
Fix: **SAFE-NOW.** Mirror select: hold a `perOpenSubs: Subscription | null`, unsubscribe-and-
recreate it in `openOverlay`, add the backdrop subscription and the `consumeOverlayEscape`
teardown to it, and unsubscribe it inside the `closeOverlay` timer callback and in the destroy
hook. ~10 lines, no public API change. Land it with F-01 or not at all — they are the same
`closeOverlay`/`ensureOverlay` pair.

---

## F-03 The CVA + `NgControl` + error-state + `required` block is duplicated 15 times verbatim

Severity: HIGH
Anchor: `projects/ngx-tw/input/input.ts:393`
Register: not in register
Confidence: [verified]
What: fifteen class bodies across fourteen files each carry the same four-part block. Measured
counts (grep, whole library, specs excluded):

| Fragment | Sites |
|---|---|
| `inject(FormGroupDirective, { optional: true })` + `NgForm` sibling | 15 |
| `private readonly _formSubmitRev = signal(0)` | 15 |
| `const streams = [ctrl.statusChanges, ctrl.valueChanges].filter(…)` + `merge(...)` + `_ngControlRev.update` | 15 |
| `const submit = this.parentFormGroup?.ngSubmit ?? this.parentForm?.ngSubmit;` + subscribe | 15 |
| `errorState` computed reading `_ngControlRev`/`_formSubmitRev` then `matcher.isErrorState(...)` | 15 |
| `required` computed reading `_ngControlRev` then `hasValidator(Validators.required)` | 14 |
| `errors` computed reading `_ngControlRev` then `control.errors ?? null` | 10 |

The 15 sites: `radio.ts:328` and `radio.ts:681` (two classes in one file), `segmented-control.ts:331`,
`slider.ts:526`, `switch.ts:279`, `checkbox.ts:368`, `input.ts:266`, `select.ts:654`,
`combobox.ts:538`, `tags-input.ts:353`, `transfer.ts:631`, `file-upload.ts:377`,
`date-picker.ts:672`, `date-range-picker.ts:613`, `time-picker.ts:677`.
The `statusChanges`/`ngSubmit` half is **byte-identical** at all 15 (compare `input.ts:393-412`
with `transfer.ts:1255-1273`); the `errorState` computeds differ only in which focus signal they
read (`_focused()` / `focusedSignal()` / none) and a pre-check.
That is roughly **300 lines of identical wiring plus ~250 lines of near-identical computeds**.
`FormFieldControl` (`form-field/form-field.ts:39`) is an abstract *shape* only — it declares
`errorState`, `required`, `errors` as abstract signals and supplies no implementation, so it
covers the contract and none of the mechanics. That is the gap.
Why it matters: every policy change to error-state derivation is a 15-file edit, and the copies
have already diverged in ways nobody chose (see the specialization list below, and F-01/F-02 for
the same failure mode in the overlay half). A future control added without the block silently
reports `errorState === false` forever, with no compile error.
Fix: **NEEDS-ITS-OWN-PASS.** Target shape — an injection-context function in `core/`, exactly the
shape `onFormReset` already models (`core/form-reset.ts:19`):

```ts
// core/error-state-wiring.ts  (new; export from core/index.ts)
export interface ErrorStateWiring {
  readonly errorState: Signal<boolean>;
  readonly required: Signal<boolean>;
  readonly errors: Signal<Record<string, unknown> | null>;
  /** Bump from FocusMonitor blur, or after a lazy NgControl lookup. */
  bump(): void;
}
export function wireErrorState(opts: {
  ngControl: () => NgControl | null;          // getter: pickers resolve lazily in ngOnInit
  matcher: Signal<ErrorStateMatcher | undefined>;
  requiredInput: Signal<boolean>;
  extraTracked?: readonly Signal<unknown>[];  // focus signal, parseError, rangeError
  requiredValidators?: readonly ValidatorFn[]; // checkbox/switch pass requiredTrue too
  errorOverride?: () => boolean;               // pickers' parse/range short-circuit
}): ErrorStateWiring;
```

Roughly **~450 lines net removed** (≈550 deleted, but each of the 15 sites retains 5–8 lines for
the call plus destructuring) **and ~90 added** in `core/`. Two legitimate specializations a future pass must
**not** flatten: (a) `checkbox.ts:479` and `switch.ts:234` also accept `Validators.requiredTrue`;
(b) `date-picker.ts:805`, `date-range-picker.ts:793` short-circuit to
`true` on `parseError()`/`rangeError()`, and `time-picker.ts:856` on `rangeError()` alone, before consulting the matcher.
Precedent that the collapse is viable: `TextareaDirective extends InputDirective`
(`textarea/textarea.ts:116`) already inherits the entire block, and is the only control in the
library that does not carry a copy.
Semver: additive — a new exported function in `core`, no interface member added, no rename.
Why not now: it rewrites the reactive graph of every form control in the library simultaneously.
A regression would be unattributable, which is precisely the maintainer's recorded objection.

---

## F-04 `select` and `combobox` hand-roll the overlay lifecycle that `PickerOverlayCoordinator` already owns

Severity: MEDIUM
Anchor: `projects/ngx-tw/select/select.ts:1474`
Register: not in register
Confidence: [verified]
What: `PickerOverlayCoordinator` (`core/overlay/picker-overlay-coordinator.ts:106`) exists and is
consumed by **exactly two** components — `date-picker.ts` and `date-range-picker.ts`. `select` and
`combobox` use only the three leaf helpers (`buildSelectLikePositions`,
`resolveSelectScrollStrategy`, `consumeOverlayEscape`) and re-implement everything above them.
Measured shape diff between `select.ts:1474-1567` and `combobox.ts:1343-1452`:

| Method | Verdict |
|---|---|
| `ensureOverlay` | identical except the anchor element and the `panelClass` string literal |
| `updateOverlaySize` | identical except the anchor element |
| `installResizeObserver` | identical except a hoisted `target` local |
| `resolvePanelClass` | byte-identical (see F-05) |
| `clearCloseTimer` | byte-identical |
| `closeOverlay` | same `setTimeout(ANIMATION_DURATION)` skeleton, divergent bodies (F-01/F-02 live here) |
| `attachOverlayComponent` | same skeleton, different portal type and callback wiring |

Method-name overlap across the whole class: **25 of 39** (`select`) / **25 of 42** (`combobox`).
Same measurement for the picker pair: **28 of 40** shared method names between `date-picker` and
`date-range-picker` — but there the name overlap is a skeleton match only. I body-diffed the four
methods that carry real logic (`onTriggerKeydown`, `commit`, `onClearAction`, `onApplyAction`) and
they diverge for stated single-vs-range reasons; the detail is in F-09, and the conclusion is that
the picker pair's remaining duplication is confined to the overlay lifecycle the coordinator
already owns, plus F-03. **`select` vs `combobox` is the pair with real body-level duplication.**
Why it matters: two of the two known behavioural defects in this file pair (F-01, F-02) are
divergence between copies that were supposed to be the same. There is no mechanism that keeps
them the same.
Fix: **NEEDS-ITS-OWN-PASS**, and the reason is specific rather than generic caution:
`PickerOverlayCoordinator.close()` **disposes** the `OverlayRef` and sets it to `null`
(`picker-overlay-coordinator.ts:213-214`, with an explanatory comment), whereas select/combobox
**reuse** the same `OverlayRef` across opens. Migrating changes the reopen path — which is exactly
where F-01's bug lives. Target decomposition: extend the coordinator with the three things it
lacks (`updateSize(width)` + a `ResizeObserver` on the origin, an optional `reuseOverlayRef` mode,
and a per-open `Subscription` aggregate exposed as `perOpen()`), then migrate select and combobox
onto it. Roughly **170 lines out of `select.ts`, 160 out of `combobox.ts`, ~90 into the
coordinator**. Land F-01 and F-02 *first and separately*, so the reopen behaviour is correct and
covered by specs before it moves.
Semver: `PickerOverlayCoordinator` and its config interface are exported from `@cdevhub/ngx-tw/core`.
New coordinator options must be **optional** members on `PickerOpenConfig` — adding a required
member is breaking.

---

## F-05 `resolvePanelClass` exists in five identical copies

Severity: LOW
Anchor: `projects/ngx-tw/select/select.ts:1556`
Register: not in register
Confidence: [verified]
What: a four-line pure function, duplicated at `select.ts:1556`, `combobox.ts:1442`,
`date-picker.ts:1498`, `date-range-picker.ts:1459`, and `popover.ts:777`. The first four are
byte-identical; popover's differs only in reading `twPopoverPanelClass()` instead of `panelClass()`.
It is **not** the same as the existing `mergeOverlayPanelClass`
(`core/overlay/overlay-container-helpers.ts:44`) — that one *merges* a consumer list onto an
internal class string; this one *flattens* a `string | readonly string[]` to a string.
Why it matters: small, but it is the only genuinely mechanical duplication in the overlay family,
and it is the kind of thing that makes a reviewer stop believing the rest is deliberate.
Fix: **SAFE-NOW.** Add `flattenPanelClass(raw: string | readonly string[] | undefined): string` to
`core/overlay/overlay-container-helpers.ts` (data-only file, no DI — correct home), export it from
`core/index.ts`, and replace the five private methods with call sites that pass their own input's
value. Pure move, mechanically verifiable, no reactive graph touched. Semver: additive export.
Adjacent and lower value: `const ANIMATION_DURATION = 120` is declared four times
(`select.ts:156`, `combobox.ts:68`, `command-palette.ts:42`, `popover.ts:68`) and matches nothing
in `core`. A shared constant is also SAFE-NOW; I would fold it into the same commit or skip it.

---

## F-06 `carousel.ts` is the one genuine multi-responsibility file with nameable seams

Severity: MEDIUM
Anchor: `projects/ngx-tw/carousel/carousel.ts:1467`
Register: not in register
Confidence: [verified]
What: 1695 lines, 1188 of them code (326 comment, 181 blank), holding **five exported classes**
plus the `tv()` config, the color lookup tables and the label defaults — and, uniquely among the
eight files over 1500 lines, with **zero extracted siblings** in its directory (`ls carousel/`
returns only `carousel.ts`, `carousel.meta.ts`, `index.ts`, `ng-package.json`). Its own section
markers name the seams:

| Seam | Lines | Responsibility |
|---|---|---|
| `Viewport / observer setup` | 846–982 | `IntersectionObserver` + `ResizeObserver` lifecycle |
| `Scroll/active-index logic` | 982–1064 | scroll-position → active index derivation |
| `Navigation methods` | 1064–1254 | imperative API |
| `Pointer drag handler` | 1277–1397 | pointer-event state machine |
| `Keyboard handler` | 1397–1459 | key routing |
| `CarouselIndicatorsComponent` | 1499–1586 | separate component |
| `CarouselPrevDirective` / `CarouselNextDirective` | 1604–1695 | separate directives |

Why it matters: the pointer-drag state machine and the observer lifecycle are independently
testable units currently reachable only through the whole component. Compare `calendar/`, which
solved the same problem by extraction (F-09).
Fix: **SAFE-NOW for one half, NEEDS-ITS-OWN-PASS for the other — and I verified which is which.**
`CarouselComponent` does not reference `CarouselIndicatorsComponent`, `CarouselPrevDirective` or
`CarouselNextDirective` anywhere except one JSDoc sentence at `carousel.ts:617`; the dependency is
one-way (children `inject(CarouselComponent)`). So **lines 1467–1695 (~229 lines) can move to
`carousel/carousel-indicators.ts` and `carousel/carousel-nav.ts`** with no circular import,
`index.ts` re-exporting the same five symbols from the new paths — invisible to consumers, no
semver impact. It needs one supporting move: `carouselVariants` (`carousel.ts:205`) is read by
both `CarouselComponent` (`:667`) and `CarouselIndicatorsComponent` (`:1516`), so it must go to a
local `carousel-variants.ts` that is *not* exported from `index.ts` — which keeps it inside
CLAUDE.md's "do not export variant configs" rule (it stays non-consumer-API; the `core/` carve-out
is not needed for a same-entry-point share).
**Do the type move in the same step, or the graph has a paper cycle.** `carousel-variants.ts` will
need `TwCarouselIndicatorVariant` (`carousel.ts:35`) and `TwCarouselIndicatorPosition` (`:38`),
which live in `carousel.ts` — while `carousel.ts` imports `carouselVariants` back. That resolves
today only because a type-only edge is erased at compile time; it is fragile and it will stop a
reviewer. Move all six public types to `carousel/carousel.types.ts` (mirroring the
`calendar/calendar.types.ts` precedent) so the graph is strictly
`carousel.types.ts ← carousel-variants.ts ← {carousel.ts, carousel-indicators.ts, carousel-nav.ts}`.
`index.ts` re-exports the same symbols either way, so consumers see nothing.
**`CarouselSlideComponent` (396–446) must NOT move** in the same step: `CarouselComponent` queries
it via `contentChildren(CarouselSlideComponent)` at `carousel.ts:586` while the slide injects
`CarouselComponent` at `:404` — a true cycle that needs an injection token or a base class first.
Extracting the drag/keyboard/observer *logic* out of `CarouselComponent` is likewise
NEEDS-ITS-OWN-PASS (it reads and writes ~10 of the component's signals).

---

## F-07 Five symbols exported from `@cdevhub/ngx-tw/core` have zero importers

Severity: LOW
Anchor: `projects/ngx-tw/core/index.ts:31`
Register: not in register
Confidence: [verified]
What: grep across the whole library (specs and `core/overlay/` itself excluded) returns **no
importer** for `AriaIdQueue`, `OVERLAY_ANIMATION_FALLBACK_PADDING`, `PICKER_ENTER_DURATION` and
`PICKER_LEAVE_DURATION` — all four re-exported from `core/index.ts:26-27, :32-33`. The two `PICKER_*`
constants appear only inside prose comments in `date-picker.spec.ts:468` and
`date-range-picker.spec.ts:436`, never as imports. `AriaIdQueue` is used only by
`core/overlay/overlay-container-coordinator.ts`; `dialog-container.ts` and `sheet-container.ts`
consume the coordinator, not the queue. Related: `PickerOverlayCoordinator.panelId()`
(`picker-overlay-coordinator.ts:282`) is public and its own JSDoc says "Neither consuming picker
uses this today."
Why it matters: this is the entry-point-boundary question the brief asked about, answered in the
"helper in `core/` that only one component uses" direction — except it is worse than that: the
consumer count is zero. Every one of these is a compatibility promise the library is making for
no benefit, and they inflate the 991-member `.d.ts` leak already recorded under `stripInternal`.
Fix: **needs a decision: keep or shed.** These are exported from a published barrel, so removal is
breaking (**semver**). Two additive-safe options: (a) mark them `@internal` and drop them from
`core/index.ts` in the next major — this is the same mechanism the barrel comment at
`core/index.ts:42-48` already describes for the tab-trigger lookup tables, so there is precedent
in the file; or (b) keep them and add a one-line "public by design, no internal consumer" note so
the next audit does not re-find them. `panelId()` is a method on an exported class, so it can only
go in a major; annotate it either way. Do **not** silently delete.

---

## F-08 Seven e2e spec files attribute picker reset behaviour to a helper no component imports

Severity: MEDIUM
Anchor: `projects/ngx-tw/core/form-reset.ts:19`
Register: **extends** "Open — carried to pass 5" → *38 `test.fixme` in e2e used as a bug tracker*
(same class: e2e prose that misdescribes the library). The `onFormReset` orphan itself is
**already recorded outside the audit register**, in `docs/library-review/done/core.md:34` and
`docs/tree-shaking-audit.md:26`, where the decision was "keep as intentional Phase-3 scaffolding."
Confidence: [verified]
What: `onFormReset` has zero importers anywhere in the repo and is not exported from
`core/index.ts`. But seven e2e files describe it as the live mechanism —
`e2e/specs/02-cross-cutting/forms-three-strategies/date-picker.spec.ts:10` ("The new `onFormReset`
helper subscribes…"), `:59` (a test *named* "clears the input via onFormReset"), and the same
pattern in `date-range-picker.spec.ts:10,59`, `time-picker.spec.ts:11,80`, `calendar.spec.ts:14`,
`select.spec.ts:149`, plus two `@signal` tests skipped with the reason "BLOCKED — onFormReset has
no Signal Forms events stream." The pickers implement **no** reset handling at all: grep for
`FormResetEvent` across the library returns `calendar.ts` (which hand-rolls it at `:810`) and
`core/form-reset.ts` only. The reset behaviour those tests assert works through `writeValue(null)`,
which `FormControl.reset()` calls anyway.
Why it matters: the passing tests are fine; the *reasoning* attached to them is false, and two
tests are permanently skipped for a stated cause that does not apply to the components under test.
A future maintainer "fixing" the Signal Forms blocker would be chasing a helper the pickers never
touch. This is the exact failure mode the register already flagged for `test.fixme` — a comment
that trains people to believe something untrue about the library.
Fix: **documentation-only, SAFE-NOW.** Rewrite the seven prose blocks to say the reset path is
`writeValue(null)`, and re-examine the two `@signal` skips on their actual merits (Signal Forms
may or may not route through `writeValue` here — that is a real question the current comment
hides). Separately, the `onFormReset` keep/delete decision from `docs/library-review/done/core.md`
is still unexecuted after four passes; either wire `calendar.ts:800-815` onto it or delete the
file. Deleting is not a semver event — the symbol is not in any barrel.

---

## F-09 Files that are large but CORRECTLY so — do not re-open these

Severity: LOW (informational)
Anchor: `projects/ngx-tw/calendar/calendar.ts:300`
Register: not in register
Confidence: [verified]
Stated positively so the next pass does not re-sweep. Line counts measured as
`total / comment / blank / code`:

- **`calendar/calendar.ts` — 1878 / 434 / 199 / 1245. Correct. Do not re-open.** This is the
  *residual* of an already-complete decomposition: the directory holds **20 sibling files** —
  `month-view.ts`, `year-view.ts`, `multi-year-view.ts`, `calendar-view-base.ts`,
  `calendar-cell.ts`, `calendar-header.ts`, `calendar.utils.ts`, `calendar.types.ts`,
  `calendar-validators.ts`, `calendar-cva-utils.ts`, `calendar-form-directives.ts`,
  `date-adapter.ts`, `native-date-adapter.ts`, six `calendar-intl-*.ts`, plus a `selection/`
  strategy directory and two nested entry points. 23% of the remaining file is comment. What is
  left is one component with 21 inputs and 8 outputs and its own view coordination. There is no
  seam left that would not be arbitrary.
- **`table/table.ts` — 1513 / 416 / 183 / 914. Correct.** 27% comment; only 914 code lines,
  the lowest density of the eight. Cap-exempt as a **data primitive** under CLAUDE.md's codified
  exception table, and it holds six template directives plus `ColumnComponent` that genuinely
  belong to the same DI contract.
- **`paginator/paginator.ts` — 1035 / 253 / 142 / 640. Correct.** Cap-exempt **navigation
  primitive** (~20 inputs, explicitly codified). Its one intrinsic-cycle effect is the documented
  exception; leave it alone.
- **`date-picker` vs `date-range-picker`: structurally twinned, bodies correctly differ below the
  overlay layer. Do not re-open the non-overlay half.** The 28-of-40 shared method-name count in
  F-04 is a skeleton match, not a code match — I body-diffed the four methods that carry real
  logic and they diverge for stated, single-vs-range reasons:
  - `onTriggerKeydown` — `date-picker.ts:1178` handles Enter/Space (its trigger is a calendar
    toggle *button* beside an editable `<input>`; Alt+Arrow lives separately on
    `onInputKeydown`, `date-picker.ts:1119-1135`). `date-range-picker.ts:1077` handles
    Alt+ArrowDown / Alt+ArrowUp because its trigger *is* the whole field. Different DOM shape,
    correctly different key routing — **not** an APG inconsistency.
  - `commit` — `date-picker.ts:1272` writes through to the input element's `.value` and clears
    `unparseableText`; `date-range-picker.ts:1106` normalises the range, short-circuits on
    `rangesEqual`, and clears two error flags. Same six-line tail
    (`if (source !== 'programmatic') { onChange; onTouched; announce }` then emit), different
    payload types — not worth extracting across two components.
  - `onClearAction` — deliberately opposite semantics, and the divergence is documented in place:
    `date-picker.ts:1460` commits `null` and closes; `date-range-picker.ts:1431` is stage-only
    ("the user must press Apply to commit, consistent with Today").
  - `onCancelAction` is the only genuinely identical pair, and it is one line.
  The duplication between these two files is therefore confined to the overlay lifecycle, which
  the coordinator already owns, and to the error-state block (F-03). There is no third seam.
- **`select` / `combobox` / `time-picker`** and the two pickers above are large for a
  real reason — each is a form control carrying the full ARIA + Forms baseline — but they are *not*
  absolved: F-03 and F-04 are exactly the excess. Their legitimate residual is roughly 900–1000
  lines each.
- **`timeline.ts` (1281 / 388 / 112 / 781)** and **`transfer.ts` (1275 / 253 / 129 / 893)** carry
  the highest comment ratios in the 800–1300 band; nothing in them read as a seam.

---

## F-10 Three of the brief's own hypotheses are falsified — recorded so nobody re-checks

Severity: LOW (informational)
Anchor: `projects/ngx-tw/time-picker/time-picker.ts:346`
Register: not in register
Confidence: [verified]

1. **"five components open an overlay from a field-shaped trigger" is four.** `time-picker` has
   **no** CDK overlay: it imports nothing from `@angular/cdk/overlay`, and its three textual
   matches for "overlay" are prose about being *embedded in* the date pickers' overlay footers
   (`time-picker.ts:237`, `:592`, `:709`). It renders inline `role="group"` +
   `role="spinbutton"` fields (`time-picker.ts:346,362,390,419`). The overlay family is
   `select`, `combobox`, `date-picker`, `date-range-picker`.
   *This makes CLAUDE.md's input-cap exception table inaccurate:* it lists `time-picker` under
   **"Overlay-bearing components"**. **The spec is wrong, not the code.** `time-picker` has 23
   inputs and is legitimately cap-exempt — but as a **form control** (the second row), on the
   ARIA + Forms baseline rationale. Suggested edit: move `time-picker` from the overlay-bearing
   row to the form-control row. Documentation-only.
2. **Keyboard / type-ahead duplication does not exist. Nothing to extract.** `menu` delegates
   entirely to `CdkMenu`/`CdkMenuItem`/`CdkMenuTrigger` (`menu.ts:14-19,176,208,250`); `tree`
   delegates to `CdkTree` (`tree.ts:52,295`); `tabs`, `tab-nav` and `collapsible` use CDK
   `FocusKeyManager` (`tabs.ts:584`, `tab-nav.ts:247`, `collapsible.ts:488`, the last with
   `.withTypeAhead()`). The **only** hand-rolled type-ahead buffer in the library is
   `select.ts:1288-1308`, and it has no sibling to share with — `combobox` filters by typed text
   instead. `command-palette.ts:803-807` is a four-line arrow-key switch. This is CDK composition
   working as CLAUDE.md prescribes.
3. **Selection tracking is correctly three separate mechanisms.** `table` uses
   `model<readonly T[]>` plus a keyed `Set` for O(1) membership (`table.ts:920`, `:1419`);
   `transfer` uses two independent `linkedSignal<ReadonlySet<K>, readonly K[]>` check layers
   (`transfer.ts:750`, `:769`) over a source/target split; `tree` uses a single
   `signal<ReadonlySet<unknown>>` with cascade and tri-state `indeterminate` resolution
   (`tree.ts:300`, `:574-593`). The semantics do not overlap — `transfer` has two selection
   layers and no cascade, `tree` has cascade and no second layer, `table` has neither.
   Unifying would be forced abstraction. **Do not re-open.**
Fix: documentation-only — apply the CLAUDE.md table correction in (1); record (2) and (3) in the
register's verified-clean section.

---

## F-11 Entry-point boundaries are clean

Severity: LOW (informational)
Anchor: `projects/ngx-tw/core/index.ts:1`
Register: **extends** "Verified-clean… → Entry points: 56/56"
Confidence: [verified]
What: no component reaches into a sibling component's internals. Every one of the ~190
cross-entry-point imports goes through a package barrel (`@cdevhub/ngx-tw/<entry>`); the only
relative `../` imports outside a directory are the 30-odd `*.meta.ts` files importing
`../meta.types` (build metadata, not shipped API) and `calendar/selection/*` importing
`../calendar.types` / `../date-adapter` / `../calendar.utils` — intra-entry-point, correct.
Zero deep imports of the form `@cdevhub/ngx-tw/<entry>/<file>` except the two documented nested
entry points (`calendar/luxon`, `icon/lucide`).
The one boundary problem is the *opposite* shape and is F-07: symbols in `core/` with zero
component consumers.
Fix: none needed. Recorded so the next pass does not re-sweep.

---

## Summary table

| ID | Severity | Fix class |
|---|---|---|
| F-01 combobox ResizeObserver dead after first close | HIGH | **SAFE-NOW** (1 line + spec) |
| F-02 combobox per-open listener accumulation | LOW | **SAFE-NOW** (~10 lines) |
| F-03 error-state / NgControl block ×15 | HIGH | NEEDS-ITS-OWN-PASS (~550 out / ~90 in) |
| F-04 select+combobox bypass `PickerOverlayCoordinator` | MEDIUM | NEEDS-ITS-OWN-PASS (~330 out / ~90 in) |
| F-05 `resolvePanelClass` ×5 | LOW | **SAFE-NOW** (pure lift) |
| F-06 `carousel.ts` seams | MEDIUM | SAFE-NOW for lines 1467–1695 only; rest NEEDS-ITS-OWN-PASS |
| F-07 five zero-importer `core` exports | LOW | needs a decision (semver) |
| F-08 e2e prose attributes reset to unused `onFormReset` | MEDIUM | documentation-only |
| F-09 correctly-large files | LOW | none — do not re-open |
| F-10 three brief hypotheses falsified | LOW | one CLAUDE.md table correction |
| F-11 entry-point boundaries clean | LOW | none |

**Ordering constraint:** F-01 and F-02 must land **before** F-04, not after. They are bugs in the
exact reopen path that F-04's migration would rewrite; fixing them first gives F-04 a correct,
spec-covered baseline to migrate against. F-03 and F-04 must not share a pass with each other —
both touch every overlay-bearing form control's reactive graph.
