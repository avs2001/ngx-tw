# Pass 6 — API surface + output-channel docs (agent: slider / dialog / checkbox / switch / radio / segmented-control / tags-input + toast / empty-state / rhythm demo)

Date 2026-09-03. All four tasks landed. Three of the brief's own anchors were wrong; corrections below.

Verification run: `npx tsc --noEmit -p projects/ngx-tw/tsconfig.lib.json`, `npx tsc --noEmit -p
projects/ngx-tw/tsconfig.spec.json`, `npx ng build demo`, `npx eslint` over every touched path.
All clean for my files. Per the brief I did **not** run `ng test`.

---

## Task 1 — unexported types in public signatures

### 1a. `ThumbId` (slider) — fixed by rename + export

`ThumbId` was module-private in `slider.ts` and named in two **non-`@internal`** public methods:
`onThumbPointerDown()` (`slider.ts:849` pre-edit) and `onThumbKeyDown()` (`:897`). A consumer
scripting either could not spell the argument type.

Renamed the declaration to `SliderThumbId` and exported it from `projects/ngx-tw/slider/index.ts`.
Rename rather than `export type { ThumbId as SliderThumbId }` because ng-packagr emits the
*declaration* name into the rollup — aliasing on export would ship a type whose emitted name
(`ThumbId`) differs from the importable one. Zero semver risk: the name was never exported, and a
repo-wide grep found it only in `slider.ts` (the one other hit is a historical line in
`projects/ngx-tw/CHANGELOG.md:100`, deliberately left alone — a release note, not API).
`ThumbId` is far too generic a name for a symbol that reaches the root barrel; `SliderThumbId` is
the same reasoning F-2 applies to `ResolvedItem` → `CommandPaletteResolvedItem`.

### 1b. `DialogContainer` (dialog) — fixed by type-only export; barrel comment was false and is corrected

`TwDialogRef.containerInstance` is a documented getter returning `DialogContainer | null`, while
`dialog/index.ts` carried a comment asserting the container "is no longer part of the public API".
The comment was **half true and half false**, which is why it misleads: the class's *runtime* is
genuinely private (it lives in the dynamically-imported renderer chunk and is not a value export),
but its *type* was already shipping — `dist/ngx-tw/types/cdevhub-ngx-tw-dialog.d.ts:78` carries the
full `declare class DialogContainer`, including every `@internal` member.

Landed:
- `dialog/index.ts` — added `DialogContainer` to the existing **type-only** `export type { … }`
  block, and rewrote the comment to state the runtime/type split accurately.
- `dialog/dialog-ref.ts` — expanded the `containerInstance` JSDoc to name the four members that are
  supported reads (`state`, `animationStateChanged`, `enterAnimationDuration`,
  `exitAnimationDuration`), say the `_`-prefixed members are library-internal wiring, note that
  `null` is normal for the first tick, and point at `TwDialogRef.state` / `afterOpened` as the
  preferred API.

**Deliberately did NOT implement F-3's proposed fix** (narrow the getter to a
`TwDialogContainerHandle` interface). Three reasons, and I recommend it be decided centrally
rather than by one agent:
1. Narrowing a return type is a **break** for any consumer reading a member outside the handle.
   The brief's semver rule says report, don't land.
2. `SheetRef.containerInstance` is the identical shape and belongs to a sibling who was told
   "report only". If dialog narrows and sheet exports, the library ships two answers to one problem.
   **These two should be changed together or not at all.**
3. Task 1's own framing is "exporting is purely additive — no semver risk", which is the
   instruction I was operating under.

### 1c. Mechanical sweep of all seven owned entry points — result: nothing else

Method: cross-checked each entry point's shipped rollup (`dist/ngx-tw/types/cdevhub-ngx-tw-*.d.ts`,
built 2026-09-03 01:58; confirmed current — it already contains `SegmentedControlVariantLegacy`, so
the pass-5 renames are in) against its `index.ts` export list, then resolved every rollup `import`
back to its owning entry point's exports.

