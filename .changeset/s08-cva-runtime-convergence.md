---
"ngx-tw": minor
---

S08 — `ControlValueAccessor` registration convergence across the four remaining matcher-aware form controls (`switch`, `radio-group`, `select`, `combobox`). Reverses the original D5 decision and codifies the new canon.

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

| Component | Previous state | New state |
| --- | --- | --- |
| `SwitchComponent` | static `NG_VALUE_ACCESSOR`; `errorState` returned `false` (dormant S07 placeholder) | runtime CVA; full `TW_ERROR_STATE_MATCHER` integration with `NgControl.invalid` + status/value/submit subscriptions |
| `RadioGroupComponent` | static `NG_VALUE_ACCESSOR`; `errorState` returned `false` | runtime CVA; same matcher wiring as switch. Added `[attr.aria-invalid]` host binding. Group-level `errorState` now propagates to child radios via the existing `parent.errorState()` read in `RadioComponent.errorState`. `notifyTouched()` now bumps `_ngControlRev` so child-radio blur refreshes the group's `aria-invalid`. |
| `SelectComponent` | static `NG_VALUE_ACCESSOR` + dead `_setErrorState(invalid: boolean)` shim writing into a private `errorStateSignal` | runtime CVA; `_setErrorState` removed (zero external callers confirmed before deletion). `errorState` is now a `computed()` reading `NgControl.invalid` through the matcher. Focus-monitor blur path now also bumps `_ngControlRev` so blur transitions repaint `aria-invalid`. Implements `OnInit` for the post-construction `statusChanges` / `valueChanges` / `ngSubmit` subscriptions. |
| `ComboboxComponent` | same shape as select | same migration as select. Template `aria-invalid` switched from `errorStateSignal()` to `errorState()`; `variantResult` likewise reads the new computed so the tailwind-variants `errorState` slot now repaints. |

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
