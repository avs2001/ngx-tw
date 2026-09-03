# Pass 6 — `PickerOverlayCoordinator` migration for `select` / `combobox` (register item 4, SRP F-04)

Scope owned: `projects/ngx-tw/select/`, `projects/ngx-tw/combobox/`, `projects/ngx-tw/core/overlay/`.
Nothing outside those was touched. `date-picker/`, `date-range-picker/`, `popover/`, `theme/`, `e2e/`
untouched.

**Outcome: migration landed.** Both components now drive their overlay through
`PickerOverlayCoordinator`. Chosen branch: **(b) dispose-on-close**, not (a) reuse mode.

---

## 1. The decision: (b) dispose-on-close

Two pieces of evidence decided it, and neither was available to F-04 when it was written.

### 1a. The stated reason to fear (b) does not apply to these two components

The brief flagged pass 5's `tooltip` rationale: `FlexibleConnectedPositionStrategy.dispose()` calls
`_positionChanges.complete()`, so a component that subscribes to `positionChanges` **once** silently
stops receiving updates after the first dispose. That is a real hazard — for `tooltip`.

Swept the whole library:

```
grep -rn "positionChanges|detachments()|attachments()|outsidePointerEvents" projects/ngx-tw --include=*.ts | grep -v spec
```

Five hits, all in files I do not own: `tooltip.ts:520,569`, `popover.ts:658,675`,
`dialog-ref.ts:124`, `sheet-ref.ts:120`. **`select.ts` and `combobox.ts` have zero.** Neither
subscribes to any once-per-ref stream. Their only overlay subscriptions are `backdropClick()` and
`keydownEvents()`, both already re-established per open. So the one documented objection to
dispose-on-close is inapplicable here.

### 1b. Reuse mode cannot fix the frozen **origin**, and is therefore the weaker branch

Pass 5's own overlay report (`pass5-w2-overlay-report.md`, "Two behaviours I deliberately did not
change") records that under reuse:

> the strategy's **origin** stays frozen with the reused strategy — combobox's
> `triggerSurfaceRef() ?? elementRef` is resolved once. … I did not add `setOrigin()`.

So the reused-ref path re-read exactly the two inputs `refreshPositionConfig()` /
`applyScrollStrategy()` knew about, and nothing else. `hasBackdrop`, `backdropClass` and the origin
had no refresh path at all (CDK exposes no setter for the first two — `attach()` reads them straight
off `_config`).

Teaching the coordinator a `reuseOverlayRef` mode would have meant **porting both refresh methods
into `core/` and inheriting that gap**, plus branching the coordinator's state machine on a flag
that only two of four consumers set. Dispose-on-close instead **deletes** both methods and closes the
gap structurally: every creation-time value is re-read because the ref is rebuilt.

**P5-17 is strengthened, not regressed.** The guarantee ("overlay config is re-read on every open")
is preserved and widened; only the mechanism changed. Both P5-17 specs pass unchanged — see §4.

### 1c. The `updateScrollStrategy` ordering hazard is retired, not worked around

Pass 5 established that `OverlayRef.updateScrollStrategy()` calls `attach()`/`enable()` on the new
strategy **only if `hasAttached()`**, while `attach()` later calls a bare `enable()` — so a strategy
swapped in while detached never receives its `_overlayRef` and `Close`/`RepositionScrollStrategy`
throw on the first scroll event. That constraint existed *because* the ref was reused.

Under (b) there is no swap. The strategy is handed to `Overlay.create()`, CDK calls `strategy.attach(ref)`
in the `OverlayRef` constructor and `strategy.enable()` inside `attach()` — the supported path, no
ordering rule to remember. The hazard is designed out.

---

## 2. What changed

### `core/overlay/picker-overlay-coordinator.ts` (+27 / −7, net **+20**)

Exactly **one** API addition, optional, therefore non-breaking:

