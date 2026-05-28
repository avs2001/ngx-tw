---
"ngx-tw": minor
---

S07 — form-control internals B (`radio`, `switch`, `slider`) plus error-state-matcher parity sweep. Addresses the audit's Batch 1 findings on the three remaining form controls and the cross-cutting "Error-state matcher coverage is split" theme.

**Behavioural change (breaking-ish for keyboard users) — `SwitchComponent`:**

- `Enter` no longer toggles the switch. Only `Space` activates, matching the ARIA `switch` role pattern and the existing `<tw-checkbox>` behaviour. Mouse / pointer activation is unchanged. Consumers who were documenting "Space or Enter" should update their docs. The matching spec assertion in `switch.spec.ts` (`'should toggle on Enter key'`) was inverted to assert the new behaviour.

**`RadioComponent` (standalone `<tw-radio>`) — adds `ControlValueAccessor` for standalone use:**

- A bare `<tw-radio>` outside any `<tw-radio-group>` now correctly form-binds via `[(ngModel)]`, `[formControl]`, or signal-forms. Previously it exposed `[(checked)]` via `model()` but no CVA wiring existed, so reactive / template-driven bindings silently dropped writes.
- CVA registration follows the runtime "Material-style" pattern (`if (this.ngControl) this.ngControl.valueAccessor = this`), matching `checkbox` and `slider`. The static `NG_VALUE_ACCESSOR` provider was rejected because it cannot coexist with `inject(NgControl, { self: true })` required by the error-state matcher integration.
- `writeValue` / `registerOnChange` / `registerOnTouched` / `setDisabledState` implemented; `onChange` is fired from user click + Space activation; `onTouched` fires on blur. Group-wrapped radios still defer to the group's CVA — the standalone CVA is dormant in that path.

**Error-state-matcher parity (audit cross-cutting theme #11):**

| Control | Result |
| --- | --- |
| `input`, `textarea` (inherits via `InputDirective`) | unchanged — already wired |
| `checkbox`, `slider` | unchanged — already wired |
| `radio` (`RadioComponent`) | **new** — full `TW_ERROR_STATE_MATCHER` + `errorStateMatcher` input + `errorState` computed, reflected via `aria-invalid` on the host. Grouped radios inherit from `parent.errorState()`; standalone radios use their own `NgControl` |
| `switch` (`SwitchComponent`) | **API surface only** — `errorStateMatcher` input + `errorState` computed exposed, `aria-invalid` host binding wired, but `errorState` returns `false` today. Same constraint applies to `RadioGroupComponent` |
| `RadioGroupComponent` | **API surface only** — `errorStateMatcher` input exposed, group-level `errorState` returns `false` today |

The `false`-today caveat: both `SwitchComponent` and `RadioGroupComponent` register CVA via the static `NG_VALUE_ACCESSOR` provider, which cannot coexist with `inject(NgControl, { self: true })` without creating a circular DI cycle. S08 (CVA convergence) will migrate both to the runtime `this.ngControl.valueAccessor = this` pattern, at which point each `errorState` computed reads the bound `NgControl.invalid` through the configured matcher. The S07 work intentionally lands the input surface and `aria-invalid` host binding now so S08 is a pure behavioural fix with no API churn.

**`SwitchComponent` token cleanup + error visual:**

- The static `CHECKED_ICON_COLOR` map now uses semantic `text-on-{color}` tokens (matching `checkbox`) instead of raw `text-white` / `text-black`. Dark-mode and high-contrast theme overrides now flow through automatically.
- An `errorState` slot variant + compound variant added to `switchVariants` so that when S08 wires the runtime CVA pattern, the off-track repaints with the error color (`bg-error-100` + inset `ring-error-300`) and the label / description shift to `text-error-700` / `text-error-600`. The styling is dormant today (the `errorState` computed returns `false`); the variant lands now so S08 is a pure behavioural swap.

**`SliderComponent` refactors (audit Batch 1 — slider):**

- `errorState` now reads `focusedThumb()` in addition to `_ngControlRev` / `_formSubmitRev`, so blur-driven `touched` transitions repaint the error border without waiting for the next status/value change. The slider has no `_focused` signal (the audit anchor was approximate) — `focusedThumb` is the actual focus-tracking signal the constructor's `FocusMonitor.monitor(elementRef, true)` subscription drives.
- The constructor `queueMicrotask` + manual `.subscribe` block has been removed. The `NgControl.statusChanges` / `valueChanges` + `ngSubmit` subscriptions now run in `ngOnInit` (where `NgControl.control` is guaranteed populated by the parent directive's `ngOnChanges`) and use `takeUntilDestroyed(this.destroyRef)`, matching the canonical `input.ts` pattern. `focusMonitor.monitor` likewise wraps in `takeUntilDestroyed`.
- The `markClassFor(markValue)` and `bubbleClassFor(thumb)` template helpers no longer recompute on every CD cycle. They now read from `computed()`-memoised maps (`markClassMap` keyed by mark value; `bubbleClassMap` enumerated per `ThumbId`). The functions are O(1) lookups, recomputed only when the variant slots, fill segment, or marks list change.
- **Breaking (pre-1.0):** the TS-side identifier `input` (`output<SliderValue>()` at `slider.ts:473`) is renamed to `valueInput` so the class field no longer shadows the imported `input` factory from `@angular/core`. The public template event name is preserved via `alias: 'input'` — `(input)="…"` bindings continue to work without modification. Consumers reading the output programmatically (`sliderRef.input.subscribe(…)`) must switch to `sliderRef.valueInput.subscribe(…)`.

**Demo API update — `RadioGroupComponent<T>` generic:**

- The radio API page (`routes/radio/api/radio-api.component.ts`) now carries a short paragraph below the H2 explaining the role of the `T` type parameter (the type of each radio's `value` input, typically a string-literal union, inferred from `[(value)]` / explicit on `[formControl]`).

**Out of scope (deferred):**

- CVA registration pattern convergence (`switch` + `radio-group` migrate from static `NG_VALUE_ACCESSOR` to runtime `this.ngControl.valueAccessor = this`) — S08.
- `SliderComponent.errorStateMatcher` existed before S07; only the `_focused` read was added.

**Test coverage added:**

- `radio.spec.ts` standalone block: a template-driven `[(ngModel)]` round-trip test and a reactive `[formControl]` write+disable test on bare `<tw-radio>`. Both verify the new runtime CVA pattern works end-to-end (not just type-check shape).

**Migration:** Switch + Enter (rare); slider `input` output TS-side identifier (rare — most consumers use the template event name). Standalone `<tw-radio>` form binding now works where it previously failed — purely additive for consumers.
