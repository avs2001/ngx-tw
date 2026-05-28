# Checkbox — Production-Grade Review

**Entry point:** `ngx-tw/checkbox`
**Files:** `projects/ngx-tw/checkbox/`

## Snapshot
- Selectors: `tw-checkbox` (element).
- Public classes/directives: `CheckboxComponent`. Public types: `CheckboxVariant`, `CheckboxLabelPosition`.
- Inputs: 13 (`color`, `size`, `variant`, `disabled`, `required`, `label`, `description`, `labelPosition`, `name`, `aria-label`, `aria-labelledby`, `aria-describedby`, plus 2 models `checked` + `indeterminate`).
- Outputs: 1 (`change`) + 2 models (`checked`, `indeterminate`).
- Slots: 3 named (`[slot="check-icon"]`, `[slot="indeterminate-icon"]`, `[slot="description"]`) + the default unprojected slot for label content.
- CVA: yes (`checkbox.ts:227, 383-401`).
- `tv()` config: yes; slots: `root`, `boxWrap`, `box`, `icon`, `labelWrap`, `label`, `description` (`checkbox.ts:31-96`).
- A11y CDK utilities used: `FocusMonitor` (`checkbox.ts:273, 405-410`).

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `color` | `TwColor` | `'primary'` | yes (`checkbox.ts:229`) | Shared core type. |
| `size` | `TwSize` | `'md'` | yes (`checkbox.ts:232`) | Shared core type. |
| `variant` | `'solid' \| 'outline'` | `'solid'` | yes (`checkbox.ts:235`) | Compliant. |
| `disabled` | `boolean` | `false` | yes (`checkbox.ts:238`) | Compliant. |
| `required` | `boolean` | `false` | yes (`checkbox.ts:241`) | Compliant. |
| `label` | `string \| undefined` | `undefined` | yes (`checkbox.ts:244`) | Prefer content projection for rich labels. |
| `description` | `string \| undefined` | `undefined` | yes (`checkbox.ts:247`) | Prefer `[slot="description"]` for rich content. |
| `labelPosition` | `'before' \| 'after'` | `'after'` | yes (`checkbox.ts:250`) | Compliant. |
| `name` | `string \| undefined` | `undefined` | yes (`checkbox.ts:253`) | Mirrored to host as native attribute (no-op for form submission). |
| `aria-label` | `string \| undefined` | `undefined` | yes (`checkbox.ts:256`) | Aliased input. |
| `aria-labelledby` | `string \| undefined` | `undefined` | yes (`checkbox.ts:259`) | Aliased input. |
| `aria-describedby` | `string \| undefined` | `undefined` | yes (`checkbox.ts:262`) | Aliased input. |
| `checked` (model) | `boolean` | `false` | yes (`checkbox.ts:265`) | Two-way bound. |
| `indeterminate` (model) | `boolean` | `false` | yes (`checkbox.ts:268`) | Two-way bound. Cleared on user toggle. |

### Findings
- **13 inputs** — checkbox is the canonical example of the form-control input-cap exception (per CLAUDE.md). Within budget.
- All inputs have one-line JSDoc — compliant.
- All boolean defaults are `false` — compliant.
- **Indeterminate handling is correct.** `writeValue` clears indeterminate to `false` (`checkbox.ts:387-388`); user toggle from indeterminate sets `checked=true` and clears indeterminate (`checkbox.ts:354-361`). Matches native HTML checkbox semantics and Material.
- **Missing input — `value`.** Same gap as switch. HTML checkboxes have a `value` attribute used in form submission. Acceptable because Angular forms bind to a property, but document.
- **Missing input — `errorStateMatcher` / `errorState`.** Same gap as switch — no way to render a checkbox in an error state.
- **No `id` input.** Same gap as switch.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| `change` | `boolean` | past-tense action | `checkbox.ts:271`. Fires on user toggle; does not fire on `writeValue`. |
| `checked` (model) | `boolean` | propertyChange | `checkbox.ts:265`. |
| `indeterminate` (model) | `boolean` | propertyChange | `checkbox.ts:268`. Cleared on user toggle. |

