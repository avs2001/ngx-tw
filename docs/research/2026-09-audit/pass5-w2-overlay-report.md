# Pass 5 FIX report — W2 overlay (`tooltip`, `select`, `combobox`, `popover`)

Scope: `projects/ngx-tw/tooltip/`, `projects/ngx-tw/select/`, `projects/ngx-tw/combobox/`,
`projects/ngx-tw/popover/`. `calendar/` and `time-picker/` untouched (sibling agent).

Per the brief I ran **no** build, `ng test`, or Playwright. Verification was by reading the
installed CDK source plus `npx tsc --noEmit` on both library tsconfigs (both clean, see
"Type check").

**F-13 is real in all four components.** Every anchor in `pass5-gaps.md` was re-verified
against the current tree before editing; all were accurate. Nothing was found to be wrong.

---

## 0. The CDK facts the whole fix rests on — verified against `@angular/cdk` 22.0.5 source, not recalled

Read from `node_modules/@angular/cdk/fesm2022/_overlay-module-chunk.mjs`:

- `FlexibleConnectedPositionStrategy.withPositions(p)` (`:1240`) **only stores** the list and
  nulls `_lastPosition`. It does not re-apply. A strategy that is currently attached needs an
  explicit `OverlayRef.updatePosition()`; one that is detached gets it for free on the next
  `attach()`.
- `OverlayRef.updateScrollStrategy(s)` (`:909`) disposes the old strategy, then calls
  `s.attach(this)` **and** `s.enable()` **only if `hasAttached()`**. `OverlayRef.attach()`
  (`:745`) later calls bare `this._scrollStrategy.enable()` with **no** `attach()`. So swapping
  a scroll strategy in **while detached** silently leaves it without its `_overlayRef`, and
  `CloseScrollStrategy`/`RepositionScrollStrategy` then throw on the first scroll event
  (`:114`, `:200` both dereference `this._overlayRef` inside the scroll subscription). **The
  swap must happen after `attach()`.** This is the single non-obvious constraint in the change
  and it is why `applyScrollStrategy()` is called where it is.
- `OverlayRef` has **no** setter for `hasBackdrop` / `backdropClass`; `attach()` reads them
  straight off `this._config` (`:769`). Rebuilding the ref is the only supported route — which
  is what F-13 said.
- `FlexibleConnectedPositionStrategy.dispose()` (`:1194`) calls `_positionChanges.complete()`.
  This makes the tooltip decision below a correctness matter, not a performance one.
- `dispose()` on a never-attached strategy is safe: `_boundingBox`/`_overlayRef` are null-guarded
  and `_clearPanelClasses()` guards `_pane` (`:1711`).
- `positions` is a **public** getter (`overlay.d.ts` `get positions(): ConnectionPositionPair[]`)
  and at runtime returns the very array handed to `withPositions`. That is what the position
  specs assert on.

`BlockScrollStrategy` was checked as a possible DOM observable and rejected: `_canBeEnabled()`
requires `documentElement.scrollHeight > viewport.height`, which is never true in jsdom, so
`cdk-global-scrollblock` never appears.

---

## 1. `tooltip` — `twTooltipPosition` frozen after the first hover — **FIXED**

Verified: `tooltip.ts` had exactly one `buildPositions(this.twTooltipPosition())`, inside
`createOverlay()` behind `if (this.overlayRef) return;`, and the hide path is `detach()` only.

**Change** (`projects/ngx-tw/tooltip/tooltip.ts`):
- `positionStrategy` and `appliedPosition` are now fields.
- `createOverlay()`'s early-return branch calls a new `applyPositions()`.
- `createAndShow()` calls `createOverlay()` **before** the `tooltipInstance` check, so a tooltip
  already on screen also picks up a changed position.
- `applyPositions()` re-`withPositions()`es only when the value actually changed, and calls
  `overlayRef.updatePosition()` when attached.
- `disposeOverlay()` nulls both new fields.

**Why in-place update rather than dispose-on-hide — this is stronger than "tooltips show
often".** `createOverlay()` subscribes to `positionStrategy.positionChanges` exactly once
(`takeUntilDestroyed`), and that feed is the only thing that sets the arrow direction.
`dispose()` completes that subject. So dispose-on-hide would have silently killed arrow
placement from the second show onward — a second bug of the same family. The rationale is in
the JSDoc on `applyPositions()`.

Its `scrollStrategy` is hard-coded (`scrollStrategies.close()`) and was **not** touched.

