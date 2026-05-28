---
"ngx-tw": minor
---

S09 — internal fixes on `select` + `combobox` plus a new `core/overlay/` module of pure helpers that both components now consume. Closes the Batch 2 select/combobox findings and the cross-cutting "Overlay scroll-strategy and position duplication" theme.

**`SelectComponent` — internal fixes:**

- Dropped the bare `focus:outline-none` from the `naked` variant trigger slot (the paired `focus-visible:outline-none` is kept). Library rule: `focus-visible` only on interactive elements.
- `errorState` / `_setErrorState` work was already landed by S08 — verified, no churn here.

**`SelectComponent` — clear-affordance follow-up (deferred):**

The audit asked to convert the clear `<span role="button">` to a native `<button type="button">`. The trigger surface in `SelectComponent` is itself a `<button #triggerButton type="button" role="combobox">`, and the clear span sits **inside** that button. Replacing the span with a native `<button>` would produce nested interactive content (invalid per HTML's content model for `<button>`). The structural fix is to migrate the trigger from `<button>` to `<div role="combobox" tabindex="0">` (Material's `mat-select` pattern), which touches focus management, keyboard activation, and spec assertions and is out of S09's scope. The current `<span role="button" tabindex="-1">` keeps the existing keyboard handlers (`Enter` / `Space` on the span). **Follow-up**: queue the trigger restructure as a separate session so the clear can become a proper native `<button>` sibling inside a non-interactive trigger.

**`ComboboxComponent` — internal fixes:**

- `color: { neutral }` row was raw-palette `focus-within:outline-neutral-500`; replaced with semantic `focus-within:outline-border-strong` so dark / high-contrast themes flow through automatically.
- The `focus-within:outline-2 focus-within:outline-offset-2` chain on the `trigger` slot is the **deliberate** container-focus indicator: the inner `<input>` clears its own outline (`outline-none` on the input slot) so the surrounding trigger surface owns the visible ring. The `color` / `errorState` variants below paint that ring per-axis. Kept with an inline comment explaining the contract so a future reader does not strip it as duplication.
- Demo Colors → Sizes ordering and the "States" section name were already fixed by S05 — verified, no churn here.

**New shared module — `projects/ngx-tw/core/overlay/`:**

Three pure helpers exported flat from `ngx-tw/core` (the existing `core/` entry-point exports are flat; no sub-entry was introduced):

- `buildSelectLikePositions(offset?: number): ConnectedPosition[]` — returns the four fallback positions (below-start, below-end, above-start, above-end). Verified byte-identical between the previous `buildSelectPositions` (select) and `buildComboboxPositions` (combobox); both call sites now consume the helper.
- `resolveSelectScrollStrategy(name: 'reposition' | 'close' | 'block', overlay: Overlay): ScrollStrategy` — maps the three-option scroll-strategy input to the corresponding CDK strategy. Both `SelectComponent.resolveScrollStrategy` and `ComboboxComponent.resolveScrollStrategy` were dead-identical; both have been deleted in favor of the helper.
- `consumeOverlayEscape(overlayRef, onEscape): () => void` — wraps `OverlayRef.keydownEvents().pipe(filter(key === 'Escape')).subscribe(onEscape)` and returns a teardown. `SelectComponent`'s per-open `Subscription` now adds the teardown; `ComboboxComponent` registers it on `destroyRef.onDestroy()` mirroring its existing backdrop subscription.

The `useNakedWhenInFormField` helper from the original S09 prompt was **not extracted**. Investigation showed the three call sites are structurally heterogeneous: `SelectComponent` and `TimePickerComponent` resolve `variant() ?? (formField ? 'naked' : 'default')` against an explicit `variant` input, while `ComboboxComponent` has no `variant` input at all and simply returns `!!formField` as a boolean. A single signature would fit two callers and force a third — three sites of trivially small heterogeneous code is not a duplication problem. Additionally, locating an `inject(FormFieldComponent)` helper inside `core/` would create a reverse dependency (core ← form-field ← core). The auto-naked migration originally planned for time-picker in S10 is moot: there is no helper to migrate to.

**Behavioural parity — combobox Escape dismiss:**

`SelectComponent` historically listened for Escape twice — once on the trigger / search-input keydown handler, once via `overlayRef.keydownEvents()`. `ComboboxComponent` listened only on its input's keydown handler. Because combobox keeps DOM focus on the `<input>` via `aria-activedescendant`, the input-level handler covered most paths. The new `subscribeOverlayEscape()` in `ComboboxComponent` adds the overlay-level listener as a safety net — when projected `[twComboboxLoading]` / `[twComboboxEmpty]` templates receive focus (e.g., a consumer puts a focusable retry button inside the empty slot), Escape still dismisses cleanly. The handler also restores `lastCommittedLabel` to match the input-level path's behavior. A new spec (`combobox.spec.ts` → "Escape dispatched on the overlay panel closes the popover") asserts the overlay-level path.

**Design intent — the helpers are sized for future callers:**

The three extracted helpers (`buildSelectLikePositions`, `resolveSelectScrollStrategy`, `consumeOverlayEscape`) are intentionally generic: their names do not say "select-only", their signatures take only what they need, and they sit at `ngx-tw/core` so any future overlay-bearing form control can consume them without round-tripping through select. S18 (date-picker / date-range-picker overlay extraction) and S20 (dialog refactor) are expected to consume the same helpers — `buildSelectLikePositions` covers any below-/above-trigger overlay shape, `resolveSelectScrollStrategy` is the canonical three-option mapping, and `consumeOverlayEscape` works for any modal overlay that wants to dismiss on Escape. Reviewers should treat the API surface as load-bearing for those future sessions.

**Spec coverage added:**

- `projects/ngx-tw/core/overlay/positions.spec.ts` — five assertions (count, ordering, default offset, signed offset application, fresh-array-per-call).
- `projects/ngx-tw/core/overlay/scroll-strategy.spec.ts` — three assertions, one per name.
- `projects/ngx-tw/core/overlay/escape.spec.ts` — three assertions (handler fires on Escape, ignored on other keys, teardown stops further invocations).
- `projects/ngx-tw/combobox/combobox.spec.ts` — one assertion verifying overlay-panel-dispatched Escape closes the popover.

Full ngx-tw suite: **2539 passing / 4 pre-existing skipped** (vs S08's 2527 — exactly +12, matching the four new helper specs plus the combobox Escape parity assertion). Type-check clean across `tsconfig.lib.json`, `tsconfig.spec.json`, `tsconfig.app.json`.

**Migration:** none. Consumers' import surface is unchanged — the helpers ship as new exports from `ngx-tw/core`. The combobox Escape behavior change is purely additive (a new path; existing paths still work). The `outline-neutral-500` → `outline-border-strong` swap is visually equivalent on the shipped default theme and now respects dark / high-contrast theme overrides.