### Findings
- Output naming follows codified dual pattern. Compliant.
- JSDoc states `change` does not fire on programmatic write — correct invariant.
- **No `(focus)` / `(blur)` events surfaced.** Same gap as switch.
- **No `indeterminateChange` emission distinct from the model.** Today the consumer reads `(indeterminateChange)` via the model's emit. Material exposes an explicit output; the model-based approach here is more idiomatic for Angular v21 — acceptable.

## Customization surface
- ng-content slots:
  - Default (label): `<ng-content />` inside the label `<span>` (`checkbox.ts:195`).
  - `[slot="description"]` (`checkbox.ts:201`).
  - `[slot="check-icon"]` with fallback SVG (`checkbox.ts:177-186`).
  - `[slot="indeterminate-icon"]` with fallback SVG (`checkbox.ts:164-173`).
- Structural directives: none.
- Fallback content:
  - `check-icon` slot has a default SVG (`checkbox.ts:178-185`).
  - `indeterminate-icon` slot has a default SVG (`checkbox.ts:165-172`).
  - `description` and `label` have **no** fallback — correct, they are optional content.
  - **This is excellent fallback usage** — the default check/indeterminate SVGs render when the consumer doesn't project, and are replaced when they do. Matches the CLAUDE.md content-projection-fallback convention.
- Class merging: yes — `twMerge: true` (`checkbox.ts:95`).
- Findings:
  - **Best fallback-content story in the form-control batch.** Fallback SVGs make zero-config usage actually work.
  - **Mixed label/description API** (input + projection both rendered, `checkbox.ts:195-204`) — same caveat as switch.

## CSS / Styling
- tailwind-variants: yes; 7 slots (`checkbox.ts:31-96`).
- twMerge: yes (`checkbox.ts:95`).
- Semantic tokens vs raw palette: **partially compliant.** Same raw colors as switch in solid/outline icon lookups:
  - `'text-white'` for primary/secondary/accent/info/error in `SOLID_ICON` (`checkbox.ts:112-120`).
  - `'text-black'` for warning (`checkbox.ts:118`).
  - `OUTLINE_ICON` uses `text-{color}-600` properly (`checkbox.ts:134-141`) and `text-fg` for neutral — compliant.
  - Per `e952a33`, the solid lookup should use `text-on-{role}` tokens.
- Surface/fg/border tokens usage: `bg-surface` resting box (`checkbox.ts:81`), `bg-surface` outline variant (`checkbox.ts:123-130`), `border-border`/`border-border-strong` (`checkbox.ts:81`), `text-fg`/`text-fg-muted` (`checkbox.ts:39, 40`). Compliant.
- Radius compliance: `rounded-md` root (`checkbox.ts:34`) for focus ring; `rounded-[3px]` box (`checkbox.ts:36`). **Issue**: `rounded-[3px]` is an **arbitrary value** — the codified scale is `none`/`md`/`lg`/`xl`/`full`. A 3px radius does not exist in the codified spec. This violates the "do not use rounded-sm or smaller arbitrary values" rule. Options: use `rounded-sm` (4px) or codify a `rounded-xs` token. See recommendations.
- Spacing/gap compliance: `gap-3` root (`checkbox.ts:34`) — compliant. Box sizes use `size-3.5` (xs) through `size-7` (xl) (`checkbox.ts:45-72`). `size-3.5` is the documented half-step carve-out — but the carve-out is for "decorative chevrons", not box dimensions. Acceptable as a checkbox-specific size choice; document.
- Typography compliance:
  - Label: `text-xs` (xs), `text-sm` (sm/md), `text-base` (lg/xl). Compliant.
  - Description: `text-2xs` (xs), `text-xs` (sm/md), `text-sm` (lg/xl). Compliant.
  - Label weight: `font-medium` (`checkbox.ts:39`). Compliant.