```ts
/** …Pass `false` for `aria-activedescendant` surfaces (`tw-select`, `tw-combobox`)… */
readonly focusTrap?: boolean;   // on PickerOpenConfig
```

`open()` now guards `if (config.focusTrap !== false) this.setupFocusTrap();`. Absent the flag the
behaviour is byte-identical, so `date-picker` / `date-range-picker` are untouched and were not edited.

Rest of the diff is JSDoc: the consumer list (2 → 4), an explicit statement that the ref is disposed
on close so nothing is frozen at first open, and a new **out-of-scope** bullet recording that panel
width deliberately stays in the consuming component.

**No `origin` widening was needed.** `combobox` anchors to `triggerSurfaceRef()?.nativeElement ??
elementRef.nativeElement`; passing `triggerSurfaceRef() ?? this.elementRef` keeps it an
`ElementRef<HTMLElement>` and preserves the exact anchor element. The panel geometry is unchanged —
which matters, because `select` has visual baselines.

### `select.ts` (+69 / −152, net **−83**) and `combobox.ts` (+77 / −179, net **−102**)

Deleted from both:

| Removed | Why it is gone |
|---|---|
| `ensureOverlay()` | the coordinator creates + attaches |
| `attachOverlayComponent()` | ditto; only the callback wiring survives, inlined into `openOverlay()` |
| `refreshPositionConfig()` | dispose-on-close re-reads `offset` for free |
| `applyScrollStrategy()` (+ its 12-line ordering JSDoc) | dispose-on-close re-reads `scrollStrategy` for free |
| `clearCloseTimer()` | coordinator owns the leave timer |
| fields `overlayRef`, `positionStrategy`, `appliedOffset`, `appliedScrollStrategy`, `closeTimer`, `perOpenSubs` | coordinator owns all six |
| `const ANIMATION_DURATION = 120` (both files) | now `PICKER_LEAVE_DURATION`, same value |
| imports `OverlayRef`, `FlexibleConnectedPositionStrategy`, `ComponentPortal`, `Subscription`, `takeUntilDestroyed`, `consumeOverlayEscape` | unused |

`subscribePerOpen()` shrank from a `Subscription` aggregate to two `coordinator.backdropClick$()` /
`escape$()` subscriptions. Those complete on close via the coordinator's `takeUntil(currentClose$)`,
**and** the ref's `dispose()` completes `_backdropClick`/`_keydownEvents` outright — so pass 5's F-02
accumulation bug is now impossible by construction rather than by discipline.

Kept private in each component, per §5: `installResizeObserver()`, `updateOverlaySize()`,
`resolvePanelClass()`.

### Behaviour deltas, each checked

- **Leave duration** `ANIMATION_DURATION` 120 → `PICKER_LEAVE_DURATION` 120. Identical. Neither spec
  file referenced the deleted constant (`grep -n "ANIMATION_DURATION" …spec.ts` → no hits); both wait
  the leave window through hardcoded numbers (`160`, `vi.advanceTimersByTime(300)`).
- **`updateSize` now runs after `attach()`, not before.** Verified against CDK 22 source: `attach()`
  does *not* position synchronously — it registers `afterNextRender(() => { if (hasAttached())
  this.updatePosition(); })` (`_overlay-module-chunk.mjs:758`). Our synchronous `updateSize()` lands
  before that render, so the deferred reposition sees the correct width. No `updatePosition()` call
  needed and none added.
- **`ResizeObserver` is now minted per open and disconnected on close.** Under reuse this was the
  F-01 bug (disconnect on close + `ensureOverlay()` early-return = permanently dead tracking). Under
  dispose-on-close the install is unconditional on every open, so that shape cannot recur. The F-01
  spec — which fires only *still-connected* observers — passes unchanged.
