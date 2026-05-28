# ngx-tw

## 0.2.0

### Minor Changes

- [`aee8235`](https://github.com/avs2001/ngx-tw/commit/aee8235b3b64500d98216fbdfd86518d005a25d2) - **BREAKING (pre-1.0):** Drop the `Tw*` prefix from dialog and table directive/component class identifiers, restoring parity with sibling `sheet` directives and the library-wide class-naming rule in `.claude/CLAUDE.md`. Element and attribute selectors are unchanged — only TypeScript class identifiers move.

  **Dialog (`ngx-tw/dialog`):**

  | Before                               | After                        |
  | ------------------------------------ | ---------------------------- |
  | `TwDialogContainer`                  | `DialogContainer`            |
  | `TwDialogHeaderDirective`            | `DialogHeaderDirective`      |
  | `TwDialogIconDirective`              | `DialogIconDirective`        |
  | `TwDialogTitleDirective`             | `DialogTitleDirective`       |
  | `TwDialogSubtitleDirective`          | `DialogSubtitleDirective`    |
  | `TwDialogDescriptionDirective`       | `DialogDescriptionDirective` |
  | `TwDialogContentDirective`           | `DialogContentDirective`     |
  | `TwDialogActionsDirective`           | `DialogActionsDirective`     |
  | `TwDialogCloseDirective`             | `DialogCloseDirective`       |
  | `TwDialogState` (type)               | `DialogState`                |
  | `TwDialogAnimationEvent` (interface) | `DialogAnimationEvent`       |
  | `TwDialogActionsAlign` (type)        | `DialogActionsAlign`         |

  **Table (`ngx-tw/table`):**

  | Before                     | After                    |
  | -------------------------- | ------------------------ |
  | `TwCellDefDirective`       | `CellDefDirective`       |
  | `TwHeaderCellDefDirective` | `HeaderCellDefDirective` |
  | `TwFooterCellDefDirective` | `FooterCellDefDirective` |
  | `TwNoDataRowDirective`     | `NoDataRowDirective`     |
  | `TwRowExpansionDirective`  | `RowExpansionDirective`  |

  **Migration:** find-and-replace each renamed import in your consuming code. Selectors (`[twDialogTitle]`, `<tw-dialog-container>`, `[twCellDef]`, etc.) are unaffected, so templates do not need to change.

  **Not changed (intentionally):** the `TwDialog` service, `TwDialogRef`, `TwDialogConfig`, and all `TwDialog{Size,Role,…}` config types in `dialog-config.ts`, plus the broader `TwTable*` / `TwColumn*` / `Tw…Context` type exports in `ngx-tw/table`. These are out of scope for this rename — they're not component/directive class identifiers (the CLAUDE.md rule's target).