**Specs** — `tooltip.spec.ts`, new `describe('position is re-read on every show')`:

| spec | load-bearing assertion | against the old code |
|---|---|---|
| `applies a twTooltipPosition changed between two shows` | `strategy().positions[0]` is `{originY:'bottom', overlayY:'top', offsetY:8}` after hover → leave → set `'bottom'` → hover | `createOverlay()` early-returned, so the captured strategy still held the `'top'` pair `{originY:'top', overlayY:'bottom', offsetY:-8}` — **fails** |
| `applies a twTooltipPosition changed while the tooltip is on screen` | `strategy().positions[0]` is the `'right'` pair `{originX:'end', overlayX:'start', offsetX:8}` after a re-hover with no intervening hide | old code re-entered `createAndShow()`, hit the `tooltipInstance` branch and never went near `createOverlay()` — the list stays `'top'` — **fails** |

---

## 2/3. `select` and `combobox` — `offset` and `scrollStrategy` frozen after the first open — **FIXED (identical shape in both files)**

Verified in both: one `buildSelectLikePositions(this.offset())` and one
`resolveSelectScrollStrategy(this.scrollStrategy(), …)`, both inside `ensureOverlay()` behind
`if (this.overlayRef) { … return; }`; the ref is disposed only in the destroy hook.

**Change** (`select.ts`, `combobox.ts` — byte-parallel):
- New fields `positionStrategy`, `appliedOffset`, `appliedScrollStrategy`.
- `ensureOverlay()`'s early-return branch calls a new `refreshPositionConfig()` before
  `updateOverlaySize()`.
- `refreshPositionConfig()` re-`withPositions(buildSelectLikePositions(offset))` on the **same**
  strategy when `offset` changed, plus `updatePosition()` if attached.
- New `applyScrollStrategy()` called from `openOverlay()` **after** `attachOverlayComponent()`,
  guarded by `!this.overlayRef?.hasAttached() || name === this.appliedScrollStrategy`.
- Destroy hook additionally nulls `positionStrategy`.

