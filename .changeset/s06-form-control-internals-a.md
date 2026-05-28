---
"ngx-tw": minor
---

S06 — form-control internals A (`input`, `textarea`, `checkbox`). Addresses the audit's Batch 1 findings on naming consistency, the no-op `userAria*` `computed` wrappers, the `rounded-sm` violation in checkbox, and the undocumented dual-storage mirror.

**Breaking (pre-1.0) renames in `InputDirective` (`ngx-tw/input`):**

| Before (TS identifier) | After (TS identifier) | Public template selector |
| --- | --- | --- |
| `userAriaDescribedByInput` | `userAriaDescribedBy` | `[aria-describedby]` (unchanged) |
| `userAriaLabelledbyInput` | `userAriaLabelledby` | `[aria-labelledby]` (unchanged) |

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