- **Destroy hooks** no longer touch `overlayRef` / `closeTimer` / `perOpenSubs`. The coordinator
  registers its own `DestroyRef.onDestroy` during the component's *field initialisation*, i.e. before
  the component's constructor-body hook, so it disposes first. Both components keep their own
  `resizeObserver.disconnect()`.

  **Destroy-mid-close, traced rather than assumed.** `combobox`'s old destroy hook released
  `perOpenSubs` with an explicit justification — *"Destroy cancels the close timer, so a destroy
  landing mid-close would otherwise never run the timer callback that releases these."* I deleted
  that line, so it deserved a trace rather than a shrug. `disposeImmediate()` runs, in order:
  `clearCloseTimer()` → `currentClose$.next()` + `.complete()` → `overlayRef.dispose()`. The middle
  step terminates the `takeUntil` on `backdropClick$()` / `overlayKeydown$()`, which **unsubscribes
  them from the source** — `currentClose$` is the notifier, not the source, so no value is pushed
  through and neither `closePanel()` handler is invoked. `dispose()` then only *completes*
  `_backdropClick` / `_keydownEvents`, and `subscribe(next)` handlers do not run on completion. The
  teardown order (streams first, ref second) is the safe one. `dispose()`'s one emission,
  `_detachments.next()`, has no subscriber in either component (the library-wide grep in §1a found
  `detachments()` only in `dialog-ref.ts` / `sheet-ref.ts`). So there is no re-entry into
  `closeOverlay()` during teardown, and the deleted release is genuinely redundant rather than merely
  unreachable-looking.
- **Dead branch collapsed** in both `updateOverlaySize()`: `typeof width === 'number'` and its `else`
  both ran `updateSize({ width })`. Merged. Zero behavioural difference.

---

## 3. Non-vacuity proof — three deliberate coordinator breaks

Each break was applied to `core/overlay/picker-overlay-coordinator.ts` alone, the library rebuilt, and
`select.spec.ts` + `combobox.spec.ts` run. **All three redden specs in both files** — which is the
point: a single edit in `core/` now moves both components, so the dedup is real rather than nominal.

| Break | Edit | Failures | Specs that caught it |
|---|---|---|---|
| **A** | drop `overlayRef.dispose(); overlayRef = null` from `close()` (keep `detach()`) → `open()`'s `if (this.overlayRef) return null` blocks every reopen | **6** (2 files) | select: `overlay configuration on reopen > applies an offset changed between two opens`, `… > applies a scrollStrategy changed between two opens`. combobox: same two, plus `overlay width > keeps tracking trigger resizes after a close/reopen cycle` and `reopen > re-pushes the option rows into the fresh panel on reopen` |
| **B** | never invoke `onAfterClose()` → neither component clears `overlayInstance`/`isAttached`/`closing` | **6** (2 files) | identical set to A |
| **C** | invert `escape$()`'s filter to `e.key !== 'Escape'` — a different code path from A/B | **9** (2 files) | select: `keyboard > updates aria-activedescendant on ArrowDown when open`, `… > skips disabled options during keyboard navigation`, `… > selects the active option on Enter`, `… > type-ahead skips a disabled option and lands on the next match`, `accessibility > keeps aria-activedescendant on the trigger when not searchable`, `accessibility > moves aria-activedescendant to the search input while a searchable panel is open`. combobox: `ARIA wiring > aria-activedescendant moves with ArrowDown`, `keyboard > Escape dispatched on the overlay panel closes the popover (parity with select)`, `keyboard > Backspace on empty input does not close the popover` |

A and B surface through the same six specs (both make a reopen impossible, by different mechanisms);
C exercises an unrelated path and reddens a disjoint set of nine. Coordinator restored byte-exact
from a backup after each run and the full suite re-run.

---

## 4. Existing specs: all pass **unchanged**

Zero edits to any existing assertion in `select.spec.ts` or `combobox.spec.ts`. Verified individually
for the specs most at risk:

- **P5-17 offset spec** — `capturePositionStrategy()` re-assigns its captured strategy on every
  `flexibleConnectedTo` call, so it naturally captures the fresh per-open strategy. `positions[0].offsetY === 16`
  still holds.