| Entry point | Unexported type in a public signature | Verdict |
|---|---|---|
| slider | `ThumbId` | fixed (1a) |
| dialog | `DialogContainer` | fixed (1b) |
| segmented-control | `SegmentedControlVariantCanonical` | **`@internal` — reported, not exported** |
| checkbox, switch, radio, tags-input | none | clean |

`SegmentedControlVariantCanonical` is reachable only through `resolvedVariant`
(`segmented-control.ts:416`), which is annotated `/** @internal … */`. Per Task 1's instruction it
gets reported, not exported — it disappears the moment the F-4 `@internal` leak is closed.

Every cross-entry-point type named in these rollups resolves to a real export: `TwColor`, `TwSize`,
`TwOrientation`, `ErrorStateMatcher`, `OverlayContainerState`, `OverlayContainerAnimationEvent` from
`@cdevhub/ngx-tw/core`; `FormFieldControl` from `@cdevhub/ngx-tw/form-field` (verified in
`form-field/index.ts:10` and the form-field rollup export list).

---

## Task 2 — the undocumented output pair (F-6)

**Verified, not assumed.** Of the six components the brief flagged as "likely", only **four
classes across three components** actually carry the pair. The other three are findings.

### Components that DO have the split — documented on both outputs + spec'd

| Class | any-change channel (`model()`-minted) | gesture-only channel | writeValue emit site |
|---|---|---|---|
| `CheckboxComponent` | `checkedChange`, `indeterminateChange` | `change` | `checkbox.ts` `writeValue` sets both models |
| `SwitchComponent` | `checkedChange` | `change` | `switch.ts` `writeValue` sets `checked` |
| `RadioComponent` (standalone) | `checkedChange` | `change` | `radio.ts` `writeValue` sets `checked` |
| `RadioGroupComponent` | `valueChange` | `change` | `radio.ts` `writeValue` sets `value` |

JSDoc rewritten on **both** sides of each pair, so a consumer sees the distinction whichever one
IntelliSense surfaces first, with the concrete failure modes named (echo loop if you write back into
the form from the any-change handler; silent no-fire if you expect `(change)` to observe
`setValue`).

**New finding inside radio, now documented:** `RadioComponent.checked` is **never written by the
component when the radio is inside a `tw-radio-group`** — selection lives on the group and the
rendered state reads `parent.value()` (`radio.ts:356-359`); the only `this.checked.set(...)` sites
are the standalone branch of `onActivate()` and the standalone `writeValue`. So a **grouped radio's
`checkedChange` never fires at all**, while its `change` still does. The old JSDoc claimed the model
"reflects group selection", which is not true. Corrected, and pinned by a spec.

### Components that do NOT have the split — findings

**`slider` — has three channels, but not the split F-6 describes.** F-6 records slider's minted
`valueChange` as the "any change" channel. That is **false**: `slider.ts` `writeValue()` sets only
the internal `linkedSignal`s (`internalSingle` / `internalStart` / `internalEnd`) and never
`this.value`, so a programmatic write emits nothing. The real split is *live vs commit*:
`(input)` on every drag move and key step, `(change)` on commit. Documented as such.

> **This is a latent defect, and it is the most consequential thing I found. I did not fix it —
> Task 2 is explicitly "documentation, not a refactor" — so it needs a decision.**
> `internalSingle = linkedSignal(() => toNumber(this.value(), this.min()))`. `writeValue` overrides
> the linked signal directly while leaving `value()` stale. Any later change to `min()` / `max()`
> (or anything else the computation reads) recomputes the linkedSignal **from the stale model** and
> silently discards the written value.
> **Repro:** bind `[formControl]`, `control.setValue(70)` (thumb moves to 70, `value()` still 20),
> then change `[min]` → the thumb reverts to 20.
> The obvious fix (`this.value.set(...)` in `writeValue`) needs care: it would start emitting
> `valueChange` for programmatic writes, which is a behaviour change for anyone using `[(value)]`.