- [`aee8235`](https://github.com/avs2001/ngx-tw/commit/aee8235b3b64500d98216fbdfd86518d005a25d2) - S06 — form-control internals A (`input`, `textarea`, `checkbox`). Addresses the audit's Batch 1 findings on naming consistency, the no-op `userAria*` `computed` wrappers, the `rounded-sm` violation in checkbox, and the undocumented dual-storage mirror.

  **Breaking (pre-1.0) renames in `InputDirective` (`ngx-tw/input`):**

  | Before (TS identifier)     | After (TS identifier) | Public template selector         |
  | -------------------------- | --------------------- | -------------------------------- |
  | `userAriaDescribedByInput` | `userAriaDescribedBy` | `[aria-describedby]` (unchanged) |
  | `userAriaLabelledbyInput`  | `userAriaLabelledby`  | `[aria-labelledby]` (unchanged)  |

  The plain identifiers now directly fulfill the `FormFieldControl.userAriaDescribedBy` / `userAriaLabelledby` contract — the previously-needed `computed(() => this.userAria*Input())` no-op wrappers have been deleted. Template-side bindings are unchanged (the alias preserves the `aria-describedby` / `aria-labelledby` attribute surface).

  **Not renamed — surfaced as deliberate deviations from the audit prescription:**

  - `InputDirective.disabledInput`, `requiredInput`, `readonlyInput`, `idInput` collide with sibling `computed()` signals of the same role name (`disabled`, `required`, `readonly` semantics, `id`) that consume the raw input value AND combine it with `NgControl` / `Validators` / `uid` fallback. The `*Input` suffix is the disambiguator between "raw consumer input" and "derived effective value", not a leaky implementation detail. Renaming would either lose the computed wrapper (and break form-field integration) or collide with TypeScript identifiers.
  - `CheckboxComponent.requiredInput`, `idInput`: same collision as input — the `required` computed at line 419 ORs the input with `Validators.required(True)`, and `id` resolves to the auto-generated `hostId` fallback.

  The audit's "names leak the Input suffix" criticism is downgraded to "deliberate disambiguation". Future work that decouples the raw-input/computed pair (e.g., a base mixin) could revisit; for now the current shape is correct.

  **Non-breaking changes:**

  - **`CheckboxComponent` visual fix:** `rounded-sm` → `rounded-md` on the `box` slot (`checkbox.ts:55`). Aligns with the CLAUDE.md Visual Design System "Border Radius" table which bans `rounded-sm` outright.
  - **Checkbox dual-storage documentation:** the `internalChecked` / `internalIndeterminate` `linkedSignal`s that mirror the `checked` / `indeterminate` `model()`s now carry one-line `@internal` JSDoc explaining the rationale — they let `toggle()` and `writeValue()` flip the visible state synchronously in the same microtask, decoupling host-binding render from the `model` notification cadence. Decision: **documented, not simplified** — removing the mirror is technically possible (`linkedSignal` auto-syncs from the model on parent updates), but the explicit `internalChecked.set()` in `toggle()` and `writeValue()` is a deliberate guarantee that DOM-read consumers see the new value before any binding round-trip. The spec doesn't have a test that reproduces a divergence scenario, so simplification carried risk; per the prompt's "default to documenting if uncertain" rule, kept and explained.
  - **Textarea `@internal` note:** the existing multi-paragraph rationale comment above the `size` re-declaration in `textarea.ts` now leads with `@internal`. The audit anchor (`inputs: ['size']` re-declaration at line 71) was stale — the actual code uses `override readonly size = input<TwSize>('md')` at line 115 with the long-form rationale already in place. Only the `@internal` tag was missing.
  - **Checkbox demo Methods row:** the audit asked for a `toggle()` row in `projects/demo/src/app/routes/checkbox/api/checkbox-api.component.ts`. **Already present** at lines 173-177 (added by an earlier session). No edit required.

  **Migration:** consumers using the renamed `*Input` identifiers in TypeScript (rare — these were almost exclusively read in templates via the public alias) should rename to the bare name. Templates need no changes — all `[aria-describedby]` / `[aria-labelledby]` bindings keep working.

- [`aee8235`](https://github.com/avs2001/ngx-tw/commit/aee8235b3b64500d98216fbdfd86518d005a25d2) - S07 — form-control internals B (`radio`, `switch`, `slider`) plus error-state-matcher parity sweep. Addresses the audit's Batch 1 findings on the three remaining form controls and the cross-cutting "Error-state matcher coverage is split" theme.

  **Behavioural change (breaking-ish for keyboard users) — `SwitchComponent`:**

  - `Enter` no longer toggles the switch. Only `Space` activates, matching the ARIA `switch` role pattern and the existing `<tw-checkbox>` behaviour. Mouse / pointer activation is unchanged. Consumers who were documenting "Space or Enter" should update their docs. The matching spec assertion in `switch.spec.ts` (`'should toggle on Enter key'`) was inverted to assert the new behaviour.

  **`RadioComponent` (standalone `<tw-radio>`) — adds `ControlValueAccessor` for standalone use:**

  - A bare `<tw-radio>` outside any `<tw-radio-group>` now correctly form-binds via `[(ngModel)]`, `[formControl]`, or signal-forms. Previously it exposed `[(checked)]` via `model()` but no CVA wiring existed, so reactive / template-driven bindings silently dropped writes.
  - CVA registration follows the runtime "Material-style" pattern (`if (this.ngControl) this.ngControl.valueAccessor = this`), matching `checkbox` and `slider`. The static `NG_VALUE_ACCESSOR` provider was rejected because it cannot coexist with `inject(NgControl, { self: true })` required by the error-state matcher integration.
  - `writeValue` / `registerOnChange` / `registerOnTouched` / `setDisabledState` implemented; `onChange` is fired from user click + Space activation; `onTouched` fires on blur. Group-wrapped radios still defer to the group's CVA — the standalone CVA is dormant in that path.

  **Error-state-matcher parity (audit cross-cutting theme #11):**

  | Control                                             | Result                                                                                                                                                                                                                                |
  | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `input`, `textarea` (inherits via `InputDirective`) | unchanged — already wired                                                                                                                                                                                                             |
  | `checkbox`, `slider`                                | unchanged — already wired                                                                                                                                                                                                             |
  | `radio` (`RadioComponent`)                          | **new** — full `TW_ERROR_STATE_MATCHER` + `errorStateMatcher` input + `errorState` computed, reflected via `aria-invalid` on the host. Grouped radios inherit from `parent.errorState()`; standalone radios use their own `NgControl` |
  | `switch` (`SwitchComponent`)                        | **API surface only** — `errorStateMatcher` input + `errorState` computed exposed, `aria-invalid` host binding wired, but `errorState` returns `false` today. Same constraint applies to `RadioGroupComponent`                         |
  | `RadioGroupComponent`                               | **API surface only** — `errorStateMatcher` input exposed, group-level `errorState` returns `false` today                                                                                                                              |

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

- [`aee8235`](https://github.com/avs2001/ngx-tw/commit/aee8235b3b64500d98216fbdfd86518d005a25d2) - S08 — `ControlValueAccessor` registration convergence across the four remaining matcher-aware form controls (`switch`, `radio-group`, `select`, `combobox`). Reverses the original D5 decision and codifies the new canon.

  **Decision reversal — D5 (CVA registration pattern):**

  The original D5 prescribed migrating every form control to the static `NG_VALUE_ACCESSOR` + `forwardRef` provider. S07 surfaced empirically (with advisor confirmation) that this is incompatible with `inject(NgControl, { self: true })` — the same-element circular DI cannot be untangled, and every ngx-tw form control needs that `NgControl` injection to integrate `TW_ERROR_STATE_MATCHER`. **The new canon is runtime registration:**

  ```ts
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }
  ```

  `input` and `textarea` are explicitly exempt — they do not integrate the matcher and may keep their static `NG_VALUE_ACCESSOR` providers. Every other form control (and every new one that integrates the matcher) MUST use the runtime pattern.

  **Codified in CLAUDE.md:**

  A new `## ControlValueAccessor` section (immediately after `## Form Compatibility`) documents the pattern, the rationale (circular DI), and the input/textarea exception. Future form controls inherit the rule.

  **Components migrated:**

  | Component             | Previous state                                                                                                      | New state                                                                                                                                                                                                                                                                                                                                                                                  |
  | --------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
  | `SwitchComponent`     | static `NG_VALUE_ACCESSOR`; `errorState` returned `false` (dormant S07 placeholder)                                 | runtime CVA; full `TW_ERROR_STATE_MATCHER` integration with `NgControl.invalid` + status/value/submit subscriptions                                                                                                                                                                                                                                                                        |
  | `RadioGroupComponent` | static `NG_VALUE_ACCESSOR`; `errorState` returned `false`                                                           | runtime CVA; same matcher wiring as switch. Added `[attr.aria-invalid]` host binding. Group-level `errorState` now propagates to child radios via the existing `parent.errorState()` read in `RadioComponent.errorState`. `notifyTouched()` now bumps `_ngControlRev` so child-radio blur refreshes the group's `aria-invalid`.                                                            |
  | `SelectComponent`     | static `NG_VALUE_ACCESSOR` + dead `_setErrorState(invalid: boolean)` shim writing into a private `errorStateSignal` | runtime CVA; `_setErrorState` removed (zero external callers confirmed before deletion). `errorState` is now a `computed()` reading `NgControl.invalid` through the matcher. Focus-monitor blur path now also bumps `_ngControlRev` so blur transitions repaint `aria-invalid`. Implements `OnInit` for the post-construction `statusChanges` / `valueChanges` / `ngSubmit` subscriptions. |
  | `ComboboxComponent`   | same shape as select                                                                                                | same migration as select. Template `aria-invalid` switched from `errorStateSignal()` to `errorState()`; `variantResult` likewise reads the new computed so the tailwind-variants `errorState` slot now repaints.                                                                                                                                                                           |

  **Behavioural change — `errorState` activates:**

  For `switch` and `radio-group`, S07 intentionally landed the input surface and `aria-invalid` host binding with `errorState` hard-coded to `false`. This session flips it on: a bound `FormControl` (or `NgModel` / signal-form field) that is `touched && invalid` per the configured matcher now correctly reports `aria-invalid="true"`. The new tests (`switch.spec.ts`, `radio.spec.ts`) drive the matcher path explicitly via `control.markAsTouched()` + `updateValueAndValidity()` and assert the host attribute. The S07 dormant `errorState` slot variant on `switchVariants` (`bg-error-100` ring on the off-track) likewise activates.

  For `select` and `combobox`, the `errorState` was previously a writable signal with no internal call sites — `_setErrorState` was a public no-op landing pad. The migration makes it react automatically to the bound control's validity, matching how `input` / `textarea` / `checkbox` / `slider` / `date-picker` / `time-picker` behave.

  **`_setErrorState` removal — risk note:**

  `grep -rn _setErrorState` across the workspace returned only the two definitions before removal (verified pre-edit, re-verified post-edit). The shim was marked `@internal` and had no consumer documentation. **Unresolved consumer risk:** if a downstream app monkey-patched onto the public class to drive error-state imperatively (extremely unlikely), the method is gone. The new `errorState` is read-only — the same effect is achievable via `[errorStateMatcher]` with a custom matcher returning `true` based on consumer state, which is the canonical Material pattern.

  **Out of scope (unchanged):**

  - `InputDirective`, `TextareaComponent` — pure-CVA, no matcher integration, no `inject(NgControl, { self: true })` ; static `NG_VALUE_ACCESSOR` kept per the carve-out.
  - `CheckboxComponent`, `SliderComponent`, `DatePickerComponent`, `TimePickerComponent`, `DateRangePickerComponent`, `RadioComponent` (standalone) — already on the runtime pattern from S06/S07; not touched.

  **Test coverage added:**

  - `switch.spec.ts` — three new errorState assertions (untouched-invalid, touched-invalid, transition-to-valid) on a `Validators.requiredTrue` host.
  - `radio.spec.ts` — four new assertions on `RadioGroupComponent`: untouched-invalid, group `aria-invalid` after touch, propagation to child radio `aria-invalid`, transition-to-valid after user selection.
  - `select.spec.ts` — three assertions mirroring switch on a `Validators.required` reactive host.
  - `combobox.spec.ts` — three assertions mirroring select.

  Full ngx-tw suite: **2527 passing / 4 pre-existing skipped**. Type-check clean across `tsconfig.lib.json`, `tsconfig.spec.json`, `tsconfig.app.json`.

  **Migration:** none for typical consumers — `[formControl]` / `[(ngModel)]` / signal-form bindings on these four controls keep working unchanged. The visible effect is `aria-invalid="true"` now flips on touched+invalid (previously hard-coded off for switch / radio-group, externally writable but never written for select / combobox). Apps relying on the old `aria-invalid=null` behaviour for these controls should audit their error-styling overrides.

- [`aee8235`](https://github.com/avs2001/ngx-tw/commit/aee8235b3b64500d98216fbdfd86518d005a25d2) - S09 — internal fixes on `select` + `combobox` plus a new `core/overlay/` module of pure helpers that both components now consume. Closes the Batch 2 select/combobox findings and the cross-cutting "Overlay scroll-strategy and position duplication" theme.

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

- [`aee8235`](https://github.com/avs2001/ngx-tw/commit/aee8235b3b64500d98216fbdfd86518d005a25d2) - S10 — internal fixes on `form-field`, `time-picker`, and `button` (Batch 2 wrap-up). Includes one consumer-visible breaking change (form-field prefix/suffix directive selector rename) and one drift retraction on `button` discovered during implementation.

  **`FormFieldComponent` — BREAKING: prefix/suffix directive selectors renamed.**

  All four projected-adornment directives moved off the non-canonical `[slot="*"]` selector form to the library's standard `tw`-camelCase attribute form:

  | Before                 | After            |
  | ---------------------- | ---------------- |
  | `[slot="prefix"]`      | `[twPrefix]`     |
  | `[slot="suffix"]`      | `[twSuffix]`     |
  | `[slot="prefix-icon"]` | `[twPrefixIcon]` |
  | `[slot="suffix-icon"]` | `[twSuffixIcon]` |

  The rename also updates the matching `<ng-content select="…">` projection selectors in `form-field.html` so a `<span twPrefix>` both receives the prefix host class **and** lands in the prefix slot. The original `slot=` attribute selector was a stylistic anomaly relative to every other library directive (`twBadge`, `twTooltip`, `twDialogTitle`, `twHint`, `twLabel`, `twError`, `twInput`) and risked colliding with future native shadow-DOM-style slotting. The S10 spec asked to rename two; the prefix-icon / suffix-icon pair share the same rationale and rename together so the consumer-facing surface lands cohesive instead of half-converted.

  **Consumer migration:** replace every `slot="prefix"` with `twPrefix`, `slot="suffix"` with `twSuffix`, `slot="prefix-icon"` with `twPrefixIcon`, and `slot="suffix-icon"` with `twSuffixIcon`. Enumeration confirmed zero non-form-field uses of these slot attributes in the repository (the only remaining matches are stale JSDoc strings inside `projects/ngx-tw/spinner/spinner.ts` lines 65/73, deliberately left untouched per S10's scope guard; queued as a S11+ housekeeping follow-up).

  **`FormFieldComponent` — dev-mode `effect()` throw → `console.error`.**

  The "at most one twHint per alignment" invariant inside an `effect()` previously called `throw new Error(...)`. Throwing inside a reactive effect leaves Angular's effect graph in an unrecoverable error state and surfaces as a generic ZoneAwareError with no relation to the original misuse. The check now calls `console.error(...)` instead — the message still surfaces clearly in dev mode, no crash. The companion spec was updated to assert on `console.error` instead of `toThrowError`. The unrelated `ngAfterContentInit` invariant ("requires a child control") still throws — that fires once at construction, outside any reactive context, and intentionally aborts mounting a misconfigured field.

  **`TimePickerComponent` — active meridiem button color routing.**

  The AM / PM toggle previously hard-coded `bg-primary-500 text-on-primary hover:bg-primary-600` on the active state regardless of the `color` input. The active state now routes through a static `MERIDIEM_ACTIVE_COLOR: Record<TwColor, string>` lookup at module scope, mirroring the pattern used by `checkbox.ts` and `radio.ts`. Tailwind v4's static scanner sees every class because every row is written out literally. A new spec asserts the active button picks up the routed background and on-color foreground for all eight semantic colors (`primary`, `secondary`, `accent`, `neutral`, `info`, `success`, `warning`, `error`). The `neutral` row pairs `bg-fg` with the canonical `text-on-neutral` token (matching `checkbox.ts` / `switch.ts`) — the foreground stays meaningful under custom themes that decouple `text-on-neutral` from `text-surface`. The lookup table was chosen over a `tv` compoundVariant matrix because the active background is computed only from `color`, not from `(color × focused × variant × …)` — the existing compoundVariant block is for the trigger border, which has an orthogonal axis (`focused: true`). Keeping the meridiem lookup outside `tv` mirrors the checkbox / radio conventions and avoids a 16-row addition to the trigger-border block.

  **`TimePickerComponent` — numeric-field width justification.**

  The `w-5` (xs) → `w-9` (xl) numeric input widths sit outside the CLAUDE.md spacing scale. Each row now carries a one-line comment explaining the field is content-driven (sized to fit a 2-digit value at the row's font scale) and pointing at the rationale in CLAUDE.md. No code change — pure documentation.

  **`TimePickerComponent` — auto-naked migration retracted (carried over from S09).**

  S10's spec originally asked to migrate the auto-naked detection at `time-picker.ts:572` to a `useNakedWhenInFormField` helper. S09 deliberately dropped that helper (see `s09-overlay-helpers-extraction.md`): the three candidate call sites (select, combobox, time-picker) have structurally heterogeneous resolution shapes, and `inject(FormFieldComponent)` inside `core/` would create a reverse dependency. Time-picker keeps its inline `variant() ?? (formField ? 'naked' : 'default')` resolution unchanged.

  **`ButtonIconDirective` — `''` union member retained (audit drift).**

  S10's spec asked to narrow `twButtonIcon = input<'' | 'leading' | 'trailing'>('leading')` to `input<'leading' | 'trailing'>('leading')`, on the grounds that `''` is undocumented and silently degrades to leading. Narrowing was attempted and **broke template type-check across both the demo and the library spec**: every bare-attribute use site (`<svg twButtonIcon>`, the canonical leading-icon shape used in the spec at `button.spec.ts:61` and at six demo sites) binds the empty string to the input, and Angular's template compiler rejects `""` against the narrowed union with TS2322. The runtime is already safe — the `=== 'trailing'` test treats `''` and `'leading'` as equivalent paths — so the narrowing offers no behavioral benefit at the cost of breaking the canonical bare-attribute spelling that ships across the library examples.

  The `''` member therefore stays in the union, but is now explicitly documented via JSDoc explaining the load-bearing role: Angular's template binding for bare-attribute selectors. This addresses the audit's underlying concern (the empty-string member is no longer "undocumented") without breaking the bare-attribute pattern. Treat this as the same kind of audit drift as the S06–S09 cases (`*Input` aliasing, `focusedThumb` naming, static-NG_VALUE_ACCESSOR vs runtime CVA, `useNakedWhenInFormField` shape) — the audit caught a real signal (no JSDoc justification) but mis-prescribed the fix (narrowing).

  **`ButtonIconDirective` — `order: 'order-last'` flex-container assumption documented.**

  Added a one-line comment above the `order` class binding noting that `order-last` only takes effect when the host is a flex container, which `ButtonDirective`'s base class (`inline-flex …`) provides. No runtime change.

  **Spec additions:**

  - `time-picker.spec.ts` — new `ColorHost` and one assertion iterating every `TwColor` value and confirming the active PM button picks up the routed `bg-{color}-500` / `text-on-{color}` pair (with `neutral`'s `bg-fg` / `text-surface` exception). Sits next to the existing `text-on-primary` assertion.
  - `form-field.spec.ts` — the duplicate-hint-alignment test was rewritten from `expect(() => fixture.detectChanges()).toThrowError(...)` to a `vi.spyOn(console, 'error')` assertion to match the new `console.error` behavior.

  **Acceptance check:**

  ```bash
  rg -n "'\[slot=\"(prefix|suffix)\"\]'" projects/ngx-tw/form-field --type ts
  # → zero matches

  rg -n "'\[twPrefix\]'|'\[twSuffix\]'" projects/ngx-tw/form-field --type ts
  # → 2 matches (selector + spec query for each)

  rg -n 'slot="prefix"|slot="suffix"' projects/ e2e/
  # → only spinner.ts JSDoc strings (lines 65, 73) — out of S10 scope

  rg -n 'bg-primary-500' projects/ngx-tw/time-picker --type ts
  # → only inside MERIDIEM_ACTIVE_COLOR's 'primary' row and the matching spec assertion

  rg -n "twButtonIcon = input<'' \| 'leading' \| 'trailing'>" projects/ngx-tw/button
  # → one match (retained per audit-drift retraction)
  ```

  Type-check clean across `tsconfig.lib.json`, `tsconfig.spec.json`, `tsconfig.app.json` (including Angular template type-check). Full library suite: **2540 passing / 4 pre-existing skipped** (one more than S09, the new color-routing assertion). No regressions.

  **Migration summary for consumers:**

  - Replace every `slot="prefix"` → `twPrefix`, `slot="suffix"` → `twSuffix`, `slot="prefix-icon"` → `twPrefixIcon`, `slot="suffix-icon"` → `twSuffixIcon` in any template that consumes `<tw-form-field>`. The directive host classes and projection routing are unchanged otherwise.
  - No other migrations required — all other S10 changes are internal or documentation-only.

  **Known follow-up (S11+):** spinner JSDoc still references the old `slot="suffix"` selector in two places — kept untouched to honor S10's scope guard; trivial sed-style swap in a later session.

- [`aee8235`](https://github.com/avs2001/ngx-tw/commit/aee8235b3b64500d98216fbdfd86518d005a25d2) - S11 — Display + status fixes for `avatar`, `badge`, `alert`, `empty-state`, `skeleton`, `spinner`, and `icon` (Batch 6 wrap-up). Includes one consumer-visible breaking change on `badge`, one a11y bug fix on `avatar`, and a small set of API additions, polish, and JSDoc cleanups across the batch.

  **`BadgeComponent` — BREAKING: `dot` input removed, dot-mode split into `BadgeDotDirective`.**

  The `BadgeComponent` reached 7 inputs (`color`, `variant`, `size`, `pill`, `dismissible`, `dot`, `dismissLabel`) plus 1 output — well over the library's 5–6 input cap, and badge is explicitly excluded from the codified input-cap exceptions (it is a visual primitive, not an overlay / form control / structural primitive / data primitive). The dot mode also carried unique a11y semantics: no text content, no padding, no leading slot, no dismiss affordance — structurally distinct from the labelled badge.

  Dot-mode now ships as a separate `BadgeDotDirective` (`[twBadgeDot]`) under `ngx-tw/badge`. `BadgeComponent` drops `dot` from its surface and lands at 6 inputs + 1 output, on the cap.

  ```html
  <!-- Before -->
  <span twBadge [dot]="true" color="success"></span>

  <!-- After -->
  <span twBadgeDot color="success"></span>
  ```

  `BadgeDotDirective` exposes `color`, `size`, and the new `live` input (see below). Demo pages and snippets under `projects/demo/src/app/routes/badge/` migrated to the directive. The badge API documentation page now lists `BadgeDotDirective` as a sibling component.

  **`BadgeComponent` + `BadgeDotDirective` — API addition: opt-in `live` input.**

  Both surfaces previously emitted an unconditional `role="status"` on the host, treating every badge as an ARIA live region. Most badges are decorative tags or counts that never change in place; announcing them on every render produces screen-reader noise. The new `live = input(false)` toggles the role: `role="status"` when `live` is true, no role otherwise. The default of `false` matches the dominant usage and surfaces the live-region semantic only when the consumer actually wants the change announced (e.g. a counter that updates in place, an unread-messages dot).

  **`AvatarComponent` — a11y bug fix: `aria-hidden` no longer hides image-mode avatars.**

  The previous host binding `'[attr.aria-hidden]': '!alt() ? "true" : null'` set `aria-hidden="true"` on the host whenever `alt` was empty — including image-mode avatars, which rely on the underlying `<img>`'s `alt` attribute for accessibility. With the bug in place, an image avatar without `alt` text was both unlabelled and explicitly hidden from assistive tech; with the fix, it is unlabelled but discoverable (the consumer-visible bug).

  The binding is now `'displayMode() !== "image" && !alt() ? "true" : null'` — `aria-hidden` only fires for non-image avatars without alt. Image-mode avatars are never hidden from AT regardless of `alt` presence.

  A dev-mode `console.warn` covers the missing-alt case on image avatars: `<tw-avatar> rendered as image without alt text — provide alt for accessibility`. The warn fires from a `constructor`-level `effect()` guarded by `isDevMode()` so production builds carry no overhead.

  **`AvatarGroupComponent` — visibility moved from `style.display` mutation to signal-driven `[hidden]`.**

  The group's overflow logic previously walked the child avatars in an `effect()` and mutated each one's `style.display` directly. The mutation worked but was imperative DOM manipulation outside Angular's reactive surface. Replaced with a new `@internal groupHidden = signal(false)` on `AvatarComponent` that the avatar host-binds to `[attr.hidden]`. The group's effect now calls `avatar.groupHidden.set(...)` instead of touching DOM — the visibility flows through the reactive graph, the avatar host attribute is declarative, and the spec asserts on `hasAttribute('hidden')` instead of `style.display !== 'none'`.

  **`AvatarComponent` — container-scale comments on `size-16` and `size-[60%]`.**

  Both values sit outside the CLAUDE.md glyph scale's ceiling (`size-10`). Avatars are not glyphs — they are surfaces that host imagery, initials, or icons — so the values are correct, but they look like violations on a skim audit. Added one-line `// Container scale — avatars are surfaces, not glyphs (see CLAUDE.md icon sizing)` comments on the xl `root: 'size-16 …'` row and on the `fallback: 'size-[60%] …'` slot to defend against future audit flags.

  **`AlertComponent` — `politeness` JSDoc expanded to cover `'off'` semantic.**

  Added one sentence: "Use `'off'` to suppress re-announcement when the alert content updates after initial render — assistive tech treats the alert as a static region rather than a live region." No behavioral change.

  **`EmptyStateComponent` — dead-code cleanup + inline-padding progression justification.**

  - Dropped the unused `hasIcon` / `hasActions` computed signals (verified: zero references inside `projects/`). The companion `iconSlot` / `actionsSlot` content-child queries that fed them are also gone — the `EmptyStateIconDirective` / `EmptyStateActionsDirective` selectors are still used directly by `<ng-content select="[twEmptyStateIcon]">` projection and by the actions directive's own host class binding.
  - Added a block comment to the `inline` compound-variant table explaining the `py-1.5 → py-2 → py-3 → py-4 → py-5` progression. `py-1.5` (sm row in the inline-padding scale) and the `py-5` halfway step before xl rows reach a container-padding step are design-specified to keep the inline empty state visually distinct from adjacent rows without over-jumping into container-padding density.

  **`SpinnerComponent` — JSDoc `slot="suffix"` → `twSuffix` (S10 follow-up).**

  S10 renamed the form-field projection selectors from `[slot="*"]` to `[twPrefix]` / `[twSuffix]` / etc. but deliberately left the spinner JSDoc references in place per S10's scope guard. The two strings at `spinner.ts:65` and `:73` now match the canonical selector. No behavioral change.

  **`SkeletonComponent` and `IconComponent` — no edits.**

  S03 already added the `track = input(true)` rationale in spinner. S04 already brought `announce` (skeleton), `name`/`img`/`ariaLabel` (icon) JSDoc up to spec with `Defaults to …` suffixes. Re-verified — no S11 edits needed.

  **Spec additions:**

  - `avatar.spec.ts` — three new accessibility cases covering the fixed binding (image avatars without alt no longer carry `aria-hidden`; image avatars with alt no longer carry `aria-hidden`; image avatars without alt fire the dev-mode warn; image avatars with alt do not fire the warn). The existing AvatarGroup overflow test rewritten from `style.display !== 'none'` to `hasAttribute('hidden')` and asserts the `style.display` property remains empty (proving the signal-driven path is the only one touching visibility).
  - `badge.spec.ts` — `LiveBadgeHost` added; new "accessibility" cases assert (1) no implicit role on the host by default, (2) `role="status"` only when `live` is true, (3) the role attribute is removed when `live` flips back to false. All previous `[dot]` tests were dropped from this spec; the existing `DotBadgeHost` / `DotDismissibleBadgeHost` / `DotWithAvatarHost` helpers were removed.
  - `badge-dot.spec.ts` (new) — covers default rendering (no children, base classes applied), per-color background tokens for all 8 `TwColor` values, per-size dot dimensions for all 5 `TwSize` values, and the same `live` opt-in pattern (no role default, role="status" when live, role removed when live → false).

  **Migration guide:**

  Replace every `[dot]="…"` usage on `[twBadge]` with the `[twBadgeDot]` directive. The two surfaces are now structurally separate — `twBadge` no longer renders dot mode.

  ```html
  <!-- Before -->
  <span twBadge [dot]="true" color="success" size="md"></span>

  <!-- After -->
  <span twBadgeDot color="success" size="md"></span>
  ```

  If you toggle between labelled badge and dot via a signal, use an `@if` at the call site to switch between the two surfaces — they accept different inputs.

  ```html
  @if (isDot()) {
  <span twBadgeDot [color]="status()" [size]="size()"></span>
  } @else {
  <span twBadge [color]="status()" [size]="size()">{{ label() }}</span>
  }
  ```

  If your code relies on the previous unconditional `role="status"` on every badge for live-region announcements (rare — most badges are static labels), add `[live]="true"` to opt back in.

  **Acceptance check:**

  ```bash
  rg -n "aria-hidden.*'true'" projects/ngx-tw/avatar         # only in spec assertions + decorative SVG children
  rg -n "displayMode\(\).*'image'" projects/ngx-tw/avatar    # gate present
  rg -n 'style\.display' projects/ngx-tw/avatar/avatar.ts    # zero — replaced with [attr.hidden]
  rg -n '\bdot\b.*input\(' projects/ngx-tw/badge/badge.ts    # zero — input removed
  rg -n 'twBadgeDot|BadgeDotDirective' projects/ngx-tw/badge # directive + spec + index export present
  rg -n '\[dot\]' projects/                                  # zero — demos migrated
  rg -n 'slot="suffix"' projects/ngx-tw/spinner              # zero — replaced with twSuffix
  ```

  Type-check clean across `tsconfig.lib.json`, `tsconfig.spec.json`, `tsconfig.app.json` (including Angular template type-check). Full library suite: **2558 passing / 4 pre-existing skipped** (18 net new tests added — badge-dot suite plus avatar a11y / dev-warn cases). No regressions.

  **Known follow-up:** none. The audit's "Medium" badge dismiss-button `transition-colors` note (targets only background) was not addressed — the existing transition is correct as-is (`transition-colors` covers both color and background-color per Tailwind v4); the audit observation was inaccurate. The audit's "Low" skeleton width/height object-vs-string-style note was deferred — the current semicolon-string serialisation is a minor style preference with no behavioral impact.

- [`aee8235`](https://github.com/avs2001/ngx-tw/commit/aee8235b3b64500d98216fbdfd86518d005a25d2) - S12 — Tabs + tab-nav keyboard accessibility hardening and shared trigger-variant extraction (Batch 5 wrap-up). Closes the tab close-button keyboard trap, migrates both components to CDK `FocusKeyManager`, and removes ~110 lines of duplicated `tv()` config between the two surfaces. No consumer-facing template selector changes; one internal DOM shape change in `tw-tabs`.

  **`TabsComponent` — a11y fix: close affordance is now keyboard-focusable.**

  The closable-tab dismiss button previously shipped as `<span role="button" tabindex="-1">` with `(keydown.enter)` / `(keydown.space)` handlers. With `tabindex="-1"` the span could never receive keyboard focus, so the handlers could never fire — the close affordance was reachable only by mouse. The span is now a native `<button type="button">` with no negative tabindex, so keyboard users can `Tab` to it and activate it with `Enter` or `Space` (native button behaviour). Screen-reader users still hear the same `aria-label` ("Close {label}").

  To keep the close button as a valid HTML child of the trigger, the trigger element changes from `<button role="tab">` to `<div role="tab">` (HTML forbids interactive content nested inside a `<button>`). Trigger activation is wired explicitly via `(click)` plus an `Enter` / `Space` handler on the tablist `(keydown)` — keyboard tab activation continues to work identically.

  In addition, pressing `Delete` while a closable tab is focused now dismisses the tab without traversing to the close button — matches the WAI-ARIA Authoring Practices recommendation for closable tabs.

  **`TabsComponent` + `TabNavComponent` — Refactor: adopt CDK `FocusKeyManager`.**

  Both components previously hand-rolled roving focus by scanning `document.activeElement` against their trigger lists, with bespoke `findNextEnabled` helpers, custom `Home` / `End` branches, and manual wrap logic. They now use `FocusKeyManager` from `@angular/cdk/a11y`, configured `.withWrap().withHomeAndEnd()` and orientation-aware (`.withHorizontalOrientation('ltr')` / `.withVerticalOrientation()` for `tw-tabs`; horizontal-only for `nav[twTabNav]`). Tabs follows the APG automatic-activation pattern (selection follows focus); tab-nav remains manual activation (focus moves on arrows, Enter / Space activates).

  This matches the canonical pattern in `AccordionComponent` and removes ~60 lines of duplicated keyboard plumbing. No behaviour change for end users.

  **Internal: shared trigger `tv()` config and active-state maps extracted to `ngx-tw/core`.**

  `tabs.ts` and `tab-nav.ts` carried two near-identical copies of the trigger `tv()` config plus the five active-state colour maps (`UNDERLINE_ACTIVE_HORIZONTAL` / `UNDERLINE_ACTIVE_VERTICAL` / `ENCLOSED_ACTIVE_HORIZONTAL` / `ENCLOSED_ACTIVE_VERTICAL` / `PILL_ACTIVE`) plus the inactive map. All of it now lives at `projects/ngx-tw/core/tab-trigger-variants.ts` as `tabTriggerVariants`, the maps, and `getActiveTriggerClasses(variant, color, orientation)` / `getInactiveTriggerClasses(variant)` helpers. Both components consume from `ngx-tw/core`.

  Component-local slots (root / tablist / tablistInner / panel / scrollButton / closeButton for tabs; nav / list for tab-nav) stay in each component's local `tv()` config — only the trigger shape is canonical enough to share. The `no-underline` class needed only by anchor-based tab-nav is appended via `twMerge` in tab-nav's `linkBaseClasses`, not the shared base.

  No consumer-facing API change: the new exports are additive on `ngx-tw/core`; existing imports from `ngx-tw/tabs` and `ngx-tw/tab-nav` are unchanged.

  **Polish.**

  - The close container in `tw-tabs` now scales with the `size` input using the codified square-interactive-target scale (`size-6` xs / `size-7` sm / `size-8` md / `size-9` lg+); previously fixed at `size-4`. The inner glyph stays at the glyph scale (`size-4`).
  - `TabLinkDirective.linkRole` keeps its dual `'tab' | null` branch — the `'tab'` branch is APG-required when the nav is wired to a panel, and the `null` branch lets the anchor's native `role="link"` win when it isn't. An inline comment now documents both branches so the next audit pass doesn't re-flag the null branch as a no-op.

  **Migration guide.**

  No consumer-facing template changes are required. The close-button DOM restructure (span → button, button → div with `role="tab"`) is library-internal — both still match `[role="tab"]` and the close affordance still matches `[aria-label]` queries. Spec-level test code that dispatched `KeyboardEvent` with only `key` (no `keyCode`) on tab triggers will need to add `keyCode` because `FocusKeyManager` reads `event.keyCode`; production code is unaffected because real browsers populate both fields. Reference numeric codes: `ArrowRight=39`, `ArrowLeft=37`, `ArrowUp=38`, `ArrowDown=40`, `Home=36`, `End=35`, `Delete=46`.

- [`aee8235`](https://github.com/avs2001/ngx-tw/commit/aee8235b3b64500d98216fbdfd86518d005a25d2) - S13 — Paginator polish: active-page color routing, CDK `FocusKeyManager` adoption, and a fifth Input-count-cap exception ("Navigation primitives") codified in CLAUDE.md. No consumer-facing API breakage; one internal directive (`PaginatorFocusableDirective`) added but kept off `ngx-tw/paginator`'s `index.ts`.

  **a11y / visual fix — active-page button now respects the `color` input.**

  `PaginatorComponent` previously hardcoded its active-page background as `bg-primary-600 text-white border-primary-600` regardless of the `color` input. That meant `<tw-paginator color="error">` rendered a primary-colored active page (the `color` input set the focus-ring color but not the active fill), and the bare `text-white` foreground bypassed the warning role's amber-on-dark contrast convention. The active-page styling now routes through two color-keyed lookup maps (`PAGE_BUTTON_ACTIVE_BG` for background + border + hover + focus-visible outline; `PAGE_BUTTON_ACTIVE_FG` for the on-color text token), mirroring the `SOLID_BOX` / `SOLID_ICON` split in `checkbox.ts`. The background shade stays at `-600` for parity with checkbox (`warning` stays at `-500` per the amber-signage convention documented in `theme/_semantic.css`); the text token swaps from raw `text-white` to `text-on-{color}` so consumers retheming the `--color-on-*` aliases get correct contrast without changing the paginator.

  **Refactor — adopt CDK `FocusKeyManager` for nav-group roving focus.**

  `PaginatorComponent.onKeydown` previously scanned `document.activeElement` against a list collected from `nav.querySelectorAll('[data-tw-paginator-focusable]')`, with bespoke ArrowLeft / ArrowRight / Home / End branches. It now delegates to `FocusKeyManager` from `@angular/cdk/a11y`, configured `.withHorizontalOrientation('ltr').withHomeAndEnd()` — no `.withWrap()` because pagination should NOT loop from page 1 ArrowLeft back to the last page (that would be disorienting). The same DOM marker attribute (`data-tw-paginator-focusable`) is now the selector of a new internal `PaginatorFocusableDirective` that implements `FocusableOption`; its `disabled` getter resolves the `isDisabled` input signal so the manager skips disabled controls (first/prev on page 1, next/last on the last page). Pattern matches `AccordionComponent` and the S12 tabs/tab-nav migration. The directive is registered in `PaginatorComponent.imports` but deliberately not exported from `ngx-tw/paginator`'s `index.ts` — same shape as `TabTriggerElementDirective` in `ngx-tw/tabs`.

  **CLAUDE.md — fifth Input-count-cap exception codified.**

  Per design decision D4, `paginator` is exempted from the ≤5–6 input cap. The `Input count cap` table at `.claude/CLAUDE.md:391-397` gains a fifth row, **Navigation primitives** (canonical: `paginator` with ~20 inputs). The lead sentence updates from "four exceptions" → "five exceptions." Rationale: pagination has independent semantic axes (boundary/sibling counts, layout, type, page-size selector, first/last jump buttons, responsive collapse, link-mode factory, i18n labels) that cannot be flattened into config objects without losing template-type safety or surprising consumers. Material's `MatPaginator` carries a comparable surface.

  **Spec coverage.**

  The two existing keyboard tests in the `PaginatorComponent — accessibility` group dispatch their `KeyboardEvent`s with both `key` AND `keyCode` (jsdom does not derive `keyCode` from `key`, and CDK `FocusKeyManager` reads `keyCode`). Three new tests land in the same group: `End` jumps focus to the last focusable, ArrowLeft from page 1 skips the disabled first/prev controls (no focus movement), and the active-page button reflects the `color` input (asserts `bg-error-600` + `text-on-error` + no `text-white` for `color="error"`). Spec count: 2569 passing / 4 pre-existing skipped (was 2566 at S12).

  **Migration guide.**

  No template selector changes. Consumers using `[(page)]` / `[(pageSize)]` / `(paginated)` are unaffected. The active-page visual changes only when consumers had set a non-primary `color` input — previously they were silently rendered as primary; now they render with the chosen color's `-600` background and the role's on-color foreground. Anyone whose theme leaves `--color-on-*` aliases at the default `--color-{role}-solid-fg` mapping sees the same active-page foreground as before for primary/secondary/accent/info/success/error (still `white`), and a slightly darker on-color for warning (was `text-black`, now `var(--color-warning-950)`).

  **Unresolved risk for reviewers.**

  - `text-on-{color}` resolves through the legacy alias block in `theme/_semantic.css:284-296` (which already carries a "New code MUST use the slot tokens" forward-looking comment). Checkbox uses the same alias today, so paginator is consistent with the canonical reference. A future slot-token migration sweep should catch both call sites at once.
  - The new `PaginatorFocusableDirective` triggers a `FocusKeyManager` rebuild on every focusable-set change (numbered page list shape, disabled-state flip). The cost is comparable to the previous `querySelectorAll` scan; no profiling regression observed in the existing spec timings.

- [`aee8235`](https://github.com/avs2001/ngx-tw/commit/aee8235b3b64500d98216fbdfd86518d005a25d2) - S14 — Breadcrumbs + menu + command-palette fixes. One BLOCKER fix (`activeIndex` no longer resets on identical-id `filteredItems` re-emission), one removed keyboard handler (`Tab` no longer closes the palette), tighter visual distinction between active and hovered options, plus polish across all three components. No consumer-facing API breakage.

  **Bug fix (command-palette) — `activeIndex` selection-preservation.**

  `CommandPaletteComponent.activeIndex` was a `linkedSignal` keyed off the `filteredItems()` array _reference_: any re-emission of the computed (even with the same item ids in the same positions) reset selection to the first enabled item. The signal is now keyed off the id sequence (`filteredItems().map((i) => i.data.id)`) and the computation uses the `previous` parameter (typed `{ source, value }`) to look up the previously-active id and carry its new index forward — only when the id has been removed entirely does the fallback to `findFirstEnabled(items)` fire. Consumer keyboard selection now survives transparent re-emissions (e.g. an upstream `commands` array re-built from a `model()` or a route change).

  **a11y fix (command-palette) — Tab keypress no longer closes the palette.**

  The previous `case 'Tab':` branch in `handleOverlayKeydown` called `event.preventDefault()` + `this.hide()`. The palette already installs a `FocusTrap` (`setupFocusTrap()`), so the trap cycles focus through the modal's focusable elements without leaking outside. The Tab branch was both redundant and surprising — pressing Tab to _escape_ a modal is non-standard. The branch is removed; FocusTrap handles the cycling.

  **Bug fix (command-palette) — close-timer leak guarded.**

  The `setTimeout(ANIMATION_DURATION)` callback in `closePalette()` could fire after the palette had already been disposed (programmatic `disposeOverlay()` race, double-close), at which point it would still call `overlayRef.detach()`, `isAttached.set(false)`, and `open.set(false)` on a destroyed component. An `if (!this.isAttached()) { this.closing = false; return; }` guard now runs at the top of the callback before any state writes. `clearCloseTimer()` is already wired into `destroyRef.onDestroy()` (line 572) so the typical teardown path was already covered; the new guard hardens the destroyed-while-animating race.

  **a11y fix (command-palette) — active vs hover visual distinction.**

  Per the "Focus Rings → Activedescendant-listbox carve-out" section in CLAUDE.md, the keyboard-active option (`role="option"` referenced by `aria-activedescendant` on the combobox input) MUST be unambiguously distinguishable from the hovered non-active state. The `active.true` slot used the same `bg-surface-muted` token as the non-active hover state, so the two visual signals collapsed onto each other and keyboard users lost the active cue when their pointer drifted. Active is now `bg-surface-sunken` (one step recessed). A compound variant (`{ active: true, disabled: false }` → `hover:bg-surface-sunken`) keeps the recessed token sticky on hover so the active option doesn't visually flip to the hover token when the cursor passes over it.

  **a11y polish (menu) — disabled-item visual hardening.**

  `MenuItemDirective`'s `disabled` `tv()` variant gains `cursor-not-allowed` alongside the existing `opacity-50 pointer-events-none`. CDK's `CdkMenuItem` already honours `disabled` natively in keyboard navigation (the `effect()` at line 218 propagates the local `disabled` signal to `cdkItem.disabled`, and CDK's `FocusKeyManager`/`FocusableOption` skips disabled items). The cursor cue covers the residual case where focus arrives via a programmatic path that bypasses CDK's skip — the item still reads as "not interactive" rather than appearing focusable. No behavioural change for keyboard users.

  **API doc (menu) — `MenuItemDirective.color` JSDoc clarification.**

  The `color = input<TwColor | undefined>(undefined)` JSDoc previously said "Leave unset for the default neutral style", which was misleading: `undefined` and `'neutral'` produce different visuals. `undefined` leaves the base `text-fg` styling at full prominence; `'neutral'` applies the dimmed `text-fg-muted` + `hover:bg-surface-muted` tint defined in the `color.neutral` slot string. The JSDoc now spells out the distinction so consumers don't pick `'neutral'` thinking it's the default.

  **Polish (menu) — submenu indicator scales with menu size.**

  `MenuItemSubmenuIndicatorDirective` previously hard-coded `class: 'ml-auto pl-2 size-4 shrink-0 text-fg-muted'` on the host. The trailing chevron now uses a small `menuItemSubmenuIndicatorVariants` `tv()` config that resolves the glyph scale off the parent `MenuComponent.size()` (xs/sm/md → `size-4` floor, lg/xl → `size-5`, with xs specifically dropping to `size-3` per the glyph scale's xs step). The pattern mirrors `MenuItemIconDirective` — `inject(MenuComponent, { optional: true })` + `computed()` + `[class]` host binding.

  **Polish (breadcrumbs) — overflow-trigger lg=xl behavior codified.**

  `BreadcrumbsComponent` uses `size-9` for both `lg` and `xl` of the overflow trigger, which would normally violate the codified square-interactive-target scale (xs=size-6, sm=size-7, md=size-8, lg=size-9, no xl entry). Rather than introduce a new `xl=size-10` step that only one component would use, the CLAUDE.md "Square interactive targets" subsection gains a "Saturation note" line documenting the lg=xl reuse for breadcrumb overflow triggers — once the trigger is keyboard-reachable and clearly tappable, further scaling reads as visual bloat.

  **Polish (breadcrumbs) — redundant `renderedEntries` condition dropped.**

  The `collapsing` calculation in `BreadcrumbsComponent.renderedEntries` carried `all.length > 2` twice in the same `&&` chain. Reduced to a single check; semantics unchanged.

  **Demo (breadcrumbs) — custom-separator example styling tightened.**

  The "Custom separator (template)" demo at `projects/demo/src/app/routes/breadcrumbs/examples/breadcrumbs-examples.component.ts` already used `*twBreadcrumbsSeparator` correctly; the ad-hoc inline styling (`text-fg-subtle font-medium px-0.5`) on the projected `<span>` is now reduced to the single semantic class (`text-fg-subtle`). The corresponding code snippet (`separatorTemplateSnippet`) is updated to match so the demo and the docs render the same markup.

  **Spec coverage.**

  Five new tests land:

  - `menu.spec.ts` — `disabled propagation to CDK > should layer cursor-not-allowed onto disabled items`; `submenu indicator scaling > should scale the trailing submenu indicator with menu size` (md = `size-4`); `submenu indicator scaling > should render size-3 for xs-density menus`; `submenu indicator scaling > should render size-5 for xl-density menus`. A new `SubmenuIndicatorSizedHost` host component covers the size-aware variants.
  - `command-palette.spec.ts` — `keyboard navigation > does NOT close the palette on Tab` (asserts `getOverlay()` remains truthy _after_ `flushClose(fixture)` — with the old `case 'Tab'` handler in place this assertion would fail because the close timer would detach the overlay; the explicit flush is what makes the test discriminate old vs new behavior); `activeIndex preservation > preserves the active index when filteredItems re-emits with identical ids` (mutates the `commands` signal to a new array reference with identical ids, asserts `aria-activedescendant` stays put); `activeIndex preservation > falls back to the first enabled item when the active id is removed` (covers the negative case); `active option visual distinction > renders the active option with bg-surface-sunken (distinct from hovered non-active)` (asserts active class string contains `bg-surface-sunken` and not `hover:bg-surface-muted`; non-active item contains `hover:bg-surface-muted` and not `bg-surface-sunken`).

  Spec count: 2579 passing / 4 pre-existing skipped (was 2571 at S13).

  **Unresolved risk for reviewers.**

  - **Tab no longer closes the palette.** Some users with muscle memory built up against the previous closing-on-Tab behaviour will be momentarily surprised. The change aligns with universal modal conventions (FocusTrap cycles focus inside a modal; Escape is the dismiss key) and matches Material's Command palette + cmdk's behaviour, so the muscle-memory cost is one-time. No migration note required because the consumer-facing API surface is unchanged.
  - **Active-option background contrast.** `bg-surface-sunken` reads as "more recessed" against the default theme's `bg-surface-overlay` palette, which is the correct semantic for an active descendant. Themes that swap `--color-surface-sunken` to a _brighter_ shade (uncommon but possible for high-contrast themes) might invert the recess cue — the visual hierarchy still differentiates active from hover (the two are distinct colors), but reviewers checking dark-mode AAA themes should sanity-check.
  - **Submenu indicator visual delta at xs/xl.** The chevron drops from `size-4` (16px) to `size-3` (12px) at xs and jumps to `size-5` (20px) at lg/xl. Consumers running the submenu indicator inside an xl menu with custom content alignment may see a small layout shift; the change is the design-system-correct scale per the glyph table.
  - **`text-base` at lg/xl sizes in breadcrumbs (deferred).** `breadcrumbs.ts:122-126` uses `text-base` at lg and xl. CLAUDE.md restricts `text-base` to two carve-outs (`tw-item lg` and `tw-stat lg/xl`). The S14 prompt explicitly deferred this; flagged here for a future session to either add a third carve-out (breadcrumbs trigger font scale) or drop the lg/xl trigger font back to `text-sm`.
  - **Breadcrumbs A1 audit-text ambiguity.** The original audit text said the custom-separator demo "mixes styling into projected separator without going through `*twBreadcrumbsSeparator` guidance" — but the demo already used `*twBreadcrumbsSeparator`. The minimal interpretation taken here is to tighten the inline styling on the projected `<span>`; reviewers wanting a heavier rework (e.g. dropping all custom styling so the projected glyph picks up the breadcrumb's own classes) should expand in a follow-up.

- [`aee8235`](https://github.com/avs2001/ngx-tw/commit/aee8235b3b64500d98216fbdfd86518d005a25d2) - S15a — Accordion + collapsible-group consolidation (design decision D1). `AccordionComponent` now extends `CollapsibleGroupComponent`, dropping ~80 lines of duplicate keyboard / toggle / sync wiring. Two breaking surface changes — both pre-1.0 — plus accordion a11y fixes per APG.

  **Breaking — `value` default and type widened (both `<tw-accordion>` and `<tw-collapsible-group>`).**

  The `value` model previously typed `string | string[]` with a `''` default. The empty-string sentinel was awkward in accordion mode (it conflated "no panel open" with "panel with `value=''` is open") and impossible to round-trip in `'multiple'` mode (where an empty array is the natural "none" state). The model is now typed `string | string[] | null` and defaults to `null`. The single-mode close branch in `CollapsibleGroupComponent.toggleItem()` now writes `null` instead of `''`.

  The change is breaking for both components because they share the same parent declaration after the inheritance refactor — `AccordionComponent` no longer redeclares `value` (signal `model()` overrides cannot narrow the type per Angular's `ModelSignal` invariance), so widening the default on `CollapsibleGroupComponent` is the only viable single-source-of-truth.

  Migration:

  - Replace `value === ''` checks with `value === null` (or use a nullish-coalescing fallback like `value ?? 'none'`).
  - Consumer signals previously typed `signal<string | string[]>('')` should widen to `signal<string | string[] | null>(null)`.
  - Templates that read `{{ value }}` continue to work — both `null` and `''` render as empty.

  **a11y fix (accordion) — drop wrapper `role="group"`.**

  Per APG's accordion pattern, the accordion wrapper does not need a role; the per-panel header/region structure plus `aria-multiselectable` on the wrapper is sufficient. The previous `host: { 'role': 'group' }` literal is removed. `CollapsibleGroupComponent` retains `role="group"` as its default — the group component is the generic primitive (no APG pattern in play) and the role helps screen-reader navigation. The accordion overrides via the new `hostRole` computed (`override readonly hostRole = computed(() => null)`).

  **a11y fix (accordion) — `aria-multiselectable` is now explicit in both modes.**

  Previously the host binding was `"type() === 'multiple' || null"`, which emitted `'true'` in multiple mode and dropped the attribute entirely in single mode. Per APG (https://www.w3.org/WAI/ARIA/apg/patterns/accordion/), accordions with `type="single"` should expose `aria-multiselectable="false"` explicitly so assistive tech can confirm the semantic. The binding is now `"type() === 'multiple' ? 'true' : 'false'"` — emits both values, never absent.

  **Refactor — `AccordionComponent extends CollapsibleGroupComponent`.**

  `AccordionComponent` lost its private `keyManager`, two `effect()` blocks (value-watcher + key-manager-builder), `syncChildrenFromValue()`, `toggleItem()`, and `onTriggerKeydown()` — all inherited from the parent. `CollapsibleGroupComponent` gained two protected virtual hooks the subclass overrides:

  - `isAccordionMode()` — defaults to `this.accordion()`; `AccordionComponent` overrides to `this.type() === 'single'`. All internal logic (value-sync effect, dev-mode warn, `syncChildrenFromValue`, `toggleItem`) reads the mode through this hook so the subclass's `type` input is honoured without the subclass having to redeclare any signal inputs.
  - `canCollapseSingleMode()` — defaults to `true`; `AccordionComponent` overrides to `this.collapsible()`. Honours the accordion's collapsible opt-out.

  The parent's `[class]` and `[attr.role]` host bindings now read overridable `hostClasses` and `hostRole` computeds (rather than the previous literal `'role': 'group'` and inline string). `AccordionComponent` overrides both — `hostClasses` becomes the variant-driven container string (`accordionVariants({ variant: this.variant() }).root()`), `hostRole` becomes `null`.

  The `providers: [{ provide: CollapsibleGroupComponent, useExisting: forwardRef(() => AccordionComponent) }]` block stays — Angular DI uses class identity, not the prototype chain, so descendant collapsibles' `inject(CollapsibleGroupComponent)` still needs the explicit `useExisting` even though the inheritance relationship exists.

  The `AccordionComponent` class is now 121 lines (was 213) — 43% reduction.

  **Internal — `CollapsibleTriggerDirective` `ViewEncapsulation.None` justification.**

  The directive is template-bearing (renders the default chevron SVG when no `[twCollapsibleIcon]` is projected). Its host is the consumer's `<button>` — emulated-encapsulation would scope the styles to the directive's own shadow tree but the host lives outside that tree, so the classes never reach it. A one-line comment above `encapsulation: ViewEncapsulation.None` now records this rationale so the declaration doesn't read as a stray escape hatch.

  **Dev-mode warn messages — wording tightened.**

  The dev-mode value-shape warnings inside `CollapsibleGroupComponent` previously referenced `\`accordion\` is true`/`\`accordion\` is false`. Since the mode is now read via `isAccordionMode()`(which the accordion subclass drives from`type`), the messages reference "accordion mode" / "independent mode" rather than the literal `accordion`input. The existing spec assertions match on`expect.stringContaining('accordion')`/`expect.stringContaining('independent')`, both still satisfied.

  **Spec coverage.**

  `accordion.spec.ts` updates:

  - The `should set role="group" on the host` test flips to `should NOT set role="group" on the host (per APG)`.
  - The `should NOT set aria-multiselectable in single mode` test flips to `should set aria-multiselectable="false" explicitly in single mode (per APG)`.
  - The `should close the open panel when re-clicked` test now asserts `active()` is `null` (was `''`).
  - A new `Value default` describe asserts `value` defaults to `null` on mount.
  - A new `Parity with tw-collapsible-group accordion` describe with 3 tests renders both `<tw-accordion type="single">` and `<tw-collapsible-group accordion>` side-by-side in a single fixture and asserts identical click-toggle DOM/value behaviour, identical `aria-expanded` propagation, and identical `ArrowDown` keyboard navigation — the guardrail against silent divergence between the two surfaces.

  `collapsible.spec.ts`: only host signal types widened (`signal<string | string[]>(...)` → `signal<string | string[] | null>(...)`). The dev-mode warn assertions still match the new wording via `stringContaining`.

  Spec count: 2583 passing / 4 pre-existing skipped (was 2579 at S14). 4 net new tests.

  **Demo updates.**

  `accordion-examples.component.ts` and `collapsible-examples.component.ts` widen their `value` signal types from `signal<string | string[]>(...)` to `signal<string | string[] | null>(...)` to match the new model surface. The accordion examples' `formatValue` helper now renders `null` as `"'none'"` (instead of stringifying to `"'null'"`); the collapsible examples already used `val || 'none'` and handle `null` correctly without changes.

  **Unresolved risk for reviewers.**

  - **Inherited `accordion` input on `AccordionComponent`.** Because Angular signal-`input()` overrides cannot narrow types and the parent's input surface is inherited intact, `<tw-accordion [accordion]="true">` is technically bindable on the subclass. The subclass ignores the input (its `isAccordionMode()` reads `type`, not `accordion`), so a stray binding is silently inert rather than incorrect — but it is undocumented surface noise. JSDoc on the parent's `accordion` input now flags the inertness when used through the subclass; future consumers reading the Compodoc API table will see both inputs documented. A follow-up could rename the parent's input or split into separate parent/child classes if this proves confusing.
  - **Host metadata is inherited across `extends`** (verified empirically — the initial naive refactor failed three tests because the parent's literal `role: 'group'` and `[class]` binding leaked through). The current fix routes both bindings through overridable computeds (`hostRole`, `hostClasses`). Reviewers introducing new host bindings on either component must remember the inheritance behaviour: literal host attributes are inherited and CANNOT be unset by a subclass (only overridden via a binding); binding expressions evaluate against the actual instance and DO respect subclass property overrides.
  - **`ViewEncapsulation` for the trigger.** The justification comment is accurate, but `CollapsibleTriggerDirective` could alternatively be modelled as a plain `@Directive` (no template) by moving the default-chevron SVG into a sibling `<ng-content>` slot or a separate component. The current Component-as-directive design is the simpler shape and the comment now explains the encapsulation choice; a structural refactor is out of scope for S15a.

- [`aee8235`](https://github.com/avs2001/ngx-tw/commit/aee8235b3b64500d98216fbdfd86518d005a25d2) - Table polish — token hygiene, internal safety nets, and an audit false-positive verified.

  **Token hygiene (theme + table):**

  - Adds three sticky-table shadow tokens to `theme/_semantic.css` that ride `--color-border` (so they auto-adapt to dark mode):
    - `--shadow-table-sticky: 0 1px 0 0 var(--color-border)` — hairline divider under a sticky `<thead>`.
    - `--shadow-table-sticky-cell-start: 1px 0 0 0 var(--color-border)` — right-edge hairline on a `sticky-start` cell.
    - `--shadow-table-sticky-cell-end: -1px 0 0 0 var(--color-border)` — left-edge hairline on a `sticky-end` cell.
      Tailwind v4 auto-generates the matching `shadow-table-sticky*` utilities.
  - Replaces three arbitrary-value escape hatches in `projects/ngx-tw/table/table.ts` with the new tokens:
    - The striped + sticky-header compound variant now applies `[&>thead>tr>th]:shadow-table-sticky`.
    - `STICKY_START_SHADOW` / `STICKY_END_SHADOW` constants now reference the token utilities directly.
  - Snaps the loading-overlay `backdrop-blur-[1px]` to the codified `backdrop-blur-sm` (≈ 4px). The haze is now visually present rather than imperceptible; consumers relying on a near-zero blur should override via the `[slot='loading']` content projection.

  **Accessibility:**

  - The Batch 8 audit flagged a `data-label` "double-read" on stack-mode `<th>` elements. **Verified false positive.** The table template renders `<th>` only inside `<thead>`, and stack mode applies `[&>thead]:max-{bp}:hidden` — `display: none` removes the element from the AT tree. The `::before` content with `attr(data-label)` lives on the `<td>` and is the only label rendered below the breakpoint; modern AT (VoiceOver, NVDA, JAWS) do not announce CSS-generated pseudo content by default per ARIA 1.2. No code change required.

  **Internal:**

  - `INTERACTIVE_TAGS` (used by `handleRowClick` to suppress row-click bubbling) now includes `'OPTION'` so a click on an `<option>` inside a row `<select>` no longer triggers `rowClicked`. `'DETAILS'` is intentionally not added — the clickable element inside a `<details>` widget is `<summary>`, which is already in the set.
  - The loading-announcement `effect()` now carries a justification comment explaining why label / row reads are wrapped in `untracked()` — to fire one announcement per loading-state transition rather than re-firing on incidental label or row mutations. Behaviour unchanged.

  **Migration:** none. All changes are internal token hygiene plus a behaviour-preserving guard. Consumers overriding the sticky-shadow look via the deep `[&>thead>tr>th]:shadow-[…]` selectors should migrate to overriding `--shadow-table-sticky` (or wrap with `!shadow-…`). The loading overlay's blur intensity is the only user-visible change.

- [`aee8235`](https://github.com/avs2001/ngx-tw/commit/aee8235b3b64500d98216fbdfd86518d005a25d2) - Content & display cleanup — sort, segmented-control, code-block, carousel, and flip-card.

  ## Breaking

  **segmented-control — `rootClass` / `optionClass` inputs removed.**
  Consumers should bind classes via Angular's standard `[class]` binding on
  `<tw-segmented-control>` and `<tw-segmented-option>` directly. Both elements
  still apply their tv() base classes through a host `[class]` binding, so
  consumer classes merge into the element's `classList` automatically. Note:
  unlike the removed `rootClass`/`optionClass` inputs (which ran `twMerge`
  _inside_ the host binding), the standard `[class]` binding does **not** drop
  conflicting base utilities — to truly override `rounded-full` with
  `rounded-md`, consumers must use a higher-specificity selector or
  `!`-prefixed utilities (e.g. `!rounded-md`) in their own stylesheet.

  ## API additions

  **code-block — `isCopied` is now a `model()` (was a private `signal`).**
  Two-way bindable via `[(isCopied)]`. Existing one-way callers see no behavior
  change; the symbol is also surfaced in Compodoc as a public API member.

  **code-block — new `copyFailed = output<Error>()`.**
  Fires when `CDK.Clipboard.copy()` returns `false` (permissions blocked,
  insecure context, jsdom). Existing successful-copy emissions (`copied`) and
  the auto-reset of `isCopied` are unchanged.

  ## a11y

  **flip-card — `LiveAnnouncer.announce` now fires in interactive modes
  (`hover`, `click`, `both`), not only `manual`.**
  Previously, screen-reader users hovering or clicking a flip card received no
  announcement of the face change. The new behavior announces `"Back face
visible"` / `"Front face visible"` on every flip when a back face is
  projected. Consumers who relied on the silent behavior in interactive modes
  should suppress the announcement at the consumer level (e.g. by overriding
  the `LiveAnnouncer` provider with a no-op for the local injector scope).

  ## Tokens

  **theme — new `--color-overlay-control` and `--color-overlay-control-hover`
  semantic tokens** in `theme/_semantic.css`:

  ```css
  --color-overlay-control: oklch(0 0 0 / 0.4);
  --color-overlay-control-hover: oklch(0 0 0 / 0.6);
  ```

  These tokens own the translucent dark capsule used by chrome that floats
  over arbitrary consumer content (carousel pause control, carousel indicator
  overlay capsule). Tailwind v4 auto-generates the matching
  `bg-overlay-control{,-hover}` utilities.

  **carousel — migrated from raw `bg-black/40` / `hover:bg-black/60` to
  `bg-overlay-control` / `hover:bg-overlay-control-hover`.**
  The visual contract is unchanged; consumers can now retheme the overlay
  chrome through theme-CSS overrides instead of monkey-patching the carousel.

  ## Internal refactors

  - **segmented-control — `ACTIVE_CLASSES` / `INACTIVE_CLASSES` constants
    moved into the `tv()` config as `compoundVariants`.** All option styling
    (3 variants × 8 colors × 2 active states + inactive default + disabled) now
    lives in a single tv() call. The option's class computation collapses to a
    single `segmentedControlVariants({...}).option()` call.
  - **segmented-control — dev-mode parent guard.** When
    `<tw-segmented-option>` is rendered without a `<tw-segmented-control>`
    ancestor, a `console.error` fires (dev mode only) explaining the
    parent-requirement. Switching `forwardRef(...)` to
    `inject(..., { optional: true })` lets the component degrade silently in
    production while making the dev-mode error explicit.
  - **carousel — dropped the `_effectiveSlidesToScrollView()` thin wrapper.**
    The underlying `_effectiveSlidesToScroll` signal was already public-internal
    (`readonly`); the indicator directive now reads it directly as
    `this.carousel._effectiveSlidesToScroll()`.

  ## Polish (no behavior change)

  - **sort — documents the `tw*` input/output aliasing pattern** on
    `SortDirective` (precedent: Angular Material's `MatSort`). The aliases
    namespace bindings under the directive selector to avoid attribute
    collisions on the host element; removing an alias is a breaking API
    change. Verified the audit's "drop the aliases" finding would have broken
    every existing consumer template.
  - **sort — annotates the `ariaDescriber.describe` effect** at
    `sort-header.ts:178-191` to document its reactive contract. Audit suggested
    converting to `afterNextRender` (one-shot), but the effect reads the
    `sortActionDescription` public signal input and must re-run on consumer
    rebinds (e.g. i18n state changes) — `afterNextRender` would silently freeze
    the description at first render.
  - **carousel — extends the closure-capture comment in `_onPointerUp`**
    documenting the read-then-null pattern that protects against re-entrant
    pointer events fired synchronously by `releasePointerCapture`.
  - **code-block — JSDoc on `CodeBlockComponent` explaining the
    `role="region"` inner-element ownership.** Outer host is presentational;
    the inner `<pre tabindex="0" role="region">` owns the focusable
    scroll-region semantics. Audit suggested promoting the outer host to
    `role="region"`; verified that would double-announce the landmark.
  - **code-block — JSDoc on `CodeBlockHeaderDirective`** documenting that its
    host class lays out the projected element's _own_ children (filename
    `<span>` + badges), distinct from the parent `headerStart` slot wrapper
    that contains it. Audit flagged "duplicate classes"; verified the two
    apply to different DOM nodes with different jobs.
  - **flip-card — JSDoc on `FlipCardComponent`** documenting the hard
    dependency on theme keyframe classes (`tw-flip-perspective`,
    `tw-flip-inner`, etc.) defined in `projects/ngx-tw/theme/_base.css`.
    Without the theme stylesheet the card renders as two flat stacked faces
    with no perspective or rotation.
  - **flip-card — annotates the `MutationObserver` setup** explaining why
    `contentChild` is _not_ a valid replacement: the back content is projected
    through `<ng-content select="[slot='back']" />`, and `contentChild`
    resolves the parent's own content children rather than projected
    descendants. The spec exercises dynamic projection toggled by an `@if`
    in the host (`DynamicBackHost`), which `contentChild` cannot satisfy. The
    observer is single-target on a `childList` mutation only, so the cost is
    bounded.

  ## Migration guide

  - **`rootClass` / `optionClass` (segmented-control):**

    ```html
    <!-- before -->
    <tw-segmented-control [rootClass]="'shadow-2xl'" [optionClass]="'uppercase'">
      ...
    </tw-segmented-control>

    <!-- after -->
    <tw-segmented-control class="shadow-2xl">
      <tw-segmented-option value="a" class="uppercase">A</tw-segmented-option>
      <tw-segmented-option value="b" class="uppercase">B</tw-segmented-option>
    </tw-segmented-control>
    ```

    For utility overrides (consumer wants `rounded-md` to win over the default
    `rounded-full`), prefix with `!` (`!rounded-md`) or write the override in
    your own stylesheet — the standard `[class]` binding adds classes without
    dropping conflicts.

  - **`copyFailed` (code-block):** previously the clipboard failure was
    silently swallowed. Consumers who wrapped `(copied)` in `try { … } catch`
    saw nothing fire — there was no rejection path to catch. Subscribe to
    `(copyFailed)` instead:
    ```html
    <tw-code-block code="..." (copied)="onCopied()" (copyFailed)="onCopyError($event)" />
    ```

- [`aee8235`](https://github.com/avs2001/ngx-tw/commit/aee8235b3b64500d98216fbdfd86518d005a25d2) - Indicators, overlays, and feedback cleanup — progress-bar, stat, timeline, popover, toast, tooltip.

  ## a11y (tooltip)

  **Tooltip migrated to CDK `AriaDescriber` (dual-mode wiring).** The directive
  now uses two `aria-describedby` paths depending on the content type:

  - **String `twTooltip`** — routed through
    `ariaDescriber.describe(trigger, message)` / `removeDescription` on
    show/hide. AriaDescriber maintains a single hidden message-container on the
    document and dedupes identical strings across all describers — nested
    tooltips sharing a message announce once instead of twice. Mirrors the
    `SortHeaderComponent` pattern.
  - **`TemplateRef` `twTooltip`** — AriaDescriber's dedup table is keyed by
    string, so template tooltips fall back to a direct
    `setAttribute('aria-describedby', overlayId)` against the role="tooltip"
    overlay. Without this fallback, AT would lose the description link for
    templated tooltip content. Symmetrical teardown branches on the active
    path.

  ## a11y polish (toast)

  **Toast dismiss container bumped from `size-5` to `size-6`** to match the
  xs square-interactive-target scale codified in CLAUDE.md. The inner `<svg>`
  now uses the canonical `size-4` glyph step (it previously expanded to
  `size-full`, which inflated to match the container). Result: visually
  unchanged glyph at 16px sitting inside a 24px target the user can hit.

  ## API addition (toast demo)

  `projects/demo/src/app/routes/toast/api/toast-api.component.ts` already
  carried the Injection Tokens subsection documenting `TW_TOAST_DATA`,
  `TW_TOAST_REF`, and `TW_TOAST_DEFAULT_OPTIONS` — no addition needed here, but
  called out so reviewers can verify the demo coverage.

  ## API addition (timeline demo)

  `scrollControls` row added to `TimelineComponent` inputs table — was missing
  entirely. Includes a footnote summarising the "Overflow-control axis on
  layout primitives" cap-exception justification (paraphrased from the
  ~16-line inline JSDoc in `timeline.ts`). New `TimelineScrollControls` type
  appears in the types snippet.

  ## Refactor (progress-bar)

  **`warned` closure-scoped flag retained inside `effect()` but the warn
  side-effect now runs inside `untracked()`.** The effect remains reactive
  because a consumer can remove the only accessible name they had after mount
  (e.g. swapping `label="x"` for `label=undefined`); the warning must fire on
  the next render. `untracked` wraps the `console.warn` + flag mutation so any
  future signal reads inside the warning block cannot accidentally create a
  reactive subscription.

  ## Refactor (progress-bar)

  **Migrated dev-mode guard from `isDevMode()` to the `ngDevMode` declared
  global**, matching the pattern already in `timeline.ts`. `ngDevMode` is a
  build-time globalThis flag the bundler dead-code-eliminates in production;
  `isDevMode()` is a runtime function call that costs a few cycles per check.
  Tree-shaking the entire warn-effect setup in prod is a real win because the
  effect ran in every mount even when the consumer correctly supplied
  accessible names.

  ## Polish

  - **tooltip** — `twTooltipShowDelay` and `twTooltipHideDelay` JSDoc now
    explain the asymmetric defaults (show 200ms = intent threshold; hide 0ms =
    no lingering over content the user moved on from).
  - **progress-bar** — demo API description for the `options` input copied
    verbatim from the library JSDoc (was previously paraphrased to a single
    line).
  - **toast** — single-line pointer comment near the `compoundVariants`
    template-literal map referencing the `@source inline(...)` safelist in
    `theme/index.css` so the dependency is visible at the use site.
  - **timeline** — no `ngDevMode` change (already in place); progress-bar now
    matches.

  ## Migration guide

  **Tooltip `aria-describedby` id format changed for string content.**
  Consumers that asserted on the literal id value (`tw-tooltip-N`) of the
  `aria-describedby` attribute will need to update for **string-valued**
  tooltips — the id is now a CDK-generated `cdk-describedby-message-N`.
  Consumers using **`TemplateRef` content** see no id-format change (the
  fallback path keeps the `tw-tooltip-N` id). Consumers that only check for
  attribute presence or read the resolved-text via
  `document.getElementById(id).textContent` are unaffected. The shipped
  tooltip overview / API demo pages already describe the AriaDescriber wiring;
  no demo updates were needed.

- [`aee8235`](https://github.com/avs2001/ngx-tw/commit/aee8235b3b64500d98216fbdfd86518d005a25d2) - **Refactor.** `DatePickerComponent` and `DateRangePickerComponent` now consume a shared `PickerOverlayCoordinator` (composition, not inheritance) — the new `@Injectable()` lives in `ngx-tw/core/overlay/picker-overlay-coordinator.ts` and is provided at each picker's component level (`providers: [PickerOverlayCoordinator]`) so each instance owns its own overlay / focus-trap / panel-id state. The coordinator wraps the CDK `OverlayRef`, `FocusTrapFactory`, leave-animation close timer, panel-id generation (via `_IdGenerator`), and exposes per-open-lifecycle `backdropClick$()` / `overlayKeydown$()` / `escape$()` / `opened$()` observables that complete on close. ~160 lines of duplicated overlay/focus-trap/timer logic removed across the two pickers.

  **Bug fix.** Both pickers' `opened` outputs now fire **after** the enter animation completes (~140ms after `open()` returns) instead of synchronously on `open()`. The audit Medium finding at `date-picker.ts:1199` (and the matching sibling in date-range-picker) is closed.

  **Behavior change — animation timing.** The leave-animation duration that gates overlay detach is unchanged (120ms — matches `theme/_base.css .scale-out 120ms`). Audit prompt had asked for `PICKER_ANIMATION_DURATION = 150` "to align with `duration-150`"; verified against the actual theme keyframes (`.scale-in 140ms`, `.scale-out 120ms`) and codified two constants — `PICKER_ENTER_DURATION = 140`, `PICKER_LEAVE_DURATION = 120` — that match reality. No theme CSS edits required.

  **a11y polish.** `date-range-picker` `clearButton` bumped from `size-5` (20×20) to `size-6` (24×24) — the codified xs square-interactive-target / WCAG AA minimum touch target. The stale "below the codified WCAG touch target" inline comment is replaced with the matching `size-6` rationale used by date-picker's own clear button.

  **Internal — helper reuse.** `buildSelectLikePositions(offset)` is now consumed by `select`, `combobox`, **and both pickers** (the per-picker `buildDatePickerPositions` / `buildDateRangePickerPositions` were byte-identical to it and have been deleted). The helper's name is preserved; its JSDoc was updated to note the expanded consumer set. `resolveSelectScrollStrategy` is similarly consumed by all four components.

  **Internal — coordinator API.** `open(config): PickerOpenResult | null`, `close(onAfterClose)`, `backdropClick$()`, `overlayKeydown$()`, `escape$()`, `opened$(): Observable<void>`, `ref()`, `panelId()`, plus readonly signals `attached` / `opened`. Per-open streams complete on close (no `takeUntilDestroyed` accumulation across reopens). `OverlayRef` is **disposed and re-created** on each open/close cycle so `offset` / `scrollStrategy` / `panelClass` input changes between cycles take effect; this was an incidental fix over the old code which kept the same `OverlayRef` and silently ignored those re-bindings on reopen.

  **Out of scope.** No public API shape changes on either picker (no input/output renames, no new variants). The calendar refactor and date-picker deprecated time inputs stay in S19. Calendar's `NG_VALUE_ACCESSOR` static-provider CVA wiring is untouched (S19 territory). Select / combobox are NOT migrated to the coordinator — they don't need it.

  **Migration guide.** Consumers subscribing to `(opened)` will see emission timing shift by ~140ms (now fires when the panel is visible, not when `open()` is called). Test code that asserted `opened` fires synchronously on `open()` must switch to `vi.useFakeTimers()` + `vi.advanceTimersByTime(200)`; the date-picker's existing test was migrated in this changeset as an example.

  **Spec.** New file `projects/ngx-tw/core/overlay/picker-overlay-coordinator.spec.ts` covers the coordinator in isolation (12 tests: open returns metadata, re-open returns null while attached, opened$ delayed by enter duration, close detaches/disposes/re-emits-once, fresh OverlayRef on re-open after close, lifecycle streams complete on close, idempotent close, ref()/panelId() accessors, throws on stream-access before open, DestroyRef.onDestroy disposes immediately). Date-picker gains a "reopens cleanly after a full close cycle" integration test; the existing "emits opened when the overlay opens" test was rewritten to assert deferred emission after the enter duration.

- [`aee8235`](https://github.com/avs2001/ngx-tw/commit/aee8235b3b64500d98216fbdfd86518d005a25d2) - **BREAKING — calendar outputs removed.** The three never-firing public outputs `opened`, `closed`, and `renderedMonthsCount` are gone from `tw-calendar`. Each carried `@deprecated v1: inline-only` JSDoc and never emitted in inline mode; the picker overlay components (`tw-date-picker`, `tw-date-range-picker`) wire their own `(opened) / (closed)` events directly via `PickerOverlayCoordinator` (S18) and do not forward the calendar's. Migration: subscribe to the picker-level events; no replacement exists for `renderedMonthsCount`.

  **BREAKING — calendar input removed.** `[blockInvalidRangeCommit]` is gone. It shipped as a no-op + dev warning and the warning told consumers to subscribe to `rangePreview.invalidPreview` together with the `calendarRangeTooShort` / `calendarRangeTooLong` validator codes — those paths remain unchanged and are now the documented integration point.

  **BREAKING — calendar range-behavior consolidation.** The four standalone booleans `[allowSingleDayRange]`, `[persistPartialRange]`, `[allowBackwardRange]`, and `[disableRangesCrossingDisabledDates]` are gone. They collapse into a single `[rangeBehavior]` input that accepts `Partial<RangeBehaviorConfig>` (new shared type exported from `ngx-tw/core`). Unset fields fall back to the documented per-field defaults — behavior matches v0.x exactly. The four codified `true`-default rationales (which lived on the individual inputs) now live on the `RangeBehaviorConfig` interface JSDoc.

  Before:

  ```html
  <tw-calendar mode="range" [allowSingleDayRange]="false" [allowBackwardRange]="true" />
  ```

  After:

  ```html
  <tw-calendar
    mode="range"
    [rangeBehavior]="{ allowSingleDayRange: false, allowBackwardRange: true }"
  />
  ```

  **BREAKING — date-range-picker range-behavior consolidation.** The four mirror inputs on `tw-date-range-picker` (`[allowSingleDayRange]`, `[persistPartialRange]`, `[allowBackwardRange]`, `[disableRangesCrossingDisabledDates]`) also collapse into a single `[rangeBehavior]` input with the same `Partial<RangeBehaviorConfig>` shape. Path (a) was chosen over keeping individual inputs (path (b)) because the picker's surface is a 1:1 forward of the calendar's; splitting the breaking change across two API shapes buys nothing.

  Before:

  ```html
  <tw-date-range-picker [allowBackwardRange]="true" [persistPartialRange]="false" />
  ```

  After:

  ```html
  <tw-date-range-picker
    [rangeBehavior]="{ allowBackwardRange: true, persistPartialRange: false }"
  />
  ```

  **BREAKING — date-picker time inputs removed.** All eight `@deprecated v2` standalone time inputs (`[withTime]` / alias of `withTimeInput`, `[timeFormat]`, `[showSeconds]`, `[hourStep]`, `[minuteStep]`, `[secondStep]`, `[minTime]`, `[maxTime]`) are gone. `[timeConfig]` — already shipping — is canonical. Pass `null` to hide the embedded `<tw-time-picker>`; pass `{}` to enable it with all defaults; supply any field to override the per-field default.

  Audit prompt cited "nine" deprecated inputs; verified count is **eight**. The mapping is 1:1:

  | v0.x input             | v1 replacement                         |
  | ---------------------- | -------------------------------------- |
  | `[withTime]="true"`    | `[timeConfig]="{}"`                    |
  | `timeFormat="12h"`     | `[timeConfig]="{ format: '12h' }"`     |
  | `[showSeconds]="true"` | `[timeConfig]="{ showSeconds: true }"` |
  | `[hourStep]="2"`       | `[timeConfig]="{ hourStep: 2 }"`       |
  | `[minuteStep]="15"`    | `[timeConfig]="{ minuteStep: 15 }"`    |
  | `[secondStep]="5"`     | `[timeConfig]="{ secondStep: 5 }"`     |
  | `[minTime]="t"`        | `[timeConfig]="{ minTime: t }"`        |
  | `[maxTime]="t"`        | `[timeConfig]="{ maxTime: t }"`        |

  Before:

  ```html
  <tw-date-picker
    [(value)]="deadline"
    [withTime]="true"
    timeFormat="12h"
    [showSeconds]="true"
    [showActions]="true"
  />
  ```

  After:

  ```html
  <tw-date-picker
    [(value)]="deadline"
    [timeConfig]="{ format: '12h', showSeconds: true }"
    [showActions]="true"
  />
  ```

  **Internal.** `RangeBehaviorConfig` is a new shared interface exported from `ngx-tw/core`. The calendar exposes a private `_resolvedRangeBehavior: Signal<RangeBehaviorConfig>` computed that merges the consumer-supplied partial over the documented per-field defaults; every internal read site now reads `_resolvedRangeBehavior().X` instead of four individual inputs. The `[REC]` dev warning that fired on `[blockInvalidRangeCommit]` is also gone; the `isDevMode()` import in `calendar.ts` is still used by the existing `_warnedShapeMismatch` warnings and remains.

  **Internal — date-picker.** `effectiveTimeConfig` now merges `timeConfig` over per-field literal defaults (`'24h'`, `false`, `1`, `1`, `1`, `null`, `null`) — there are no longer any deprecated-input fallbacks to consult. `withTime` simplifies to `this.timeConfig() !== null`. The overlay (`date-picker-overlay.ts`) is unchanged: it keeps individual signals fed from the parent's destructured `effectiveTimeConfig`, since each signal binds to a `<tw-time-picker>` property.

  **Internal — date-range-picker.** Both effect-driven mirror blocks (`date-range-picker.ts:~819`, `:~1180`) simplify from four `instance.X.set(this.X())` calls to a single `instance.rangeBehavior.set(this.rangeBehavior())`. `date-range-picker-overlay.ts` template binding goes from four `[xxx]="xxx()"` rows to one `[rangeBehavior]="rangeBehavior()"`, and the four overlay signals collapse into a single `rangeBehavior = signal<Partial<RangeBehaviorConfig>>({})`.

  **Demo.** Calendar API table replaces the four range-behavior rows with one `rangeBehavior` row pointing at `RangeBehaviorConfig`. Date-range-picker API table mirrors the same consolidation. Date-picker API table drops the three deprecated rows (`withTime`, `timeFormat`, `showSeconds` — the other five were never rendered as separate rows). Date-picker examples "With time" section + `withTimeSnippet` migrate to `[timeConfig]="{}"` and `[timeConfig]="{ format: '12h', showSeconds: true }"`. The date-picker playground's three time-related buttons (`withTime` / `12h` / `seconds`) now drive a single `playTimeConfig: Signal<DatePickerTimeConfig<Date> | null>` and the `<tw-date-picker>` binding shrinks to `[timeConfig]="playTimeConfig()"`. Calendar examples' "Range click behavior" copy updates the inline `<code>` blurbs to the new shape.

  **CLAUDE.md.** The two codified `true`-default entries (`calendar.allowSingleDayRange`, `calendar.persistPartialRange`) are dropped — the rationale moves naturally to the `RangeBehaviorConfig` interface JSDoc, where each field's default is documented inline. `calendar.bordered` and `calendar.showAdjacentMonths` remain on the codified list (those inputs survive).

  **Spec.** Calendar `phase-placeholder outputs` describe is replaced with two dropped-surface assertions (`opened` / `closed` / `renderedMonthsCount` undefined; `blockInvalidRangeCommit` + the four booleans undefined). A new `rangeBehavior config` describe adds four tests: defaults applied when input unset, `allowSingleDayRange: false` rejects same-cell second click, `allowBackwardRange: true` skips auto-swap, partial config merges over defaults. Date-picker's `back-compat: legacy [withTime] alias` test is removed and replaced with an assertion that all eight deprecated inputs are no longer on the component. Test count: 2614 (S18 baseline) → 2619 (+5 net).

  **Out of scope.** `monthColumns` Phase 9 cap (audit Low) untouched. Calendar CVA / NG_VALUE_ACCESSOR migration to runtime stays in a future session. No new picker features; no overlay-coordinator changes.

  **Risk note.** The `_resolvedRangeBehavior` computed uses object spread, which is safe for both partial and full `RangeBehaviorConfig` values consumers might pass — spreading a full config over the defaults still yields the full config. Consumers who passed `[allowSingleDayRange]="value"` via Angular's framework-level `setInput` API in their tests will see the input no longer exist (runtime ignore in template, hard error in `setInput`); they must migrate to `[rangeBehavior]="{ allowSingleDayRange: value }"`. Picker-level `(opened)` events were already independent from the calendar's (S18 wired them via `PickerOverlayCoordinator.opened$`), so the calendar-output removal has no observable behavior change for picker consumers.

- [`aee8235`](https://github.com/avs2001/ngx-tw/commit/aee8235b3b64500d98216fbdfd86518d005a25d2) - **Refactor.** `DialogContainer` and `SheetContainer` now consume a shared `OverlayContainerCoordinator` (composition, not inheritance) — the new `@Injectable()` lives in `ngx-tw/core/overlay/overlay-container-coordinator.ts` and is provided at each container's component level (`providers: [OverlayContainerCoordinator]`) so each instance owns its own animation state and aria-describedby queue. The coordinator wraps the `state` signal, `transitionDuration` computed, `enter`/`exit` animation methods, `animationStateChanged` EventEmitter, `transitionend`-fallback timer, and the `AriaIdQueue` for `aria-describedby`. Pure helpers (`mergeOverlayPanelClass`, `coerceOverlayDuration`, `OVERLAY_ANIMATION_FALLBACK_PADDING`, `AriaIdQueue`) live alongside in `overlay-container-helpers.ts`. Both containers shrink from ~210 lines to ~140 lines apiece — roughly 140 lines of byte-identical animation-state-machine + aria-queue + panelClass-merge logic removed across the two files.

  **Internal — `findEnclosingDialog` / `findEnclosingSheet` DOM walks removed.** Both `*TitleDirective` and `*DescriptionDirective` previously walked `parentElement` chains up to `<tw-dialog-container>` / `<tw-sheet-container>` and looked the ref up by id via `Dialog.getDialogById()` / `Sheet.getSheetById()` whenever the primary `inject(TwDialogRef)` / `inject(SheetRef)` returned null. That walk is brittle when the directive is nested inside other portals. Replaced with ancestor-DI: `inject(DialogContainer, { optional: true, skipSelf: true })` and the matching sheet line — the container is the closest provider in the directive's element-injector tree because the directive lives inside the container's DOM. The primary `inject(*Ref)` path is unchanged; the ancestor-DI line is the new fallback. Mirrors the `inject(Sheet, { optional: true, skipSelf: true })` ancestor-DI pattern already used at `sheet.ts:50` for parent-sheet detection. Verified end-to-end: two new specs (one for dialog, one for sheet) provide a stub `DialogContainer` / `SheetContainer` via `{ provide: X, useValue: stub }` WITHOUT supplying the matching `*Ref`, and assert the directive's `ngOnInit` calls `_addAriaLabelledBy` / `_addAriaDescribedBy` on the stub container — proving the ancestor-DI line resolves correctly when the primary `inject(*Ref)` path is null.

  **Behavior change — `DialogCloseDirective` / `SheetCloseDirective` lost their secondary fallback.** Close needs the `Ref` (not the container) to call `.close()`, and the audit explicitly asked to remove the DOM walk. Both Close directives now have only the primary `inject(TwDialogRef, { optional: true })` / `inject(SheetRef, { optional: true })` path; if it returns null the click is a silent no-op (previously the DOM walk would have found the ref via the service registry). In practice `inject(*Ref)` succeeds for both component and template portals — the DOM-walk fallback was defensive for an edge case the audit author couldn't cleanly articulate. This asymmetry with Title/Description (which still get the ancestor-DI container fallback) is intentional: Title/Description only need the container; Close needs the ref, and a partial restoration via the service registry would re-introduce the DOM coupling the audit asked to remove. Document as a behavior change rather than restore the registry lookup.

  **Internal — `OverlayContainerCoordinator` API.** `state` signal, `describedByIds` signal (live snapshot of the queue), `transitionDuration` computed, `animationStateChanged` EventEmitter, plus `setDurations(enter, exit)`, `startEnterAnimation()`, `startExitAnimation()`, `addAriaDescribedBy(id)`, `removeAriaDescribedBy(id)`, `firstDescribedBy()`. `DestroyRef.onDestroy` clears the active animation timer and completes the EventEmitter — neither container needs its own `ngOnDestroy` override anymore (the `implements OnDestroy` declaration was removed from both as part of this changeset).

  **Internal — `mergeOverlayPanelClass(internal, consumer)`** signature preserves the original semantics: `undefined` consumer returns the internal string unchanged, `string` consumer appends with a space, `readonly string[]` consumer appends each entry. Empty array is treated as the trivially-true case (no behavior change vs the original inline merge).

  **No consumer-facing API change.**

  - `DialogContainer` / `SheetContainer` still expose the same public surface — `state`, `animationStateChanged`, `enterAnimationDuration`, `exitAnimationDuration`, `_startExitAnimation()`, `_addAriaDescribedBy()`, `_removeAriaDescribedBy()` — so `TwDialogRef` / `SheetRef` are untouched.
  - Both containers still subclass `CdkDialogContainer` directly — CDK still owns focus trap, escape/backdrop key dispatch, overlay attach/detach, the `_ariaLabelledByQueue` array, and `_contentAttached()` lifecycle.
  - Type aliases re-exported from the new shared types: `DialogState` and `SheetState` now alias `OverlayContainerState`; `DialogAnimationEvent` and `SheetAnimationEvent` alias `OverlayContainerAnimationEvent`. Consumers' existing imports still work.

  **Behavior preserved.** Dialog enter/exit durations: 150ms / 120ms. Sheet enter/exit durations: 200ms / 160ms. Fallback timer padding: 50ms. Enter animation defers `state` flip by one `requestAnimationFrame` so the browser applies the initial hidden/offscreen styles. All 81 existing dialog + sheet specs pass unchanged.

  **Migration guide.** None for normal consumers. Code that subclasses `DialogContainer` / `SheetContainer` directly (rare) may need to re-implement methods that were previously inline on the container — recommend instead consuming the coordinator and helpers from `ngx-tw/core`. Anything that relied on Close's DOM-walk fallback path (extremely rare; would require a custom portal setup that breaks `inject(TwDialogRef)`) is now a no-op — surface via injection rather than DOM nesting.

  **Spec coverage added.**

  - `projects/ngx-tw/core/overlay/overlay-container-helpers.spec.ts` — 16 tests across 4 `describe` blocks covering `coerceOverlayDuration` (positive / zero / undefined / null / negative / NaN / Infinity), `mergeOverlayPanelClass` (undefined / string / array / empty array), `AriaIdQueue` (empty, idempotent add, first survives middle remove, first advances when head removed, remove unknown is no-op, snapshot returns fresh array, insertion order across mixed ops), and the `OVERLAY_ANIMATION_FALLBACK_PADDING` constant value.
  - `projects/ngx-tw/dialog/dialog.spec.ts` — 2 new "ancestor-DI fallback" tests for `DialogTitleDirective` and `DialogDescriptionDirective` (see above).
  - `projects/ngx-tw/sheet/sheet.spec.ts` — 2 new "ancestor-DI fallback" tests mirroring the dialog ones.

  Full ngx-tw suite: **2639 passing / 4 pre-existing skipped** (vs S19 baseline 2619 — exactly **+20**, matching the 16 helper-spec tests plus 4 ancestor-DI fallback tests).

  **Out of scope.** No public API shape changes on dialog or sheet (no input/output renames, no new variants). The `_ariaLabelledByQueue` is owned by CDK's `CdkDialogContainer` and stays imperative-array-shaped; we did NOT unify it with our signal-backed `_ariaDescribedByQueue` (would have meant fighting CDK's host binding). The audit's "animation-class resolver" was redundant for this pair — both containers use `data-[state]` CSS transitions, not `animate.enter`/`animate.leave` keyframes, and no animation-class string is shared between them.

  **Audit drifts handled (S20).**

  1. `Tw*` dialog class names already renamed by S01 — skipped.
  2. `text-base` on dialog/sheet titles already fixed by S02 — skipped.
  3. Both containers extend `CdkDialogContainer` — kept; no FocusTrap / overlay-lifecycle re-implementation.
  4. `findEnclosingDialog` confirmed at `dialog-content.ts:213-225` (pre-edit) and the matching `findEnclosingSheet` at `sheet-content.ts:212-224` (pre-edit) — both removed.
  5. `panelClass` merge confirmed byte-identical at `dialog-container.ts:119-124` and `sheet-container.ts:168-173` (pre-edit) — extracted to `mergeOverlayPanelClass`.

  The audit's framing of "~80% of plumbing duplicated" was understated — the duplication footprint included the full animation state machine, not just the helpers. The coordinator's scope grew accordingly while staying composition-not-inheritance per design decision D2.

### Patch Changes

- [`aee8235`](https://github.com/avs2001/ngx-tw/commit/aee8235b3b64500d98216fbdfd86518d005a25d2) - Cross-cutting token-violation sweep. Visual output is unchanged; this PR closes the audit's "token violations" theme (`text-base` outside the `tw-item` carve-out, `duration-normal` codification, `size-3.5` justification comments, raw `<pre>` in demo pages).

  **Library:**

  - `SheetTitleDirective` and `DialogTitleDirective` step from `text-base` → `text-sm font-semibold` per the CLAUDE.md typography rule. The `tw-stat` lg/xl `value` and stepper lg/xl labels keep `text-base` but now carry inline carve-out comments; CLAUDE.md gains a `tw-stat` KPI value row in the typography table.
  - Every `size-3.5` use in the library now carries a one-line justification comment per the codified half-step rule (sort-header, paginator, alert dismiss, checkbox box+icon, radio circle+dot, select chevron + checkmark, combobox chevron+spinner — plus the previously-commented badge, date-picker, date-range-picker).
  - CLAUDE.md adds a row in the **Transitions** table codifying `duration-normal` as a theme-overridable alias for `duration-200` (used by tabs, tab-nav, paginator, menu, command-palette, progress-bar).

  **Demo:**

  - Raw `<pre>...<code>` blocks in the accordion overview, accordion API page, and the sort examples event-log panel migrate to `<tw-code-block>`.

- [`aee8235`](https://github.com/avs2001/ngx-tw/commit/aee8235b3b64500d98216fbdfd86518d005a25d2) - Documentation-only sweep: every `input(true)` declaration in the library now carries rationale either as an inline `// TRUE-default:` comment, in its JSDoc one-liner, or in CLAUDE.md's codified Boolean-defaults list. Closes the audit's "Boolean `true` defaults without codified rationale" theme.

  **New inline rationale comments:** `stepper.showError`, `stepper.headerInteractive`, `calendar-header.canSwitchView`, `paginator.showFirstLastButtons`, `paginator.showPageInfo`, `paginator.hideOnEmpty`, `combobox.showChevron`, `combobox.clearable`, `combobox.openOnFocus`.

  **Spinner JSDoc** now explains _why_ `track` defaults to `true` — without the ring the spinner reads as a partial arc, not a loading indicator.

  **CLAUDE.md codified list** appended with `popover.twPopoverArrow`, `popover.twPopoverCloseOnOutside`, `popover.twPopoverCloseOnEscape`, `popover.twPopoverTrapFocus`, `timePicker.showSteppers`, `timePicker.showClear`.

  No behavior or API changes.

- [`aee8235`](https://github.com/avs2001/ngx-tw/commit/aee8235b3b64500d98216fbdfd86518d005a25d2) - Documentation parity sweep. Closes the audit's "JSDoc → demo API description drift" theme.

  **Library JSDoc completeness:** every public `input()` that lacked a `Defaults to …` suffix now has one — covered `skeleton.announce` and three `icon` inputs (`name`, `img`, `ariaLabel`).

  **Demo API description mirror:** seven components' API tables (`button`, `progress-bar`, `stat`, `popover`, `toast`, `tooltip`, `select`) now match library JSDoc one-liners. Consumers reading Compodoc and the demo see the same wording for each input/output/model row.

  No behavior or selector changes. No public-API surface changes.

- [`aee8235`](https://github.com/avs2001/ngx-tw/commit/aee8235b3b64500d98216fbdfd86518d005a25d2) - Demo-only: closes the audit's "Demo doc-page section canon drift" theme. Section additions and renames across the `projects/demo/src/app/routes/**` tree so every Examples page follows the canonical `demo-doc-page` SKILL order.

  **Sections added:**

  - **Variants** → `select/examples` (`variant: 'default' | 'naked'` side by side).
  - **Template-driven forms** → `textarea/examples`, `calendar/examples`, `date-picker/examples`, `date-range-picker/examples`. Each new section comes before its Reactive sibling per canon.
  - **Playground** → `textarea/examples`, `calendar/examples`, `breadcrumbs/examples`. Live-binding playground with signals controlling every consumer-facing input.
  - **Accessibility** → `button/overview`. ARIA roles, keyboard contract, focus management.

  **Renames / cleanups:**

  - `form-field/examples`: H2 "Appearance" → "Variants" (matching the SKILL canon vocabulary). Library input remains `appearance` — the audit's claim that the input was named `variant` was inaccurate; only the demo title moves.
  - `calendar/examples`: stripped `(§21.2)`, `(§10.1)`, `(§25)`, `(§6.5)`, `(§7.3)` impl-spec references from section titles and body text.

  No library code or API changes; no behavioral changes outside the demo app.