- **P5-17 scroll-strategy spec** — still green, but note the *reason* shifted: its comment explains
  itself in terms of a post-`attach()` **swap** (`updateScrollStrategy`), which no longer exists.
  CDK now calls `fake.attach()` in the `OverlayRef` constructor and `fake.enable()` inside `attach()`.
  The assertions (`closeFactory` called, `fake.attach` called, `fake.enable` called) are unchanged and
  still prove the strategy reached a live attached overlay. **Flagged so a future reader does not read
  that comment as accidentally stale.** I left it alone rather than editing a passing spec.
- **F-01 resize spec** (`keeps tracking trigger resizes after a close/reopen cycle`) — passes. It
  filters to observers that are not disconnected *and* observe the combobox host; the per-open install
  supplies exactly one such observer after the reopen.
- **Pane-identity risk, checked explicitly** — grepped both spec files for `Overlay.create` /
  `toHaveBeenCalledTimes` / `reuse` / `cdk-overlay-pane`. There is **no** spec asserting overlay
  identity across a close, and every `.cdk-overlay-pane` query happens *after* the (re)open, so no
  reference goes stale under dispose. Had one existed I would have reported it rather than edited it.

### Two new specs added (not edits)

`focusTrap: false` was, on inspection, **not covered by anything** — I removed the flag, rebuilt, and
all 189 specs still passed. Rather than leave an uncovered behavioural decision, I added one guard per
file (`select.spec.ts` → `accessibility > does not trap focus around the panel`; `combobox.spec.ts` →
`ARIA wiring > does not trap focus around the panel`). Each asserts the pane has no sibling
`.cdk-focus-trap-anchor`.

**Confirmed non-vacuous by forced failure**, not by reasoning: with the flag removed both fail with
`expected 2 to be +0` — CDK inserts exactly two tabbable anchors around the pane. Restored, both pass.

### Suite state

`npm run build:lib` clean. `npx tsc --noEmit` clean on both `tsconfig.lib.json` and `tsconfig.spec.json`.
`ng test ngx-tw`: **3375 passed, 4 skipped, 1 failed**.

The single failure is **not mine**: `date-picker.spec.ts > aria-required from the bound control >
exposes aria-required when the control carries Validators.required`. `git diff` shows a sibling agent
mid-edit in `date-picker.ts` (`[attr.aria-required]="requiredInput()"` → `required()`) with a new
28-line spec. Pure forms wiring, no overlay involvement, in a file I do not own and did not touch.
(A `theme/theme-token-parity` failure appeared in an intermediate run and had cleared by the final one
— also a sibling's in-flight edit.) Playwright not run, per the brief.

---

## 5. What I deliberately did **not** do

- **Width sync stays out of `core/`.** F-04 proposed moving `updateSize(width)` + the `ResizeObserver`
  into the coordinator. I left them private in each component. Reasons: the two date pickers do not
  want them; the coordinator's JSDoc enumerates its scope deliberately and this would blur it; and
  `select`'s `updateOverlaySize()` carries a load-bearing comment about the pass-6 clear-button
  restructure ("The view query, NOT `querySelector('button')`") that constraint 3 says not to disturb.
  The two `installResizeObserver()` / `updateOverlaySize()` pairs remain near-duplicates (~25 lines
  each). A standalone `applyOverlayWidth(ref, width, anchor)` helper in `core/overlay/` would collapse
  them; it is a clean, separable follow-up, not part of this migration.
- **`resolvePanelClass()` not extracted.** F-04's table counts it as duplication this migration
  removes. It is F-05's, and F-05 spans `date-picker`, `date-range-picker` and `popover` — three files
  I do not own. Touching only the two copies I own would leave three behind and make the situation
  worse. Left in place; still five identical copies.
- **No `reuseOverlayRef` mode added** — see §1b.
- **No `enterDuration` config.** `select`/`combobox` simply never call `opened$()`; they emit
  `openedChange` synchronously, exactly as before. The coordinator still arms a 140 ms `openedTimer`
  per open, which is inert (guarded by `attachedSignal()` and cleared in `disposeImmediate`). An
  optional flag that changes no behaviour would be pure API surface.
- **No `origin` widening on `PickerOpenConfig`** — turned out unnecessary; see §2.
- **No spec edited.** The brief's instruction was to report rather than edit; nothing required it.

---

## 6. Corrections to F-04

1. **F-04's proposed decomposition names "an optional `reuseOverlayRef` mode" as the target. That is
   the wrong branch.** Reuse cannot refresh the position strategy's origin (nor `hasBackdrop` /
   `backdropClass`, for which CDK has no setter), so it would have imported pass 5's known gap into
   `core/` and branched the coordinator's state machine for it. Dispose-on-close deletes the two
   refresh methods outright and re-reads *everything*. F-04's stated blocker — "migrating changes the
   reopen path, which is exactly where F-01's bug lives" — was correct as sequencing advice and is
   why this waited; it was not an argument for reuse.