**`segmented-control` — no pair at all.** `value = model()` mints `valueChange`, and `writeValue`
(`segmented-control.ts:559-561`) sets it, so `valueChange` **is** the any-change channel — but the
component ships **no hand-written gesture-only output**. Consumers therefore have no way to
distinguish a user selection from a programmatic write, and a `(valueChange)` handler that writes
back into the same form will echo. Documented on the `value` JSDoc and pinned by a spec. Adding a
`change` output would be additive and would bring it level with checkbox/switch/radio — flagging it
as a proposal, not landing it (out of scope for a docs task, and it is new public API).

**`tags-input` — no pair, and correctly so.** It has **no `value` input at all** (the third CVA
shape CLAUDE.md names), so there is no `model()` and nothing auto-minted. Its `valueChange` is
hand-written and gesture-only. Expanded its JSDoc to say *why* there is no any-change channel and
where to get one (the form control's own `valueChanges`). **No new spec** — the behaviour is
already guarded non-vacuously by the pre-existing
`tags-input.spec.ts:593` `'writeValue renders chips without emitting'`.

### The specs, and their non-vacuity

These are **regression guards for pre-existing behaviour, not failing-before fix guards** — Task 2
is a documentation task and there is no behaviour change to bisect, so the brief's
"fails before, passes after" rule does not apply and I am not claiming it does. Non-vacuity is
established instead by naming, in a comment above each block, the mutation that turns it red:

| Spec block | Turns red if… |
|---|---|
| `CheckboxComponent output-channel split` (3 tests) | delete `this.checked.set(next)` from `writeValue()`; or move `this.change.emit(next)` out of `toggle()` into `writeValue()` |
| `SwitchComponent output-channel split` (2 tests) | same two mutations on `switch.ts` |
| `RadioGroupComponent output-channel split` (3 tests) | delete `this.value.set(...)` from `writeValue`; move `change.emit` into `writeValue`; **or add a `this.checked.set(...)` to the grouped branch of `RadioComponent.onActivate()`** (third test) |
| `RadioComponent standalone output-channel split` (2 tests) | same as switch, on the standalone branch |
| `SliderComponent output-channel split` (2 tests) | move `change.emit` from `commitValue()` into `setThumbValue()`; or emit from `writeValue()` |
| `SegmentedControl output channel` (2 tests) | delete `this.value.set(...)` from `writeValue()` (first test) or from `selectOption()` (second) |

Each block clears its spies after the initial `detectChanges()`, because the first `writeValue`
lands an equal value on the model (a no-op set that does not emit) and the assertions should not
depend on that.

**The slider spec deliberately does NOT assert that a programmatic write leaves `valueChange`
silent**, even though that is today's behaviour — that would lock in the defect above and turn its
fix into a red test. It asserts only that neither *gesture* channel (`(input)`, `(change)`) fires
for a programmatic write, which is correct in any future world, and that `(change)` does not fire
mid-drag, which is the reason `(input)` exists. The reasoning is recorded in a comment in the spec.

### F-6's other half is not mine

F-6 also requires the **demo API tables** to hand-list the `model()`-minted outputs, since Compodoc
cannot see them. The demo routes for `checkbox`, `switch`, `radio`, `slider` and
`segmented-control` are **outside my ownership** (I own only `toast/`, `empty-state/`,
`foundations/rhythm/`). Not done — needs assigning. The JSDoc I wrote is the source Compodoc reads
for the *declared* outputs, so the `(change)` side of every pair will now render; the minted side
still has no declaration site and still needs hand-adding.

---

## Task 3 — toast reduced-motion claim deleted (gate confirmed absent)

Confirmed the gate does not exist, widening the search past `toast/` as a check on the whole task:
`grep -rn "prefers-reduced|reduced-motion|reducedMotion|matchMedia" projects/ngx-tw --include='*.ts'`
returns only `skeleton` / `flip-card` JSDoc prose, `carousel` (the library's **only** runtime
`matchMedia` reduced-motion check) and `theme.service.ts` (dark/contrast queries, unrelated).
`toast-container.ts:327` reads `ref.config.swipeToDismiss` bare, with nothing in front of it.
Reduced motion reaches toast **only** through the universal CSS guard at `theme/_base.css:397`,
which zeroes transition/animation durations — it cannot disable a pointer gesture.

Followed the decision as given (delete the claim, do not add the gate). Rewrote **four** sites, not
the three the brief lists — the fourth is the "Reduced motion" row in the overview, whose *first*
half ("enter / leave animations shorten") is true, so I edited it surgically rather than dropping
the row:

- `toast/examples/toast-examples.component.ts` — replaced "disabled automatically under
  prefers-reduced-motion" with the real opt-out (`swipeToDismiss: false`) plus one line on why the
  gesture survives reduced motion.
- `toast/api/toast-api.component.ts` — `swipeToDismiss` row.
- `toast/overview/toast-overview.component.ts` — "Pointer swipe" keyboard-table row.
- `toast/overview/toast-overview.component.ts` — **"Reduced motion" row (extra site, not in the
  brief)**: kept the animation half, corrected the swipe half.

I do not think the gate should be added, for the reasons in the brief plus one more: the only
runtime reduced-motion check in the library (carousel) downgrades *programmatic scroll animation*
to `'instant'` — it never removes a user-driven affordance, so adding a swipe gate would also break
the library's own internal precedent.

---

## Task 4 — legacy variant strings in demo source

**The brief's anchor `container-panel.ts:326` is wrong and I did not change it.** That line is
`tableAppearance`, i.e. `TwTableVariant` (`table/table.ts:69`, `'default' | 'striped' |
'bordered'`), which has **no legacy alias** — `bordered` there means "draw cell gridlines", a
grid-style axis, and pass 5 §A1.6 excludes it explicitly. Rewriting it to `'outline'` would hit the
exact silently-unstyled failure the brief warns about, in reverse: `tv()` would return base classes
only, with no throw and no warning. I left it and **added a JSDoc block on `tableAppearance`
recording why**, so the next grep-driven pass does not re-derive the same wrong edit.

The brief also **missed two sites**. Real edit set:

| File | Was | Now |
|---|---|---|
| `foundations/rhythm/panels/container-panel.ts:134` | `<tw-accordion variant="bordered">` | `variant="outline"` (**not in brief**) |
| `foundations/rhythm/panels/container-panel.ts:151` | `<tw-accordion variant="bordered">` | `variant="outline"` (**not in brief**) |
| `foundations/rhythm/panels/container-panel.ts:320` | `collapsibleDisplay` `variant: 'bordered'` | `'outline'` |
| `empty-state/examples/empty-state-examples.component.ts:212` | `<tw-card variant="outlined">` | `variant="outline"` |
| `empty-state/examples/empty-state-examples.component.ts:477` | `cardSnippet` — the copyable snippet | `variant="outline"` |
| `empty-state/overview/empty-state-overview.component.ts:79` | prose "an outlined card" | "a Card with `variant="outline"`" |

That last one is English prose, not an API string, so it was out of the brief's scope — but a reader
types spellings out of prose, so I made it name the canonical variant explicitly instead.

No aliases were removed from the library. Re-swept all three owned demo directories afterwards: the
only remaining legacy-looking spelling is the table `'bordered'` above, which is canonical.

`rhythm-row.ts:50`, `rhythm-page.ts:217`, `rhythm-cell.ts:18`, `overlay-panel.ts` and
`row-alignment-panel.ts:140` also contain the words "bordered" / "filled" / "plain" — all ordinary
English in explanatory comments and notes, none of them API strings. Left alone.

---

## Things I chose not to do

1. **F-3's `TwDialogContainerHandle` narrowing** — a return-type narrowing is breaking, and the
   identical `SheetRef` getter is a sibling's. Needs a joint decision. (Task 1)
2. **Fixing `slider.writeValue()` to set the model** — out of scope for a docs task, and it changes
   `valueChange` emission semantics for `[(value)]` consumers. Reported with a repro instead.
3. **Adding a gesture-only `change` output to `segmented-control`** — new public API; reported as a
   proposal.
4. **Exporting `SegmentedControlVariantCanonical`** — `@internal`-only reachable, so per Task 1 it
   is reported, not exported.
5. **A new tags-input spec** — the guard already exists and is non-vacuous.
6. **Demo API tables for the minted outputs** — not my files.
7. **Adding the toast reduced-motion gate** — per the decision in the brief, plus the carousel
   precedent above.

## Residual risks

- **The new specs have not been executed.** The brief forbids running tests, so they are verified by
  `tsc` (both `tsconfig.lib.json` and `tsconfig.spec.json`), by `eslint`, and by mirroring
  established patterns in each file — every host template shape I used already exists in the repo
  (e.g. calling a `vi.fn()` field directly from a spec host template is the pre-existing
  `time-picker.spec.ts:40-41` idiom). Plain `tsc` does **not** run Angular's `strictTemplates`
  checking, so the spec host templates are the unverified surface. The orchestrator's central run is
  the gate.
  **No assertion in this set depends on template-binding semantics** — every one is a direct
  consequence of an emit site I read. The checkbox `indeterminate` test originally did (it set the
  model through a parent `[indeterminate]` binding that `writeValue` then contradicted); it was
  rewritten to set the model through the component instance via `By.directive`, the same
  instance-handle pattern the pre-existing `CheckboxComponent change emission` block uses, so the
  parent and child can no longer disagree.
- **A sibling's in-flight file currently breaks `ng test ngx-tw` for everyone.** Not mine, not
  touched, reporting it because it will look like my breakage:
  `projects/ngx-tw/theme/theme-node-shims.d.ts` (untracked, new) has a JSDoc block comment
  containing `theme/**/*.spec.ts` on line 12 — the `**/` **closes the block comment**, and the rest
  of the line parses as code. `tsc` reports `TS1109` ×2 at 12:60/12:61 and `TS1005` at 13:5. The
  author escaped the same hazard one line later (`src/**\/*.d.ts`, line 13) but missed line 12. Fix
  is the same backslash.
- **A second sibling's in-flight work also shows up in the spec type-check**, and is likewise not
  mine: `projects/ngx-tw/calendar/luxon/luxon-date-adapter.ts:3` imports `TW_TZ_OVERRIDE` from
  `@cdevhub/ngx-tw/calendar` (`TS2724`), plus a `TS2322` at `:62`. That is the A2 token-rename agent
  mid-flight — the root tsconfig maps `@cdevhub/ngx-tw/*` to `./dist/ngx-tw/*`, so the new token name
  cannot resolve until the next `build:lib`. Exactly the cross-entry-point phantom the brief warns
  about; expect it to clear on the central rebuild.
- Those two files aside, **there were no errors** in either library type-check run.
- **`ng build demo` compiles against `dist/ngx-tw/` (last build), not source.** It validated my demo
  edits, which is what the task's verification note asks for, but it cannot see my library-side
  changes. Those are covered by the two `tsc` runs.

## Files touched (all within my ownership)

Library:
- `projects/ngx-tw/slider/slider.ts`
- `projects/ngx-tw/slider/slider.spec.ts`
- `projects/ngx-tw/slider/index.ts`
- `projects/ngx-tw/dialog/index.ts`
- `projects/ngx-tw/dialog/dialog-ref.ts`
- `projects/ngx-tw/checkbox/checkbox.ts`
- `projects/ngx-tw/checkbox/checkbox.spec.ts`
- `projects/ngx-tw/switch/switch.ts`
- `projects/ngx-tw/switch/switch.spec.ts`
- `projects/ngx-tw/radio/radio.ts`
- `projects/ngx-tw/radio/radio.spec.ts`
- `projects/ngx-tw/segmented-control/segmented-control.ts`
- `projects/ngx-tw/segmented-control/segmented-control.spec.ts`
- `projects/ngx-tw/tags-input/tags-input.ts`

Demo:
- `projects/demo/src/app/routes/toast/examples/toast-examples.component.ts`
- `projects/demo/src/app/routes/toast/api/toast-api.component.ts`
- `projects/demo/src/app/routes/toast/overview/toast-overview.component.ts`
- `projects/demo/src/app/routes/empty-state/examples/empty-state-examples.component.ts`
- `projects/demo/src/app/routes/empty-state/overview/empty-state-overview.component.ts`
- `projects/demo/src/app/routes/foundations/rhythm/panels/container-panel.ts`