**The `OverlayRef` is NOT disposed on close, deliberately** — the brief's instruction, and it
keeps both constraints from `pass5-fix-cbx-report.md` intact: combobox's `perOpenSubs` aggregate
is untouched, and the `ResizeObserver` still survives a close (its "the OverlayRef is only
disposed on destroy" comment in `closeOverlay()` remains true, so I did not have to edit or
invalidate a sibling agent's comment). F-13's suggested `dispose()` in the close timer would
have made that comment false.

**Why the change-guard (`appliedOffset`/`appliedScrollStrategy`) rather than re-applying
unconditionally.** It makes the unchanged-reopen path provably a no-op, which matters when the
suite cannot be run. Unconditional `withPositions` would hand CDK a fresh array every open, so
`positions.indexOf(this._lastPosition) === -1` would always hold and `_lastPosition` would be
nulled on every open. That happens to be inert here (neither component calls
`withLockedPosition`), but "inert because of a property of a code path in another file" is not
an argument worth relying on.

**Two behaviours I deliberately did not change:**
- The strategy's **origin** stays frozen with the reused strategy — combobox's
  `triggerSurfaceRef() ?? elementRef` is resolved once. That is identical to today's behaviour,
  so it is not a regression; I did not add `setOrigin()`.
- No shared helper was extracted into `core/`. The later `PickerOverlayCoordinator` migration
  owns that consolidation; a competing helper now would collide with it.

**Specs** — `select.spec.ts` and `combobox.spec.ts`, new
`describe('overlay configuration on reopen')` with a dedicated `OverlayConfigHost` binding both
inputs to signals. Identical pair in each file (select drives open/close by trigger click under
fake timers, matching its existing Escape spec; combobox drives the `open` model and waits out
the 120 ms leave window on real timers, matching its existing `overlay width` spec):

| spec | load-bearing assertion | against the old code |
|---|---|---|
| `applies an offset changed between two opens` | `strategy().positions[0].offsetY === 16` after open → close → `offset.set(16)` → reopen | `ensureOverlay()` early-returned, so the captured strategy still carried `offsetY: 4` — **fails** |
| `applies a scrollStrategy changed between two opens` | `fake.enable` was called, where `fake` is a stub returned by a spied `scrollStrategies.close` | the reopen never re-read `scrollStrategy`, so the factory never ran and nothing was enabled: `closeFactory` was never called and `fake.enable`/`fake.attach` never fired — **fails on all three** |

The scroll-strategy spec deliberately asserts `enable()` on a **stub strategy** rather than
asserting the factory ran. Asserting only "the factory was called" would still pass if the swap
had been placed *before* `attach()` — the exact mistake CDK punishes silently (section 0). CDK
calls `enable()` only once the strategy is installed on an **attached** ref, so that assertion
is what proves the placement.

Both position specs assert on the list handed to CDK rather than on rendered geometry. That is
deliberate and stated in a comment in each file: jsdom gives every element a zero-sized rect, so
there is no honest DOM observable for placement, and asserting the configuration handed to CDK
is testing the integration with CDK — which CLAUDE.md's "trust CDK; test your integration with
it" permits.

---

## 4. `popover` — backdrop config and `twPopoverScrollStrategy` frozen — **FIXED, with a deliberate deviation from F-13's proposed fix**

F-13's characterisation is correct and I want to restate its **partial** nature plainly:
`twPopoverPosition` and `twPopoverOffset` were **already** refreshed on every open via
`updatePositionStrategy()` (`openPopover()`). Only the two creation-time values were frozen:
`hasBackdrop`/`backdropClass` (from `twPopoverBackdrop`) and `scrollStrategy`. The
`subscribePerOpen()` re-read of `twPopoverBackdrop` is what made the disagreement observable.

**Change** (`projects/ngx-tw/popover/popover.ts`): `ensureOverlay()` now returns `boolean` and
rebuilds the ref **only when a creation-time input actually changed**, tracked via new
`appliedBackdrop` / `appliedScrollStrategy` fields. `openPopover()` skips the now-redundant
`updatePositionStrategy()` when the ref was just built fresh. `disposeOverlay()` clears the new
fields and `currentPositionStrategy`.

**Deviation, stated as such:** F-13 says popover "needs the dispose-on-close approach". I used a
**conditional rebuild on open** instead. Two reasons:

1. The existing `describe('overlay reuse')` spec asserts `panelsAfter === panelsBefore` on an
   unchanged reopen and is named "should reuse the same overlay across open/close cycles". Under
   a conditional rebuild that name stays true and the spec is untouched. Under dispose-on-close
   I would have been editing a passing test's meaning to fit my change.
2. A rebuild never runs inside the close timer, so it cannot interact with `cancelPendingClose()`
   or the `describe('reopen during the close animation')` path — dispose-on-close would have had
   to be careful there.

Accepted minor waste on a rebuild: `ensureOverlay()` builds a strategy and, on the reuse path,
`updatePositionStrategy()` builds and swaps in another, disposing the first unattached one. The
`createdFresh` return value removes that for the rebuild path; disposing an unattached strategy
is safe either way (section 0).

**Specs** — `popover.spec.ts`, new
`describe('creation-time overlay configuration on reopen')` with an `OverlayConfigPopoverHost`:

| spec | load-bearing assertion | against the old code |
|---|---|---|
| `renders the backdrop after twPopoverBackdrop changes between opens` | after open(`'none'`) → close → `'dimmed'` → reopen, `.cdk-overlay-backdrop` **exists** and carries `bg-black/20` | `hasBackdrop` stayed `false` from the first creation, so no backdrop element was ever attached — `getBackdrop()` is `null` — **fails**. This is F-13's "two reads of one input disagreeing", asserted purely on the DOM with no white-box access. |
| `installs a scroll strategy changed between two opens` | `fake.enable` was called (same stub-strategy technique as select/combobox) | the reopen never re-read `twPopoverScrollStrategy`; factory never ran, nothing enabled — **fails** |
| `keeps the same overlay when neither creation-time input changed` | `Overlay.create` called exactly once across open → close → reopen | **passes against the old code too** — see below |

**Explicitly flagged: the third popover spec is not an F-13 regression guard.** It passes before
and after. It exists to pin the *conditional* half of my deviation, so a future edit cannot
quietly turn this into rebuild-on-every-open (which would resurrect exactly the reopen fragility
the brief warned about). I am calling it out rather than letting it pad the "fails before"
count.

---

## What I chose not to do

- **No shared abstraction.** No helper added to `core/`; each fix is private to its file. The
  queued `PickerOverlayCoordinator` migration for `select`/`combobox` owns that.
- **No dispose-on-close in `select`/`combobox`** (F-13's proposal #1). It would have contradicted
  the brief and invalidated the `ResizeObserver`-survives-close comment landed earlier this pass.
- **Tooltip's `scrollStrategy` untouched** — hard-coded, not input-driven, no bug.
- **`setOrigin()` not added** to the reused select/combobox strategies (see above).
- **Nothing touched in `calendar/` or `time-picker/`.**

## Semver

Non-breaking. No exported symbol renamed, removed, or given a required member. Everything added
is `private`; `ensureOverlay()`'s changed return type is a private method in `popover`.

## Type check

`npx tsc --noEmit -p projects/ngx-tw/tsconfig.lib.json` → clean.
`npx tsc --noEmit -p projects/ngx-tw/tsconfig.spec.json` → clean.
(The `theme/theme.service.spec.ts` error recorded in `pass5-fix-cbx-report.md` no longer
reproduces; that sibling's edit has evidently settled.)

**`tsc` does not type-check Angular templates**, and all four new spec hosts introduce new
template bindings, so those two clean runs do not cover them. Each new binding was instead
verified by name against its input declaration: `[offset]` → `select.ts:557` / `combobox.ts:442`;
`[scrollStrategy]` → `select.ts:554` / `combobox.ts:433`; `[twPopoverBackdrop]` →
`popover.ts:354`; `[twPopoverScrollStrategy]` → `popover.ts:363`. `[(open)]`, `[(twPopoverOpen)]`
and `aria-label` each reuse an existing spec host's binding shape (`WidthHost`,
`ModelPopoverHost`, `PanelConfigHost`).

## Not in scope, because it was never frozen: `panelClass`

`picker-overlay-coordinator.ts:209-213` names "offset, scrollStrategy, **panelClass**" as the set
its dispose-on-close protects, so a reviewer will ask why `panelClass` is absent here. It is not
affected: the value passed to `Overlay.create()` is the constant `'tw-select-panel'` /
`'tw-combobox-panel'`, and the **consumer's** `panelClass` input goes through
`resolvePanelClass()` into the state-push effect that writes `instance.panelClassValue.set(…)`
(`select.ts:990`/`:1013`, `combobox.ts:824`) — a reactive push onto the overlay component, so it
already tracked changes. Same for popover: `attachContent()` calls
`this.popoverInstance.panelClass.set(this.resolvePanelClass())` on every open.

## Residual risk — closed rather than left ambient

The three position/scroll specs and the `hasAttached()`-ordering arguments were verified by
reading CDK 22.0.5 source, not by executing the suite (the brief forbids it). The one newly
reachable call into `FlexibleConnectedPositionStrategy.apply()` is `applyPositions()`'s
`overlayRef.updatePosition()` on an already-visible tooltip, so I traced it to the end rather
than stopping at the happy path:

- `apply()` → `_getOriginRect`, `_getNarrowedViewportRect`, `_getContainerRect`, `_applyPosition`
  — all plain `getBoundingClientRect` / `documentElement.clientWidth` / style writes.
- Tooltip's `positionChanges` **does** have a subscriber (the arrow-direction subscription), so
  `_applyPosition` takes the `if (this._positionChanges.observers.length)` branch and
  `_getScrollVisibility()` runs. It maps over `this._scrollables`, which is `[]` — nothing calls
  `withScrollableContainers` anywhere in the library — so `isElementScrolledOutsideView` /
  `isElementClippedByScrolling` short-circuit on the empty array.
- `grep` for `getComputedStyle|visualViewport|matchMedia|IntersectionObserver` across the whole
  CDK overlay chunk returns **zero** hits, so no browser-only API is reachable on that path.
- The arrow subscription therefore fires on the on-screen reposition (`withPositions` nulls
  `_lastPosition`, so `position !== this._lastPosition` holds). That is the same
  `arrowDirection.set(...)` it already performs on every attach — not a new write, and not a
  signal-cycle risk: it is a plain subscription callback, not an `effect()`.

I consider this closed, not merely likely.

## Files touched

- `projects/ngx-tw/tooltip/tooltip.ts`
- `projects/ngx-tw/tooltip/tooltip.spec.ts`
- `projects/ngx-tw/select/select.ts`
- `projects/ngx-tw/select/select.spec.ts`
- `projects/ngx-tw/combobox/combobox.ts`
- `projects/ngx-tw/combobox/combobox.spec.ts`
- `projects/ngx-tw/popover/popover.ts`
- `projects/ngx-tw/popover/popover.spec.ts`

No demo or e2e file needed a change — the fixes are internal and produce no new rendered DOM
outside the (previously missing) popover backdrop element, which only appears when a consumer
changes `twPopoverBackdrop` between opens.