2. **F-04 counts `resolvePanelClass` among the duplication this migration removes.** It is F-05's
   finding and spans three files outside this agent's ownership. Out of scope, not skipped silently.
3. **F-04's line estimate was high: "~170 lines out of `select.ts`, 160 out of `combobox.ts`, ~90 into
   the coordinator."** Measured: **−83 / −102 / +20**. The gap is mostly the width-sync pair that F-04
   assumed would move into `core/` and that I deliberately left in place (§5), plus `resolvePanelClass`.
4. *(Withdrawn.)* An earlier draft of this list claimed F-04 "understated" the `updateOverlaySize`
   difference. It did not — F-04 says "identical except the anchor element", and `triggerButtonRef()`
   vs `triggerSurfaceRef()` is exactly that. The anchors differ for stated per-component reasons
   (`select`'s carries the pass-6 clear-button comment), which is a reason the pair did not move into
   `core/`, but it is not a defect in F-04. Recorded rather than deleted so the correction count is
   honest: **three** F-04 corrections, not four.

**Net measured delta: −165 lines across the two components, +20 in `core/`, for −145 source lines
overall** (+42 spec lines for the two new focus-trap guards).

---

## 7. Residual risk, stated rather than implied closed

- **Not covered by any spec, before or after: real-browser panel geometry.** jsdom gives every element
  a zero-sized rect, so no unit spec observes placement. The argument that attach-then-size is
  equivalent to size-then-attach rests on CDK source (`attach()` defers `updatePosition()` to
  `afterNextRender`), read directly, not recalled. `select` has visual baselines; the orchestrator's
  Playwright run is the check I am not permitted to make.
- **`focusTrap: false` is my judgement call.** It is behaviour-preserving (neither component trapped
  focus before) and now spec-guarded, but the guard asserts absence of anchors, not that trapping
  would have been *wrong*. The reasoning: both panels are `aria-activedescendant` surfaces whose
  options are not focusable, so the trap's two anchors would be the only tab stops in the overlay.
- **Every spec run happened while sibling agents were editing `date-picker`, `date-range-picker`,
  `time-picker` and `theme`.** My files' results are stable across five runs; the two failures I saw
  were in their files and one of them cleared on its own.

## 8. Semver

Non-breaking. One **optional** member added to `PickerOpenConfig` (`focusTrap?: boolean`); nothing
renamed, removed, or made required. `PickerOverlayCoordinator`'s public surface is otherwise
unchanged. `select` and `combobox` public APIs are untouched — no input, output, model, or exported
type changed.

## 9. Files touched

- `projects/ngx-tw/core/overlay/picker-overlay-coordinator.ts`
- `projects/ngx-tw/select/select.ts`
- `projects/ngx-tw/select/select.spec.ts` (one spec **added**, none edited)
- `projects/ngx-tw/combobox/combobox.ts`
- `projects/ngx-tw/combobox/combobox.spec.ts` (one spec **added**, none edited)