- Focus rings compliance: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` on root (`checkbox.ts:34`). Canonical compliant.
- Dark mode handling: relies on surface/fg/border tokens + `-600` shades. No `dark:` overrides. Same caveat as switch.
- Transitions: `transition-colors duration-200 motion-reduce:transition-none` on box (`checkbox.ts:36`). Specific, motion-reduce-aware. Compliant.
- Shadows: none. Correct.
- Icon sub-scale: `[&_svg]:size-3` (xs/sm), `size-3.5` (md, half-step), `size-4` (lg), `size-5` (xl) (`checkbox.ts:46, 52, 58, 64, 70`). The xl `size-5` is the standard glyph; md's `size-3.5` is a half-step (the box is `size-5`, so the icon at `size-3.5` gives ~70% box coverage — visually correct). Document the half-step justification.
- Animations: `animate.enter="check-in"` on the icon (`checkbox.ts:163, 176`). Native Angular v18+ animation primitive — correct per CLAUDE.md. Verify a `check-in` keyframe exists in `theme/default.css`.
- Findings:
  - **Replace raw `text-white`/`text-black` with `text-on-{role}` tokens** — same change as switch.
  - **Resolve `rounded-[3px]` arbitrary value** — adopt `rounded-sm` (4px Tailwind default) or codify a `rounded-xs`/`--radius-xs` token in the theme.
  - **Verify the `check-in` keyframe exists in `theme/default.css`.** If not, the animation will silently no-op.

## Accessibility
- ARIA roles/attributes:
  - `role="checkbox"` (`checkbox.ts:209`). Correct.
  - `aria-checked` is `'mixed'` when indeterminate, else `'true'/'false'` (`checkbox.ts:301-304`). Correct — matches WAI-ARIA tri-state checkbox pattern.
  - `aria-disabled` set when disabled (`checkbox.ts:215`). Correct.
  - `aria-required` set when required (`checkbox.ts:216`). Correct.
  - `aria-label`/`aria-labelledby`/`aria-describedby` all mirrored and `effectiveAriaLabelledby`/`effectiveAriaDescribedby` default to internal ids when no external is set and no `aria-label` is set (`checkbox.ts:306-317`). Material parity.
  - `data-checked` and `data-indeterminate` attributes for styling hooks (`checkbox.ts:212-213`).
  - `tabindex` 0 or -1 based on disabled (`checkbox.ts:220`). Correct.
  - `name` mirrored (`checkbox.ts:221`) — same no-op caveat as switch.
- Keyboard support: **Space only** (`checkbox.ts:368-374`). Correctly **does not** activate on Enter — matches native checkbox semantics (unlike switch, where Enter is recommended for `role="switch"`).
- CDK a11y utilities: `FocusMonitor.monitor()` with `DestroyRef.onDestroy()` cleanup (`checkbox.ts:405-410`). Focus origin not exposed; same gap as switch.
- Label / hint / error wiring: same as switch — local label/description, no form-field interop, no error state.
- AXE risks:
  - Same as switch — accessible-name enforced via dev warn only.
  - The `'text-black'` carve-out on warning solid (`checkbox.ts:118`) is again a deliberate contrast choice.
- Findings:
  - **Add `aria-invalid` host binding** tied to an error-state signal.
  - **Add `errorStateMatcher` + `errorState`** support.
  - **Register with form-field** via `FormFieldControl`.
  - **Expose `focused()` signal**.
  - The "Space only" keyboard pattern is correct and well-tested (`checkbox.spec.ts:281-288` asserts Enter does NOT toggle).

## Form integration
- CVA: yes — `writeValue` / `registerOnChange` / `registerOnTouched` / `setDisabledState` (`checkbox.ts:383-401`). `writeValue` also clears indeterminate to `false` (`checkbox.ts:387-388`) — correct for native parity.
- ErrorStateMatcher integration: **NOT integrated.** Same gap as switch.
- form-field interop: **NOT integrated.** Same gap as switch.
- Works with template-driven, reactive, AND signal-based forms: yes (verified by spec `checkbox.spec.ts:451-558`). Signal forms tested.
- Findings:
  - **Same cross-cutting form-control gap as switch (and radio): no error state, no form-field interop, no ErrorStateMatcher.**
  - CVA + signal forms work correctly; the gap is purely error semantics + form-field composition.

## Tests
- Spec file: yes (`checkbox.spec.ts`, 559 lines).
- Coverage breakdown:
  - Rendering: default mount, `role="checkbox"`, `aria-checked="false"`, every color, every size, every variant, label + description text rendering (`checkbox.spec.ts:130-205`).
  - Inputs: `aria-required`, `tabindex`, `labelPosition` flex direction (`checkbox.spec.ts:209-242`).
  - Interactions: click toggles + emits, Space toggles, Enter does NOT toggle, ignored keys, disabled blocks, programmatic update reflects (`checkbox.spec.ts:246-324`).
  - Indeterminate: `aria-checked="mixed"`, `data-indeterminate` host attr, clear-on-toggle behavior, subsequent toggle flips to `false` (`checkbox.spec.ts:328-367`).
  - Accessibility: aria-disabled, aria-label round-trip, aria-labelledby targeting internal label, unique id (`checkbox.spec.ts:371-401`).
  - Content projection: label + description + custom check-icon + default-fallback SVG (`checkbox.spec.ts:405-430`).
  - FocusMonitor: monitor + stopMonitoring (`checkbox.spec.ts:434-447`).
  - CVA: reactive init/setValue/disable, indeterminate cleared on `setValue`, template-driven ngModel (`checkbox.spec.ts:451-519`).
  - Signal forms: initial value reflection, user toggle updates field, blur marks touched (`checkbox.spec.ts:524-558`).
- Vitest-specific issues: none. Uses `vi.fn()`, `vi.spyOn`, `vi.clearAllMocks`. No `fakeAsync`/`tick`. Compliant.
- Findings:
  - **Strongest test coverage in the batch.** Tri-state semantics are thoroughly exercised.
  - **Missing**: no test that `change` does NOT fire on `writeValue()` — same gap as switch.
  - **Missing**: no test for the accessible-name dev warn — same as switch.
  - **Missing**: no test that the `animate.enter="check-in"` class actually appears on the icon span when checked transitions to true.
  - **Missing**: no test for any color × variant combinatorial — the spec spot-checks each axis independently. A loop covering all 8 colors × 2 variants would be cheap insurance against a regression in `SOLID_BOX` / `OUTLINE_BOX` / `SOLID_ICON` / `OUTLINE_ICON` lookups.

## Gaps & lacks
1. **No form-field interop.** Cross-cutting with switch/radio.
2. **No error state / ErrorStateMatcher / `aria-invalid`.** Cross-cutting.
3. **`text-white`/`text-black` raw colors** in `SOLID_ICON` — should be `text-on-{role}` tokens.
4. **`rounded-[3px]` arbitrary radius** — outside the codified `none/md/lg/xl/full` scale.
5. **`name` attribute is a no-op** on `<tw-checkbox>` (not a native form element). Render a hidden `<input type="checkbox">` for true form participation.
6. **No `id` input.** Inconsistent with `input`.
7. **No `focused()` signal exposed.**
8. **Mixed label/description API** (input + projection both rendered).
9. **Verify `check-in` keyframe exists** in `theme/default.css`.
10. **Test gaps**: no `change`-on-writeValue test, no dev-warn test, no animation-class assertion, no color×variant combinatorial loop.

## Concrete recommendations (deep-dive prompt body)

> The block below is intended to be pasted into a fresh Claude session as the deep-dive prompt for fixing this component.

### Goal

Bring `tw-checkbox` to the same form-control bar as `tw-input`: register with form-field, support ErrorStateMatcher + `aria-invalid`, replace raw foreground colors with `text-on-{role}` tokens, resolve the arbitrary `rounded-[3px]` value, render a hidden native input for real form participation, and close the polish gaps (`id` input, exposed `focused()` signal, mixed-label-API guidance). Tri-state semantics and CVA/signal-forms integration are already strong — preserve.

### Tasks

1. **Register checkbox with form-field via `FormFieldControl`.**
   - File(s): `projects/ngx-tw/checkbox/checkbox.ts:148-226`, depends on `ngx-tw/form-field`.
   - Why: cross-cutting consistency — input/select already do this; switch and radio will be done in parallel. A form-field-wrapped checkbox is a real-world pattern (consent forms with hint text).
   - Change:
     - `extends FormFieldControl<boolean>` on `CheckboxComponent`.
     - Add to providers: `{ provide: TW_FORM_FIELD_CONTROL, useExisting: CheckboxComponent }`.
     - Expose required signals: `id` (the new `id` input — see task 6), `value` (`computed(() => internalChecked())`), `focused` (new signal driven by FocusMonitor — see task 8), `empty` (`computed(() => false)`), `disabled` (already `isDisabled`), `required` (already), `errorState` (new — see task 2), `controlType = 'checkbox'`, `userAriaDescribedBy` (`computed(() => ariaDescribedby())`).
     - Implement `setDescribedByIds(ids: string[])`: write/remove `aria-describedby` on host.
     - Implement `onContainerClick(event)`: focus the host without toggling.
   - Acceptance: spec adds `<tw-form-field><label twLabel>Accept</label><tw-checkbox /></tw-form-field>` host; asserts label `for` and `aria-describedby` wiring; AXE passes.

2. **Add ErrorStateMatcher + `errorState` + `aria-invalid`.**
   - File(s): `projects/ngx-tw/checkbox/checkbox.ts:227-295, 208-225`.
   - Why: cannot paint a required checkbox as invalid in a reactive form today.
   - Change:
     - Inject `NgControl` (optional, self), `NgForm` (optional), `FormGroupDirective` (optional), `TW_ERROR_STATE_MATCHER`. Mirror `input.ts:154-162`.
     - Add `readonly errorStateMatcher = input<ErrorStateMatcher | undefined>(undefined);`.
     - Add `errorState = computed(() => matcher.isErrorState(ngControl?.control ?? null, form))` with revision-signal pattern.
     - Host binding `'[attr.aria-invalid]': 'errorState() || null'`.
     - Visual: a compound variant where `active=false` + `errorState=true` swaps `border-border` → `border-error-500` on the box; `active=true` + `errorState=true` swaps fill to `bg-error-600` (solid) or border to `border-error-600` (outline). Reuse the patterns from `SOLID_BOX`/`OUTLINE_BOX` with the error color forced.
   - Acceptance: spec asserts `<tw-checkbox [required]="true">` in a reactive form flips `aria-invalid="true"` once touched + invalid; visual diff shows the error border.

3. **Replace `text-white`/`text-black` with `text-on-{role}` tokens.**
   - File(s): `projects/ngx-tw/checkbox/checkbox.ts:111-120`.
   - Why: codified after commit `e952a33`.
   - Change: rewrite `SOLID_ICON` to `{ primary: 'text-on-primary', ..., warning: 'text-on-warning', ... }`. Remove the `text-black` carve-out for warning — `text-on-warning` maps to amber-950 already.
   - Acceptance: spec asserts the icon color class for each `TwColor`; no visible contrast change.

4. **Resolve `rounded-[3px]` arbitrary value.**
   - File(s): `projects/ngx-tw/checkbox/checkbox.ts:36`.
   - Why: violates the codified `none/md/lg/xl/full` radius scale.
   - Change: prefer one of:
     - **Option A** (preferred): adopt `rounded-sm` (Tailwind default 4px) — adjust the icon size to compensate at xs/sm if needed.
     - **Option B**: codify a `rounded-xs` token in `theme/_semantic.css` mapping to `0.1875rem` (3px) and document the addition. Update CLAUDE.md "Border Radius" table.
   - Acceptance: chosen path documented; spec asserts the new class on the box at every size.

5. **Render a hidden native `<input type="checkbox">` for real form participation.**
   - File(s): `projects/ngx-tw/checkbox/checkbox.ts:158-207`.
   - Why: `<tw-checkbox name="…">` does not participate in native form submission today.
   - Change: add `<input type="checkbox" class="sr-only" [name]="name() || null" [checked]="internalChecked()" [disabled]="isDisabled()" tabindex="-1" aria-hidden="true">` inside the host template. Position with `sr-only` (Tailwind utility) so it is invisible and out of the tab order. Match Material's `MatCheckbox`.
   - Acceptance: submitting a `<form>` containing `<tw-checkbox name="terms" [checked]="true">` includes `terms=on` in the FormData. The hidden input is invisible and not tab-focusable.

6. **Add `id` input for parity with `input`.**
   - File(s): `projects/ngx-tw/checkbox/checkbox.ts:253-262`.
   - Why: consistency; required for form-field's `<label for>` association.
   - Change: same change as switch task — `readonly idInput = input<string | undefined>(undefined, { alias: 'id' })`; `id = computed(() => idInput() ?? hostId)`; update `labelId`/`descriptionId` derivation.
   - Acceptance: spec asserts `<tw-checkbox id="my-cb">` round-trips the attribute and `<label for="my-cb">` associates.

7. **Verify (and add if missing) the `check-in` keyframe.**
   - File(s): `projects/ngx-tw/theme/default.css` (search for `@keyframes check-in`).
   - Why: `animate.enter="check-in"` is referenced (`checkbox.ts:163, 176`) but the keyframe must exist or the animation silently no-ops.
   - Change: if missing, add `@keyframes check-in { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }` and `.check-in { animation: check-in 150ms ease-out; }` with a `@media (prefers-reduced-motion: reduce) { .check-in { animation-duration: 0ms; } }` clause. If present, no action needed.
   - Acceptance: visual diff shows a brief scale-in of the check icon when transitioning from false→true; no animation under `prefers-reduced-motion: reduce`.

8. **Expose `focused()` signal.**
   - File(s): `projects/ngx-tw/checkbox/checkbox.ts:273-275, 405-410`.
   - Why: form-field interop needs `control.focused()`; today FocusMonitor is used only for the focus ring.
   - Change: mirror `input.ts:278-289` — convert FocusMonitor stream into a `_focused` signal exposed as `focused = _focused.asReadonly()`. Remove the redundant `(blur)` handler.
   - Acceptance: spec asserts `directive.focused()` flips on focus/blur.

9. **Document mixed label/description API behavior.**
   - File(s): `projects/ngx-tw/checkbox/checkbox.ts:194-204`, demo overview.
   - Why: today both `label` input and default content projection render simultaneously — consumers using both get duplicates.
   - Change: in the template, `@if`-gate the input-driven label/description when a `contentChild` query reports projected content. Add `contentChild()` queries for label and description, drop the projected child from the input's render. Document the precedence: projection > input.
   - Acceptance: spec asserts that when both `<tw-checkbox label="X">Y</tw-checkbox>` is rendered, only `Y` shows.

10. **Add the missing tests.**
    - File(s): `projects/ngx-tw/checkbox/checkbox.spec.ts`.
    - Why: close the four documented gaps.
    - Change:
      - Test that `change` does NOT fire on `writeValue()` (spy + writeValue + assert spy not called).
      - Test the accessible-name dev warn (no label, no aria-label, no projection → expect one `console.warn`).
      - Test the animation class actually appears on the icon when checked flips to true.
      - Loop assert all 8 colors × 2 variants of `boxClasses()` / `iconColorClasses()`.
    - Acceptance: green.

### Out of scope

- Removing `label` / `description` string inputs — they're documented and convenient; the precedence change (task 9) covers the duplicate-rendering issue.
- Adding a `[slot="indeterminate-fallback"]` mechanism — the existing fallback SVGs are sufficient.
- Adding click-area-extension to the label — the form-field handles container-click forwarding once form-field interop lands (task 1).

### Verification
- Build: `npm run build:lib`
- Test: `npm test -- checkbox`
- Visual check: `http://localhost:4600/checkbox` (every size + color + variant, indeterminate state, inside form-field, error state via reactive `Validators.requiredTrue`)
- A11y: `npm run e2e:a11y` (checkbox route — verify with form-field wrapper)

## Priority
**P1** — checkbox is the canonical example of the form-control input-cap exception in CLAUDE.md, and it has the strongest tri-state semantics, best fallback content, and best test coverage of the batch. But it shares the same three cross-cutting gaps as switch and radio: no form-field interop, no error state, raw `text-white`/`text-black`. Land the cross-cutting fixes (tasks 1–3) together across checkbox/switch/radio in one PR; ship the checkbox-specific polish (tasks 4–10) in a follow-up.
